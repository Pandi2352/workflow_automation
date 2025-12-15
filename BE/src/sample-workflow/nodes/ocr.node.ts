import { BaseWorkflowNode } from './workflow-node.interface';
import { NodeExecutionResult, NodeExecutionContext } from '../interfaces/execution-context.interface';
import { OCRService } from '../node-services/ocr.service';
import * as path from 'path';


import { ProcessedItemService } from '../services/processed-item.service';

export class OCRNodeStrategy extends BaseWorkflowNode {
    constructor(
        private ocrService: OCRService,
        private processedItemService: ProcessedItemService
    ) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<NodeExecutionResult | any[]> {
        const config = data?.config || {};
        const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
        const modelName = config.modelName || 'gemini-1.5-flash';
        const forceProcess = config.forceProcess === true; // Allow overriding deduplication

        if (!apiKey) {
            throw new Error('Gemini API Key is required');
        }

        // Determine input files
        // Strategy: iterate through 'inputs' array (which now includes merged config values) and find things that look like files.

        let filesToProcess: any[] = [];
        const potentialInputs = [...inputs];

        // Also check direct config.files/file if they weren't merged or if we need to handle specific logic
        // But since we merge in executeWithContext, inputs should have them. 
        // We'll keep the logic robust.

        if (config.files && typeof config.files !== 'string') potentialInputs.push(config.files);
        else if (config.files && typeof config.files === 'string' && !config.files.startsWith('{{')) {
            potentialInputs.push({ path: config.files });
        }

        if (config.file && typeof config.file !== 'string') potentialInputs.push(config.file);


        for (const val of potentialInputs) {
            if (!val) continue;

            if (Array.isArray(val)) {
                // Check if array of files
                for (const item of val) {
                    if (item && (item.key || item.path || item.url || item.file_id)) {
                        filesToProcess.push(item);
                    }
                }
            } else if (typeof val === 'object') {
                if (val.key || val.path || val.url || val.file_id) {
                    filesToProcess.push(val);
                }
            }
        }

        // Remove duplicates if any (by file_id or path)
        const uniqueFiles = new Map();
        for (const f of filesToProcess) {
            const id = f.file_id || f.key || f.path || f.url;
            if (id) uniqueFiles.set(id, f);
        }
        filesToProcess = Array.from(uniqueFiles.values());

        if (filesToProcess.length === 0) {
            this.log('WARN', 'No files found to process');
            return [];
        }

        this.log('INFO', `Found ${filesToProcess.length} candidate files`);

        const results: any[] = [];

        for (const file of filesToProcess) {
            // Determine path: 'key' (local path relative to root/uploads), 'path' (absolute), or 'url' (remote)
            const fileIdentifier = file.key || file.path || file.url;
            // Use file_id for persistent tracking if available, falling back to identifier
            const persistentId = file.file_id || file.id || file.key || file.path || file.url;

            if (!persistentId) {
                this.log('WARN', `Skipping file without identifier: ${JSON.stringify(file)}`);
                continue;
            }

            // DEDUPLICATION CHECK
            if (!forceProcess) {
                const shouldProcess = await this.processedItemService.shouldProcess(persistentId, 'OCR');
                if (!shouldProcess) {
                    this.log('INFO', `Skipping duplicate file (already processed): ${file.name || persistentId}`);
                    // Optionally push a dummy/cached result if needed, but for now we skip to save cost
                    continue;
                }
            }

            try {
                // If it's a 'key' from our upload system, ensure it maps to absolute path
                let processPath = fileIdentifier;
                if (file.key && !file.path) {
                    processPath = path.join(process.cwd(), 'uploads', file.key);
                }

                if (!processPath) {
                    this.log('WARN', `Skipping invalid file object: ${JSON.stringify(file)}`);
                    continue;
                }

                this.log('INFO', `Analyzing file: ${file.name || 'Unknown'}`);

                // Mark as PENDING
                await this.processedItemService.markPending(persistentId, 'OCR', { fileName: file.name });

                const result = await this.ocrService.processFile(processPath, {
                    apiKey,
                    modelName,
                });

                // Mark as COMPLETED
                await this.processedItemService.markCompleted(persistentId, 'OCR', {
                    fileName: file.name,
                    timestamp: new Date()
                });

                results.push({
                    ...result,
                    fileId: file.file_id || file.id,
                    fileName: file.name || file.originalName,
                    status: 'SUCCESS'
                });

            } catch (error: any) {
                this.log('ERROR', `Failed to process file ${file.name}: ${error.message}`);

                // Mark as FAILED
                await this.processedItemService.markFailed(persistentId, 'OCR', error.message);

                results.push({
                    fileName: file.name,
                    status: 'FAILED',
                    error: error.message
                });
            }
        }

        this.log('INFO', `OCR Processing complete. Processed ${results.length} new items.`);
        return results;
    }

    async executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting execution of node: ${context.nodeName}`);

            // CUSTOM LOGIC: specific to OCR Node
            // We want BOTH the config usage AND the raw inputs.
            // BaseWorkflowNode chooses one or the other.

            let inputValues: any[] = context.inputs.map(input => input.value);

            if (context.data?.config && Object.keys(context.data.config).length > 0) {
                const configValues = Object.values(context.data.config);
                // Append config values to inputs so we check everything
                inputValues = [...inputValues, ...configValues];
                this.log('DEBUG', `Merging inputs and config values: ${JSON.stringify(inputValues)}`);
            } else {
                this.log('DEBUG', `Input values: ${JSON.stringify(context.inputs)}`);
            }

            // Pass triggerData
            if (context.triggerData) {
                if (!context.data) context.data = {};
                context.data._triggerData = context.triggerData;
            }

            const result = await this.execute(inputValues, context.data);

            this.log('INFO', `Node executed successfully`);

            return {
                success: true,
                output: result,
                logs: [...this.logs],
                metadata: {
                    executionTime: Date.now() - startTime,
                    inputCount: inputValues.length,
                }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            this.log('ERROR', `Node execution failed: ${errorMessage}`);

            return {
                success: false,
                output: null,
                error: errorMessage,
                errorStack,
                logs: [...this.logs],
            };
        }
    }
}
