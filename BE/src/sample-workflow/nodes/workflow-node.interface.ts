import { NodeExecutionContext, NodeExecutionResult, ExecutionLog } from '../interfaces/execution-context.interface';

export type WorkflowNodeContext = NodeExecutionContext;

export interface WorkflowNode {
    execute(inputs: any[], data?: any): Promise<any> | any;
}

export abstract class BaseWorkflowNode implements WorkflowNode {
    protected logs: ExecutionLog[] = [];
    protected context: NodeExecutionContext;

    abstract execute(inputs: any[], data?: any): Promise<any> | any;

    async executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        this.context = context;
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting execution of node: ${context.nodeName}`);
            this.log('DEBUG', `Input values: ${JSON.stringify(context.inputs)}`);

            // Priority 1: Use resolved config values from expressions (if available)
            // These are values resolved from expressions like {{NodeName.outputs.value.property}}
            let inputValues: any[];

            if (context.data?.config && Object.keys(context.data.config).length > 0) {
                // We typically don't rely on this legacy 'resolved config' path for variable substitution anymore
                // instead we let the node strategy use this.resolveVariables()
                // But generally, we pass the raw values
                // inputValues = context.inputs.map(input => input.value);
                const configValues = Object.values(context.data.config);
                inputValues = configValues; // Legacy fall back or specific logic
                // Actually, let's stick to passing raw input values as the standard contract
                inputValues = context.inputs.map(input => input.value);
            } else {
                // Fallback: Use raw values from edge connections
                inputValues = context.inputs.map(input => input.value);
            }

            // Pass triggerData in the execution data if available
            if (context.triggerData) {
                // We inject it into the data object so the node's execute method can access it
                if (!context.data) context.data = {};
                context.data._triggerData = context.triggerData;
            }

            const result = await this.execute(inputValues, context.data);

            this.log('INFO', `Node executed successfully`);

            return {
                success: true,
                output: result,
                logs: [...this.logs],
                metadata: {
                    executionTime: Date.now() - startTime,
                    inputCount: inputValues.length,
                }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            this.log('ERROR', `Node execution failed: ${errorMessage}`);

            return {
                success: false,
                output: null,
                error: errorMessage,
                errorStack,
                logs: [...this.logs],
            };
        }
    }

    protected log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, data?: any): void {
        this.logs.push({
            timestamp: new Date(),
            level,
            message,
            data,
        });
    }

    /**
     * Resolves variables in a template string using the execution context inputs.
     * Supports: {{Node Name.outputs.path.to.value}}
     * If the template matches a single variable exactly, returns the raw value (preserving types).
     * Otherwise returns a string with interpolations.
     */
    protected resolveVariables(template: any): any {
        if (typeof template !== 'string') return template;

        // Regex to find {{ ... }}
        const regex = /{{([\s\S]+?)}}/g;

        // Check if it's a single variable replacement (e.g. "{{Node.outputs}}")
        // logic: starts with {{, ends with }}, and has only one match
        const trimmed = template.trim();
        if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
            const match = regex.exec(trimmed);
            if (match && match[0] === trimmed) {
                // It's a single variable, return the raw value
                return this.getValueFromPath(match[1].trim());
            }
        }

        // Otherwise, string interpolation
        return template.replace(regex, (match, path) => {
            const val = this.getValueFromPath(path.trim());
            return val !== undefined && val !== null ? String(val) : '';
        });
    }

    private getValueFromPath(path: string): any {
        // Expected format: NodeName.outputs.property... OR NodeName.data...
        // Built-ins: $input, $json

        // 0. Handle Built-ins
        if (path === '$input' || path.startsWith('$input.')) {
            const allInputs = (this.context.inputs || []).map(i => i.value);
            if (path === '$input') return allInputs.length === 1 ? allInputs[0] : allInputs;
            return this.getNestedValue(allInputs.length === 1 ? allInputs[0] : allInputs, path.substring(7));
        }

        if (path === '$json' || path.startsWith('$json.')) {
            const jsonContext: Record<string, any> = {};
            (this.context.inputs || []).forEach(i => {
                jsonContext[i.nodeName] = i.value;
            });
            if (path === '$json') return jsonContext;
            return this.getNestedValue(jsonContext, path.substring(6));
        }

        // 1. Split identifying the node name. Node names can contain spaces.
        // We look for the first node name that matches an input.
        const inputs = this.context.inputs || [];

        let matchingInput: any = null;
        let propertyPath = '';

        for (const input of inputs) {
            // Check if path starts with Node Name + .
            const prefix = input.nodeName + '.';
            if (path.startsWith(prefix) || path === input.nodeName) {
                matchingInput = input;
                propertyPath = path.substring(prefix.length);
                break;
            }
            // Fallback: Check for 'nodeId' if labels aren't unique inputs
            if (path.startsWith(input.nodeId + '.')) {
                matchingInput = input;
                propertyPath = path.substring(input.nodeId.length + 1);
                break;
            }
        }

        if (!matchingInput) {
            // Maybe it is referring to triggerData? e.g. {{trigger.body...}}
            if (path.startsWith('trigger.')) {
                return this.getNestedValue(this.context.triggerData, path.substring(8));
            }
            return undefined; // Not found
        }

        // 2. Resolve property path on matchingInput.value
        // If propertyPath is empty, return the whole value
        if (!propertyPath) return matchingInput.value;

        // Remove 'outputs.' prefix if it exists, as input.value IS usually the outputs
        if (propertyPath.startsWith('outputs.')) {
            propertyPath = propertyPath.substring(8);
        } else if (propertyPath === 'outputs') {
            return matchingInput.value;
        }

        return this.getNestedValue(matchingInput.value, propertyPath);
    }

    private getNestedValue(obj: any, path: string): any {
        if (!path) return obj;
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : undefined;
        }, obj);
    }
}
