import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { TriggerNodeBase } from '../base/TriggerNodeBase';

export const ScheduleNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const config = (data.config || {}) as any;
    
    // Find execution status
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';

    const interval = config.interval || 'Not set';
    const value = config.value || '';

    let label = 'Schedule';
    if (interval === 'custom') {
        label = config.cronExpression || 'Custom Cron';
    } else if (interval && value) {
        label = `Run every ${value} ${interval}`;
    }

    return (
        <TriggerNodeBase
            label={String(data.label || 'Scheduler')}
            badgeText={label}
            icon={<Clock size={32} className={isRunning ? "animate-spin-slow" : ""} />}
            accent="orange"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default ScheduleNode;

