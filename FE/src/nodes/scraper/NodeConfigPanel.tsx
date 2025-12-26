import React, { useState, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Earth, Database, Play, CheckCircle2, AlertCircle, RefreshCw, Layout, ArrowRight, Sparkles, Code } from 'lucide-react';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { axiosInstance } from '../../api/axiosConfig';
import { DataTreeViewer } from '../../common/DataTreeViewer';

export const NodeConfigPanel: React.FC = () => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [isExecuting, setIsExecuting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const config = useMemo(() => (selectedNode?.data?.config || {}) as any, [selectedNode]);
    const mode = config.mode || 'ai';

    // Compute incoming data for sidebar
    const inputData = useMemo(() => {
        if (!selectedNode) return [];
        const incomingEdges = edges.filter(edge => edge.target === selectedNode.id);
        return incomingEdges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const sourceExec = currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === edge.source);
            return {
                nodeId: edge.source,
                nodeLabel: sourceNode?.data?.label || sourceNode?.id,
                outputs: sourceExec?.outputs || null,
                status: sourceExec?.status || 'NOT_RUN'
            };
        });
    }, [selectedNode, edges, nodes, currentExecution]);

    if (!selectedNode) return null;

    const handleConfigChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, {
            config: { ...config, [key]: value }
        });
    };

    const handleTestScrape = async () => {
        setIsExecuting(true);
        setTestResult(null);
        try {
            // Prepare inputs for variable substitution
            const inputs = inputData.flatMap(d => {
                const vals = Array.isArray(d.outputs) ? d.outputs : (d.outputs ? [d.outputs] : []);
                return vals.map(v => ({
                    value: v,
                    nodeId: d.nodeId,
                    nodeName: d.nodeLabel
                }));
            });

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'BROWSER_SCRAPER',
                nodeData: config,
                inputs: inputs
            });
            setTestResult({ success: true, data: response.data.output || response.data });
        } catch (error: any) {
            setTestResult({ 
                success: false, 
                error: error.response?.data?.message || error.message,
                details: error.response?.data 
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1250px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                            <Earth size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedNode.data.label as string}</h2>
                            <p className="text-xs text-slate-500">Configure Browser Scraper</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Sidebar */}
                    <div className="w-[300px] border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Database size={12} />
                                Input Variables
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <NodeDataSidebar 
                                availableNodes={inputData.map(d => ({ nodeId: d.nodeId, nodeName: d.nodeLabel as string, data: d.outputs, status: d.status }))}
                                onDragStart={(e, path) => e.dataTransfer.setData('text/plain', path)}
                            />
                        </div>
                    </div>

                    {/* CENTER: Config */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-[400px] border-r border-slate-200">
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Layout size={12} />
                                Scraping Options
                            </span>
                            
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => handleConfigChange('mode', 'ai')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${mode === 'ai' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Sparkles size={10} /> AI Mode
                                </button>
                                <button
                                    onClick={() => handleConfigChange('mode', 'selector')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${mode === 'selector' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Code size={10} /> Selector
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* URL Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target URL</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={config.url || ''}
                                        onChange={(e) => handleConfigChange('url', e.target.value)}
                                        placeholder="https://example.com/product/..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 transition-all pl-10"
                                    />
                                    <Earth className="absolute left-3 top-2.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                </div>
                            </div>

                            {mode === 'ai' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            Extraction Prompt
                                            <Sparkles size={10} className="text-indigo-400" />
                                        </label>
                                        <textarea
                                            value={config.prompt || ''}
                                            onChange={(e) => handleConfigChange('prompt', e.target.value)}
                                            placeholder="Example: Extract the product name, price, and current stock status as a JSON object."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none shadow-inner"
                                        />
                                        <p className="text-[10px] text-slate-400 bg-indigo-50/50 p-2 rounded border border-indigo-100/50">
                                            AI Mode works best for unstructured content. The system fetches the page text and provides it to Gemini AI for intelligent extraction.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSS Selector</label>
                                        <input
                                            type="text"
                                            value={config.selector || ''}
                                            onChange={(e) => handleConfigChange('selector', e.target.value)}
                                            placeholder=".article-content h1"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400">
                                            V1 currently uses AI-fallback for selectors. Precise CSS selector mapping is coming in a future update.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                        </div>

                         {/* Footer action bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button 
                                onClick={handleTestScrape}
                                disabled={isExecuting || !config.url}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${
                                    !config.url ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                    isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                {isExecuting ? 'Scraping...' : 'Test Scrape'}
                            </button>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Output Preview */}
                    <div className="w-[350px] border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden shrink-0">
                         <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRight size={12} />
                                Extracted Results
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {testResult ? (
                                testResult.success ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-3 py-2 rounded border border-green-100">
                                            <CheckCircle2 size={14} /> Success
                                        </div>
                                        <DataTreeViewer data={testResult.data} />
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider bg-red-50 px-3 py-2 rounded border border-red-100">
                                            <AlertCircle size={14} /> Failed
                                        </div>
                                        <div className="text-xs text-red-600 bg-white p-3 rounded border border-red-100 font-mono break-all leading-relaxed shadow-sm">
                                            {testResult.error}
                                        </div>
                                        {testResult.details && <DataTreeViewer data={testResult.details} />}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <Layout size={48} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-slate-500">No Data Scraped</p>
                                    <p className="text-xs mt-1 max-w-[200px]">Run a test to see what the AI extracts from the target URL.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
