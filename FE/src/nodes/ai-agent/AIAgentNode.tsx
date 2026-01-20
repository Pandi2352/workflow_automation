import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { AgentNodeBase } from './AgentNodeBase';

export const AIAgentNode = memo((props: NodeProps) => {
    const nodeData = props.data as any;

    return (
        <AgentNodeBase
            {...props}
            label={nodeData.label || 'AI Agent'}
            description={nodeData.description}
            icon={Bot}
            data={nodeData}
            isConnectable={props.isConnectable}
        />
    );
});

export default AIAgentNode;
