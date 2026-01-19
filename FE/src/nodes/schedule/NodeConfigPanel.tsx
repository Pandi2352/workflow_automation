import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Clock, Settings, Zap, History, Trash2, RefreshCw } from 'lucide-react';
import { ScheduleConfig } from './ScheduleConfig';
import { axiosInstance } from '../../api/axiosConfig';
import { NodeHelpButton } from '../../common/NodeHelpButton';
import { cn } from '../../lib/utils';
import { DataTreeViewer } from '../../common/DataTreeViewer';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, fetchNodeDefinitions, deleteNode } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');

    useEffect(() => {
        fetchNodeDefinitions();
    }, [fetchNodeDefinitions]);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || 'Scheduler');
            if (nodeExecutionData) {
                setExecutionResult({
                    success: nodeExecutionData.status === 'SUCCESS',
                    output: nodeExecutionData.outputs || nodeExecutionData.value,
                    logs: nodeExecutionData.logs,
                    status: nodeExecutionData.status
                });
                setActiveTab('output');
            } else {
                setExecutionResult(null);
                setActiveTab('config');
            }
        }
    }, [selectedNode, nodeExecutionData]);

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');
        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: selectedNode?.type,
                nodeData: selectedNode?.data?.config || {},
                inputs: [] 
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

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode!.id, { label: e.target.value });
    };

    if (!selectedNode) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Sliding Panel Container */}
            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300 mr-0">
                
                {/* Empty Sidebar for consistent width but different content for Trigger */}
                <div className="w-80 h-full bg-slate-50 border-r border-slate-200 flex flex-col -mr-[1px]">
                    <div className="p-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Node Context</h4>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Type</span>
                                <span className="text-xs font-bold text-slate-700">Trigger Node</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Output</span>
                                <span className="text-xs font-bold text-slate-700">Detailed Timestamp Object</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Drawer */}
                <div className="w-[520px] h-full bg-white flex flex-col border-l border-slate-200">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                                <Clock size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Schedule Trigger</h3>
                                <p className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-tight">{selectedNode.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this trigger?')) {
                                        deleteNode(selectedNode.id);
                                        setSelectedNode(null);
                                    }
                                }}
                                className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Node"
                            >
                                <Trash2 size={20} />
                            </button>
                            <NodeHelpButton nodeType="SCHEDULE" />
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-5 py-3 border-b border-slate-100 bg-white">
                        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            {[
                                { id: 'config', label: 'Parameters', icon: Settings },
                                { id: 'output', label: 'Output Results', icon: History }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-lg transition-all",
                                        activeTab === tab.id 
                                            ? "bg-white text-slate-900 border border-slate-200/60 shadow-sm" 
                                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
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
                                {/* Label Input */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">General Settings</label>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">Display Name</span>
                                            <input 
                                                type="text" 
                                                value={label} 
                                                onChange={handleLabelChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                                                placeholder="e.g., Morning Trigger"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Config Content */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                                    <ScheduleConfig selectedNode={selectedNode} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                {executionResult ? (
                                    <div className="space-y-6">
                                        <div className={cn(
                                            "p-4 rounded-2xl border-2",
                                            executionResult.success ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
                                        )}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                                </span>
                                            </div>
                                            {executionResult.error && (
                                                <p className="text-xs mt-1 font-mono italic">{executionResult.error}</p>
                                            )}
                                        </div>

                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[100px]">
                                            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Produced Variables</span>
                                            </div>
                                            <div className="p-4 bg-white">
                                                <DataTreeViewer data={executionResult.output} truncate={false} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                                        <History size={48} className="mb-4 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No execution data</p>
                                        <p className="text-[11px] font-medium text-slate-500 mt-2">Test the trigger to see results here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-white flex justify-end items-center gap-3">
                        <button 
                            onClick={handleExecuteNode}
                            disabled={isExecuting}
                            className={cn(
                                "px-5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center gap-2",
                                isExecuting 
                                    ? "bg-slate-100 text-slate-400" 
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 shadow-sm"
                            )}
                        >
                            {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                            {isExecuting ? 'Triggering...' : 'Execute Trigger'}
                        </button>
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200 active:scale-95"
                        >
                            Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
