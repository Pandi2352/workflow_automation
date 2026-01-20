import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '../../store/workflowStore';

export interface AgentNodeBaseProps extends NodeProps {
    label: string;
    description?: string;
    icon?: React.ElementType;
}

export const AgentNodeBase = memo(({ id, data, isConnectable, selected, label, icon: Icon = Bot }: AgentNodeBaseProps) => {
    const { deleteNode } = useWorkflowStore();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete this agent?`)) {
            deleteNode(id);
        }
    };

    const status = data.executionStatus;

    return (
        <div className={cn(
            "relative min-w-[200px] bg-white border-2 rounded-xl transition-all duration-300 group pb-4",
            selected ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-xl" : "border-emerald-600/80 shadow-sm hover:border-emerald-600 hover:shadow-md"
        )}>
            {/* Side handles */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-500 !-left-[3px] transition-all hover:scale-125 hover:!bg-emerald-50"
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-500 !-right-[3px] transition-all hover:scale-125 hover:!bg-emerald-50"
            />

            {/* Toolbar */}
            <div className="absolute -top-7 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                <button 
                    onClick={handleDelete}
                    className="p-1 bg-gray-80 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Main Content */}
            <div className="px-3 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-700 shrink-0">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                
                <div className="flex flex-col min-w-0">
                    <h3 className="text-base font-bold text-slate-800 leading-tight tracking-tight truncate">
                        {label}
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                        Double-click to open
                    </p>
                </div>
            </div>

            {/* Status Indicator (Checkmark like in image) - repositioned for tight fit */}
            {status === 'SUCCESS' && (
                <div className="absolute right-3 bottom-5 text-emerald-500 animate-in zoom-in duration-300">
                    <Check size={16} strokeWidth={4} />
                </div>
            )}

            {/* Diamond Handles at Bottom Border with unique styling */}
            {/* Chat Model Handle */}
            <Handle
                type="target"
                id="model"
                position={Position.Bottom}
                isConnectable={isConnectable}
                style={{ left: '23%' }}
                className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-300 !top-full !-translate-y-1/2 !transform rotate-45 !rounded-none transition-all hover:!border-emerald-500 hover:scale-110 shadow-sm"
            />
            <div className="absolute top-[calc(100%+6px)] left-[24%] -translate-x-1/2">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                    Chat Model<span className="text-red-500">*</span>
                </span>
            </div>

            {/* Memory Handle */}
            <Handle
                type="target"
                id="memory"
                position={Position.Bottom}
                isConnectable={isConnectable}
                style={{ left: '53%' }}
                className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-300 !top-full !-translate-y-1/2 !transform rotate-45 !rounded-none transition-all hover:!border-emerald-500 hover:scale-110 shadow-sm"
            />
            <div className="absolute top-[calc(100%+6px)] left-[54%] -translate-x-1/2">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                    Memory
                </span>
            </div>

            {/* Tool Handle */}
            <Handle
                type="target"
                id="tool"
                position={Position.Bottom}
                isConnectable={isConnectable}
                style={{ left: '83%' }}
                className="!w-2.5 !h-2.5 !bg-white !border-2 !border-slate-300 !top-full !-translate-y-1/2 !transform rotate-45 !rounded-none transition-all hover:!border-emerald-500 hover:scale-110 shadow-sm"
            />
            <div className="absolute top-[calc(100%+6px)] left-[84%] -translate-x-1/2">
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                    Tool
                </span>
            </div>
            
            {/* Minimal execution status bar if running/error */}
            {status === 'RUNNING' && (
                <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-emerald-500 overflow-hidden rounded-b-xl">
                    <div className="h-full bg-emerald-300 w-1/3 animate-[progress_1.5s_infinite_linear]" />
                </div>
            )}
            {status === 'FAILED' && (
                <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500 rounded-b-xl" />
            )}
        </div>
    );
});
