import { BaseWorkflowNode } from './workflow-node.interface';

export class DivideNode extends BaseWorkflowNode {
    execute(inputs: number[]): number {
        const a = inputs[0] || 0;
        const b = inputs[1];

        this.log('DEBUG', `Dividing: ${a} / ${b}`);

        if (b === 0 || b === undefined) {
            this.log('WARN', 'Division by zero attempted, using 1 as divisor');
            const result = a / 1;
            this.log('INFO', `Division result (fallback): ${result}`);
            return result;
        }

        const result = a / b;
        this.log('INFO', `Division result: ${result}`);
        return result;
    }
}
