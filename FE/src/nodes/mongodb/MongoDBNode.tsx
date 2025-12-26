import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, Play, Trash2, Layout, DatabaseZap } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface MongoDBNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    config?: {
        dbName?: string;
        collectionName?: string;
        [key: string]: any;
    };
    executionStatus?: string;
}

export const MongoDBNode = memo(({ id, data, selected }: NodeProps) => {
    const nodeData = data as MongoDBNodeData;
    const { deleteNode, currentExecution } = useWorkflowStore();
    
    // Find execution status for this node
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const getStatusColor = () => {
        if (isRunning) return 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-lg' : 'border-slate-200 hover:border-emerald-400 shadow-sm';
    };

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                        title="Test Node"
                    >
                        <Play size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete Node"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center gap-3 rounded-t-[10px]">
                <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600">
                    <Database size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">
                        {nodeData.label || 'MongoDB'}
                    </h3>
                    <div className="flex items-center gap-1">
                        <DatabaseZap size={10} className="text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Database Storage</span>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-3">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 mb-2">
                    <p className="text-[10px] text-slate-400 font-mono truncate uppercase flex items-center gap-1 mb-1">
                         <span className="text-emerald-500 underline decoration-emerald-200/50 underline-offset-2 font-bold decoration-2">DB</span> {nodeData.config?.dbName || 'automation_db'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate uppercase flex items-center gap-1">
                        <Layout size={8} className="text-slate-300" /> {nodeData.config?.collectionName || 'manual_review'}
                    </p>
                </div>
            </div>

            {/* Execution Status Indicator */}
            {(isRunning || isSuccess || isFailed) && (
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm transform transition-all scale-110 ${
                        isRunning ? 'bg-blue-500 animate-spin border-t-transparent' :
                        isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
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
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-emerald-500 hover:!scale-125 shadow-sm"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-emerald-500 hover:!scale-125 shadow-sm"
            />
        </div>
    );
});
