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
        const modelName = config.modelName || 'gemini-2.5-flash';
        const forceProcess = config.forceProcess !== false; // Default to true

        if (!apiKey) {
            throw new Error('Gemini API Key is required');
        }

        // Determine input files
        let filesToProcess: any[] = [];

        // 1. Check explicit config.files/file first (User's primary intent)
        const configFiles = config.files || config.file;
        if (configFiles) {
            const items = Array.isArray(configFiles) ? configFiles : [configFiles];
            for (const item of items) {
                if (typeof item === 'object' && item !== null) {
                    if (item.key || item.path || item.url || item.file_id) {
                        filesToProcess.push(item);
                    }
                } else if (typeof item === 'string' && item.length > 0) {
                    // If user explicitly provided a string in config.files, treat it as a path/URL
                    filesToProcess.push({ path: item });
                }
            }
        }

        // 2. If no files found in config, check inputs for file-like objects
        if (filesToProcess.length === 0) {
            for (const val of inputs) {
                if (!val) continue;

                if (Array.isArray(val)) {
                    for (const item of val) {
                        if (item && typeof item === 'object' && (item.key || item.path || item.url || item.file_id)) {
                            filesToProcess.push(item);
                        }
                    }
                } else if (typeof val === 'object') {
                    if (val.key || val.path || val.url || val.file_id) {
                        filesToProcess.push(val);
                    }
                }
                // NOTE: We deliberately skip raw strings here because they are often
                // metadata (labels, IDs) and not actual file paths.
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

        this.log('INFO', `Found ${filesToProcess.length} candidate files. Force Process: ${forceProcess}`);

        const results: any[] = [];

        // Process all files in parallel for high throughput
        const processPromises = filesToProcess.map(async (file) => {
            // Determine path: 'key' (local path relative to root/uploads), 'path' (absolute), or 'url' (remote)
            const fileIdentifier = file.key || file.path || file.url;
            // Use file_id for persistent tracking if available, falling back to identifier
            const persistentId = file.file_id || file.id || file.key || file.path || file.url;

            if (!persistentId) {
                this.log('WARN', `Skipping file without identifier: ${JSON.stringify(file)}`);
                return;
            }

            // DEDUPLICATION CHECK
            if (!forceProcess) {
                const shouldProcess = await this.processedItemService.shouldProcess(persistentId, 'OCR');
                if (!shouldProcess) {
                    this.log('INFO', `Skipping duplicate file (already processed): ${file.name || persistentId}`);
                    return;
                }
            }

            try {
                // If it's a 'key' from our upload system, ensure it maps to absolute path
                let processPath = fileIdentifier;
                if (file.key && !file.path) {
                    processPath = path.join(process.cwd(), 'uploads', file.key);
                }

                if (!processPath) {
                    if (file.file_type === 'email/message') {
                        this.log('INFO', `Processing email body (no attachment): ${file.email_subject || file.file_id}`);

                        // Mark as COMPLETED
                        await this.processedItemService.markCompleted(persistentId, 'OCR', {
                            fileName: 'Email Body',
                            timestamp: new Date(),
                            note: 'No attachment'
                        });

                        results.push({
                            fileId: file.file_id || file.id,
                            fileName: 'Email Context',
                            status: 'SUCCESS',
                            text: file.email_body || file.email_snippet || '',
                            ...file,
                            message: 'No attachment available for this message'
                        });
                    } else {
                        this.log('WARN', `Skipping invalid file object (no key/path/url): ${JSON.stringify(file)}`);
                    }
                    return;
                }

                this.log('INFO', `Analyzing file: ${file.name || 'Unknown'}`);

                // Mark as PENDING
                await this.processedItemService.markPending(persistentId, 'OCR', { fileName: file.name });

                const result = await this.ocrService.processFile(processPath, {
                    apiKey,
                    modelName,
                    prompt: config.prompt
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
                await this.processedItemService.markFailed(persistentId, 'OCR', error.message);
                results.push({
                    fileName: file.name,
                    status: 'FAILED',
                    error: error.message
                });
            }
        });

        await Promise.all(processPromises);

        this.log('INFO', `OCR Processing complete. Processed ${results.length} items (before grouping).`);

        // GROUPING LOGIC:
        // User wants multiple attachments from the same email (same fileId/messageId)
        // to be grouped into ONE output item with an array of files.
        const groupedResults = new Map<string, any>();

        for (const res of results) {
            const id = res.fileId || 'unknown';

            if (!groupedResults.has(id)) {
                // Initialize group with the first item's metadata
                groupedResults.set(id, {
                    ...res, // Copy metadata
                    files: [],
                    // Initialize text with the Email Body (common to all items in this group)
                    text: res.email_body || ''
                });
            }

            const group = groupedResults.get(id);

            // Add this file result to the 'files' array
            if (res.status === 'SUCCESS' && res.fileName !== 'Email Context') {
                group.files.push({
                    fileName: res.fileName,
                    text: res.text,
                    data: res.data
                });

                // Append attachment text to the master text
                if (res.text) {
                    group.text = (group.text ? group.text + '\n\n' : '') + `--- Attachment: ${res.fileName} ---\n` + res.text;
                }
            } else if (res.status === 'NO_ATTACHMENT' || res.fileName === 'Email Context') {
                // It's the body-only item. Body is already in 'group.text' via init or shared metadata.
                // No action needed for text, just ensure it exists.
            }
        }

        const finalOutput = Array.from(groupedResults.values());
        this.log('INFO', `Returning ${finalOutput.length} grouped message(s).`);

        return finalOutput;
    }

    async executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        this.context = context;
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting execution of node: ${context.nodeName}`);

            // CUSTOM LOGIC: specific to OCR Node
            // We want BOTH the config usage AND the raw inputs.
            // BaseWorkflowNode chooses one or the other.

            // 1. Resolve variables in the config object specifically
            const resolvedConfig = { ...context.data?.config };
            for (const key of Object.keys(resolvedConfig)) {
                resolvedConfig[key] = this.resolveVariables(resolvedConfig[key]);
            }

            // 2. Prepare context data with resolved config
            const executionData = {
                ...context.data,
                config: resolvedConfig
            };

            // 3. Keep inputs clean - only use actual node inputs
            let inputValues: any[] = context.inputs.map(input => input.value);
            this.log('DEBUG', `Input values: ${JSON.stringify(inputValues)}`);

            // Pass triggerData
            if (context.triggerData) {
                executionData._triggerData = context.triggerData;
            }

            const result = await this.execute(inputValues, executionData);


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
