import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeActionToolbar } from '../common/NodeActionToolbar';

interface HttpNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        method?: string;
        url?: string;
        [key: string]: any;
    };
}

export const HttpNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as HttpNodeData;
    const { currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const getStatusColor = () => {
        if (isRunning) return 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-cyan-500 ring-2 ring-cyan-100 shadow-lg' : 'border-slate-200 hover:border-cyan-400 shadow-sm';
    };

    const methodColor = () => {
        const method = nodeData.config?.method || 'GET';
        switch (method) {
            case 'GET': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'POST': return 'text-green-600 bg-green-50 border-green-200';
            case 'PUT': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className={`relative group min-w-[240px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
            <NodeActionToolbar nodeId={id} nodeLabel={nodeData.label} />

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-50 to-white border-b border-cyan-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-100 rounded-md text-cyan-600">
                         <Globe size={16} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[150px]">
                            {String(nodeData.label || 'HTTP REQUEST')}
                        </span>
                        <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-tighter">REST API</span>
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
                 <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${methodColor()}`}>
                        {String(nodeData.config?.method || 'GET')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 truncate flex-1" title={String(nodeData.config?.url || '')}>
                        {String(nodeData.config?.url || 'https://api.example.com...')}
                    </span>
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
                <div className="absolute inset-0 bg-cyan-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-cyan-500 shadow-sm" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-cyan-500 shadow-sm" 
            />
        </div>
    );
});
