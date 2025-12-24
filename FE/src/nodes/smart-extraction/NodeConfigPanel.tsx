
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, BrainCircuit, Zap, Key, Database, Plus, RefreshCw, TableProperties, Trash2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import JsonViewer from '../../common/JsonViewer';
import { GeminiCredentialModal } from '../../components/credentials/GeminiCredentialModal';

import { SchemaBuilderModal } from './SchemaBuilderModal';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution, fetchCredentials, credentials } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
    const [isSchemaBuilderOpen, setIsSchemaBuilderOpen] = useState(false);
    
    useEffect(() => {
        fetchCredentials('GEMINI');
    }, [fetchCredentials]);
    
    const geminiCredentials = useMemo(() => {
        return credentials.filter((c: any) => c.provider === 'GEMINI');
    }, [credentials]);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
            if (!nodeExecutionData) {
                setExecutionResult(null);
            }
        }
    }, [selectedNode]);

    useEffect(() => {
        if (nodeExecutionData) {
            setExecutionResult({
                success: nodeExecutionData.status === 'SUCCESS',
                output: nodeExecutionData.outputs || nodeExecutionData.value || nodeExecutionData.data,
                logs: nodeExecutionData.logs,
                status: nodeExecutionData.status
            });
        }
    }, [nodeExecutionData]);

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

    if (!selectedNode) return null;

    const config = (selectedNode.data?.config || {}) as any;
    const schema = config.schema || {}; // Key -> Description

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
            const rawInputs = inputData.map(d => d.outputs).filter(Boolean).flat();
            const inputs = rawInputs.length > 0 ? [rawInputs[0]] : []; // Use latest

            const selectedCred = credentials.find(c => c._id === config.credentialId);
            
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SMART_EXTRACTION',
                nodeData: { 
                    ...config, 
                    apiKey: selectedCred?.value
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

    const activeTabState = useState<'output' | 'logs'>('output');
    const [activeTab, setActiveTab] = activeTabState;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1600px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                 {/* Header */}
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                             <BrainCircuit size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">Smart Extraction</h3>
                            <p className="text-xs text-slate-500">Context-aware data extraction</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Body - 3 Column Split View */}
                <div className="flex flex-1 overflow-hidden">
                    
                     {/* COLUMN 1 - Left Sidebar */}
                     <div className="w-[250px] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50 shrink-0">
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

                    {/* COLUMN 2 - Center Config */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200 min-w-[400px]">
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Key size={12} />
                                Configuration
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    placeholder="e.g., Extract Invoice Data"
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Gemini Credential */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Key size={12} />
                                        Gemini API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={config.credentialId || ''}
                                            onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                                        >
                                            <option value="">Select key...</option>
                                            {geminiCredentials.map((cred: any) => (
                                                <option key={cred._id} value={cred._id}>
                                                    {cred.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setIsCredentialModalOpen(true)}
                                            className="px-3 py-2 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Model Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap size={12} />
                                        Model
                                    </label>
                                    <select
                                        value={config.modelName || 'gemini-1.5-flash'}
                                        onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none"
                                    >
                                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                    </select>
                                </div>

                                {/* Input Variable Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Database size={12} />
                                        Input Text <span className="text-red-500">*</span>
                                    </label>
                                    <div className="text-[10px] text-slate-400 mb-1">
                                        Drag & Drop a variable here (e.g. {`{{OCRNode.outputs}}`}) containing the text or analysis to extract from.
                                    </div>
                                    <input 
                                        type="text" 
                                        value={config.inputText || ''} 
                                        onChange={(e) => handleConfigChange('inputText', e.target.value)}
                                        className={`w-full bg-slate-50 border rounded-lg p-2.5 text-sm font-mono text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                                            !config.inputText ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
                                        }`}
                                        placeholder="{{OCRNode.outputs}}"
                                    />
                                    {!config.inputText && (
                                        <p className="text-[10px] text-red-500 font-medium mt-1">This field is required.</p>
                                    )}
                                </div>

                                {/* Schema Builder Trigger */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <TableProperties size={12} />
                                            Extraction Schema
                                        </label>
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                            {Object.keys(schema).length} root fields
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-3">
                                                <BrainCircuit size={24} />
                                            </div>
                                            <h4 className="text-sm font-semibold text-slate-900 mb-1">Visual Schema Builder</h4>
                                            <p className="text-xs text-slate-500 mb-4 px-4">
                                                Design complex, nested data structures for precise extraction using the advanced visual editor.
                                            </p>
                                            <button
                                                onClick={() => setIsSchemaBuilderOpen(true)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium flex items-center justify-center gap-2 mx-auto w-full"
                                            >
                                                <TableProperties size={16} />
                                                Open Schema Editor
                                            </button>
                                        </div>

                                        {/* Simple Preview List */}
                                        {Object.keys(schema).length > 0 && (
                                            <div className="mt-4 border-t border-slate-200 pt-3">
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mb-2">Configured Fields:</p>
                                                <div className="space-y-1">
                                                    {Object.keys(schema).slice(0, 5).map(key => (
                                                        <div key={key} className="flex items-center gap-2 text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200/50">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                                            <span className="font-mono font-medium">{key}</span>
                                                            <span className="text-slate-400 text-[10px]">({schema[key].type})</span>
                                                        </div>
                                                    ))}
                                                    {Object.keys(schema).length > 5 && (
                                                        <div className="text-[10px] text-slate-400 text-center italic mt-1">
                                                            + {Object.keys(schema).length - 5} more fields...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <SchemaBuilderModal
                                    isOpen={isSchemaBuilderOpen}
                                    onClose={() => setIsSchemaBuilderOpen(false)}
                                    initialSchema={schema}
                                    onSave={(newSchema) => handleConfigChange('schema', newSchema)}
                                />
                            </div>
                        </div>

                         {/* Footer */}
                         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                {isExecuting ? 'Extracting...' : 'Test Extraction'}
                            </button>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* COLUMN 3 - Output */}
                    <div className="w-[300px] bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                         <div className="flex border-b border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setActiveTab('output')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'output' ? 'border-teal-500 text-teal-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Output
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'logs' ? 'border-teal-500 text-teal-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Logs
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50 relative p-4">
                             {executionResult ? (
                                activeTab === 'output' ? (
                                    <div className="text-xs font-mono text-slate-600">
                                        <JsonViewer data={executionResult.data || executionResult.output || executionResult} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                         {executionResult.logs?.map((log: any, i: number) => (
                                             <div key={i} className="text-[10px] font-mono p-2 bg-white border border-slate-100 rounded">
                                                 <div className="flex justify-between text-slate-400 mb-1">
                                                     <span>{log.level}</span>
                                                     <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                 </div>
                                                 <div className="text-slate-700 break-words">{log.message}</div>
                                             </div>
                                         ))}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <BrainCircuit size={32} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No Data</p>
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
