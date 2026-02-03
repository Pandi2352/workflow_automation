import { Injectable, Logger } from '@nestjs/common';
import { BaseWorkflowNode, WorkflowNodeContext } from './workflow-node.interface';
import { NodeExecutionResult } from '../interfaces/execution-context.interface';
import { OCRService } from '../node-services/ocr.service';
import { SampleNodeType } from '../enums/node-type.enum';

@Injectable()
export class EmailTemplateNodeStrategy extends BaseWorkflowNode {
    private readonly logger = new Logger(EmailTemplateNodeStrategy.name);

    constructor(private readonly ocrService: OCRService) {
        super();
    }

    get type(): SampleNodeType {
        return SampleNodeType.EMAIL_TEMPLATE;
    }

    // Legacy execute
    execute(inputs: any[], data?: any): any {
        throw new Error('Method not implemented. Use executeWithContext instead.');
    }

    async executeWithContext(context: WorkflowNodeContext): Promise<NodeExecutionResult> {
        this.context = context;
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Executing Email Template Node: ${context.nodeName}`);

            const config = context.data?.config || {};
            const userPrompt = config.userPrompt || 'Generate a professional email based on the provided information.';
            const inputText = config.inputText || ''; // This is where dynamic data from previous nodes arrives
            const modelName = config.modelName || 'gemini-1.5-flash';
            const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error('Gemini API Key is required for Email Template generation.');
            }

            const prompt = `
            You are a professional communication assistant. Your task is to generate a high-quality email subject and body based on the user's instructions and provided context.

            **CONSTRAINTS:**
            1. Return strictly valid JSON.
            2. Do NOT use markdown code blocks or explanations.
            3. The output MUST follow this JSON structure:
            {
                "subject": "The email subject line",
                "body": "The complete email body text"
            }

            **USER INSTRUCTIONS:**
            ${userPrompt}

            **CONTEXT/DATA PROVIDED:**
            ${inputText}
            `;

            this.log('INFO', 'Sending request to AI for email template generation...');

            const result = await this.ocrService.generateStructuredData(prompt, apiKey, modelName);

            this.log('INFO', 'Email template generated successfully.');

            return {
                success: true,
                output: {
                    subject: result.subject || '',
                    body: result.body || '',
                    status: 'SUCCESS'
                },
                logs: [...this.logs],
                metadata: {
                    executionTime: Date.now() - startTime,
                    model: modelName
                }
            };

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log('ERROR', `Email Template generation failed: ${errorMessage}`);

            return {
                success: false,
                output: null,
                error: errorMessage,
                logs: [...this.logs]
            };
        }
    }
}
