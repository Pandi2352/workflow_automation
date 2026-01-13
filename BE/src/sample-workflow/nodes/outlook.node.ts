import { BaseWorkflowNode } from './workflow-node.interface';
import { OutlookService } from '../node-services/outlook.service';

export class OutlookNode extends BaseWorkflowNode {
    constructor(private readonly outlookService: OutlookService) {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<any> {
        const config = data?.config;
        if (!config || !config.credentialId) {
            throw new Error('Credential ID is required for Outlook node');
        }

        const mode = config.mode || 'action';

        if (mode === 'trigger') {
            // Trigger mode: passed message data is in data._triggerData
            return data?._triggerData?.email || { message: 'Trigger mode: No email data in triggerData' };
        }

        // Action mode: Fetch latest emails
        const maxResults = config.maxResults || 5;
        const messages = await this.outlookService.listMessages(
            config.credentialId,
            maxResults
        );

        return {
            count: messages.length,
            messages: messages
        };
    }
}
