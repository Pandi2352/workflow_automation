import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { X, RefreshCw, Zap } from 'lucide-react';
import { GoogleDriveConfig } from './GoogleDriveConfig';
import { axiosInstance } from '../../../api/axiosConfig';
import { NodeHelpButton } from '../../../common/NodeHelpButton';
import { SchemaDrivenConfig } from '../../../components/designer/panels/SchemaDrivenConfig';

// --- Config Switcher Map ---
const NODE_CONFIGS: Record<string, React.FC<any>> = {
    GOOGLE_DRIVE: GoogleDriveConfig
};

// --- Main Panel Component ---
export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, fetchNodeDefinitions, nodeDefinitions, fetchCredentials } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        fetchNodeDefinitions();
        fetchCredentials();
    }, []);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
            // Only reset if no external data provided, otherwise let the next effect handle it
            if (!nodeExecutionData) {
                setExecutionResult(null); 
            }
        }
    }, [selectedNode]);

    // Sync with external execution data
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

    // Handle Google Auth Pop-up Message (Global Listener for Panel)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && selectedNode) {
                const { credentialId } = event.data;
                const currentConfig = selectedNode.data?.config || {};
                updateNodeData(selectedNode.id, {
                    config: { ...currentConfig, credentialId }
                });
                fetchCredentials();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [selectedNode]);

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: selectedNode?.type,
                nodeData: selectedNode?.data?.config || {},
                inputs: [] // Mock inputs or fetch from upstream if feasible later
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

    if (!selectedNode) return null;

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode.id, { label: e.target.value });
    };

    const definition = nodeDefinitions.find(def => def.type === selectedNode.type);
    
    // Determine which config component to render
    const ConfigComponent = NODE_CONFIGS[selectedNode.type || ''] || SchemaDrivenConfig;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${definition?.category === 'Google' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                             <RefreshCw size={20} className={definition ? '' : 'hidden'} /> 
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-slate-900">{definition?.name || selectedNode.type}</h3>
                            <p className="text-sm text-slate-500">Configure parameters</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="GOOGLE_DRIVE" />
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Node Label</label>
                        <input 
                            type="text" 
                            value={label} 
                            onChange={handleLabelChange}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Name your node..."
                        />
                    </div>

                    <div className="space-y-6">
                        {/* Dynamic Switcher */}
                        <ConfigComponent selectedNode={selectedNode} focusColor="focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>

                {/* Execution Result Viewer */}
                {executionResult && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50 max-h-60 overflow-y-auto shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Execution Output</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${executionResult.success ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                {executionResult.success ? 'Success' : 'Result'}
                            </span>
                        </div>
                        <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg text-xs font-mono overflow-x-auto custom-scrollbar">
                            {JSON.stringify(executionResult.output, null, 2)}
                        </pre>
                        {/* Show logs if available */}
                        {executionResult.logs && executionResult.logs.length > 0 && (
                             <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                 Logs: {executionResult.logs.length} entries
                             </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl flex justify-between items-center">
                    <div className="text-xs text-slate-400 font-mono">
                        ID: {selectedNode.id}
                    </div>
                    <div className="flex gap-3">
                         <button 
                             onClick={handleExecuteNode}
                             disabled={isExecuting}
                             className={`px-4 py-2.5 font-medium rounded-lg transition-all flex items-center gap-2 ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                            {isExecuting ? 'Running...' : 'Test Node'}
                        </button>
                        <button 
                             onClick={() => setSelectedNode(null)}
                             className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

