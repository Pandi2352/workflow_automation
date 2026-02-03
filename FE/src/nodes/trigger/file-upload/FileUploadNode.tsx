import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Upload } from 'lucide-react';
import { TriggerNodeBase } from '../base/TriggerNodeBase';

interface FileUploadNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        file?: {
            originalName: string;
            size: number;
        };
        [key: string]: any;
    };
}

const FileUploadNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as FileUploadNodeData;
    const fileName = nodeData.config?.file?.originalName;

    return (
        <TriggerNodeBase
            id={id}
            label={nodeData.label || 'File Upload'}
            badgeText="FILE UPLOAD"
            detailText={fileName || 'No file uploaded'}
            icon={<Upload size={28} />}
            accent="blue"
            selected={selected}
            isConnectable={isConnectable}
            executionStatus={nodeData.executionStatus as any}
        />
    );
});

export default FileUploadNode;

