import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Play, Cpu, Zap } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface OCRNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        modelType?: string;
        files?: any;
        [key: string]: any;
    };
}

export const SuryaOCRNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as OCRNodeData;
    const { deleteNode, showToast, currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing Surya OCR...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SURYA_OCR',
                nodeData: nodeData.config || {},
                inputs: [] 
            });
            showToast('Node test successful', 'success');
        } catch (error: any) {
            showToast('Node test failed', 'error', error.message);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
    };

    const getStatusColor = () => {
        if (isRunning) return 'border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-orange-500 ring-2 ring-orange-100 shadow-lg' : 'border-slate-200 hover:border-orange-400 shadow-sm';
    };

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors cursor-pointer"
                        title="Test Node"
                    >
                        <Play size={14} />
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete Node"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded text-orange-600 shrink-0">
                        <Zap size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[150px]">
                            {String(nodeData.label || 'SURYA OCR')}
                        </span>
                        <span className="text-[8px] font-bold text-orange-500 uppercase tracking-tighter flex items-center gap-0.5">
                            <Cpu size={8} fill="currentColor" /> LAYOUT ENGINE
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
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-medium tracking-tight">Model</span>
                        <span className="text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                            {String(nodeData.config?.modelType || 'standard')}
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

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-orange-500 -left-[7px]" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-orange-500 -right-[7px]" 
            />
        </div>
    );
});

export default SuryaOCRNode;
