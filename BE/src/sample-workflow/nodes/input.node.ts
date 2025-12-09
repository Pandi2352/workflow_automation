import { BaseWorkflowNode } from './workflow-node.interface';

interface InputNodeData {
    value?: any;
    config?: Record<string, any>;
    inputs?: Array<{ name: string; type: string; value?: any; valueType?: string }>;
}

export class InputNode extends BaseWorkflowNode {
    execute(inputs: any[], data?: InputNodeData): any {
        this.log('DEBUG', `InputNode received data: ${JSON.stringify(data)}`);

        // Priority 1: Check resolved config.value (from expression evaluation)
        // This is where resolved inputs go: config.value = 10
        if (data?.config?.value !== undefined) {
            this.log('INFO', `Input node providing value from config.value: ${JSON.stringify(data.config.value)}`);
            return data.config.value;
        }

        // Priority 2: Check if config has any values (resolved inputs are stored here)
        if (data?.config && Object.keys(data.config).length > 0) {
            // If there's only one key, return its value
            const keys = Object.keys(data.config);
            if (keys.length === 1) {
                const singleValue = data.config[keys[0]];
                this.log('INFO', `Input node providing single config value: ${JSON.stringify(singleValue)}`);
                return singleValue;
            }
            // If multiple keys, return the whole config object
            this.log('INFO', `Input node providing config object: ${JSON.stringify(data.config)}`);
            return data.config;
        }

        // Priority 3: Check structured inputs array
        if (data?.inputs && Array.isArray(data.inputs) && data.inputs.length > 0) {
            // If there's only one input named 'value', return it directly
            const valueInput = data.inputs.find(i => i.name === 'value');
            if (valueInput?.value !== undefined) {
                this.log('INFO', `Input node providing value from inputs array: ${JSON.stringify(valueInput.value)}`);
                return valueInput.value;
            }

            // If multiple inputs, return as an object
            const result: Record<string, any> = {};
            for (const input of data.inputs) {
                if (input.value !== undefined) {
                    result[input.name] = input.value;
                }
            }
            if (Object.keys(result).length > 0) {
                this.log('INFO', `Input node providing values from inputs: ${JSON.stringify(result)}`);
                return Object.keys(result).length === 1 ? Object.values(result)[0] : result;
            }
        }

        // Priority 4: Check direct value property (backward compatibility)
        if (data?.value !== undefined) {
            this.log('INFO', `Input node providing direct value: ${JSON.stringify(data.value)}`);
            return data.value;
        }

        // Default
        this.log('WARN', 'Input node has no value configured, returning 0');
        return 0;
    }
}
