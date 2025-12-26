import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu } from 'lucide-react';

export const ParsingNode = memo((props: NodeProps) => {
    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
            props.selected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
        }`}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={props.isConnectable}
                className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -left-[9px]"
            />

            {/* Header */}
            <div className="flex items-center p-3 border-b border-slate-100 bg-indigo-50/50 rounded-t-lg backdrop-blur-sm">
                <div className="mr-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-indigo-600">
                    <Cpu size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate leading-tight" title={props.data.label as string}>
                        {props.data.label as string || 'AI Parsing'}
                    </h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 bg-white rounded-b-lg">
                <div className="text-xs text-slate-500 mb-2">
                    Extracts structured data
                </div>
                
                {!!(props.data.executionStatus || (props.data as any).executionStatus) && (
                     <div className="mt-2 flex items-center justify-between text-xs">
                         <span className={`font-semibold flex items-center gap-1 ${
                             (props.data.executionStatus || (props.data as any).executionStatus) === 'SUCCESS' ? 'text-green-600' :
                             (props.data.executionStatus || (props.data as any).executionStatus) === 'FAILED' ? 'text-red-600' :
                             'text-blue-600'
                         }`}>
                             {String(props.data.executionStatus || (props.data as any).executionStatus)}
                         </span>
                         {(props.data as any).executionResults?.confidenceScore && (
                             <span className="text-amber-600 font-medium">
                                 {((props.data as any).executionResults.confidenceScore * 100).toFixed(0)}% Conf.
                             </span>
                         )}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={props.isConnectable}
                className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-white transition-all hover:scale-125 top-1/2 -right-[9px]"
            />
        </div>
    );
});
