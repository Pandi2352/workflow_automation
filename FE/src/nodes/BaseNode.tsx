import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { cn } from '@/lib/utils';
import { Handle, Position } from '@xyflow/react';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { NodeActionToolbar } from './common/NodeActionToolbar';

export interface BaseNodeProps extends Omit<NodeProps, 'selected' | 'isConnectable'> {
    label: string;
    icon?: React.ElementType;
    color?: string;
    selected?: boolean;
    children?: React.ReactNode;
    className?: string;
    data: any;
    isConnectable?: boolean;
    handles?: {
        target?: boolean;
        source?: boolean;
    };
}

export const BaseNode = memo(({ id, data, isConnectable, selected, label, icon: Icon, color = 'text-slate-600', children, className = '', handles }: BaseNodeProps) => {
    const { deleteNode } = useWorkflowStore();

    // Map existing status to new status type
    let status: "idle" | "running" | "success" | "error" = "idle";
    
    if (data.executionStatus === 'RUNNING') status = 'running';
    else if (data.executionStatus === 'SUCCESS') status = 'success';
    else if (data.executionStatus === 'FAILED') status = 'error';

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete this ${label || 'node'}?`)) {
            deleteNode(id);
        }
    };

    return (
        <div 
            className={cn(
                "node-container group relative h-auto w-auto min-w-[200px] max-w-[280px] rounded-xl bg-white shadow-sm transition-all duration-200 border border-slate-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
                status === "success" && "border-green-500 ring-2 ring-green-500/10",
                status === "error" && "border-red-500 ring-2 ring-red-500/10",
                selected && "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg",
                className
            )}
        >
            {status === "running" && <AnimatedBorder />}
            {(handles?.target ?? true) && (
                <Handle 
                    position={Position.Left} 
                    type="target" 
                    isConnectable={isConnectable}
                    className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -left-[9px]"
                />
            )}
            {(handles?.source ?? true) && (
                <Handle 
                    position={Position.Right} 
                    type="source" 
                    isConnectable={isConnectable}
                    className="!w-3.5 !h-3.5 !bg-slate-400 !border-2 !border-white transition-all hover:!bg-indigo-500 hover:scale-125 top-1/2 -right-[9px]"
                />
            )}

            <NodeActionToolbar
                nodeId={id}
                nodeLabel={label}
                onDelete={handleDelete}
            />

            {/* Header */}
            <div className="flex flex-row items-center justify-between p-2 border-b border-slate-100/80 bg-slate-50/50 rounded-t-xl">
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-white border border-slate-200 shadow-sm ${color}`}>
                        {Icon ? <Icon size={16} /> : <div className="w-4 h-4 rounded-full bg-slate-400" />}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 tracking-tight">
                        {label || data.label as string}
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>


            {/* Content */}
            <div className="p-2 flex flex-col gap-2 text-xs text-slate-600">
                 {/* Always show main content */}
                 <div className="min-h-[20px]">
                    {children || (
                        <div className="text-xs text-slate-500 line-clamp-2">
                            {data.description as string || 'No description'}
                        </div>
                    )}
                 </div>

                 {/* Status Footer Overlay */}
                 {data.executionStatus && (
                     <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-1 bg-slate-50/50 -mx-2 -mb-2 px-2 py-1.5 ">
                         <span className={`font-semibold flex items-center gap-1.5 ${
                             data.executionStatus === 'SUCCESS' ? 'text-green-600' :
                             data.executionStatus === 'FAILED' ? 'text-red-600' :
                             'text-blue-600'
                         }`}>
                             {data.executionStatus === 'SUCCESS' ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Success
                                </>
                             ) : 
                              data.executionStatus === 'FAILED' ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Error
                                </>
                              ) : 
                              <>
                                <Loader2 className="animate-spin" size={10} /> 
                                <span className="animate-pulse">Running...</span>
                              </>}
                         </span>
                         {data.executionDuration !== undefined && (
                             <span className="text-[10px] text-slate-400 font-mono">
                                 {data.executionDuration}ms
                             </span>
                         )}
                    </div>
                 )}
            </div>
        </div>
    );
});
