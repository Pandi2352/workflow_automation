import { BaseWorkflowNode } from './workflow-node.interface';

export class SubtractNode extends BaseWorkflowNode {
    execute(inputs: number[]): number {
        const a = inputs[0] || 0;
        const b = inputs[1] || 0;
        this.log('DEBUG', `Subtracting: ${a} - ${b}`);
        const result = a - b;
        this.log('INFO', `Subtraction result: ${result}`);
        return result;
    }
}
