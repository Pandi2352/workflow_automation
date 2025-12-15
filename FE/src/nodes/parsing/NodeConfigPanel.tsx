import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Cpu, AlertTriangle, X } from 'lucide-react';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';

interface NodeConfigPanelProps {
    nodeExecutionData?: {
        status: string;
        result?: {
            confidenceScore?: number;
            [key: string]: any;
        };
        error?: any;
    };
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [config, setConfig] = useState<any>({ 
        schema: '{}',
        modelName: 'gemini-1.5-flash'
    });
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Compute Input Data from Previous Nodes
    const inputData = React.useMemo(() => {
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

    useEffect(() => {
        if (selectedNode?.data?.config) {
            const currentConfig = selectedNode.data.config as any;
            if (currentConfig.schema && typeof currentConfig.schema === 'object') {
                 setConfig({ 
                    ...currentConfig, 
                    schema: JSON.stringify(currentConfig.schema, null, 2),
                    modelName: currentConfig.modelName || 'gemini-1.5-flash'
                });
            } else {
                 setConfig({
                    ...currentConfig,
                    modelName: currentConfig.modelName || 'gemini-1.5-flash'
                 });
            }
        }
    }, [selectedNode?.id, selectedNode?.data?.config]);

    const handleConfigChange = (key: string, value: any) => {
        if (!selectedNode) return;
        
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        
        if (key === 'schema') {
            try {
                const parsed = JSON.parse(value);
                setJsonError(null);
                updateNodeData(selectedNode.id, {
                    config: { ...newConfig, schema: parsed }
                });
            } catch (e) {
                setJsonError('Invalid JSON format');
            }
        } else {
            updateNodeData(selectedNode.id, { config: newConfig });
        }
    };

    if (!selectedNode) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[1100px] h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                            <Cpu size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedNode.data.label as string}</h2>
                            <p className="text-xs text-slate-500">AI Parsing Configuration</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT: Sidebar */}
                    <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
                        <NodeDataSidebar 
                            availableNodes={inputData.map(d => ({
                                nodeId: d.nodeId,
                                nodeName: d.nodeLabel,
                                data: d.outputs,
                                status: d.status
                            }))}
                            onDragStart={(e, path) => console.log('Drag:', path)}
                        />
                    </div>

                    {/* RIGHT: Config */}
                    <div className="w-2/3 flex flex-col bg-white overflow-hidden p-6 space-y-6 overflow-y-auto">
                        
                        {/* Model Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                AI Model
                            </label>
                            <select
                                value={config.modelName || 'gemini-1.5-flash'}
                                onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                            >
                                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                            </select>
                        </div>

                        {/* Schema Editor */}
                        <div className="space-y-3 flex-1 flex flex-col">
                            <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                Extraction Schema (JSON)
                            </label>
                            <div className="relative flex-1">
                                <textarea
                                    value={config.schema}
                                    onChange={(e) => handleConfigChange('schema', e.target.value)}
                                    className={`w-full h-full min-h-[300px] p-3 pr-10 text-xs font-mono bg-slate-800 text-green-400 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm ${
                                        jsonError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder='{ "field": "type" }'
                                />
                                {jsonError && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 text-red-400 bg-red-900/20 px-2 py-1 rounded text-xs">
                                        <AlertTriangle size={12} />
                                        <span>Invalid JSON</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50 p-4 shrink-0 flex justify-end">
                     <button 
                        onClick={() => setSelectedNode(null)}
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
