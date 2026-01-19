import { BaseWorkflowNode } from './workflow-node.interface';

export class GeminiModelNode extends BaseWorkflowNode {
    async execute(inputs: any[], data: any): Promise<any> {
        const config = data.config || {};

        this.log('INFO', `Configuring Gemini Model: ${config.modelName || 'gemini-2.5-flash'}`);

        return {
            type: 'chat_model',
            provider: 'GEMINI',
            modelName: config.modelName || 'gemini-2.5-flash',
            settings: {
                temperature: config.temperature || 0.7,
                maxOutputTokens: config.maxOutputTokens || 2048,
                topP: config.topP || 0.95,
                topK: config.topK || 40
            },
            credentialId: config.credentialId,
            apiKey: config.apiKey
        };
    }
}
