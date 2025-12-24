
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Trash2, Upload, FileText } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface FileUploadNodeData extends Record<string, unknown> {
    label?: string;
    executionStatus?: string;
    config?: {
        file?: {
            originalName: string;
            size: number;
        };
        [key: string]: any;
    };
}

const FileUploadNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const nodeData = data as FileUploadNodeData;
    const { deleteNode } = useWorkflowStore();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNode(id);
    };

    const fileName = nodeData.config?.file?.originalName;
    const fileSize = nodeData.config?.file?.size;

    return (
        <div className="relative group min-w-[220px]">
             {/* Hover Toolbar */}
            <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex items-center gap-1">
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
                selected ? 'border-blue-500 shadow-md' : 'border-gray-200 shadow-md hover:border-blue-300'
            }`}>
                
                {/* Header Section */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                             <Upload size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider leading-tight">FILE UPLOAD</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold tracking-tight border border-blue-100">
                        <FileText size={8} />
                        <span>INPUT</span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="px-3 py-3 bg-white space-y-3">
                     
                     {/* Config Preview */}
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-medium">File:</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {fileName ? (
                                <div className="flex items-center gap-2">
                                     <div className="bg-white p-1 rounded border border-slate-200 text-blue-600">
                                        <FileText size={12} />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-medium text-slate-700 truncate" title={fileName}>{fileName}</p>
                                        <p className="text-[9px] text-slate-400">{(fileSize ? fileSize / 1024 : 0).toFixed(1)} KB</p>
                                     </div>
                                </div>
                            ) : (
                                <span className="text-[9px] text-slate-400 italic">No file uploaded</span>
                            )}
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
            </div>

            {/* Source Handle Only (Input Node) */}
            <Handle 
                type="source" 
                position={Position.Right} 
                isConnectable={isConnectable}
                className="!w-2 !h-4 !bg-slate-400 !border-2 !border-white !rounded-sm transition-all hover:!bg-blue-500 -right-[7px]" 
            />
        </div>
    );
});

export default FileUploadNode;
