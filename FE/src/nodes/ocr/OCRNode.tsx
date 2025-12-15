import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Play, FileText, Cpu, Key } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { axiosInstance } from '../../api/axiosConfig';

interface OCRNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        modelName?: string;
        files?: any;
        file?: any;
        [key: string]: any;
    };
}

export const OCRNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as OCRNodeData;
    const { deleteNode, showToast } = useWorkflowStore();

    const handleTestNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        showToast('Testing node...', 'info');
        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'OCR',
                nodeData: nodeData.config || {},
                inputs: [] 
            });
            console.log(response);
            showToast('Node test successful', 'success');
        } catch (error: any) {
            showToast('Node test failed', 'error', error.message);
        }
    };



    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
    };

    return (
        <div className="relative group min-w-[200px]">
             {/* Hover Toolbar */}


            {/* Top Toolbar - Actions */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
                    <button 
                        onClick={handleTestNode}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
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

            <div className={`relative flex flex-col items-stretch bg-white rounded-lg border border-gray-100 overflow-hidden duration-200 ${
                selected ? 'border-purple-500 shadow-md' : 'border-gray-200 shadow-md hover:border-purple-300'
            }`}>
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-md text-purple-600">
                             <FileText size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider leading-tight">OCR PROCESSING</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-bold tracking-tight border border-purple-100">
                        <Cpu size={8} />
                        <span>AI</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-3 py-3 bg-white space-y-3">
                     
                     {/* Input Preview */}
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <Key size={10} />
                            <span className="font-medium">Configuration</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">Model:</span>
                                <span className="text-slate-700 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {nodeData.config?.modelName?.replace('gemini-', '') || '1.5-flash'}
                                </span>
                            </div>
                           {/*  Credential display - requires lookup or just existence check */}
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">Creds:</span>
                                <span className={`font-medium px-1.5 py-0.5 rounded border ${nodeData.config?.credentialId ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                    {nodeData.config?.credentialId ? 'Set' : 'Missing'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">Input:</span>
                                <span className="text-slate-700 font-medium truncate max-w-[100px]" title={nodeData.config?.files || nodeData.config?.file || 'Not set'}>
                                    {nodeData.config?.files ? 'Dynamic Files' : (nodeData.config?.file ? 'Single File' : 'Not set')}
                                </span>
                            </div>
                        </div>
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
                         <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <Handle 
                type="target" 
                position={Position.Left} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-purple-500 -left-[7px]" 
            />
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-purple-500 -right-[7px]" 
            />
        </div>
    );
});

export default OCRNode;
