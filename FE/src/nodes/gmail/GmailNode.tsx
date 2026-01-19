import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from '../BaseNode';
import gmailIcon from '../../assets/nodeIcons/gmail-icon-logo-svgrepo-com.svg';

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

const GmailIcon = () => (
    <img src={gmailIcon} alt="Gmail" className="w-4 h-4 object-contain" />
);

export const GmailNode = memo((props: NodeProps) => {
    const nodeData = props.data as GmailNodeData;
    const mode = nodeData.config?.mode || 'action';
    const isTrigger = mode === 'trigger';

    let displayLabel = nodeData.label || (isTrigger ? 'Watch Emails' : 'Fetch Emails');
    if (isTrigger && nodeData.config?.query) {
        const q = nodeData.config.query;
        displayLabel = `Watch ${q.length > 10 ? q.slice(0, 10) + '...' : q}`;
    }

    return (
        <BaseNode
            {...props}
            label={displayLabel}
            icon={GmailIcon}
            color="text-red-500"
            isConnectable={props.isConnectable}
            handles={{
                target: !isTrigger, // Only show target if NOT a trigger
                source: true
            }}
        >
            <div className="flex flex-col gap-1">
                 {!nodeData.executionStatus && (
                     <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium uppercase">{isTrigger ? 'Trigger' : 'Action'}</span>
                     </div>
                 )}
                 <div className="text-xs text-slate-600">
                    {nodeData.description || 'Gmail Automation'}
                 </div>
            </div>
        </BaseNode>
    );
});
