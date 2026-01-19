import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNode } from '../BaseNode';
import { FileText, Cpu, Key } from 'lucide-react';

interface OCRNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        modelName?: string;
        files?: any;
        file?: any;
        credentialId?: string;
        [key: string]: any;
    };
}

export const OCRNode = memo((props: NodeProps) => {
    const nodeData = props.data as OCRNodeData;

    return (
        <BaseNode
            {...props}
            label={nodeData.label || 'OCR Processing'}
            icon={FileText}
            color="text-purple-600"
            isConnectable={props.isConnectable}
        >
             <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight flex items-center gap-1">
                        <Cpu size={10} />
                        {nodeData.config?.modelName?.replace('gemini-', '') || '1.5-flash'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-tight flex items-center gap-1 ${
                        nodeData.config?.credentialId 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        <Key size={10} />
                        {nodeData.config?.credentialId ? 'Active' : 'Missing'}
                    </span>
                 </div>
                 <div className="text-[11px] text-slate-600 line-clamp-2 italic">
                    {nodeData.description || 'Extract data relative to document structure'}
                 </div>
            </div>
        </BaseNode>
    );
});

export default OCRNode;

