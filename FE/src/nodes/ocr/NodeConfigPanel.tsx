import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, FileText, Zap, Key, Box, Type, Settings, Terminal, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { GeminiCredentialModal } from '../../components/credentials/GeminiCredentialModal';
import { cn } from '../../lib/utils';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/panels/NodeDataSidebar';
import { NodeHelpButton } from '../../common/NodeHelpButton';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, fetchCredentials, credentials, nodes, edges, currentExecution, deleteNode } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');

    // Fetch credentials on mount
    useEffect(() => {
        fetchCredentials('GEMINI');
    }, [fetchCredentials]);

    const geminiCredentials = useMemo(() => {
        return credentials.filter((c: any) => c.provider === 'GEMINI');
    }, [credentials]);

    // Input Data Calculation
    const inputData = useMemo(() => {
        if (!selectedNode) return [];
        const incomingEdges = edges.filter(edge => edge.target === selectedNode.id);
        return incomingEdges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const sourceExecution = currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === edge.source);
            const sourceOutput = currentExecution?.nodeOutputs?.find((out: any) => out.nodeId === edge.source); 
            
            return {
                nodeId: edge.source,
                nodeLabel: (sourceNode?.data?.label as string) || sourceNode?.id || 'Unknown Node',
                outputs: sourceExecution?.outputs || sourceOutput?.value || sourceExecution?.value || null,
                status: sourceExecution?.status || 'NOT_RUN'
            };
        });
    }, [selectedNode, edges, nodes, currentExecution]);

    const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode) {
            const isNewNode = selectedNode.id !== prevSelectedId;
            if (isNewNode) {
                setLabel((selectedNode.data?.label as string) || '');
                if (!nodeExecutionData) {
                    setExecutionResult(null);
                }
                setActiveTab('config');
                setPrevSelectedId(selectedNode.id);
            }
        } else {
            setPrevSelectedId(null);
        }
    }, [selectedNode, prevSelectedId]);

    useEffect(() => {
        if (nodeExecutionData) {
            setExecutionResult({
                success: nodeExecutionData.status === 'SUCCESS',
                output: nodeExecutionData.outputs || nodeExecutionData.value,
                logs: nodeExecutionData.logs,
                status: nodeExecutionData.status
            });
             if (nodeExecutionData.status) {
                 setActiveTab('output');
             }
        }
    }, [nodeExecutionData]);

    if (!selectedNode) return null;

    const config = (selectedNode.data?.config || {}) as any;

    const handleConfigChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, {
            config: {
                ...config,
                [key]: value
            }
        });
    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode.id, { label: e.target.value });
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');
        
        try {
            const rawInputs = inputData.map(d => ({
                nodeId: d.nodeId,
                nodeName: d.nodeLabel,
                value: d.outputs
            }));

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'OCR',
                nodeData: { ...config, forceProcess: true },
                inputs: rawInputs
            });
            setExecutionResult(response.data);
        } catch (error: any) {
            setExecutionResult({ 
                error: error.response?.data?.message || error.message,
                status: 'Failed' 
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden backdrop-blur-[2px]">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 animate-in fade-in duration-300"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Sliding Panel Container */}
            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300">
                
                {/* Variable Sidebar (Left of Drawer) */}
                {activeTab === 'config' && (
                    <div className="w-80 h-full bg-slate-50/50 backdrop-blur-md border-r border-slate-200 flex flex-col">
                         <NodeDataSidebar 
                            availableNodes={inputData.map(d => ({
                                nodeId: d.nodeId,
                                nodeName: d.nodeLabel,
                                data: d.outputs,
                                status: d.status
                            }))}
                            onDragStart={(e, variablePath) => {
                                e.dataTransfer.setData('text/plain', `{{${variablePath}}}`);
                            }}
                        />
                    </div>
                )}
                
                {/* Main Drawer */}
                <div className="w-[500px] h-full bg-white flex flex-col border-l border-slate-200 relative">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">OCR Processing</h3>
                                <p className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-tight">{selectedNode.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this node?')) {
                                        deleteNode(selectedNode.id);
                                        setSelectedNode(null);
                                    }
                                }}
                                className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Node"
                            >
                                <Trash2 size={20} />
                            </button>
                            <NodeHelpButton 
                                nodeType="OCR"
                            />
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs / Segmented Control */}
                    <div className="px-5 py-3 border-b border-slate-100 bg-white">
                        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            {[
                                { id: 'config', label: 'Configuration', icon: Settings },
                                { id: 'output', label: 'Results', icon: Terminal }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-lg transition-all",
                                        activeTab === tab.id 
                                            ? "bg-white text-slate-900 border border-slate-200/60 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                    )}
                                >
                                    <tab.icon size={13} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col">
                        {activeTab === 'config' ? (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                {/* Node Label */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">General Settings</label>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Display Name</span>
                                            <input 
                                                type="text" 
                                                value={label} 
                                                onChange={handleLabelChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500 transition-all"
                                                placeholder="e.g., Extract Invoice Data"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Main Config */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-6">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Processing Engine</label>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Gemini Credential Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                                <Key size={12} className="text-purple-500" />
                                                API Identifier
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={config.credentialId || ''}
                                                    onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-all cursor-pointer appearance-none"
                                                >
                                                    <option value="">Select Key...</option>
                                                    {geminiCredentials.map((cred: any) => (
                                                        <option key={cred._id} value={cred._id}>
                                                            {cred.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setIsCredentialModalOpen(true)}
                                                    className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                                    title="Add New Key"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Model Selection */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                                <Box size={12} className="text-purple-500" />
                                                Vision Model
                                            </label>
                                            <select
                                                value={config.modelName || 'gemini-1.5-flash'}
                                                onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="gemini-2.5-flash">2.5 Flash (Latest)</option>
                                                <option value="gemini-1.5-flash">1.5 Flash</option>
                                                <option value="gemini-1.5-pro">1.5 Pro</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Files Input */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                            <FileText size={12} className="text-purple-500" />
                                            Target Document Path
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={config.files || ''}
                                                onChange={(e) => handleConfigChange('files', e.target.value)}
                                                placeholder="{{PreviousNode.outputs}} or {{Gmail.files}}"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic font-medium px-1 pt-1">
                                            Supports dynamic variable notation or direct file links.
                                        </p>
                                    </div>

                                    {/* Prompt Input */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
                                            <Type size={12} className="text-purple-500" />
                                            Extraction Instructions
                                        </label>
                                        <textarea
                                            value={config.prompt || ''}
                                            onChange={(e) => handleConfigChange('prompt', e.target.value)}
                                            placeholder="Provide context or fields to prioritize (e.g., 'Extract itemized table')..."
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-300 resize-none overflow-y-auto custom-scrollbar leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                {executionResult ? (
                                    <div className="space-y-6">
                                        {/* Status Banner */}
                                        <div className={cn(
                                            "p-5 rounded-2xl border-2",
                                            executionResult.success ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                                        )}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={cn("text-xs font-bold uppercase tracking-wider", executionResult.success ? "text-emerald-700" : "text-red-700")}>
                                                    {executionResult.success ? 'Analysis Successful' : 'Analysis Failed'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                                                    ST: {executionResult.status || 'DONE'}
                                                </span>
                                            </div>
                                            {executionResult.error && (
                                                <p className="text-xs text-red-600 mt-2 font-mono italic whitespace-pre-wrap leading-relaxed">{executionResult.error}</p>
                                            )}
                                        </div>

                                        {/* Data Viewer */}
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Extracted Payload</span>
                                                <button 
                                                    className="text-[9px] text-purple-600 hover:text-purple-800 uppercase font-bold"
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(executionResult.output, null, 2))}
                                                >
                                                    Copy JSON
                                                </button>
                                            </div>
                                            <div className="p-5 bg-white min-h-[100px]">
                                                <DataTreeViewer data={executionResult.output} truncate={false} />
                                            </div>
                                        </div>
                                        
                                        {/* Logs */}
                                        {executionResult.logs && executionResult.logs.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Runtime Logs</label>
                                                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    <div className="space-y-1.5 font-mono">
                                                        {executionResult.logs.map((log: any, i: number) => {
                                                            const logMessage = typeof log === 'object' && log !== null 
                                                                ? `[${log.level || 'INFO'}] ${log.message}`
                                                                : String(log);
                                                            return (
                                                                <div key={i} className="text-[11px] border-b border-white/5 pb-1.5 mb-1.5 last:border-0 last:mb-0">
                                                                    <div className="text-slate-300 break-words whitespace-pre-wrap leading-relaxed">{logMessage}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-500">
                                            <Terminal size={32} className="opacity-20 translate-y-px" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 uppercase tracking-tight">No Runtime Data</p>
                                        <p className="text-[11px] opacity-60 mt-1 font-medium italic">Execute analysis to see structured results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Action Bar */}
                    <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono font-bold hidden md:inline-block uppercase">TEST RUN</span>
                            <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border",
                                    isExecuting 
                                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
                                        : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:scale-95"
                                )}
                            >
                                {isExecuting ? (
                                    <RefreshCw className="animate-spin" size={12} />
                                ) : (
                                    <div className="w-4 h-4 rounded-md bg-blue-400/30 flex items-center justify-center">
                                        <Zap size={10} fill="white" stroke="white" />
                                    </div>
                                )}
                                {isExecuting ? 'Processing...' : 'Run Analysis'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <GeminiCredentialModal 
                isOpen={isCredentialModalOpen}
                onClose={() => setIsCredentialModalOpen(false)}
                onSuccess={() => fetchCredentials('GEMINI')}
            />
        </div>
    );
};

export default NodeConfigPanel;
