import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Mail } from 'lucide-react';
import { AgentNodeBase } from './AgentNodeBase';

export const EmailTemplateNode = memo((props: NodeProps) => {
    const nodeData = props.data as any;

    return (
        <AgentNodeBase
            {...props}
            label={nodeData.label || 'Email Template (AI)'}
            description={nodeData.description || 'Generate subject & body'}
            icon={Mail}
            data={nodeData}
            isConnectable={props.isConnectable}
        />
    );
});

export default EmailTemplateNode;
