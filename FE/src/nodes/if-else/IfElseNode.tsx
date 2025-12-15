import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';

export const IfElseNode = memo((props: NodeProps) => {
    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
            props.selected ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-200 hover:border-slate-300'
        }`}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={props.isConnectable}
                className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -left-[9px]"
            />

            {/* Header */}
            <div className="flex items-center p-3 border-b border-slate-100 bg-orange-50/50 rounded-t-lg backdrop-blur-sm">
                <div className="mr-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-orange-600">
                    <GitFork size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate leading-tight" title={props.data.label as string}>
                        {props.data.label as string || 'Decision'}
                    </h3>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 bg-white rounded-b-lg">
                <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100 truncate">
                    {(props.data.config as any)?.condition || 'No condition set'}
                </div>
                
                {!!props.data.executionStatus && (
                     <div className="mt-2 flex items-center justify-between text-xs">
                         <span className={`font-semibold flex items-center gap-1 ${
                             props.data.executionStatus === 'SUCCESS' ? 'text-green-600' :
                             props.data.executionStatus === 'FAILED' ? 'text-red-600' :
                             'text-blue-600'
                         }`}>
                             {props.data.executionStatus as string}
                         </span>
                         {(props.data as any).executionDuration !== undefined && (
                             <span className="text-gray-400">
                                 {(props.data as any).executionDuration}ms
                             </span>
                         )}
                    </div>
                )}
            </div>

            {/* Output Handles */}
            {/* True Handle */}
            <div className="absolute top-1/3 -right-[9px] flex items-center">
                 <span className="absolute right-4 text-[10px] font-bold text-green-600">True</span>
                 <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    isConnectable={props.isConnectable}
                    className="!w-3.5 !h-3.5 !bg-green-500 !border-2 !border-white transition-all hover:scale-125"
                />
            </div>

            {/* False Handle */}
            <div className="absolute bottom-1/3 -right-[9px] flex items-center">
                <span className="absolute right-4 text-[10px] font-bold text-red-600">False</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    isConnectable={props.isConnectable}
                    className="!w-3.5 !h-3.5 !bg-red-500 !border-2 !border-white transition-all hover:scale-125"
                />
            </div>
        </div>
    );
});
