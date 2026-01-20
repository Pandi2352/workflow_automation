
import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { ToolNodeBase } from '../base/ToolNodeBase';

export const GoogleSearchToolNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;

    return (
        <ToolNodeBase
            id={id}
            label={String(data.label || 'Search Tool')}
            badgeText="GOOGLE_SEARCH"
            icon={<Globe size={22} />}
            accent="amber"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeStatus}
        />
    );
});

export default GoogleSearchToolNode;
