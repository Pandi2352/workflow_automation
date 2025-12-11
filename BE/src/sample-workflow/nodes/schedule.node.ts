import { BaseWorkflowNode } from './workflow-node.interface';

export class ScheduleNode extends BaseWorkflowNode {
    async execute(inputs: any[], data?: any): Promise<any> {
        // The node itself mostly passes through metadata
        // Since the scheduler triggers the execution, this node simply confirms it ran.

        const output = {
            triggeredAt: new Date().toISOString(),
            interval: data?.config?.interval,
            source: 'scheduler'
        };

        this.log('INFO', `Schedule triggered successfully at ${output.triggeredAt}`);
        return output;
    }
}
