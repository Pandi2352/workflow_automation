import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { AgentNodeBase } from '../ai-agent/AgentNodeBase';

export const SummarizeNode = memo((props: NodeProps) => {
    const nodeData = props.data as any;

    return (
        <AgentNodeBase
            {...props}
            label={nodeData.label || 'AI Summary Agent'}
            description={nodeData.description}
            icon={Bot}
            data={nodeData}
            isConnectable={props.isConnectable}
        />
    );
});

export default SummarizeNode;
