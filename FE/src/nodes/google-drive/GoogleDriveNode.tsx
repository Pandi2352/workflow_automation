import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { HardDrive } from 'lucide-react'; // Placeholder icon if no Google Drive icon
import { BaseNode } from '../BaseNode';

export const GoogleDriveNode = memo((props: NodeProps) => {
    return (
        <BaseNode
            {...props}
            label={props.data.label as string || 'Google Drive'}
            icon={HardDrive}
            color="text-green-600"
        />
    );
});
