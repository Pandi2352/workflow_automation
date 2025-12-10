import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MoreVertical, Loader2 } from 'lucide-react';

interface BaseNodeProps extends Omit<NodeProps, 'selected'> {
    label: string;
    icon?: React.ElementType;
    color?: string;
    selected?: boolean;
    children?: React.ReactNode;
    className?: string;
    data: any;
}

export const BaseNode = memo(({ data, isConnectable, selected, label, icon: Icon, color = 'text-slate-600', children, className = '' }: BaseNodeProps) => {
    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 ${
            selected ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
        } ${className}`}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -left-[9px]"
            />

            {/* Header */}
            <div className="flex items-center p-3 border-b border-slate-100 bg-slate-50/80 rounded-t-lg backdrop-blur-sm">
                <div className={`mr-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm ${color}`}>
                    {Icon ? <Icon size={18} /> : <div className="w-4 h-4 rounded-full bg-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate leading-tight" title={label || data.label as string}>
                        {label || data.label as string}
                    </h3>
                </div>
                 {/* Action Menu (Placeholder) */}
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 bg-white rounded-b-lg">
                 {data.executionStatus ? (
                     <div className="flex items-center justify-between text-xs">
                         <span className={`font-semibold flex items-center gap-1 ${
                             data.executionStatus === 'SUCCESS' ? 'text-green-600' :
                             data.executionStatus === 'FAILED' ? 'text-red-600' :
                             'text-blue-600'
                         }`}>
                             {data.executionStatus === 'SUCCESS' ? 'Success' : 
                              data.executionStatus === 'FAILED' ? 'Error' : 
                              <>
                                <Loader2 className="animate-spin" size={12} /> Running
                              </>}
                         </span>
                         {data.executionDuration !== undefined && (
                             <span className="text-gray-400">
                                 {data.executionDuration}ms
                             </span>
                         )}
                    </div>
                 ) : children || (
                     <div className="text-xs text-slate-500 line-clamp-2">
                        {data.description as string || 'No description'}
                     </div>
                 )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                 className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -right-[9px]"
            />
        </div>
    );
});
