import { BaseWorkflowNode } from './workflow-node.interface';
import { NodeExecutionResult, NodeExecutionContext } from '../interfaces/execution-context.interface';

export class IfElseNodeStrategy extends BaseWorkflowNode {
    constructor() {
        super();
    }

    async execute(inputs: any[], data?: any): Promise<NodeExecutionResult | any[]> {
        const config = data?.config || {};
        const condition = config.condition; // e.g., "{{input.confidence}} > 0.8"
        // Note: The expression evaluator in WorkflowExecutorService should have already resolved 
        // string expressions in data.config if they were simple {{}} replacements.
        // However, for logical comparisons like "A > B", we might need to handle it here 
        // if the evaluator only does variable substitution.

        // Assuming the 'condition' itself might be a boolean if resolved, or a string to evaluate.
        // For now, let's assume the condition is evaluated by the expression evaluator OR
        // we implement a simple JS check here if it's still a string.

        // In a real system, we'd use a sandboxed evaluator or the service's evaluator.
        // Given 'expressionEvaluator' service is in the executor, 'data.config' passed here 
        // might already have resolved values if we set it up right.

        // BUT 'IfElse' nodes often need their OWN logic to determine which OUTPUT to fire.
        // WorkflowExecutor normally stops if a node finishes. 
        // BaseWorkflowNode usually returns an output value.

        // Strategy: 
        // IF TRUE: Return output { result: true }. 
        // The WorkflowExecutor needs to know which EDGE to follow. 
        // Standard ReactFlow/Workflow engines often handle this by "sourceHandle".
        // We should output a value that downstream nodes can filter on, 
        // OR the Executor specifically handles 'IF_ELSE' routing.

        // Let's implement this node to return { result: boolean }.
        // Downstream paths will need to filter based on this result.
        // OR the node outputs to specific handles 'true' and 'false'.

        let result = false;

        // Simple evaluation assuming resolved boolean or basic string comparison
        if (typeof condition === 'boolean') {
            result = condition;
        } else if (typeof condition === 'string') {
            // Very unsafe eval for demo purposes, or use a safer parser.
            // For this environment, let's try to interpret "value > value".
            // If the expression evaluator already replaced vars, we might have "0.9 > 0.8".
            try {
                // Determine if we can safely evaluate
                // eslint-disable-next-line no-eval
                result = eval(condition);
            } catch (e) {
                this.log('ERROR', `Failed to evaluate condition: ${condition} - ${e.message}`);
                result = false;
            }
        }

        this.log('INFO', `Condition '${condition}' evaluated to ${result}`);

        return {
            success: true, // Required
            output: {
                result,
                branch: result ? 'true' : 'false'
            },
            logs: this.logs
        };
    }
}
