import React, { useEffect, useState, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { GitFork, ArrowLeft, Play, X, Zap, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution, triggerWorkflowExecution } = useWorkflowStore();
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
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'IF_ELSE',
                nodeData: { ...config },
                inputs: inputData.map(d => d.outputs).filter(Boolean) 
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

    const handleRunPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerWorkflowExecution();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[900px] h-[80vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                             <GitFork size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">Decision Engine Configuration</h3>
                            <p className="text-xs text-slate-500">Define branching logic (True/False)</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Body - Split View */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* LEFT COLUMN - Input Data */}
                    <div className="w-1/2 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ArrowLeft size={12} />
                                Available Data
                            </span>
                             <span className="text-[10px] text-slate-400">
                                {inputData.length} Source(s)
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                           {inputData.map((input) => (
                                <div key={input.nodeId} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-3">
                                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-semibold text-xs text-slate-700">{input.nodeLabel}</span>
                                        <button 
                                            onClick={handleRunPrevious}
                                            className="p-1 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded transition-colors"
                                            title="Execute Workflow"
                                        >
                                            <Play size={10} fill="currentColor" />
                                        </button>
                                    </div>
                                    <div className="max-h-[200px] overflow-auto">
                                        {input.outputs ? (
                                            <pre className="p-3 text-[10px] font-mono text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {JSON.stringify(input.outputs, null, 2)}
                                            </pre>
                                        ) : (
                                            <div className="p-3 text-center text-xs text-slate-400 italic">No data</div>
                                        )}
                                    </div>
                                </div>
                           ))}
                           {inputData.length === 0 && (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No inputs connected</div>
                           )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Configuration */}
                    <div className="w-1/2 flex flex-col bg-white overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="Name your decision..."
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <GitFork size={12} />
                                        Expression Condition
                                    </label>
                                    <textarea
                                        value={config.condition || ''}
                                        onChange={(e) => handleConfigChange('condition', e.target.value)}
                                        placeholder="{{ParsingNode.outputs.confidence}} > 0.8"
                                        rows={4}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-slate-600 placeholder:text-slate-300 resize-none"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Supports JavaScript comparisons. Use {'{{variable}}'} notation.
                                    </p>
                                </div>

                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-800">
                                    <strong>Routes:</strong>
                                    <ul className="list-disc ml-4 mt-1 space-y-1">
                                        <li>If condition is <strong>true</strong>, continues to "True" output handle.</li>
                                        <li>If condition is <strong>false</strong>, continues to "False" output handle.</li>
                                    </ul>
                                </div>
                            </div>

                             {/* Execution Result Viewer */}
                            {executionResult && (
                                <div className="mt-8 border-t border-slate-100 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Execution Output</div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${executionResult.success ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {executionResult.success ? 'Success' : 'Failed'}
                                        </span>
                                    </div>
                                    <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg text-xs font-mono overflow-x-auto custom-scrollbar max-h-60">
                                        {JSON.stringify(executionResult.output, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                         {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="text-xs text-slate-400 font-mono">
                                ID: {selectedNode.id}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleExecuteNode}
                                    disabled={isExecuting}
                                    className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                >
                                    {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                    {isExecuting ? 'Evaluating...' : 'Test Condition'}
                                </button>
                                <button 
                                    onClick={() => setSelectedNode(null)}
                                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
