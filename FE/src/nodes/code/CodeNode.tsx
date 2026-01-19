
import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Terminal, Braces, Code } from 'lucide-react';
import { BaseNode } from '../BaseNode';

interface CodeNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        code?: string;
        language?: string;
        args?: Record<string, string>;
        [key: string]: any;
    };
}

export const CodeNode = memo((props: NodeProps) => {
    const nodeData = props.data as CodeNodeData;
    
    const argsCount = Object.keys(nodeData.config?.args || {}).length;
    const language = nodeData.config?.language || 'JavaScript';

    return (
        <BaseNode
            {...props}
            label={nodeData.label || 'Code Execution'}
            icon={Terminal}
            color="text-indigo-600"
            isConnectable={props.isConnectable}
        >
            <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Braces size={10} />
                        <span className="font-medium">Args: {argsCount}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-600 font-bold uppercase">
                        {language === 'python3' ? 'Python' : 'JS'}
                    </span>
                 </div>
                 <div className="text-[10px] text-slate-500 font-medium italic truncate">
                    {nodeData.description || 'Run custom logic'}
                 </div>
                 {nodeData.config?.code && (
                     <div className="mt-1 p-1.5 bg-slate-900 rounded border border-slate-800 text-[8px] font-mono text-emerald-400 overflow-hidden">
                        <div className="flex items-center gap-1 mb-1 text-slate-500 border-b border-white/5 pb-1">
                            <Code size={8} />
                            <span>SOURCE</span>
                        </div>
                        <pre className="truncate opacity-80">
                            {nodeData.config.code.substring(0, 50)}...
                        </pre>
                     </div>
                 )}
            </div>
        </BaseNode>
    );
});

export default CodeNode;

