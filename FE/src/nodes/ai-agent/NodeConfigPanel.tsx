
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, RefreshCw, Trash2, Zap, Bot, MessageSquare, Sparkles, Box, Terminal } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/panels/NodeDataSidebar';
import { cn } from '../../lib/utils';
import { NodeHelpButton } from '../../common/NodeHelpButton';

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
            setLabel((selectedNode.data?.label as string) || 'AI Agent');
            const currentConfig = (selectedNode.data?.config as any) || {};
            setConfig({
                promptSource: 'define',
                userPrompt: '',
                requireOutputFormat: false,
                enableFallback: false,
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
                nodeType: 'AI_AGENT',
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
                            <Bot size={22} />
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
                                placeholder="AI Agent Name"
                            />
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} /> Intelligent Processing
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="AI_AGENT" />
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
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                                <Box size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                                    <span className="font-bold">Tip:</span> Connect a Chat Model and optional Tools to use this agent. Use the prompt below to instruct the agent on what to do.
                                </div>
                            </div>

                            {/* Prompt Configuration */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare size={16} className="text-emerald-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Agent Configuration</h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Prompt Source */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Source for Prompt (User Message)
                                        </label>
                                        <select
                                            value={config.promptSource}
                                            onChange={(e) => handleConfigChange('promptSource', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                        >
                                            <option value="define">Define below</option>
                                            <option value="input">From input node</option>
                                        </select>
                                    </div>

                                    {/* Prompt Input */}
                                    {config.promptSource === 'define' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Prompt (User Message)
                                            </label>
                                            <textarea
                                                value={config.userPrompt}
                                                onChange={(e) => handleConfigChange('userPrompt', e.target.value)}
                                                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 transition-all resize-none font-mono"
                                                placeholder="Example: Summarize the world news from the last 24 hours. Today is {{ $today }}"
                                            />
                                            <p className="text-[10px] text-slate-400 italic">
                                                Drag variables from the left sidebar to inject dynamic data.
                                            </p>
                                        </div>
                                    )}

                                    {/* Toggles */}
                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700">Require Specific Output Format</span>
                                                <span className="text-[10px] text-slate-400">Force the agent to return JSON</span>
                                            </div>
                                            <button 
                                                onClick={() => handleConfigChange('requireOutputFormat', !config.requireOutputFormat)}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    config.requireOutputFormat ? "bg-emerald-600" : "bg-slate-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all",
                                                    config.requireOutputFormat ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-700">Enable Fallback Model</span>
                                                <span className="text-[10px] text-slate-400">Use secondary model if primary fails</span>
                                            </div>
                                            <button 
                                                onClick={() => handleConfigChange('enableFallback', !config.enableFallback)}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative",
                                                    config.enableFallback ? "bg-emerald-600" : "bg-slate-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all",
                                                    config.enableFallback ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
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
                                                {executionResult.success ? "Execution Successful" : "Execution Failed"}
                                            </h4>
                                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                                {executionResult.success ? "The agent processed your request successfully." : executionResult.error}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {executionResult.success && (
                                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Agent Output
                                            </div>
                                            <div className="p-4 overflow-auto custom-scrollbar">
                                                <DataTreeViewer data={executionResult.output} />
                                            </div>
                                        </div>
                                    )}

                                    {executionResult.logs && executionResult.logs.length > 0 && (
                                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest underline underline-offset-4 decoration-emerald-500/50">
                                                Raw Logs
                                            </div>
                                            <div className="p-4 max-h-[200px] overflow-auto custom-scrollbar font-mono text-[10px]">
                                                {executionResult.logs.map((log: any, i: number) => (
                                                    <div key={i} className="mb-1.5 last:mb-0 border-l-2 border-emerald-500/30 pl-3">
                                                        <span className="text-emerald-400/70 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                                        <span className={cn(
                                                            "font-bold mr-2 uppercase",
                                                            log.level === 'ERROR' ? 'text-red-400' : 
                                                            log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'
                                                        )}>
                                                            {log.level}
                                                        </span>
                                                        <span className="text-slate-300">{log.message}</span>
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
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">No Results Yet</h3>
                                    <p className="text-xs text-slate-500 max-w-[240px]">
                                        Configure the agent and click "Execute Step" below to see the results here.
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
                             if (confirm('Are you sure you want to delete this agent node?')) {
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
                            {isExecuting ? 'EXECUTING...' : 'EXECUTE STEP'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
