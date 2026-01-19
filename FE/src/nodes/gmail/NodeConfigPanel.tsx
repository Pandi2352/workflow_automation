import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, RefreshCw, Zap, Settings, Terminal } from 'lucide-react';
import { GmailConfig } from './GmailConfig';
import { axiosInstance } from '../../api/axiosConfig';
import { Button } from '../../common/Button';
import { cn } from '../../lib/utils';

// --- Generic Configuration Component ---
const GenericNodeConfig = ({ selectedNode }: { selectedNode: any }) => {
    const { updateNodeData, nodeDefinitions, credentials } = useWorkflowStore();
    
    // Config change handler
    const handleConfigChange = (key: string, value: any) => {
        const currentConfig = selectedNode.data?.config || {};
        updateNodeData(selectedNode.id, {
            config: { ...currentConfig, [key]: value }
        });
    };

    const definition = nodeDefinitions.find(def => def.type === selectedNode.type);
    const configSchema = definition?.configSchema || {};
    const nodeConfig = (selectedNode.data?.config || {}) as Record<string, any>;

    const renderField = (key: string, field: any) => {
        // Condition check
        if (field.condition) {
            const [condKey, condValue] = Object.entries(field.condition)[0];
            if (nodeConfig[condKey] !== condValue) return null;
        }

        if (field.type === 'credential') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={nodeConfig['credentialId'] || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleConfigChange('credentialId', val);
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                            >
                                <option value="">-- Select Credential --</option>
                                {credentials?.filter((c: any) => c.provider === field.provider).map((cred: any) => (
                                    <option key={cred._id} value={cred._id}>
                                        {cred.name || cred.metadata?.email || 'Unnamed Credential'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <select
                        value={nodeConfig[key] || field.default || ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    >
                        {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === 'string') {
            return (
                <div key={key} className="mb-5">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.description}</label>
                    <input
                        type="text"
                        value={nodeConfig[key] || ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    />
                </div>
            );
        }

        return null;
    };

    return (
        <>
            {Object.entries(configSchema).map(([key, field]) => renderField(key, field))}
        </>
    );
};

// --- Config Switcher Map ---
const NODE_CONFIGS: Record<string, React.FC<any>> = {
    GMAIL: GmailConfig
};

// --- Main Panel Component ---
export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, fetchNodeDefinitions, nodeDefinitions, fetchCredentials } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'output'>('config');
    const [testInput, setTestInput] = useState('[]');

    useEffect(() => {
        fetchNodeDefinitions();
        fetchCredentials();
    }, []);

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
            if (!nodeExecutionData) {
                setExecutionResult(null); 
            }
            setActiveTab('config'); // Reset to config tab on node change
            setTestInput('[]'); // Reset test inputs
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
            // Automatically switch to output tab if execution finishes (optional, maybe distracting)
             if (nodeExecutionData.status) {
                 setActiveTab('output');
             }
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
        setActiveTab('output'); // Switch to output view
        
        // Parse Test Inputs
        let inputs = [];
        try {
            inputs = JSON.parse(testInput);
            if (!Array.isArray(inputs)) {
                throw new Error("Inputs must be a JSON Array.");
            }
        } catch (e: any) {
            setExecutionResult({ 
                error: `Invalid Test Inputs: ${e.message}`,
                status: 'Config Error' 
            });
            setIsExecuting(false);
            return;
        }

        try {
            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: selectedNode?.type,
                nodeData: selectedNode?.data?.config || {},
                inputs: inputs 
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
    const ConfigComponent = NODE_CONFIGS[selectedNode.type || ''] || GenericNodeConfig;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 animate-in fade-in duration-200"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Drawer */}
            <div className="relative w-[500px] h-full bg-white shadow-2xl flex flex-col transform transition-all animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${definition?.category === 'Google' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                             {/* Icon specific logic could go here, for now using generic or category */}
                             <Settings size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">{definition?.name || selectedNode.type}</h3>
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

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-4">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'config' 
                                ? "border-red-500 text-red-600" 
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Settings size={14} />
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('output')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'output' 
                                ? "border-red-500 text-red-600" 
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Terminal size={14} />
                        Output & Logs
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6">
                    {activeTab === 'config' ? (
                        <div className="space-y-6">
                             {/* Node Label Input */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="Name your node..."
                                />
                            </div>

                            {/* Dynamic Config Component */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <ConfigComponent selectedNode={selectedNode} />
                            </div>

                            {/* Test Inputs (Mock Data) */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex justify-between">
                                    <span>Test Inputs (JSON Array)</span>
                                    <span className="text-[10px] normal-case font-normal text-slate-400">Mock upstream data</span>
                                </label>
                                <textarea
                                    value={testInput}
                                    onChange={(e) => setTestInput(e.target.value)}
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-y custom-scrollbar"
                                    placeholder="e.g. [{ &quot;key&quot;: &quot;value&quot; }]"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Execution Result Viewer */}
                            {executionResult ? (
                                <div className="flex-1 flex flex-col gap-4">
                                     <div className={`p-4 rounded-xl border border-l-4 shadow-sm ${
                                         executionResult.success ? 'bg-green-50 border-green-200 border-l-green-500' : 'bg-red-50 border-red-200 border-l-red-500'
                                     }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-sm font-bold ${executionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {executionResult.status}
                                            </span>
                                        </div>
                                        {executionResult.error && (
                                            <p className="text-xs text-red-600 mt-1">{executionResult.error}</p>
                                        )}
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
                                    
                                    {executionResult.logs && executionResult.logs.length > 0 && (
                                         <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-sm max-h-[200px] overflow-y-auto">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">System Logs</span>
                                            </div>
                                            <div className="space-y-1 font-mono">
                                                {executionResult.logs.map((log: any, i: number) => {
                                                    const logMessage = typeof log === 'object' && log !== null 
                                                        ? `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level}] ${log.message}`
                                                        : String(log);
                                                    
                                                    // Color code based on level if present
                                                    const isError = logMessage.includes('[ERROR]');
                                                    const isWarn = logMessage.includes('[WARN]');
                                                    const isInfo = logMessage.includes('[INFO]');

                                                    return (
                                                        <div key={i} className={`text-xs border-b border-slate-900 last:border-0 pb-1 mb-1 break-all ${
                                                            isError ? 'text-red-400' : 
                                                            isWarn ? 'text-yellow-400' : 
                                                            isInfo ? 'text-blue-300' : 'text-slate-400'
                                                        }`}>
                                                            <span className="text-slate-600 mr-2 select-none">{(i + 1).toString().padStart(2, '0')}</span>
                                                            {logMessage}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                         </div>
                                    )}
                                </div>
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

                {/* Footer Action Bar */}
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={handleExecuteNode}
                        disabled={isExecuting}
                        className={cn(
                            "flex-1 justify-center gap-2",
                            isExecuting ? "bg-slate-100 text-slate-400" : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                        )}
                    >
                        {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                        {isExecuting ? 'Running...' : 'Test Node'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
