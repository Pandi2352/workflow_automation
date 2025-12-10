import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Box } from 'lucide-react';

export const GenericNode = memo((props: NodeProps) => {
    return (
        <BaseNode
            {...props}
            label={props.data.label as string || 'Node'}
            icon={Box}
        />
    );
});
