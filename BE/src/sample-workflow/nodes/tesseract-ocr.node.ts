import { BaseWorkflowNode } from './workflow-node.interface';
import { NodeExecutionResult, NodeExecutionContext } from '../interfaces/execution-context.interface';
import { TesseractOCRService } from '../node-services/tesseract-ocr.service';
import * as path from 'path';
import { ProcessedItemService } from '../services/processed-item.service';

export class TesseractOCRNodeStrategy extends BaseWorkflowNode {
    constructor(
        private tesseractOCRService: TesseractOCRService,
        private processedItemService: ProcessedItemService
    ) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<NodeExecutionResult | any[]> {
        const config = data?.config || {};
        const forceProcess = config.forceProcess !== false;

        let filesToProcess: any[] = [];
        const potentialInputs = [...inputs];

        if (config.files && typeof config.files !== 'string') potentialInputs.push(config.files);
        else if (config.files && typeof config.files === 'string' && !config.files.startsWith('{{')) {
            potentialInputs.push({ path: config.files });
        }

        for (const val of potentialInputs) {
            if (!val) continue;
            if (Array.isArray(val)) {
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

        const results: any[] = [];
        const processPromises = filesToProcess.map(async (file) => {
            const fileIdentifier = file.url || file.path || file.key;
            const persistentId = file.file_id || file.id || fileIdentifier;

            if (!persistentId) return;

            if (!forceProcess) {
                const shouldProcess = await this.processedItemService.shouldProcess(persistentId, 'TESSERACT_OCR');
                if (!shouldProcess) {
                    this.log('INFO', `Skipping duplicate file: ${file.name || persistentId}`);
                    return;
                }
            }

            try {
                let processPath = fileIdentifier;
                if (file.key && !file.path && !file.url) {
                    processPath = path.join(process.cwd(), 'uploads', file.key);
                }

                this.log('INFO', `Analyzing file with Tesseract OCR: ${file.name || 'Unknown'}`);
                await this.processedItemService.markPending(persistentId, 'TESSERACT_OCR', { fileName: file.name });

                const result = await this.tesseractOCRService.processFile(processPath, {
                    lang: config.lang
                });

                await this.processedItemService.markCompleted(persistentId, 'TESSERACT_OCR', {
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
                await this.processedItemService.markFailed(persistentId, 'TESSERACT_OCR', error.message);
                results.push({
                    fileName: file.name,
                    status: 'FAILED',
                    error: error.message
                });
            }
        });

        await Promise.all(processPromises);

        // Grouping logic (simplified from Gemini OCR)
        const groupedResults = new Map<string, any>();
        for (const res of results) {
            const id = res.fileId || 'unknown';
            if (!groupedResults.has(id)) {
                groupedResults.set(id, { ...res, files: [], text: res.text || '' });
            }
            const group = groupedResults.get(id);
            if (res.status === 'SUCCESS') {
                group.files.push({ fileName: res.fileName, text: res.text });
            }
        }

        return Array.from(groupedResults.values());
    }
}
