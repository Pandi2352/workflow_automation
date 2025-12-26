import { BaseWorkflowNode } from '../../sample-workflow/nodes/workflow-node.interface';
import { Logger } from '@nestjs/common';
import jsonata from 'jsonata';

export class DataMapperNodeStrategy extends BaseWorkflowNode {
    private readonly systemLogger = new Logger(DataMapperNodeStrategy.name);

    async execute(inputs: any[], data?: any): Promise<any> {
        const config = data?.config || {};
        const mappingType = config.mappingType || 'visual'; // 'visual' or 'custom'

        // Prepare Source Data
        // Combine all inputs into a single object for easier querying
        // Or if there is a primary input, use that.
        // For simplicity, let's look at the first input, or wrap them.

        let sourceData: any;
        if (inputs.length === 1) {
            sourceData = inputs[0];
        } else {
            sourceData = inputs;
        }

        this.log('DEBUG', 'Data Mapper Input', { type: typeof sourceData, inputCount: inputs.length });

        try {
            let result: any = {};

            if (mappingType === 'custom') {
                // Advanced Mode: Raw JSONATA Expression
                const expression = config.expression || '$';
                this.log('INFO', 'Executing custom JSONATA expression');

                const compiled = jsonata(expression);
                result = await compiled.evaluate(sourceData);

            } else {
                // Visual Mode: Key-Value Mapping
                // Config structure: { mappings: [{ target: 'field', source: 'jsonata_expr' }] }
                const mappings = config.mappings || [];
                this.log('INFO', `Executing Visual Mapping with ${mappings.length} fields`);

                for (const map of mappings) {
                    if (map.target && map.source) {
                        try {
                            // If source is a literal value (not starting with $ or special char), might need handling?
                            // For now assume source is a valid JSONATA expression (even simple field access is jsonata)

                            // To support simple Drag & Drop variable replacement from frontend {{Node.data}}
                            // We might need to preprocess. 
                            // However, ideally the Frontend sends valid JSONATA or we interpret it here.

                            // Let's assume the Frontend sends a 'source' string that might be a JSONATA expression
                            // OR a simple path. 

                            // If the user drags a variable {{Node.data}}, the frontend might convert it to a value before sending?
                            // NO, the backend executes. using `inputs`.

                            // If the user configures: Target: "invoiceId", Source: "inputs[0].invoice_number"
                            // Then we run jsonata("inputs[0].invoice_number").evaluate(sourceData)

                            // Resolve variable substitutions first (e.g. {{Node.data}})
                            let sourceValue = this.resolveVariables(map.source);

                            let value: any;
                            // If it resolved to a non-string object/array, use it directly
                            if (typeof sourceValue !== 'string') {
                                value = sourceValue;
                            } else {
                                // If it's a string, evaluate as JSONATA against the current sourceData context
                                try {
                                    const expression = jsonata(sourceValue);
                                    value = await expression.evaluate(sourceData);
                                } catch (e) {
                                    // Fallback: If JSONATA fails (e.g. simple string), just use the string
                                    value = sourceValue;
                                }
                            }

                            // Handle nested target paths ? (e.g. "address.city")
                            // For V1, flat target keys or simple dot notation manual handling
                            this.setNestedProperty(result, map.target, value);

                        } catch (err: any) {
                            this.log('WARN', `Failed to map field ${map.target}: ${err.message}`);
                        }
                    }
                }
            }

            return result;

        } catch (error: any) {
            this.systemLogger.error(`Data Mapping failed: ${error.message}`);
            this.log('ERROR', `Mapping failed: ${error.message}`);
            throw error;
        }
    }

    private setNestedProperty(obj: any, path: string, value: any) {
        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length; i++) {
            const key = parts[i];
            if (i === parts.length - 1) {
                current[key] = value;
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        }
    }
}
