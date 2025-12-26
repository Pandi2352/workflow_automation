import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, FileText, Zap, Box, Database, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { DataTreeViewer } from '../../common/DataTreeViewer';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);

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
                output: nodeExecutionData.outputs || nodeExecutionData.value,
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

    const handleConfigChange = (key: string, value: any) => {
        updateNodeData(selectedNode.id, {
            config: { ...config, [key]: value }
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
            const inputs = rawInputs.length > 0 ? [rawInputs[0]] : [];

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'SURYA_OCR',
                nodeData: { ...config, forceProcess: true },
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

    const [activeTab, setActiveTab] = useState<'output' | 'logs'>('output');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1600px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                             <Zap size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">Surya OCR Configuration</h3>
                            <p className="text-xs text-slate-500">Advanced layout-preserved extraction</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Input Sidebar */}
                    <div className="w-[300px] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50 shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                 <Database size={12} /> Input
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
                                    e.dataTransfer.setData('text/plain', `{{${variablePath}}}`);
                                }}
                            />
                        </div>
                    </div>

                    {/* Config Area */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200 min-w-[400px]">
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
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
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Model Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Box size={12} /> Model Type
                                    </label>
                                    <select
                                        value={config.modelType || 'standard'}
                                        onChange={(e) => handleConfigChange('modelType', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="multilingual">Multilingual</option>
                                    </select>
                                </div>

                                {/* Files Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={12} /> File Source
                                    </label>
                                    <input
                                        type="text"
                                        value={config.files || ''}
                                        onChange={(e) => handleConfigChange('files', e.target.value)}
                                        placeholder="{{PreviousNode.outputs}} or {{FILE UPLOAD.output[0].url}}"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                {isExecuting ? 'Processing...' : 'Test Surya OCR'}
                            </button>
                            <button onClick={() => setSelectedNode(null)} className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm">Done</button>
                        </div>
                    </div>

                    {/* Output Area */}
                    <div className="w-[380px] bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                         <div className="flex border-b border-slate-200 bg-slate-50">
                            <button onClick={() => setActiveTab('output')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'output' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Output</button>
                            <button onClick={() => setActiveTab('logs')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'logs' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Logs</button>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50">
                             {executionResult ? (
                                activeTab === 'output' ? <div className="bg-slate-50 min-h-full"><DataTreeViewer data={executionResult.output} truncate={true} /></div> :
                                <div className="divide-y divide-slate-100">{executionResult.logs?.map((log: any, i: number) => <div key={i} className="p-3 text-[10px] font-mono text-slate-600 border-b border-slate-100">{log.message}</div>)}</div>
                            ) : <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center"><Zap size={32} className="mb-3 opacity-20" /><p className="text-sm font-medium">No Execution Data</p></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default NodeConfigPanel;
