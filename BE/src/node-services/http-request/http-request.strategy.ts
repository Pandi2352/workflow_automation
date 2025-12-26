import { BaseWorkflowNode } from '../../sample-workflow/nodes/workflow-node.interface';
import { SampleNodeType } from '../../sample-workflow/enums/node-type.enum';
import axios, { Method } from 'axios';
import { Logger } from '@nestjs/common';

export class HttpRequestNodeStrategy extends BaseWorkflowNode {
    private readonly systemLogger = new Logger(HttpRequestNodeStrategy.name);

    // Abstract method implementation
    async execute(inputs: any[], data?: any): Promise<any> {
        const config = data?.config || {};
        const method = (config.method || 'GET').toUpperCase() as Method;
        const url = this.resolveVariables(config.url);
        const headers = config.headers || {};

        this.log('INFO', `Initializing ${method} request to ${url}`);

        if (!url) {
            this.log('ERROR', 'URL is required');
            throw new Error('URL is required');
        }

        // Handle Body
        let requestData = config.data;
        if (requestData && typeof requestData === 'string') {
            try {
                // Try to resolve first
                const processed = this.resolveVariables(requestData);
                // Try JSON parse if it looks like an object/array, or if processed result is a string
                if (typeof processed === 'string') {
                    requestData = JSON.parse(processed);
                } else {
                    requestData = processed;
                }
            } catch (e) {
                // Keep as resolved value if not JSON
                requestData = this.resolveVariables(requestData);
            }
        } else if (requestData) {
            // If data is already an object, we might want to recursively resolve strings in it?
            // For now, let's assume direct object is fine or user manages it.
            // If we really want deep resolution, we'd need a recursive helper.
            // Simple fallback:
            requestData = this.resolveVariables(typeof requestData === 'string' ? requestData : JSON.stringify(requestData));
            if (typeof requestData === 'string') {
                try { requestData = JSON.parse(requestData); } catch { }
            }
        }

        try {
            this.log('DEBUG', `Request Config`, { method, url, headersCount: Object.keys(headers).length });

            const response = await axios({
                method,
                url,
                headers,
                data: requestData,
                validateStatus: () => true
            });

            this.log('INFO', `Request completed with status ${response.status}`);

            return {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
                success: response.status >= 200 && response.status < 300
            };

        } catch (error: any) {
            this.systemLogger.error(`HTTP Request failed: ${error.message}`);
            this.log('ERROR', `Request failed: ${error.message}`);

            return {
                success: false,
                error: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            };
        }
    }
}
