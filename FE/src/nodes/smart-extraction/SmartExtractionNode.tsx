
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Play, BrainCircuit, ScanSearch, TableProperties } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface SmartExtractionNodeData extends Record<string, unknown> {
    label?: string;
    description?: string;
    executionStatus?: string;
    config?: {
        schema?: Record<string, string>; // key -> description
        credentialId?: string;
        [key: string]: any;
    };
}

export const SmartExtractionNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as SmartExtractionNodeData;
    const { deleteNode, showToast, currentExecution } = useWorkflowStore();

    // Find execution status
    const nodeStatus = nodeData.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isRunning = nodeStatus === 'RUNNING';
    const isSuccess = nodeStatus === 'SUCCESS';
    const isFailed = nodeStatus === 'FAILED';

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing node...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SMART_EXTRACTION',
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
        if (isRunning) return 'border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]';
        if (isSuccess) return 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
        if (isFailed) return 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
        return selected ? 'border-teal-500 ring-2 ring-teal-100 shadow-lg' : 'border-slate-200 hover:border-teal-400 shadow-sm';
    };

    const schemaKeys = Object.keys(nodeData.config?.schema || {});

    return (
        <div className={`relative group min-w-[220px] bg-white rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
            
             {/* Hover Toolbar */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-teal-50 to-white border-b border-teal-100/50 rounded-t-[10px]">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 rounded-md text-teal-600">
                         <BrainCircuit size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[150px]">
                            {String(nodeData.label || 'SMART EXTRACT')}
                        </span>
                        <span className="text-[8px] font-bold text-teal-500 uppercase tracking-tighter flex items-center gap-0.5">
                            <ScanSearch size={8} /> AI ENGINE
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
                 {/* Config Preview */}
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <TableProperties size={10} />
                        <span className="font-medium">Fields to Extract:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {schemaKeys.length > 0 ? schemaKeys.slice(0, 3).map((key, i) => (
                            <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700">
                                {key}
                            </span>
                        )) : (
                            <span className="text-[9px] text-slate-400 italic">No fields configured</span>
                        )}
                        {schemaKeys.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-bold">+{schemaKeys.length - 3}</span>
                        )}
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
                <div className="absolute inset-0 bg-teal-50/10 backdrop-blur-[0.5px] rounded-xl animate-pulse pointer-events-none" />
            )}

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-teal-500 -left-[7px]" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-teal-500 -right-[7px]" 
            />
        </div>
    );
});
