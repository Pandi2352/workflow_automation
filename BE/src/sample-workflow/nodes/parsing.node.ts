import { ParsingService } from '../../node-services/parsing.service';
import { BaseWorkflowNode } from './workflow-node.interface';
import { Injectable } from '@nestjs/common';

export class ParsingNodeStrategy extends BaseWorkflowNode {
    constructor(private parsingService: ParsingService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        this.log('INFO', 'Starting AI Parsing');

        const config = data?.config || {};
        const schema = config.schema || {};

        // Input resolution: Expecting text from previous node (e.g., OCR)
        // If inputs is array, try to find a text field or join them
        let inputText = '';
        if (inputs.length > 0) {
            let input = inputs[0];

            // Handle array output from previous node (like OCR returning array of results)
            // If the previous node returned an array (e.g. multiple files), we pick the first one by default
            // unless specific batch processing is implemented (e.g. via ForEach)
            if (Array.isArray(input) && input.length > 0) {
                input = input[0];
            }

            if (typeof input === 'string') {
                inputText = input;
            } else if (typeof input === 'object' && input.text) {
                inputText = input.text; // Common OCR output format
            } else {
                inputText = JSON.stringify(input);
            }
        }

        if (!inputText) {
            this.log('WARN', 'No input text found for parsing');
            return { success: false, error: 'No input text' };
        }

        const modelName = config.modelName || 'gemini-1.5-flash';

        try {
            const result = await this.parsingService.parseText(inputText, schema, modelName);

            this.log('INFO', `Parsing complete with confidence ${result.confidenceScore.toFixed(2)}`);

            if (result.data && result.data.metadata) {
                delete result.data.metadata;
            }

            return {
                success: true,
                parsedData: result.data,
                confidenceScore: result.confidenceScore,
                // Pass through original text if needed
                originalText: inputText.substring(0, 100) + '...'
            };
        } catch (error: any) {
            this.log('ERROR', `Parsing failed: ${error.message}`);
            throw error;
        }
    }
}
