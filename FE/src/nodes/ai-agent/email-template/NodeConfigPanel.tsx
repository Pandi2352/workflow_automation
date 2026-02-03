
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { X, RefreshCw, Trash2, Zap, Mail, MessageSquare, Sparkles, Box, Terminal } from 'lucide-react';
import { axiosInstance } from '../../../api/axiosConfig';
// import { DataTreeViewer } from '../../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../../components/designer/panels/NodeDataSidebar';
import { cn } from '../../../lib/utils';
import { NodeHelpButton } from '../../../common/NodeHelpButton';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { updateNodeData, nodes, edges, currentExecution, deleteNode, selectedNode, setSelectedNode } = useWorkflowStore();

    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    
    // Config State
    const [config, setConfig] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || 'Email Template (AI)');
            const currentConfig = (selectedNode.data?.config as any) || {};
            setConfig({
                userPrompt: 'Write a professional follow-up email',
                inputText: '',
                modelName: 'gemini-1.5-flash',
                ...currentConfig
            });
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
            if (nodeExecutionData.status) {
                setActiveTab('output');
            }
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
                nodeName: (sourceNode?.data?.label as string) || sourceNode?.id || 'Unknown Node',
                data: sourceExecution?.outputs || sourceOutput?.value || sourceExecution?.value || null,
                status: sourceExecution?.status || 'NOT_RUN'
            };
        });
    }, [selectedNode, edges, nodes, currentExecution]);

    if (!selectedNode) return null;

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');
        try {
            const rawInputs = inputData.map(d => ({
                nodeId: d.nodeId,
                nodeName: d.nodeName,
                value: d.data
            }));

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'EMAIL_TEMPLATE',
                nodeData: { ...config, forceProcess: true },
                inputs: rawInputs
            });
            setExecutionResult(response.data);
        } catch (error: any) {
             setExecutionResult({ 
                error: error.response?.data?.message || error.message,
                status: 'Failed',
                success: false
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none">
            {/* Sidebar with incoming data - only visible in config tab */}
            {activeTab === 'config' && (
                <div className="pointer-events-auto h-full mr-1 animate-in slide-in-from-right-10 duration-300">
                    <NodeDataSidebar 
                        availableNodes={inputData}
                        onDragStart={() => {}} 
                    />
                </div>
            )}

            {/* Main Config Drawer */}
            <div className="w-[600px] h-full bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                            <Mail size={22} />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => {
                                    setLabel(e.target.value);
                                    updateNodeData(selectedNode.id, { label: e.target.value });
                                }}
                                className="text-base font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                                placeholder="Email Template Name"
                            />
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} /> AI Content Generator
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="EMAIL_TEMPLATE" />
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-6 bg-white border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "px-4 py-3 text-xs font-bold transition-all border-b-2",
                            activeTab === 'config' ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        )}
                    >
                        CONFIGURATION
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            "px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2",
                            activeTab === 'output' ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"
                        )}
                    >
                        RESULTS
                        {executionResult && (
                            <div className={cn("w-1.5 h-1.5 rounded-full", executionResult.success ? "bg-emerald-500" : "bg-red-500")} />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'config' ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            {/* Tips */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                                <Box size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                    <span className="font-bold">Instructions:</span> Define how you want the email to be written. You can reference data from previous nodes using <code>{"{{NodeName.output.path}}"}</code> in the Context area.
                                </div>
                            </div>

                            {/* Prompt Configuration */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare size={16} className="text-emerald-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Email Instructions</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            How should the AI write the email?
                                        </label>
                                        <textarea
                                            value={config.userPrompt}
                                            onChange={(e) => handleConfigChange('userPrompt', e.target.value)}
                                            className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                                            placeholder="Example: Write a professional thank you email for the interview. Mention specific points from the conversation."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                            Context / Input Data
                                            <span className="text-[9px] text-emerald-500 lowercase font-normal italic">supports dynamic variables</span>
                                        </label>
                                        <textarea
                                            value={config.inputText}
                                            onChange={(e) => handleConfigChange('inputText', e.target.value)}
                                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                                            placeholder="Drag variables here... Example: {{OCRNode.output.content}}"
                                        />
                                        <p className="text-[10px] text-slate-400 italic">
                                            Variables like <code>{"{{NodeName.output.field}}"}</code> will be replaced with real data during execution.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            AI Model
                                        </label>
                                        <select
                                            value={config.modelName}
                                            onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                        >
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {executionResult ? (
                                <div className="space-y-4">
                                    <div className={cn(
                                        "p-4 rounded-2xl border flex items-start gap-4",
                                        executionResult.success ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                                    )}>
                                        {executionResult.success ? (
                                            <Zap className="text-emerald-600 shrink-0 mt-1" size={18} />
                                        ) : (
                                            <X className="text-red-600 shrink-0 mt-1" size={18} />
                                        )}
                                        <div>
                                            <h4 className={cn(
                                                "text-xs font-bold uppercase tracking-wider mb-1",
                                                executionResult.success ? "text-emerald-800" : "text-red-800"
                                            )}>
                                                {executionResult.success ? "Generation Successful" : "Generation Failed"}
                                            </h4>
                                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                                {executionResult.success ? "The AI has generated your email template." : executionResult.error}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {executionResult.success && (
                                        <div className="space-y-4">
                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Subject
                                                </div>
                                                <div className="p-4 text-xs font-bold text-slate-900">
                                                    {executionResult.output?.subject}
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Body
                                                </div>
                                                <div className="p-4 text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                    {executionResult.output?.body}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {executionResult.logs && executionResult.logs.length > 0 && (
                                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Process Logs
                                            </div>
                                            <div className="p-4 max-h-[150px] overflow-auto custom-scrollbar font-mono text-[9px]">
                                                {executionResult.logs.map((log: any, i: number) => (
                                                    <div key={i} className="mb-1.5 last:mb-0 text-slate-300">
                                                        <span className="text-emerald-400/70 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                                        <span className="text-blue-400 mr-2 font-bold">{log.level}</span>
                                                        {log.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4 border-2 border-dashed border-slate-200">
                                        <Terminal size={32} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">Preview Generation</h3>
                                    <p className="text-xs text-slate-500 max-w-[240px]">
                                        Click "Generate Template" below to test the AI output with your current configuration.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={() => {
                             if (confirm('Are you sure you want to delete this template node?')) {
                                deleteNode(selectedNode.id);
                                setSelectedNode(null);
                             }
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                        <Trash2 size={14} />
                        DELETE NODE
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            DISMISS
                        </button>
                        <button
                            onClick={handleExecuteNode}
                            disabled={isExecuting}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg",
                                isExecuting ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-95"
                            )}
                        >
                            {isExecuting ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Zap size={14} />
                            )}
                            {isExecuting ? 'GENERATING...' : 'GENERATE TEMPLATE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
