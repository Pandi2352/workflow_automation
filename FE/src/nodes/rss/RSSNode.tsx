import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from '../BaseNode';
import { Rss } from 'lucide-react';

interface RSSNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        url?: string;
        [key: string]: any;
    };
}

export const RSSNode = memo((props: NodeProps) => {
    const nodeData = props.data as RSSNodeData;

    return (
        <BaseNode
            {...props}
            label={nodeData.label || 'RSS Feed'}
            icon={Rss}
            color="text-orange-500"
            isConnectable={props.isConnectable}
        >
             <div className="flex flex-col gap-1">
                 <div className="text-[10px] text-slate-500 truncate" title={nodeData.config?.url}>
                    {nodeData.config?.url || 'No URL configured'}
                 </div>
                 <div className="text-xs text-slate-600 line-clamp-2">
                    {nodeData.description || 'Fetch RSS Data'}
                 </div>
            </div>
        </BaseNode>
    );
});
