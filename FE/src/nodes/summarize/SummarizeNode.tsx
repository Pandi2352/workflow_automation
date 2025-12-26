import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Play, AlignLeft, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface SummarizeNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        modelName?: string;
        prompt?: string;
        credentialId?: string;
        [key: string]: any;
    };
}

export const SummarizeNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as SummarizeNodeData;
    const { deleteNode, showToast, currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing AI summary...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SUMMARIZE',
                nodeData: nodeData.config || {},
                inputs: []
            });
            showToast('Summary successful', 'success');
        } catch (error: any) {
            showToast('Summary failed', 'error', error.message);
        }
    };

    const getStatusColor = () => {
        if (isRunning) return 'border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-violet-500 ring-2 ring-violet-100 shadow-lg' : 'border-slate-200 hover:border-violet-400 shadow-sm';
    };

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-violet-50 to-white border-b border-violet-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 rounded-md text-violet-600">
                         <AlignLeft size={16} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[150px]">
                            {String(nodeData.label || 'SUMMARIZE')}
                        </span>
                        <span className="text-[8px] font-bold text-violet-500 uppercase tracking-tighter flex items-center gap-0.5">
                            <Sparkles size={8} /> AI ASSISTANT
                        </span>
                    </div>
                </div>
            </div>

            {/* Body Content */}
            <div className="p-3 bg-white space-y-3">
                 {nodeData.description && (
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed line-clamp-2 italic mb-1 px-1">
                        {String(nodeData.description)}
                    </p>
                 )}
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-slate-500 font-medium">Model</span>
                        <span className="text-violet-700 font-bold bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 uppercase">
                            {String(nodeData.config?.modelName?.replace('gemini-', '') ?? '1.5-flash')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-medium">Status</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded border ${nodeData.config?.credentialId ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                            {String(nodeData.config?.credentialId ? 'Ready' : 'Pending')}
                        </span>
                    </div>
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
                <div className="absolute inset-0 bg-violet-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-violet-500 shadow-sm" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-violet-500 shadow-sm" 
            />
        </div>
    );
});

export default SummarizeNode;
