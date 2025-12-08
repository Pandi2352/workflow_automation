import { BaseWorkflowNode } from './workflow-node.interface';

export class MultiplyNode extends BaseWorkflowNode {
    execute(inputs: number[]): number {
        this.log('DEBUG', `Multiplying values: ${inputs.join(' * ')}`);
        const result = inputs.reduce((a, b) => a * b, 1);
        this.log('INFO', `Multiplication result: ${result}`);
        return result;
    }
}
