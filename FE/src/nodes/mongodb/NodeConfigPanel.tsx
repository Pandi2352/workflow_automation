import React, { useEffect, useState, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Database, X, Zap, RefreshCw, Server, Table, ArrowRight, TableProperties, CheckCircle2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { DataTreeViewer } from '../../common/DataTreeViewer';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [config, setConfig] = useState<any>({ 
        connectionString: '',
        dbName: 'automation_db',
        collectionName: 'manual_review',
        documentData: '{{$input}}'
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);

    const inputData = useMemo(() => {
        if (!selectedNode) return [];
        const incomingEdges = edges.filter(edge => edge.target === selectedNode.id);
        return incomingEdges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const sourceExec = currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === edge.source);
            return {
                nodeId: edge.source,
                nodeName: (sourceNode?.data?.label as string) || sourceNode?.id || 'Unknown Node',
                data: sourceExec?.outputs || null,
                status: (sourceExec?.status as string) || 'NOT_RUN'
            };
        });
    }, [selectedNode, edges, nodes, currentExecution]);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
            if (selectedNode.data?.config) {
                setConfig({ 
                    ...config,
                    ...(selectedNode.data.config as any)
                });
            }
        }
    }, [selectedNode?.id]);

    useEffect(() => {
        if (nodeExecutionData) {
            setExecutionResult({
                status: nodeExecutionData.status,
                output: nodeExecutionData.outputs || nodeExecutionData.value || nodeExecutionData.result,
                logs: nodeExecutionData.logs
            });
        }
    }, [nodeExecutionData]);

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        updateNodeData(selectedNode!.id, { config: newConfig });
    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode!.id, { label: e.target.value });
    };

    const handleTestNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'MONGODB',
                nodeData: config,
                inputs: []
            });
            setExecutionResult({
                status: 'SUCCESS',
                output: response.data
            });
        } catch (error: any) {
            setExecutionResult({
                status: 'FAILED',
                error: error.response?.data?.message || error.message
            });
        } finally {
            setIsExecuting(false);
        }
    };

    if (!selectedNode) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedNode(null)}>
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1250px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                             <Database size={20} /> 
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">{label || 'MongoDB Storage'}</h3>
                            <p className="text-xs text-slate-500">Configure database parameters</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Inputs Sidebar */}
                    <div className="w-[300px] border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Database size={12} />
                                Input Variables
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <NodeDataSidebar 
                                availableNodes={inputData}
                                onDragStart={(e, path) => e.dataTransfer.setData('text/plain', path)}
                            />
                        </div>
                    </div>

                    {/* CENTER: Config */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200">
                        <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <TableProperties size={12} />
                                Configuration
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="mb-8">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="Name your node..."
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Connection String */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Server size={12} className="text-slate-400" />
                                        Connection String
                                    </label>
                                    <input
                                        type="password"
                                        value={config.connectionString}
                                        onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                                        placeholder="{{mongodb_uri}} or direct string"
                                    />
                                    <p className="text-[10px] text-slate-400 text-right">Standard URI (Hidden for security). Supports variables like <code>{`{{path}}`}</code></p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* DB Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Database size={12} className="text-slate-400" />
                                            Database Name
                                        </label>
                                        <input
                                            type="text"
                                            value={config.dbName}
                                            onChange={(e) => handleConfigChange('dbName', e.target.value)}
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-emerald-600"
                                        />
                                    </div>

                                    {/* Collection Name */}
                                     <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Table size={12} className="text-slate-400" />
                                            Collection
                                        </label>
                                        <input
                                            type="text"
                                            value={config.collectionName}
                                            onChange={(e) => handleConfigChange('collectionName', e.target.value)}
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-emerald-600"
                                        />
                                    </div>
                                </div>

                                {/* Document Data */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <TableProperties size={12} className="text-slate-400" />
                                        Document Content (JSON or Variable)
                                    </label>
                                    <textarea
                                        value={config.documentData}
                                        onChange={(e) => handleConfigChange('documentData', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                                        placeholder='{ "key": "{{variable}}" } or {{node.outputs}}'
                                    />
                                    <p className="text-[10px] text-slate-400">Specify the document to insert. Use <code>{`{{$input}}`}</code> to insert the previous node's output, or provide a custom JSON object.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="text-[10px] text-slate-400 font-mono">
                                ID: {selectedNode.id}
                            </div>
                            <div className="flex gap-3">
                                 <button 
                                     onClick={handleTestNode}
                                     disabled={isExecuting}
                                     className={`px-4 py-2 font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm'}`}
                                >
                                    {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                    {isExecuting ? 'Testing...' : 'Test Node'}
                                </button>
                                <button 
                                     onClick={() => setSelectedNode(null)}
                                     className="px-6 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-[350px] border-l border-slate-100 bg-slate-50 flex flex-col overflow-hidden shrink-0">
                         <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRight size={12} />
                                Output Preview
                            </span>
                             {executionResult && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    executionResult.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                                    executionResult.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-200 text-slate-600'
                                }`}>
                                    {executionResult.status}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {executionResult ? (
                                executionResult.error ? (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-xs font-mono border border-red-100 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <strong className="block mb-1">Execution Error:</strong>
                                        {executionResult.error}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 px-3 py-2 rounded border border-emerald-100">
                                            <CheckCircle2 size={14} /> Operation Successful
                                        </div>
                                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                            <div className="p-2 bg-slate-50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Result Data</div>
                                            <DataTreeViewer data={executionResult.output} />
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                                    <Database size={48} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-slate-500 leading-tight">No Execution Data</p>
                                    <p className="text-[10px] mt-2 max-w-[180px]">Run a test or execute the workflow to see storage results.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
