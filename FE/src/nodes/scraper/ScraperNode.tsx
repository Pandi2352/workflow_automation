import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Earth, Layout, Play, Trash2, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface ScraperNodeData extends Record<string, unknown> {
    label?: string;
    config?: {
        url?: string;
        [key: string]: any;
    };
}

export const ScraperNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const nodeData = data as ScraperNodeData;
    const { deleteNode, currentExecution } = useWorkflowStore();
    
    // Find execution status for this node
    // Priority: 1. data.executionStatus (passed by ExecutionCanvas), 2. currentExecution (from store)
    const nodeStatus = (data as any).executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const getStatusColor = () => {
        if (isRunning) return 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-lg' : 'border-slate-200 hover:border-indigo-400 shadow-sm';
    };

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            {/* Hover Toolbar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xl opacity-0 group-hover:opacity-100 transition-all z-10 scale-95 group-hover:scale-100">
                <button 
                    className="p-1.5 hover:bg-green-50 text-slate-500 hover:text-green-600 rounded-md transition-colors"
                >
                    <Play size={14} fill="currentColor" />
                </button>
                <div className="w-[1px] h-4 bg-slate-100 mx-0.5" />
                <button 
                    onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                    className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100/50 flex items-center gap-3 rounded-t-[10px]">
                <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                    <Earth size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">
                        {nodeData.label || 'Web Scraper'}
                    </h3>
                    <div className="flex items-center gap-1">
                        <Layout size={10} className="text-indigo-400" />
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">AI Scraper</span>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-3">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 mb-2">
                    <p className="text-[10px] text-slate-400 font-mono truncate uppercase flex items-center gap-1">
                        <ArrowRight size={8} /> {nodeData.config?.url || 'No URL configured'}
                    </p>
                </div>
            </div>

            {/* Execution Status Indicator */}
            {(isRunning || isSuccess || isFailed) && (
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm transform transition-all scale-110 ${
                        isRunning ? 'bg-blue-500 animate-spin border-t-transparent' :
                        isSuccess ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                        {isSuccess && '✓'}
                        {isFailed && '!'}
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isRunning && (
                <div className="absolute inset-0 bg-blue-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            {/* Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-indigo-500 hover:!scale-125 shadow-sm"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-indigo-500 hover:!scale-125 shadow-sm"
            />
        </div>
    );
};
