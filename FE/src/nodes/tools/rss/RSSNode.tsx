import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Rss } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { ToolNodeBase } from '../base/ToolNodeBase';

export const RSSNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const config = (data.config || {}) as any;

    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const hostname = config.url ? new URL(config.url).hostname : 'NO URL';

    return (
        <ToolNodeBase
            label={String(data.label || 'RSS Feed')}
            badgeText="RSS"
            detailText={hostname}
            icon={<Rss size={24} />}
            accent="orange"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default RSSNode;
