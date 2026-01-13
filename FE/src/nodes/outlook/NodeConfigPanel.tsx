import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { OutlookConfig } from './OutlookConfig';
import { 
    X, 
    Settings, 
    History, 
    Play,
    Mail,
    Search,
    Clock,
    Database,
    FileText,
    Activity
} from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';

export const NodeConfigPanel = ({ nodeExecutionData }: { nodeExecutionData?: any }) => {
    const { selectedNode, setSelectedNode, showToast } = useWorkflowStore();
    const [activeTab, setActiveTab] = useState<'config' | 'execution' | 'help'>('config');

    if (!selectedNode) return null;

    const handleTestNode = async () => {
        showToast('Testing Outlook node...', 'info');
        try {
            await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'OUTLOOK',
                nodeData: selectedNode.data.config || {},
                inputs: []
            });
            showToast('Node test successful', 'success');
        } catch (error: any) {
            showToast('Node test failed', 'error', error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="absolute top-4 right-4 bottom-4 w-[400px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 flex flex-col z-[100] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">Outlook Settings</h3>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">Microsoft 365 Email</p>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex px-2 py-2 gap-1 bg-slate-50/50 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                        activeTab === 'config' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Settings size={14} />
                    Configuration
                </button>
                <button
                    onClick={() => setActiveTab('execution')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                        activeTab === 'execution' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Activity size={14} />
                    Latest Run
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                    {activeTab === 'config' ? (
                        <>
                            <OutlookConfig selectedNode={selectedNode} />
                            
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleTestNode}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
                                >
                                    <Play size={16} fill="currentColor" />
                                    Test Node
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {nodeExecutionData ? (
                                <>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${nodeExecutionData.status === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{nodeExecutionData.status}</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {nodeExecutionData.metadata?.executionTime || 0}ms
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-900 pb-2 border-b border-slate-50">
                                            <Database size={14} className="text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Output Data</span>
                                        </div>
                                        <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
                                            <pre className="text-[11px] text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                                {JSON.stringify(nodeExecutionData.output, null, 2)}
                                            </pre>
                                        </div>
                                    </div>

                                    {nodeExecutionData.logs && nodeExecutionData.logs.length > 0 && (
                                        <div className="space-y-4">
                                             <div className="flex items-center gap-2 text-slate-900 pb-2 border-b border-slate-50">
                                                <FileText size={14} className="text-indigo-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Execution Logs</span>
                                            </div>
                                            <div className="space-y-2">
                                                {nodeExecutionData.logs.map((log: any, i: number) => (
                                                    <div key={i} className="text-[10px] p-2 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-600">
                                                        <span className="text-indigo-500 font-bold mr-2">[{log.level}]</span>
                                                        {log.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <History size={24} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900">No execution history</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Run the workflow to see the output data for this node.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Tip */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
                 <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 text-indigo-500 px-3">
                        <Search size={14} />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                        <span className="font-bold text-slate-700 block mb-0.5">Quick Tip</span>
                        Use OData filters to watch specific senders or subjects.
                    </p>
                 </div>
            </div>
        </div>
    );
};
