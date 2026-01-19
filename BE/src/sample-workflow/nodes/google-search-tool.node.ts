import { BaseWorkflowNode } from './workflow-node.interface';

export class GoogleSearchToolNode extends BaseWorkflowNode {
    async execute(inputs: any[], data: any): Promise<any> {
        const config = data.config || {};

        this.log('INFO', `Configuring Google Search Tool: ${config.toolName || 'Google Search'}`);

        return {
            type: 'tool',
            name: config.toolName || 'google_search',
            description: config.description || 'Search the web for current information',
            parameters: {
                query: 'string'
            },
            plugin: 'GOOGLE_SEARCH',
            config: {
                numResults: config.numResults || 5,
                gl: config.gl || 'us',
                hl: config.hl || 'en'
            }
        };
    }
}
