import { BaseWorkflowNode } from './workflow-node.interface';

export class InputNode extends BaseWorkflowNode {
    execute(inputs: number[], data?: { value?: number }): number {
        const value = data?.value ?? 0;
        this.log('INFO', `Input node providing value: ${value}`);
        return value;
    }
}
