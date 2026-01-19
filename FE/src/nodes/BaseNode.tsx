import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { MoreVertical, Loader2, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { 
    Node, 
    NodeHeader, 
    NodeTitle, 
    NodeContent 
} from '@/components/designer/NodeUI';

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
        <Node 
            className={className}
            selected={selected}
            status={status}
            isConnectable={isConnectable}
            handles={handles || {
                target: true,
                source: true
            }}
        >
            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <button 
                    onClick={handleDelete}
                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Node"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <NodeHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                 <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-white border border-slate-200 shadow-sm ${color}`}>
                        {Icon ? <Icon size={16} /> : <div className="w-4 h-4 rounded-full bg-slate-400" />}
                    </div>
                    <NodeTitle title={label || data.label as string} className="text-xs font-medium">
                        {label || data.label as string}
                    </NodeTitle>
                 </div>
                 
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
                        <MoreVertical size={14} />
                    </button>
                </div>
            </NodeHeader>


            <NodeContent className="p-2 flex flex-col gap-2">
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
            </NodeContent>
        </Node>
    );
});
