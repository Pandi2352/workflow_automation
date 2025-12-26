import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Globe, Key, Database, Play, CheckCircle2, AlertCircle, Plus, Trash2, ArrowUpRight, RefreshCw } from 'lucide-react';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { axiosInstance } from '../../api/axiosConfig';
import { DataTreeViewer } from '../../common/DataTreeViewer';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = () => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [isExecuting, setIsExecuting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

    // Headers State
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);

    const config = useMemo(() => (selectedNode?.data?.config || {}) as any, [selectedNode]);

    useEffect(() => {
        if (config.headers && typeof config.headers === 'object') {
            const headerArray = Object.entries(config.headers).map(([key, value]) => ({ key, value: String(value) }));
            setHeaders(headerArray.length > 0 ? headerArray : [{ key: '', value: '' }]);
        } else {
            setHeaders([{ key: '', value: '' }]);
        }
    }, [selectedNode?.id]);

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

    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
        
        // Update config
        const headerObj = newHeaders.reduce((acc, curr) => {
            if (curr.key.trim()) acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
        handleConfigChange('headers', headerObj);
    };

    const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
    const removeHeader = (index: number) => {
        const newHeaders = headers.filter((_, i) => i !== index);
        setHeaders(newHeaders);
        const headerObj = newHeaders.reduce((acc, curr) => {
            if (curr.key.trim()) acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
        handleConfigChange('headers', headerObj);
    };

    const handleTestRequest = async () => {
        setIsExecuting(true);
        setTestResult(null);
        try {
            const inputs = inputData.flatMap(d => {
                const vals = Array.isArray(d.outputs) ? d.outputs : (d.outputs ? [d.outputs] : []);
                return vals.map(v => ({
                    value: v,
                    nodeId: d.nodeId,
                    nodeName: d.nodeLabel
                }));
            });

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'HTTP_REQUEST',
                nodeData: config,
                inputs: inputs 
            });
            setTestResult({ success: true, data: response.data });
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
                        <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedNode.data.label as string}</h2>
                            <p className="text-xs text-slate-500">Configure HTTP Request</p>
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
                                <Key size={12} />
                                Configuration
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Method & URL */}
                            <div className="flex gap-2">
                                <select 
                                    value={config.method || 'GET'}
                                    onChange={(e) => handleConfigChange('method', e.target.value)}
                                    className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="PATCH">PATCH</option>
                                </select>
                                <input
                                    type="text"
                                    value={config.url || ''}
                                    onChange={(e) => handleConfigChange('url', e.target.value)}
                                    placeholder="https://api.example.com/v1/..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none focus:border-cyan-500 transition-all"
                                />
                            </div>

                            {/* Tabs for Headers/Body */}
                            <div className="bg-slate-50 rounded-lg p-1 flex gap-1 border border-slate-200">
                                {['Params', 'Headers', 'Body'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                            activeTab === tab.toLowerCase() 
                                            ? 'bg-white text-cyan-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'headers' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Request Headers</label>
                                        <button onClick={addHeader} className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 bg-cyan-50 px-2 py-1 rounded-md transition-colors">
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {headers.map((header, i) => (
                                            <div key={i} className="flex gap-2 group">
                                                <input 
                                                    placeholder="Key"
                                                    value={header.key}
                                                    onChange={(e) => handleHeaderChange(i, 'key', e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                                />
                                                <input 
                                                    placeholder="Value"
                                                    value={header.value}
                                                    onChange={(e) => handleHeaderChange(i, 'value', e.target.value)}
                                                    className="flex-[2] bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                                />
                                                <button onClick={() => removeHeader(i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded hover:bg-red-50 opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'body' && (
                                <div className="h-[300px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                    <textarea
                                        value={typeof config.data === 'string' ? config.data : JSON.stringify(config.data || {}, null, 2)}
                                        onChange={(e) => handleConfigChange('data', e.target.value)}
                                        placeholder='{ "key": "value" }'
                                        className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed shadow-inner"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Valid JSON required. Use {'{{variable}}'} to inject data.
                                    </p>
                                </div>
                            )}

                            {activeTab === 'params' && (
                                <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 border-2 border-dashed border-slate-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Globe size={32} className="mb-2 opacity-20" />
                                    <p className="text-xs">Query params are currently managed via the URL field.</p>
                                </div>
                            )}
                            
                        </div>

                         {/* Footer action bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button 
                                onClick={handleTestRequest}
                                disabled={isExecuting || !config.url}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${
                                    !config.url ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                    isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                }`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                {isExecuting ? 'Sending Request...' : 'Send Request'}
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
                                <ArrowUpRight size={12} />
                                Response
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
                                        <div className="text-xs text-red-600 bg-white p-3 rounded border border-red-100 font-mono break-all">
                                            {testResult.error}
                                        </div>
                                        {testResult.details && <DataTreeViewer data={testResult.details} />}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <Globe size={48} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-slate-500">No Response Data</p>
                                    <p className="text-xs mt-1 max-w-[200px]">Send a request to inspect the response payload here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
