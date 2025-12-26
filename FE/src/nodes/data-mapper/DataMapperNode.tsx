import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Split, Play, Trash2, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface DataMapperNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        mappings?: any[];
        mappingType?: string;
        [key: string]: any;
    };
}

export const DataMapperNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as DataMapperNodeData;
    const { deleteNode, showToast } = useWorkflowStore();
    const mappingCount = nodeData.config?.mappings?.length || 0;

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing transformation...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'DATA_MAPPER',
                nodeData: nodeData.config || {},
                inputs: []
            });
            showToast('Transformation successful', 'success');
        } catch (error: any) {
            showToast('Transformation failed', 'error', error.message);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
    };

    return (
        <div className="relative group min-w-[220px]">
            {/* Hover Toolbar */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors cursor-pointer"
                        title="Test Transformation"
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

            <div className={`relative flex flex-col items-stretch bg-white rounded-lg border border-gray-100 overflow-hidden duration-200 ${
                selected ? 'border-pink-500 shadow-md' : 'border-gray-200 shadow-md hover:border-pink-300'
            }`}>
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-pink-50 to-white border-b border-pink-100/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-pink-100 rounded-md text-pink-600">
                             <Split size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider leading-tight">MAPPER</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-[8px] font-bold tracking-tight border border-pink-100">
                        <ArrowRight size={8} />
                        <span>TRANSFORM</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-3 py-3 bg-white space-y-3">
                     <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-500 font-medium">Mapped Fields</span>
                        <span className="text-xs font-bold text-pink-600 bg-white px-2 py-0.5 rounded border border-pink-100">
                            {mappingCount}
                        </span>
                     </div>
                </div>

                {/* Status Line */}
                {!!nodeData.executionStatus && (
                    <div className={`h-[3px] w-full ${
                        nodeData.executionStatus === 'SUCCESS' ? 'bg-green-500' : 
                        nodeData.executionStatus === 'FAILED' ? 'bg-red-500' : 
                        'bg-blue-500 animate-pulse'
                    }`} />
                )}

                 {/* Loading Spinner Overlay */}
                 {nodeData.executionStatus === 'RUNNING' && (
                    <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                         <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-pink-500 -left-[7px]" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-pink-500 -right-[7px]" 
            />
        </div>
    );
});
