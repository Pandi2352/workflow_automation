import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Split, Plus, Trash2, ArrowRight, TableProperties, Play, RefreshCw, Braces, Database, CheckCircle2 } from 'lucide-react';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { axiosInstance } from '../../api/axiosConfig';

interface MappingItem {
    target: string;
    source: string;
}

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Guard against null selectedNode
    if (!selectedNode) return null;

    const config = useMemo(() => (selectedNode?.data?.config || {}) as any, [selectedNode]);
    const mappingType = config.mappingType || 'visual';

    // State for mappings to handle local edits before pushing to store
    // We initialize this inside a useEffect to keep it in sync but allow local editing
    const [mappings, setMappings] = useState<MappingItem[]>([]);

    useEffect(() => {
        if (config.mappings && Array.isArray(config.mappings)) {
            setMappings(config.mappings);
        } else {
            setMappings([]);
        }
    }, [selectedNode?.id]);

    const handleConfigChange = (key: string, value: any) => {
        if (!selectedNode) return;
        updateNodeData(selectedNode.id, {
            config: { ...config, [key]: value }
        });
    };

    const updateMappings = (newMappings: MappingItem[]) => {
        setMappings(newMappings);
        handleConfigChange('mappings', newMappings);
    };

    const addMapping = () => {
        updateMappings([...mappings, { target: '', source: '' }]);
    };

    const removeMapping = (index: number) => {
        updateMappings(mappings.filter((_, i) => i !== index));
    };

    const updateMappingItem = (index: number, field: keyof MappingItem, value: string) => {
        const newMappings = [...mappings];
        newMappings[index] = { ...newMappings[index], [field]: value };
        updateMappings(newMappings);
    };

    // -- Test Execution Logic --
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

    const handleTest = async () => {
        setIsTesting(true);
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
                nodeType: 'DATA_MAPPER',
                nodeData: config,
                inputs: inputs 
            });
            setTestResult(response.data);
        } catch (error: any) {
             setTestResult({ error: error.message, details: error.response?.data });
        } finally {
            setIsTesting(false);
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
                        <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
                            <Split size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedNode.data.label as string}</h2>
                            <p className="text-xs text-slate-500">Transform Data</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
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
                                availableNodes={inputData.map(d => ({ nodeId: d.nodeId, nodeName: d.nodeLabel as string, data: d.outputs, status: d.status }))}
                                onDragStart={(e, path) => e.dataTransfer.setData('text/plain', path)}
                            />
                        </div>
                    </div>

                    {/* CENTER: Config */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden p-0 border-r border-slate-200 min-w-[400px]">
                        
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <TableProperties size={12} />
                                Mapping Configuration
                            </span>
                            
                            {/* Mode Selector - integrated into header line for cleaner look or just below */}
                             <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => handleConfigChange('mappingType', 'visual')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${mappingType === 'visual' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <TableProperties size={10} /> Visual
                                </button>
                                <button
                                    onClick={() => handleConfigChange('mappingType', 'custom')}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${mappingType === 'custom' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Braces size={10} /> JSONATA
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                            {mappingType === 'visual' ? (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs text-slate-500">
                                            Map properties from input variables to your desired output structure.
                                        </p>
                                        <button 
                                            onClick={addMapping}
                                            className="text-xs flex items-center gap-1 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full font-bold hover:bg-pink-100 transition-colors"
                                        >
                                            <Plus size={12} /> Add Field
                                        </button>
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 pb-4">
                                        {mappings.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                                                <Split size={32} className="mb-3 opacity-20" />
                                                <p className="text-sm font-medium text-slate-500">No mappings configured</p>
                                                <button onClick={addMapping} className="mt-2 text-xs text-pink-600 hover:text-pink-700 font-medium">
                                                    + Add your first field
                                                </button>
                                            </div>
                                        )}
                                        {mappings.map((map, i) => (
                                            <div key={i} className="flex items-start gap-2 group animate-in slide-in-from-left-2 duration-200">
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <input
                                                            placeholder="target_key"
                                                            value={map.target}
                                                            onChange={(e) => updateMappingItem(i, 'target', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-pink-500 focus:outline-none focus:bg-white transition-all pl-8"
                                                        />
                                                        <div className="absolute left-2.5 top-2.5 text-slate-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-3 text-slate-300">
                                                    <ArrowRight size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <input
                                                            placeholder="{{variable}}"
                                                            value={map.source}
                                                            onChange={(e) => updateMappingItem(i, 'source', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-mono text-pink-600 focus:ring-2 focus:ring-pink-500 focus:outline-none focus:bg-white transition-all shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeMapping(i)}
                                                    className="mt-2 p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">JSONATA Expression</label>
                                    <div className="flex-1 flex flex-col relative">
                                        <textarea
                                            value={config.expression || '$'}
                                            onChange={(e) => handleConfigChange('expression', e.target.value)}
                                            className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none leading-relaxed shadow-inner"
                                            placeholder="$"
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 text-white/50 text-[10px] rounded font-mono">
                                            JSONATA
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mt-3">
                                        <p className="text-[10px] text-slate-500">
                                            <span className="font-bold text-slate-700">Tip:</span> The root input object is active as <code className="bg-white border border-slate-200 px-1 rounded text-pink-600">$</code>.
                                            You can use complex queries like <code className="bg-white border border-slate-200 px-1 rounded text-slate-600">Account.Order[0].ProductID</code>.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer action bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button
                                onClick={handleTest}
                                disabled={isTesting}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${
                                    isTesting ? 'bg-slate-100 text-slate-400' : 'bg-pink-600 text-white hover:bg-pink-700'
                                }`}
                            >
                                {isTesting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                {isTesting ? 'Simulating...' : 'Test Transformation'}
                            </button>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                            >
                                Done
                            </button>
                        </div>

                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-[350px] border-l border-slate-200 bg-slate-50 flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRight size={12} />
                                Output Preview
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {testResult ? (
                                testResult.error ? (
                                    <div className="bg-red-50 text-red-600 p-3 rounded text-xs border border-red-100 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <strong>Error:</strong> {testResult.error}
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-3 py-2 rounded border border-green-100">
                                            <CheckCircle2 size={14} /> Success
                                        </div>
                                        <DataTreeViewer data={testResult.output || testResult} />
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <Split size={48} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-slate-500">No Test Result</p>
                                    <p className="text-xs mt-1 max-w-[200px]">Run a test to see proper transformation output.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
