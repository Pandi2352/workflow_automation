import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowUpRight, Play, Trash2, Globe, Activity } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface HttpNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        method?: string;
        url?: string;
        [key: string]: any;
    };
}

export const HttpNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as HttpNodeData;
    const { deleteNode, showToast } = useWorkflowStore();

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing request...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'HTTP_REQUEST',
                nodeData: nodeData.config || {},
                inputs: []
            });
            showToast('Request successful', 'success');
        } catch (error: any) {
            showToast('Request failed', 'error', error.message);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
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
        <div className="relative group min-w-[240px]">
            {/* Hover Toolbar */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors cursor-pointer"
                        title="Test Request"
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
                selected ? 'border-cyan-500 shadow-md' : 'border-gray-200 shadow-md hover:border-cyan-300'
            }`}>
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-50 to-white border-b border-cyan-100/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-100 rounded-md text-cyan-600">
                             <ArrowUpRight size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider leading-tight">HTTP REQ</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-[8px] font-bold tracking-tight border border-cyan-100">
                        <Globe size={8} />
                        <span>API</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-3 py-3 bg-white space-y-3">
                     <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${methodColor()}`}>
                            {nodeData.config?.method || 'GET'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 truncate flex-1" title={nodeData.config?.url}>
                            {nodeData.config?.url || 'https://api.example.com...'}
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
                         <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-cyan-500 -left-[7px]" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-cyan-500 -right-[7px]" 
            />
        </div>
    );
});
