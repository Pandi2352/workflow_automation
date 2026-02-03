import React, { useEffect, useState } from 'react';
import { RefreshCw, Settings, Terminal, X, Zap } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { useWorkflowStore } from '../../store/workflowStore';
import { SchemaDrivenConfig } from '../../components/designer/panels/SchemaDrivenConfig';
import { cn } from '../../lib/utils';

export const SchemaNodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, fetchNodeDefinitions } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [testInput, setTestInput] = useState('[]');

    useEffect(() => {
        fetchNodeDefinitions();
    }, [fetchNodeDefinitions]);

    useEffect(() => {
        if (!selectedNode) {
            return;
        }

        setLabel((selectedNode.data?.label as string) || '');
        setExecutionResult(null);
        setActiveTab('config');
        setTestInput('[]');
    }, [selectedNode?.id]);

    useEffect(() => {
        if (!nodeExecutionData) {
            return;
        }

        setExecutionResult({
            success: nodeExecutionData.status === 'SUCCESS',
            output: nodeExecutionData.outputs || nodeExecutionData.value,
            logs: nodeExecutionData.logs,
            status: nodeExecutionData.status,
        });
        setActiveTab('output');
    }, [nodeExecutionData]);

    if (!selectedNode) {
        return null;
    }

    const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextLabel = event.target.value;
        setLabel(nextLabel);
        updateNodeData(selectedNode.id, { label: nextLabel });
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');

        let parsedInputs: any[] = [];
        try {
            const raw = JSON.parse(testInput);
            if (!Array.isArray(raw)) {
                throw new Error('Inputs must be a JSON array.');
            }
            parsedInputs = raw;
        } catch (error: any) {
            setExecutionResult({
                error: `Invalid test input: ${error.message}`,
                status: 'CONFIG_ERROR',
                success: false,
            });
            setIsExecuting(false);
            return;
        }

        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: selectedNode.type,
                nodeData: selectedNode.data?.config || {},
                inputs: parsedInputs,
            });
            setExecutionResult(response.data);
        } catch (error: any) {
            setExecutionResult({
                error: error.response?.data?.message || error.message,
                status: 'FAILED',
                success: false,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 animate-in fade-in duration-200" onClick={() => setSelectedNode(null)} />

            <div className="relative w-[500px] h-full bg-white shadow-2xl flex flex-col transform transition-all animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedNode.type.replace(/_/g, ' ')}</h3>
                            <p className="text-xs text-slate-500">Configure Node ID: {selectedNode.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 px-4">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'config'
                                ? 'border-slate-800 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700',
                        )}
                    >
                        <Settings size={14} />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'output'
                                ? 'border-slate-800 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700',
                        )}
                    >
                        <Terminal size={14} />
                        Output & Logs
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6">
                    {activeTab === 'config' ? (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Node Label</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                                    placeholder="Name your node..."
                                />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <SchemaDrivenConfig selectedNode={selectedNode} focusColor="focus:ring-2 focus:ring-slate-500" />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex justify-between">
                                    <span>Test Inputs (JSON Array)</span>
                                    <span className="text-[10px] normal-case font-normal text-slate-400">Mock upstream data</span>
                                </label>
                                <textarea
                                    value={testInput}
                                    onChange={(event) => setTestInput(event.target.value)}
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all resize-y custom-scrollbar"
                                    placeholder='[{ "value": "example" }]'
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col gap-4">
                            {executionResult ? (
                                <>
                                    <div
                                        className={cn(
                                            'p-4 rounded-xl border border-l-4 shadow-sm',
                                            executionResult.success ? 'bg-green-50 border-green-200 border-l-green-500' : 'bg-red-50 border-red-200 border-l-red-500',
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={cn('text-sm font-bold', executionResult.success ? 'text-green-700' : 'text-red-700')}>
                                                {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                            </span>
                                            <span className="text-xs text-slate-500">{executionResult.status || 'UNKNOWN'}</span>
                                        </div>
                                        {executionResult.error && <p className="text-xs text-red-600 mt-1">{executionResult.error}</p>}
                                    </div>

                                    <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-hidden flex flex-col">
                                        <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                                            <span className="text-xs font-mono text-slate-400">JSON Output</span>
                                            <button
                                                className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wider"
                                                onClick={() => navigator.clipboard.writeText(JSON.stringify(executionResult.output, null, 2))}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <pre className="flex-1 overflow-auto custom-scrollbar text-xs font-mono text-green-400">
                                            {JSON.stringify(executionResult.output, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Terminal size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No execution data available</p>
                                    <p className="text-xs text-slate-400 mt-1">Run the node to see outputs here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleExecuteNode}
                        disabled={isExecuting}
                        className={cn(
                            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                            isExecuting
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-slate-900 text-white',
                        )}
                    >
                        {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                        {isExecuting ? 'Running...' : 'Test Node'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchemaNodeConfigPanel;
