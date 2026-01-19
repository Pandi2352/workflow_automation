import { Injectable, Logger } from '@nestjs/common';
import { BaseWorkflowNode } from './workflow-node.interface';
import { SampleNodeType } from '../enums/node-type.enum';
import { OCRService } from '../node-services/ocr.service';

@Injectable()
export class SummarizeNodeStrategy extends BaseWorkflowNode {
    private readonly logger = new Logger(SummarizeNodeStrategy.name);

    constructor(private readonly ocrService: OCRService) {
        super();
    }

    get type(): SampleNodeType {
        return SampleNodeType.SUMMARIZE;
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', `Executing Summarize Node`);

        const config = data?.config || {};
        const inputText = this.extractInputText(inputs);
        const prompt = config.prompt || 'Summarize the following text concisely.';
        const modelName = config.modelName || 'gemini-2.5-flash';
        const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

        if (!inputText) {
            this.log('ERROR', 'No input text found to summarize.');
            throw new Error('No input text found to summarize.');
        }

        if (!apiKey) {
            this.log('ERROR', 'Gemini API Key is required');
            throw new Error('Gemini API Key is required');
        }

        try {
            this.log('INFO', `Generating summary with model: ${modelName}`);

            const summary = await this.ocrService.generateText(
                `${prompt}\n\nTEXT TO SUMMARIZE:\n${inputText}`,
                apiKey,
                modelName
            );

            this.log('INFO', 'Summarization complete.');

            return {
                summary,
                status: 'SUCCESS'
            };

        } catch (error: any) {
            this.logger.error(`Summarization failed: ${error.message}`);
            this.log('ERROR', `Summarization failed: ${error.message}`);
            throw error;
        }
    }

    private extractInputText(inputs: any[]): string {
        let text = '';

        for (const input of inputs) {
            if (typeof input === 'string') {
                text += input + '\n';
            } else if (typeof input === 'object' && input !== null) {
                if (input.text) text += input.text + '\n';
                else if (input.analysis) text += input.analysis + '\n';
                else if (input.summary) text += input.summary + '\n';
                else if (input.message) text += input.message + '\n'; // From email body often
                else text += JSON.stringify(input) + '\n';
            }
        }
        return text.trim();
    }
}
