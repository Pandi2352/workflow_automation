import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, FileText, Zap, Key, Box, Type, Settings, Terminal, Plus, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { GeminiCredentialModal } from '../../components/credentials/GeminiCredentialModal';
import { Button } from '../../common/Button';
import { cn } from '../../lib/utils';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
// ... imports

    const { selectedNode, updateNodeData, setSelectedNode, fetchCredentials, credentials, nodes, edges, currentExecution } = useWorkflowStore();
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
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 animate-in fade-in duration-200"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Sliding Panel Container */}
            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300 mr-0">
                
                {/* Variable Sidebar (Left of Drawer) */}
                {activeTab === 'config' && (
                    <div className="w-80 h-full bg-slate-50 border-r border-slate-200 shadow-2xl flex flex-col -mr-[1px]">
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
                <div className="w-[500px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-100">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        {/* ... same header ... */}
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                             <FileText size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">OCR Processing</h3>
                            <p className="text-xs text-slate-600">Configure Node ID: {selectedNode.id}</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-4">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'config' 
                                ? "border-purple-500 text-purple-600" 
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Settings size={14} />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'output' 
                                ? "border-purple-500 text-purple-600" 
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Terminal size={14} />
                        Output & Logs
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6">
                    {activeTab === 'config' ? (
                        <div className="space-y-6">
                             {/* Node Label Input */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    placeholder="Name your node..."
                                />
                            </div>

                            {/* Main Config */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                {/* Gemini Credential Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Key size={12} />
                                        Gemini API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={config.credentialId || ''}
                                            onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                                        >
                                            <option value="">Select a saved key...</option>
                                            {geminiCredentials.map((cred: any) => (
                                                <option key={cred._id} value={cred._id}>
                                                    {cred.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsCredentialModalOpen(true)}
                                            className="px-3 py-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                            title="Add New Key"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Model Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Box size={12} />
                                        Model
                                    </label>
                                    <select
                                        value={config.modelName || 'gemini-1.5-flash'}
                                        onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none"
                                    >
                                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                    </select>
                                </div>

                                {/* Files Input (Dynamic) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={12} />
                                        File to Process
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={config.files || ''}
                                            onChange={(e) => handleConfigChange('files', e.target.value)}
                                            placeholder="{{PreviousNode.outputs}} or {{Gmail.files}}"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-slate-600"
                                        />
                                    </div>
                                     <p className="text-[10px] text-slate-500 font-medium">
                                         Enter variable path like {'{{Gmail.files}}'} or drag locally.
                                     </p>
                                </div>

                                {/* Prompt Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Type size={12} />
                                        Custom Prompt Additions
                                    </label>
                                    <textarea
                                        value={config.prompt || ''}
                                        onChange={(e) => handleConfigChange('prompt', e.target.value)}
                                        placeholder="Add specific instructions to the extraction prompt..."
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-300 resize-none custom-scrollbar"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">

                            {/* Execution Result Viewer */}
                            {executionResult ? (
                                <div className="flex-1 flex flex-col gap-4">
                                     <div className={`p-4 rounded-xl border border-l-4 shadow-sm ${
                                         executionResult.success ? 'bg-green-50 border-green-200 border-l-green-500' : 'bg-red-50 border-red-200 border-l-red-500'
                                     }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-sm font-bold ${executionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {executionResult.status}
                                            </span>
                                        </div>
                                        {executionResult.error && (
                                            <p className="text-xs text-red-600 mt-1">{executionResult.error}</p>
                                        )}
                                     </div>

                                    {/* JSON Output Key Fix: Use DataTreeViewer or raw JSON if simpler */}
                                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-white">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Output Data</span>
                                            <button 
                                                className="text-[10px] text-slate-500 hover:text-purple-600 uppercase font-bold tracking-wider"
                                                onClick={() => navigator.clipboard.writeText(JSON.stringify(executionResult.output, null, 2))}
                                            >
                                                Copy JSON
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-auto bg-slate-50">
                                             <DataTreeViewer data={executionResult.output} />
                                        </div>
                                    </div>
                                    
                                    {/* Terminal Logs */}
                                    {executionResult.logs && executionResult.logs.length > 0 && (
                                         <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-sm max-h-[200px] overflow-y-auto">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">System Logs</span>
                                            </div>
                                            <div className="space-y-1 font-mono">
                                                {executionResult.logs.map((log: any, i: number) => {
                                                    const logMessage = typeof log === 'object' && log !== null 
                                                        ? `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level}] ${log.message}`
                                                        : String(log);
                                                    
                                                    const isError = logMessage.includes('[ERROR]');
                                                    const isWarn = logMessage.includes('[WARN]');
                                                    const isInfo = logMessage.includes('[INFO]');

                                                    return (
                                                        <div key={i} className={`text-xs border-b border-slate-900 last:border-0 pb-1 mb-1 break-all ${
                                                            isError ? 'text-red-400' : 
                                                            isWarn ? 'text-yellow-400' : 
                                                            isInfo ? 'text-blue-300' : 'text-slate-400'
                                                        }`}>
                                                            <span className="text-slate-600 mr-2 select-none">{(i + 1).toString().padStart(2, '0')}</span>
                                                            {logMessage}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                         </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Terminal size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No execution data available</p>
                                    <p className="text-xs text-slate-400 mt-1">Run the node to see outputs here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={handleExecuteNode}
                        disabled={isExecuting}
                        className={cn(
                            "flex-1 justify-center gap-2",
                            isExecuting ? "bg-slate-100 text-slate-400" : "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                        )}
                    >
                        {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                        {isExecuting ? 'Running...' : 'Test OCR'}
                    </Button>
                </div>
            </div>
            
            <GeminiCredentialModal 
                isOpen={isCredentialModalOpen}
                onClose={() => setIsCredentialModalOpen(false)}
                onSuccess={() => fetchCredentials('GEMINI')}
            />
        </div>
        </div>
    );
};

export default NodeConfigPanel;
