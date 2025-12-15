import { NodeExecutionContext, NodeExecutionResult, ExecutionLog } from '../interfaces/execution-context.interface';

export interface WorkflowNode {
    execute(inputs: any[], data?: any): Promise<any> | any;
}

export abstract class BaseWorkflowNode implements WorkflowNode {
    protected logs: ExecutionLog[] = [];

    abstract execute(inputs: any[], data?: any): Promise<any> | any;

    async executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting execution of node: ${context.nodeName}`);
            this.log('DEBUG', `Input values: ${JSON.stringify(context.inputs)}`);

            // Priority 1: Use resolved config values from expressions (if available)
            // These are values resolved from expressions like {{NodeName.outputs.value.property}}
            let inputValues: any[];

            if (context.data?.config && Object.keys(context.data.config).length > 0) {
                // Get values from resolved config (expression results)
                const configValues = Object.values(context.data.config);
                inputValues = configValues;
                this.log('DEBUG', `Using resolved config values: ${JSON.stringify(configValues)}`);
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

            // Pass triggerData in the execution data if available
            if (context.triggerData) {
                // We inject it into the data object so the node's execute method can access it
                if (!context.data) context.data = {};
                context.data._triggerData = context.triggerData;
            }

            const result = await this.execute(inputValues, context.data);

            this.log('INFO', `Node executed successfully`); // Removed result from log (too verbose)

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
}
