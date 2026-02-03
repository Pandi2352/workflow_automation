
import React, { useState } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, Trash2, FileText } from 'lucide-react';
import axios from 'axios';
import { useWorkflowStore } from '../../../store/workflowStore';
import JsonViewer from '../../../common/JsonViewer';
import { NodeHelpButton } from '../../../common/NodeHelpButton';

interface FileUploadConfigPanelProps {
    data?: any;
    onChange?: (data: any) => void;
    nodeExecutionData?: any;
}

const FileUploadConfigPanel: React.FC<FileUploadConfigPanelProps> = ({ data, onChange, nodeExecutionData }) => {
    const { setSelectedNode } = useWorkflowStore();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If viewing execution, use output data
    const executionFile = nodeExecutionData?.output?.[0];
    const isReadOnly = !!nodeExecutionData;
    
    // Fallback to configured data if not execution
    const currentFile = executionFile || data?.config?.file;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:4000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update node configuration with file metadata
            if (onChange) {
                onChange({
                    ...data,
                    config: {
                        ...data.config,
                        file: response.data
                    }
                });
            }

        } catch (err: any) {
            console.error('Upload failed', err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        if (onChange) {
            onChange({
                ...data,
                config: {
                    ...data.config,
                    file: null
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 animate-in fade-in duration-200" onClick={() => setSelectedNode(null)} />
            <div 
                className="relative bg-white shadow-2xl w-[95vw] max-w-[600px] h-full flex flex-col transform transition-all animate-in slide-in-from-right duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                             <Upload size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">File Upload</h3>
                            <p className="text-xs text-slate-500">Manual file input</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="FILE_UPLOAD" />
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 bg-slate-50 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={12} />
                            Selected File
                        </label>

                        {!currentFile ? (
                            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-white transition-colors text-center cursor-pointer group bg-white/50">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className={`absolute inset-0 w-full h-full opacity-0 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                    disabled={uploading || isReadOnly}
                                />
                                 <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-blue-600 transition-colors">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-50 transition-colors">
                                                <Upload size={24} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="text-sm font-medium block">Click to upload file</span>
                                                <span className="text-xs text-slate-400">or drag and drop</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileIcon size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{currentFile.originalName}</p>
                                        <p className="text-xs text-slate-500 font-medium">{(currentFile.size / 1024).toFixed(2)} KB</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-green-600 mt-1 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                            <CheckCircle size={10} />
                                            <span>Ready</span>
                                        </div>
                                    </div>
                                </div>
                                {!isReadOnly && (
                                    <button 
                                        onClick={handleRemoveFile}
                                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Remove File"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                                <X size={14} />
                                {error}
                            </div>
                        )}
                    </div>

                    {isReadOnly && executionFile && (
                         <div className="space-y-2 pt-4 border-t border-slate-200">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                 Execution Details
                             </label>
                             <div className="bg-white rounded-lg border border-slate-200 text-xs font-mono max-h-40 overflow-auto custom-scrollbar">
                                 <JsonViewer data={executionFile} />
                             </div>
                         </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end items-center shrink-0">
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUploadConfigPanel;

