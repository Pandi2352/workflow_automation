import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Mail } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { TriggerNodeBase } from '../base/TriggerNodeBase';

export const OutlookNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;

    const query = (data.config as any)?.query as string | undefined;
    const displayLabel = query ? `Watch ${query.length > 10 ? query.slice(0, 10) + '...' : query}` : (data.label as string) || 'Watch Outlook';

    return (
        <TriggerNodeBase
            label={displayLabel}
            badgeText="OUTLOOK"
            detailText={query || 'New email'}
            icon={<Mail size={28} />}
            accent="indigo"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default OutlookNode;
