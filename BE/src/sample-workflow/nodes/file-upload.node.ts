
import { Injectable, Logger } from '@nestjs/common';
import { BaseWorkflowNode, WorkflowNodeContext } from './workflow-node.interface';
import { NodeExecutionResult } from '../interfaces/execution-context.interface';

@Injectable()
export class FileUploadNodeStrategy extends BaseWorkflowNode {
    private readonly logger = new Logger(FileUploadNodeStrategy.name);

    constructor() {
        super();
    }

    // Dummy implementation
    execute(inputs: any[], data?: any): any {
        throw new Error('Method not implemented. Use executeWithContext instead.');
    }

    async executeWithContext(context: WorkflowNodeContext): Promise<NodeExecutionResult> {
        this.context = context;
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Executing File Upload Node: ${context.nodeName}`);

            const config = context.data?.config || {};
            const fileData = config.file;

            if (!fileData) {
                // It's possible the user hasn't uploaded a file yet, or provided it via input (unlikely for this node type usually)
                // But if we want to support dynamic file injection later, we can check inputs.
                // For now, we expect 'file' in config.
                this.log('WARN', 'No file configured for this upload node.');
                return {
                    success: true, // We don't fail, we just pass null/empty? Or fail? Let's pass empty array like other sources.
                    output: [],
                    logs: this.logs,

                };
            }

            this.log('INFO', `File found: ${fileData.originalName || fileData.name}`);

            // Standardize output format to match other file sources (GMail, etc)
            // Expected format: Array of objects with keys like name, url, path, etc.
            const fileOutput = {
                ...fileData,
                name: fileData.originalName || fileData.name,
                // Ensure we have a valid URL or Path
            };

            return {
                success: true,
                output: [fileOutput], // Wrap in array as most downstream nodes expect lists of files
                logs: this.logs
            };

        } catch (error) {
            this.log('ERROR', `File Upload Node failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                output: null,
                logs: this.logs
            };
        }
    }
}
