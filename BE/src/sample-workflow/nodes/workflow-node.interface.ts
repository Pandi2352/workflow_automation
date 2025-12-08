import { NodeExecutionContext, NodeExecutionResult, ExecutionLog } from '../interfaces/execution-context.interface';

export interface WorkflowNode {
    execute(inputs: number[], data?: any): number;
}

export abstract class BaseWorkflowNode implements WorkflowNode {
    protected logs: ExecutionLog[] = [];

    abstract execute(inputs: number[], data?: any): number;

    async executeWithContext(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        this.logs = [];
        const startTime = Date.now();

        try {
            this.log('INFO', `Starting execution of node: ${context.nodeName}`);
            this.log('DEBUG', `Input values: ${JSON.stringify(context.inputs)}`);

            const inputValues = context.inputs.map(input => input.value);
            const result = this.execute(inputValues, context.data);

            this.log('INFO', `Node executed successfully with result: ${result}`);

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
