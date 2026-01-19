import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Plus, RefreshCw, Trash2, Settings, Zap, History, Sparkles, Rss } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { cn } from '../../lib/utils';
import { NodeHelpButton } from '../../common/NodeHelpButton';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { updateNodeData, nodes, edges, currentExecution, deleteNode, selectedNode, setSelectedNode } = useWorkflowStore();
    // const selectedNode is obtained from store directly

    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    
    // Config State
    const [config, setConfig] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');

    // RSS Specific State
    const [customOptions, setCustomOptions] = useState<{key:string, value:string}[]>([]);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || 'RSS Feed');
            
            const currentConfig = (selectedNode.data?.config as any) || {};
            setConfig(currentConfig);

            setCustomOptions(currentConfig.customOptions || []);
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

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode.id, { label: e.target.value });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData(selectedNode.id, { description: e.target.value });
    };

    // Options Management
    const addOption = () => {
        const newOpts = [...customOptions, { key: '', value: '' }];
        setCustomOptions(newOpts);
        handleConfigChange('customOptions', newOpts);
    };

    const updateOption = (index: number, field: 'key' | 'value', val: string) => {
        const newOpts = [...customOptions];
        newOpts[index][field] = val;
        setCustomOptions(newOpts);
        handleConfigChange('customOptions', newOpts);
    };

    const removeOption = (index: number) => {
        const newOpts = customOptions.filter((_, i) => i !== index);
        setCustomOptions(newOpts);
        handleConfigChange('customOptions', newOpts);
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
                nodeType: 'RSS',
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
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Sliding Panel Container */}
            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300 mr-0">
                
                {/* Variable Sidebar (Left of Drawer) */}
                <div className="w-80 h-full bg-slate-50 border-r border-slate-200 flex flex-col -mr-[1px]">
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

                {/* Main Drawer */}
                <div className="w-[620px] h-full bg-white flex flex-col border-l border-slate-200">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600">
                                <Rss size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">RSS Feed</h3>
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
                            <NodeHelpButton nodeType="RSS" />
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
                                { id: 'output', label: 'Results', icon: History }
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
                    <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col relative">
                        {activeTab === 'config' && (
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
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
                                                placeholder="e.g., Get Tech News"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Description</span>
                                            <textarea 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-orange-500 transition-all resize-none"
                                                rows={2}
                                                value={(selectedNode.data?.description as string) || ''}
                                                onChange={handleDescriptionChange}
                                                placeholder="Describe what this node does..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* RSS Config */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Rss size={12} />
                                            Feed Configuration
                                        </label>
                                    </div>
                                    
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Feed URL</span>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={config.url || ''} 
                                                onChange={(e) => handleConfigChange('url', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-orange-500 transition-all"
                                                placeholder="https://example.com/rss.xml"
                                            />
                                            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                                <Sparkles size={14} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                                            Enter the full URL of the RSS or Atom feed.
                                        </span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100">
                                         <div className="flex items-center justify-between mb-3">
                                            <span className="text-[11px] font-semibold text-slate-600">Additional Options</span>
                                         </div>
                                         <div className="space-y-2">
                                            {customOptions.map((opt, idx) => (
                                                <div key={idx} className="flex gap-2 items-center group">
                                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                                        <input 
                                                            placeholder="Key"
                                                            value={opt.key}
                                                            onChange={(e) => updateOption(idx, 'key', e.target.value)}
                                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 focus:outline-none transition-all"
                                                        />
                                                        <input 
                                                            placeholder="Value"
                                                            value={opt.value}
                                                            onChange={(e) => updateOption(idx, 'value', e.target.value)}
                                                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 focus:outline-none transition-all"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => removeOption(idx)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={addOption}
                                                className="text-[10px] flex items-center gap-1.5 text-orange-600 hover:bg-orange-50 font-bold px-3 py-2 rounded-lg border border-orange-100 transition-colors w-full justify-center border-dashed"
                                            >
                                                <Plus size={12} /> Add Option
                                            </button>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {executionResult ? (
                                    <div className="space-y-6">
                                        {/* Status Banner */}
                                        <div className={cn(
                                            "p-4 rounded-2xl border-2",
                                            executionResult.success ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                                        )}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={cn("text-xs font-bold uppercase tracking-wider", executionResult.success ? "text-emerald-700" : "text-red-700")}>
                                                    {executionResult.success ? 'Success' : 'Failed'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                                    ST: {executionResult.status}
                                                </span>
                                            </div>
                                            {executionResult.error && (
                                                <p className="text-xs text-red-600 mt-1 font-mono italic">{executionResult.error}</p>
                                            )}
                                        </div>

                                        {/* Data Viewer */}
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Output Result</span>
                                                <button 
                                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 uppercase font-bold"
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(executionResult.output, null, 2))}
                                                >
                                                    Copy JSON
                                                </button>
                                            </div>
                                            <div className="p-4 bg-white min-h-[100px]">
                                                <DataTreeViewer data={executionResult.output} truncate={false} />
                                            </div>
                                        </div>

                                        {/* Logs */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Runtime Logs</label>
                                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {executionResult.logs && executionResult.logs.length > 0 ? (
                                                    <div className="space-y-1.5 font-mono">
                                                        {executionResult.logs.map((log: any, i: number) => (
                                                            <div key={i} className="text-[11px] border-b border-white/5 pb-1.5 mb-1.5 last:border-0 last:mb-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={cn(
                                                                        "text-[8px] font-bold px-1.5 py-0.5 rounded",
                                                                        log.level === 'ERROR' ? "bg-red-500 text-white" :
                                                                        log.level === 'WARN' ? "bg-amber-500 text-black" : "bg-emerald-500 text-white"
                                                                    )}>
                                                                        {log.level}
                                                                    </span>
                                                                    <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                                </div>
                                                                <div className="text-slate-300 break-words whitespace-pre-wrap">{log.message}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-6 text-center text-slate-500 text-xs italic">
                                                        No console output detected.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                            <Rss size={32} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium">No Execution Data</p>
                                        <p className="text-xs opacity-60 mt-1">Run the node to see output and logs here.</p>
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
                            <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border",
                                    isExecuting 
                                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
                                        : "bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700 active:scale-95"
                                )}
                            >
                                {isExecuting ? (
                                    <RefreshCw className="animate-spin" size={12} />
                                ) : (
                                    <div className="w-4 h-4 rounded-md bg-orange-400/30 flex items-center justify-center">
                                        <Zap size={10} fill="white" stroke="white" />
                                    </div>
                                )}
                                {isExecuting ? 'Processing...' : 'Fetch Feed'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeConfigPanel;
