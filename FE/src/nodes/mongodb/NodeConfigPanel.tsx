import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Database, X, Zap, RefreshCw, Server, Table } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [config, setConfig] = useState<any>({ 
        connectionString: '',
        dbName: 'automation_db',
        collectionName: 'manual_review'
    });
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                             <Database size={20} /> 
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-slate-900">MongoDB Storage</h3>
                            <p className="text-sm text-slate-500">Configure database parameters</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Node Label</label>
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
                                placeholder="mongodb://username:password@host..."
                            />
                            <p className="text-[10px] text-slate-400">Standard MongoDB URI (Hidden for security)</p>
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
                                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Execution Result Viewer */}
                {executionResult && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 max-h-60 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execution Result</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                executionResult.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                                executionResult.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                'bg-slate-200 text-slate-600'
                            }`}>
                                {executionResult.status}
                            </span>
                        </div>
                        {executionResult.error ? (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-mono border border-red-100">
                                {executionResult.error}
                            </div>
                        ) : (
                            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-x-auto custom-scrollbar shadow-inner">
                                {JSON.stringify(executionResult.output, null, 2)}
                            </pre>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl flex justify-between items-center">
                    <div className="text-[10px] text-slate-400 font-mono">
                        Node ID: {selectedNode.id}
                    </div>
                    <div className="flex gap-3">
                         <button 
                             onClick={handleTestNode}
                             disabled={isExecuting}
                             className={`px-4 py-2.5 font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                            {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                            {isExecuting ? 'Testing...' : 'Test Node'}
                        </button>
                        <button 
                             onClick={() => setSelectedNode(null)}
                             className="px-8 py-2.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
