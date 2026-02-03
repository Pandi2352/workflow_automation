import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Split } from 'lucide-react';
import { BaseNode } from '../BaseNode';

export const DataMapperNode = memo((props: NodeProps) => {
    const config = (props.data.config || {}) as Record<string, any>;
    const mappingType = String(config.mappingType || 'visual').toUpperCase();
    const mappingCount = Array.isArray(config.mappings) ? config.mappings.length : 0;

    return (
        <BaseNode
            {...props}
            label={(props.data.label as string) || 'Data Mapper'}
            icon={Split}
            color="text-amber-600"
        >
            <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-700">Type: {mappingType}</div>
                <div className="text-xs text-slate-500">Mappings: {mappingCount}</div>
            </div>
        </BaseNode>
    );
});

export default DataMapperNode;
