import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import gmailIcon from '../../../assets/nodeIcons/gmail-icon-logo-svgrepo-com.svg';
import { TriggerNodeBase } from '../base/TriggerNodeBase';

interface GmailNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        mode?: 'action' | 'trigger';
        query?: string;
        [key: string]: any;
    };
}

export const GmailNode = memo((props: NodeProps) => {
    const nodeData = props.data as GmailNodeData;
    let displayLabel = nodeData.label || 'Watch Emails';
    if (nodeData.config?.query) {
        const q = nodeData.config.query;
        displayLabel = `Watch ${q.length > 10 ? q.slice(0, 10) + '...' : q}`;
    }

    return (
        <TriggerNodeBase
            label={displayLabel}
            badgeText="GMAIL TRIGGER"
            detailText={nodeData.config?.query}
            icon={<img src={gmailIcon} alt="Gmail" className="w-6 h-6 object-contain" />}
            accent="red"
            selected={props.selected}
            isConnectable={props.isConnectable}
            executionStatus={nodeData.executionStatus as any}
        />
    );
});

