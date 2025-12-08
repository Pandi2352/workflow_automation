import { BaseWorkflowNode } from './workflow-node.interface';

export class AddNode extends BaseWorkflowNode {
    execute(inputs: number[]): number {
        this.log('DEBUG', `Adding values: ${inputs.join(' + ')}`);
        const result = inputs.reduce((a, b) => a + b, 0);
        this.log('INFO', `Addition result: ${result}`);
        return result;
    }
}
