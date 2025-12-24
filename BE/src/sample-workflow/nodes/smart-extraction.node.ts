
import { Injectable, Logger } from '@nestjs/common';
import { BaseWorkflowNode, WorkflowNodeContext } from './workflow-node.interface';
import { NodeExecutionResult } from '../interfaces/execution-context.interface';
import { OCRService } from '../node-services/ocr.service';

@Injectable()
export class SmartExtractionNodeStrategy extends BaseWorkflowNode {
    private readonly logger = new Logger(SmartExtractionNodeStrategy.name);

    constructor(private ocrService: OCRService) {
        super();
    }

    // Dummy implementation to satisfy abstract base class
    execute(inputs: any[], data?: any): any {
        throw new Error('Method not implemented. Use executeWithContext instead.');
    }

    async executeWithContext(context: WorkflowNodeContext): Promise<NodeExecutionResult> {
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting Smart Extraction on node: ${context.nodeName}`);

            const config = context.data?.config || {};

            // Normalize schema (handle old basic format vs new detailed format)
            const rawSchema = config.schema || {};
            const schema: Record<string, any> = {};

            for (const [key, val] of Object.entries(rawSchema)) {
                if (typeof val === 'string') {
                    schema[key] = { description: val, type: 'string', aliases: [] };
                } else {
                    schema[key] = val;
                }
            }

            const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error('Gemini API Key is required for Smart Extraction.');
            }

            if (Object.keys(schema).length === 0) {
                throw new Error('No extraction schema defined.');
            }

            // 1. Extract Inputs
            const inputText = this.extractInputText(context);

            if (!inputText || inputText.length < 10) {
                throw new Error('Input text is too short to extract data.');
            }

            this.log('INFO', `Input Text Preview: ${inputText.substring(0, 200)}...`);

            // Recursive Schema Describer
            const describeSchema = (s: any, indentLevel = 0): string => {
                let output = '';
                const indent = '  '.repeat(indentLevel);

                for (const [key, val] of Object.entries(s)) {
                    const def = (typeof val === 'string') ? { type: 'string', description: val } : val as any;

                    output += `${indent}- **${key}** (${def.type || 'string'}): ${def.description || ''}\n`;

                    if (def.aliases && def.aliases.length > 0) {
                        output += `${indent}  Aliases: [${def.aliases.join(', ')}]\n`;
                    }

                    if (def.type === 'object' && def.properties) {
                        output += `${indent}  Properties:\n`;
                        output += describeSchema(def.properties, indentLevel + 1);
                    } else if (def.type === 'array' && def.items) {
                        output += `${indent}  Items:\n`;
                        if (def.items.properties) {
                            output += describeSchema(def.items.properties, indentLevel + 1);
                        } else {
                            output += `${indent}  - (Primitive type: ${def.items.type || 'string'})\n`;
                        }
                    }
                }
                return output;
            };

            const schemaDescription = describeSchema(schema);

            // 2. Prepare Prompt (Enhanced with Types & Aliases)
            const prompt = `
            You are an expert Data Extractor and Normalizer.
            
            **Task:**
            Extract structured data from the provided text based strictly on the schema below.
            
            **Context:**
            Input Data: Contains analysis, raw text, or summaries from OCR/Parsing.
    
            **Schema & Rules:**
            ${schemaDescription}

            **Type Specific Rules:**
            - **money**: Extract number/decimal only, remove currency symbols.
            - **date**: Convert to ISO 8601 (YYYY-MM-DD).
            - **array**: Return as JSON array.
            
            **General Normalization Rules:**
            1. **Dates**: Convert ALL dates to **ISO 8601 (YYYY-MM-DD)**.
            2. **Money/Numbers**: Remove currency symbols, commas for thousands. (e.g. "$1,200.00" -> 1200.00).
            3. **Arrays**: If multiple values exist (e.g. tracking numbers), return them as an array.
            4. **Extraction Strategy (Priority Order)**:
               - **Primary**: Search strictly for the **Field Key**.
               - **Secondary (Aliases)**: If the key is not found, search immediately for any provided **Aliases**. If an alias is found (e.g. found "document_no" when looking for "invoice_no"), extraction MUST use that value.
               - **Inference**: If neither are found, infer from context/description.
               - **Final Default**: Return **null** (or [] for Array) if data is absent. DO NOT hallucinate.
    
            **Input Text:**
            "${inputText.substring(0, 15000)}"
    
            **Output Format:**
            Return a SINGLE valid JSON object with the following structure:
            {
               ...[extracted fields matching schema keys]...,
               "confidence_score": {
                  [field_key]: 0 to 1 score (float)
               }
            }

            **Confidence Scoring Guide:**
            - **1.0**: Perfect exact match found in text (Primary Key).
            - **0.8 - 0.9**: Found via Alias or slight fuzzy match.
            - **0.5 - 0.7**: Inferred from context or derived.
            - **0.0**: Value not found.
            `;

            // 3. Call AI
            this.log('INFO', `Extracting fields: ${Object.keys(schema).join(', ')}`);
            const result = await this.ocrService.generateStructuredData(prompt, apiKey, config?.modelName);

            // 4. Post-Process Metrics
            const getConfidenceValues = (obj: any): number[] => {
                let scores: number[] = [];
                for (const val of Object.values(obj)) {
                    if (typeof val === 'number') {
                        scores.push(val);
                    } else if (typeof val === 'object' && val !== null) {
                        scores = scores.concat(getConfidenceValues(val));
                    }
                }
                return scores;
            };

            const confidenceScores = getConfidenceValues(result.confidence_score || {});
            let docScore = 0;
            let minScore = 0;

            if (confidenceScores.length > 0) {
                const sum = confidenceScores.reduce((a: number, b: number) => a + b, 0);
                docScore = parseFloat((sum / confidenceScores.length).toFixed(2));
                minScore = Math.min(...confidenceScores);
            }

            const finalResult = {
                ...result,
                _metrics: {
                    doc_score: docScore,
                    min_score: minScore
                }
            };

            this.log('INFO', `Extraction Result: ${JSON.stringify(finalResult)}`);

            return {
                success: true,
                output: {
                    data: finalResult,
                    status: 'SUCCESS'
                },
                logs: [...this.logs],
                metadata: {
                    executionTime: Date.now() - startTime,
                }
            };

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            this.log('ERROR', `Extraction Failed: ${errorMessage}`);

            return {
                success: false,
                output: null,
                error: errorMessage,
                errorStack,
                logs: [...this.logs],
            };
        }
    }



    private extractInputText(context: WorkflowNodeContext): string {
        const config = context.data?.config || {};
        const inputs = context.inputs || [];
        let combinedText = '';

        // Helper to extract text from a value (string, object, or array)
        const processValue = (val: any) => {
            if (!val) return;

            if (typeof val === 'string') {
                combinedText += val + '\n\n';
            } else if (Array.isArray(val)) {
                // Recursively handle arrays (common in OCR batch output)
                val.forEach(item => processValue(item));
            } else if (typeof val === 'object') {
                // Prioritize specific AI/OCR fields
                if (val.analysis) combinedText += `[Analysis]\n${val.analysis}\n`;
                if (val.text) combinedText += `[Text Content]\n${val.text}\n`;
                if (val.summary) combinedText += `[Summary]\n${val.summary}\n`;

                // Fallback: If it's a generic data object (like an invoice structure), dump it as JSON context
                // But avoid dumping huge raw objects if we already got analysis
                if (!val.analysis && !val.text && !val.summary) {
                    combinedText += `[Data Context]\n${JSON.stringify(val)}\n`;
                }
            }
        };

        // Track if we found specific input to avoid default scan
        let specificInputFound = false;

        // 1. If user provided a specific input path/text in config, use that primarily.
        if (config.inputText && typeof config.inputText === 'string') {
            const trimmedInput = config.inputText.trim();

            // Check for variable syntax {{NodeName.path}}
            if (trimmedInput.startsWith('{{') && trimmedInput.endsWith('}}')) {
                const variablePath = trimmedInput.replace(/^\{\{|\}\}$/g, '').trim();
                const parts = variablePath.split('.');
                const nodeName = parts.shift(); // e.g. "OCR"
                let dataPath = parts.join('.'); // e.g. "output[0].analysis" or "data.text"

                // Handle "output" keyword abstraction common in workflow variables
                if (dataPath.startsWith('output.')) {
                    dataPath = dataPath.substring(7); // Remove "output."
                } else if (dataPath === 'output') {
                    dataPath = ''; // The value itself
                } else if (dataPath.startsWith('output[')) {
                    dataPath = dataPath.substring(6); // Remove "output" -> "[0].analysis"
                }

                // Attempt to find the matching node input
                // In Test Mode, nodeName might be "Mock" or mismatch, so we also fallback to first input if strict match fails.
                let targetInput = inputs.find(i => i.nodeName === nodeName);

                // Fallback for Test Mode or if nodeName is generic: use the first available input
                if (!targetInput && inputs.length > 0) {
                    targetInput = inputs[0];
                }

                if (targetInput) {
                    let resolvedValue = targetInput.value;

                    // Allow simple path traversal if dataPath exists
                    if (dataPath) {
                        // Simple path resolver (supports dot notation and array indices)
                        // e.g. "items[0].name" -> parts: ["items", "0", "name"]
                        // Clean brackets: "[0]" -> ".0." to standard dot notation
                        const cleanPath = dataPath.replace(/\[(\d+)\]/g, '.$1').split('.').filter(p => p !== '');

                        for (const key of cleanPath) {
                            if (resolvedValue && typeof resolvedValue === 'object' && key in resolvedValue) {
                                resolvedValue = resolvedValue[key];
                            } else if (resolvedValue && Array.isArray(resolvedValue) && !isNaN(Number(key))) {
                                resolvedValue = resolvedValue[Number(key)];
                            } else {
                                resolvedValue = undefined;
                                break;
                            }
                        }
                    }

                    if (resolvedValue) {
                        // Found it! Process this specific value only.
                        processValue(resolvedValue);
                        if (combinedText.trim().length > 0) return combinedText;
                        specificInputFound = true;
                    }
                }
            } else {
                // Literal string provided
                processValue(config.inputText);
                if (combinedText.trim().length > 0) return combinedText;
                specificInputFound = true;
            }
        }

        if (!specificInputFound) {
            // 2. Default behavior: scan all inputs
            inputs.forEach(input => {
                if (input && input.value) {
                    processValue(input.value);
                }
            });
        }

        // Limit to reasonable size to prevent token overflow
        return combinedText.trim();
    }
}
