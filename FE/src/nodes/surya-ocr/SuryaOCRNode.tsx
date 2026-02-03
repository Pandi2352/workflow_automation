import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { BaseNode } from '../BaseNode';

export const SuryaOCRNode = memo((props: NodeProps) => {
    const config = (props.data.config || {}) as Record<string, any>;
    const modelType = String(config.modelType || 'standard').toUpperCase();

    return (
        <BaseNode
            {...props}
            label={(props.data.label as string) || 'Surya OCR'}
            icon={FileText}
            color="text-indigo-600"
        >
            <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-700">Model: {modelType}</div>
                <div className="text-xs text-slate-500">Advanced multilingual OCR engine</div>
            </div>
        </BaseNode>
    );
});

export default SuryaOCRNode;
