import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { TriggerNodeBase } from '../base/TriggerNodeBase';

interface WebhookNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        path?: string;
        [key: string]: any;
    };
}

export const WebhookNode = memo(({ data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as WebhookNodeData;

    return (
        <TriggerNodeBase
            label={nodeData.label || 'Webhook'}
            badgeText="WEBHOOK"
            detailText={nodeData.config?.path}
            icon={<Zap size={28} />}
            accent="orange"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeData.executionStatus as any}
        />
    );
});

export default WebhookNode;

