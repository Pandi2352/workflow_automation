
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, AlignLeft, Zap, Key, Box, Type, Database, Plus, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import JsonViewer from '../../common/JsonViewer';
import { NodeHelpButton } from '../../common/NodeHelpButton';
import { GeminiCredentialModal } from '../../components/credentials/GeminiCredentialModal';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution, fetchCredentials, credentials } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

    // Fetch credentials on mount
    useEffect(() => {
        fetchCredentials('GEMINI');
    }, [fetchCredentials]);

    const geminiCredentials = useMemo(() => {
        return credentials.filter((c: any) => c.provider === 'GEMINI');
    }, [credentials]);

    const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode) {
            const isNewNode = selectedNode.id !== prevSelectedId;
            if (isNewNode) {
                setLabel((selectedNode.data?.label as string) || '');
                if (!nodeExecutionData) {
                    setExecutionResult(null);
                }
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
                output: nodeExecutionData.outputs || nodeExecutionData.value || nodeExecutionData.data, // handle various formats
                logs: nodeExecutionData.logs,
                status: nodeExecutionData.status
            });
        }
    }, [nodeExecutionData]);

    const inputData = useMemo(() => {
        if (!selectedNode) return [];
        
        // Find edges connected to this node's input
        const incomingEdges = edges.filter(edge => edge.target === selectedNode.id);
        
        // Map edges to source nodes and their execution data
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
        try {
            // Optimize: Only process the FIRST item (Latest) from the input array for testing
            const rawInputs = inputData.map(d => d.outputs).filter(Boolean).flat();
            const inputs = rawInputs.length > 0 ? [rawInputs[0]] : [];

            // For local test, we might need to inject the API key if the backend doesn't look it up from DB during "test"
            // The OCR node panel sends { ...config, forceProcess: true }
            // BE SummarizeNode expects apiKey in config or env. 
            // Better to look up credential value here if needed, or rely on backend.
            // In OCR panel, it just sends config.credentialId. Let's assume Backend handles lookup or we send key.
            // Actually, for "Text Generation" test, usually credentials are secure.
            // Let's check how OCR panel does it. It just sends `...config`.
            // Wait, previous implementation I wrote for Summarize config panel looked up the key:
            // apiKey: credentials.find(c => c._id === credentialId)?.value
            // I should preserve that if the backend requires it for atomic tests.
            
            const selectedCred = credentials.find(c => c._id === config.credentialId);
            
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SUMMARIZE',
                nodeData: { 
                    ...config, 
                    apiKey: selectedCred?.value // Send key for immediate test execution
                },
                inputs: [inputs]
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


    const [activeTab, setActiveTab] = useState<'config' | 'output' | 'logs'>('config');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1600px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                             <AlignLeft size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">Summarize Configuration</h3>
                            <p className="text-xs text-slate-500">Generate AI summaries with Gemini</p>
                         </div>
                    </div>
                     <div className="flex items-center gap-1">
                        <NodeHelpButton 
                            nodeType="SUMMARIZE"
                        />
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                {/* Body - 3 Column Split View */}
                <div className="flex flex-1 overflow-hidden relative">
                    
                    {/* COLUMN 1 - Input Data Sidebar (Left) */}
                    <div className="w-[300px] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50 shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                 <Database size={12} />
                                 Input Variables
                             </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <NodeDataSidebar 
                                availableNodes={inputData.map(d => ({
                                    nodeId: d.nodeId,
                                    nodeName: d.nodeLabel,
                                    data: d.outputs,
                                    status: d.status
                                }))}
                                onDragStart={(e, variablePath) => {
                                    e.dataTransfer.setData('text/plain', variablePath);
                                }}
                            />
                        </div>
                    </div>

                    {/* COLUMN 2 - Configuration (Center) */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200 min-w-[400px]">
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Key size={12} />
                                Parameters
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    placeholder="Name your node..."
                                />
                            </div>

                            <div className="space-y-6">
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
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
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
                                            className="px-3 py-2 bg-violet-50 border border-violet-100 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
                                            title="Add New Key"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Required for Gemini AI processing.
                                    </p>
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
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none"
                                    >
                                        <option value="gemini-1.5-flash">gemini-1.5-flash (Fast)</option>
                                        <option value="gemini-1.5-pro">gemini-1.5-pro (Powerful)</option>
                                    </select>
                                </div>

                                {/* Custom Prompt */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Type size={12} />
                                        Custom Prompt
                                    </label>
                                    <textarea
                                        value={config.prompt || 'Summarize the following text concisely.'}
                                        onChange={(e) => handleConfigChange('prompt', e.target.value)}
                                        placeholder="Enter instructions for the summary..."
                                        rows={6}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-300 resize-none font-mono"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        The input text from previous nodes will be appended automatically.
                                    </p>
                                </div>
                            </div>
                        </div>

                         {/* Footer (Actions) */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <div className="text-xs text-slate-400 font-mono mr-auto">
                                ID: {selectedNode.id}
                            </div>
                             <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                {isExecuting ? 'Running...' : 'Test Summary'}
                            </button>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* COLUMN 3 - Output (Right) */}
                    <div className="w-[350px] bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                         {/* Tabs Header */}
                         <div className="flex border-b border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setActiveTab('output')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'output' ? 'border-violet-500 text-violet-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Output
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'logs' ? 'border-violet-500 text-violet-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Logs
                            </button>
                        </div>
                        
                        {/* Tab Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50 relative p-0">
                             {executionResult ? (
                                <>
                                    {activeTab === 'output' && (
                                        <div className="p-4 text-xs font-mono text-slate-600">
                                            <JsonViewer data={executionResult.data || executionResult.output || executionResult} />
                                        </div>
                                    )}
                                    
                                    {activeTab === 'logs' && (
                                        <div className="p-0">
                                            {executionResult.logs && executionResult.logs.length > 0 ? (
                                                 <div className="divide-y divide-slate-100">
                                                    {executionResult.logs.map((log: any, i: number) => (
                                                        <LogMessage key={i} log={log} />
                                                    ))}
                                                 </div>
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 text-xs">
                                                    No logs available
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <Zap size={32} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No Execution Data</p>
                                    <p className="text-xs mt-1">Run a test to see results here</p>
                                </div>
                            )}
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

const LogMessage = ({ log }: { log: any }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = log.message.length > 150;

    return (
        <div className="p-3 text-[10px] font-mono hover:bg-slate-100 transition-colors border-l-2 border-transparent hover:border-slate-300">
            <div className="flex justify-between mb-1 opacity-50">
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={log.level === 'ERROR' ? 'text-red-500 font-bold' : ''}>{log.level}</span>
            </div>
            <div className={log.level === 'ERROR' ? 'text-red-600' : 'text-slate-600'}>
                <span className="whitespace-pre-wrap break-all">
                    {expanded || !isLong ? log.message : log.message.substring(0, 150) + '...'}
                </span>
                {isLong && (
                     <button 
                        onClick={() => setExpanded(!expanded)}
                        className="ml-1.5 text-[9px] text-violet-600 hover:text-violet-800 font-bold bg-violet-50 hover:bg-violet-100 border border-violet-100 px-1.5 py-0.5 rounded cursor-pointer select-none transition-colors inline-block align-middle"
                    >
                        {expanded ? 'Less' : 'More'}
                    </button>
                )}
            </div>
        </div>
    );
};
