import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeActionToolbar } from '../common/NodeActionToolbar';

interface ParsingNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: any;
}

export const ParsingNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as ParsingNodeData;
    const { currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const getStatusColor = () => {
        if (isRunning) return 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-lg' : 'border-slate-200 hover:border-indigo-400 shadow-sm';
    };

    return (
        <div className={`relative group min-w-[200px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            <NodeActionToolbar nodeId={id} nodeLabel={nodeData.label} />
             {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                         <Cpu size={16} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[150px]">
                            {String(nodeData.label || 'AI PARSING')}
                        </span>
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-tighter">AI ENGINE</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 bg-white space-y-3">
                 {nodeData.description && (
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed line-clamp-2 italic mb-1 px-1">
                        {String(nodeData.description)}
                    </p>
                 )}
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 italic text-[10px] text-slate-500 text-center">
                    Extracts structured data
                 </div>
                 
                 {(data as any).executionResults?.confidenceScore && (
                     <div className="flex items-center justify-between text-[10px] px-1">
                         <span className="text-slate-500">Confidence</span>
                         <span className="text-amber-600 font-bold">
                             {((data as any).executionResults.confidenceScore * 100).toFixed(0)}%
                         </span>
                     </div>
                 )}
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
                <div className="absolute inset-0 bg-indigo-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-indigo-500 shadow-sm"
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-indigo-500 shadow-sm"
            />
        </div>
    );
});
