
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Play, Code, Database, Plus, RefreshCw, Terminal, Trash2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
// Helper to generate code template
const generateCodeTemplate = (language: string, args: Record<string, string>) => {
    const argNames = Object.keys(args).join(', ');
    
    if (language === 'python3') {
        const pyArgs = Object.keys(args).map(k => `${k}: str`).join(', ');
        return `
def main(${pyArgs}):
    # Your logic here
    result = "Hello " + str(${Object.keys(args)[0] || '""'})
    
    return {
        "result": result
    }
`;
    } else {
        return `
async function main(${argNames}) {
    // Your logic here
    const result = "Hello " + (${Object.keys(args)[0] || '""'});

    return {
        result: result
    };
}
`;
    }
};

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = ({ nodeExecutionData }) => {
    const { selectedNode, updateNodeData, setSelectedNode, nodes, edges, currentExecution } = useWorkflowStore();
    const [label, setLabel] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);
    
    // Config State
    const [config, setConfig] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'output' | 'logs'>('output');

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || '');
            
            const currentConfig = (selectedNode.data?.config as any) || {};
            const initialLanguage = currentConfig.language || 'javascript';
            const initialArgs = currentConfig.args || {};
            
            // If code is empty, generate from template
            let initialCode = currentConfig.code;
            if (!initialCode) {
                initialCode = generateCodeTemplate(initialLanguage, initialArgs);
            }

            setConfig({
                language: initialLanguage,
                args: initialArgs,
                code: initialCode,
                outputVar: currentConfig.outputVar || 'result'
            });

            if (!nodeExecutionData) {
                setExecutionResult(null);
            }
        }
    }, [selectedNode]);

    useEffect(() => {
        if (nodeExecutionData) {
            setExecutionResult({
                success: nodeExecutionData.status === 'SUCCESS',
                output: nodeExecutionData.outputs || nodeExecutionData.value || nodeExecutionData.data,
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

    const handleConfigChange = (key: string, value: any) => {
        let newConfig = { ...config, [key]: value };
        
        // Auto-fill code if switching language
        if (key === 'language') {
             // Simple heuristic: if code looks like the OTHER language's default, switch it
             // Or if it's empty.
             const isDefaultJS = config.code?.includes('function main');
             const isDefaultPy = config.code?.includes('def main');
             const isEmpty = !config.code || config.code.trim() === '';

             if (isEmpty || (value === 'python3' && isDefaultJS) || (value === 'javascript' && isDefaultPy)) {
                 newConfig.code = generateCodeTemplate(value, newConfig.args);
             }
        }

        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        updateNodeData(selectedNode.id, { label: e.target.value });
    };

    const handleArgChange = (key: string, value: string, oldKey?: string) => {
        const newArgs = { ...config.args };
        if (oldKey && oldKey !== key) {
            delete newArgs[oldKey];
        }
        newArgs[key] = value;
        
        // Should we regenerate code? Only if user hasn't heavily modified it maybe?
        // For now, let's NOT auto-regenerate code on arg change to avoid losing user work.
        // User can manually delete code to regenerate.
        
        const newConfig = { ...config, args: newArgs };
        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    const deleteArg = (key: string) => {
        const newArgs = { ...config.args };
        delete newArgs[key];
        const newConfig = { ...config, args: newArgs };
        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    const addArg = () => {
        const count = Object.keys(config.args || {}).length + 1;
        handleArgChange(`arg${count}`, '');
    };
    
    const regenerateCode = () => {
        if (confirm('This will overwrite your current code. Continue?')) {
            const newCode = generateCodeTemplate(config.language, config.args);
            handleConfigChange('code', newCode);
        }
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        try {
            const rawInputs = inputData.map(d => ({
                 nodeId: d.nodeId,
                 nodeName: d.nodeLabel, 
                 value: d.outputs
            }));

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'CODE',
                nodeData: config,
                inputs: rawInputs
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1250px] h-[85vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                 {/* Header */}
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                             <Terminal size={20} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900">Code Execution</h3>
                            <p className="text-xs text-slate-500">Run custom Javascript or Python scripts</p>
                         </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Body - 3 Column Split View */}
                <div className="flex flex-1 overflow-hidden">
                    
                     {/* COLUMN 1 - Left Sidebar */}
                     <div className="w-[280px] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50 shrink-0">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                 <Database size={12} />
                                 Available Variables
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
                                    e.dataTransfer.setData('text/plain', variablePath);
                                }}
                            />
                        </div>
                    </div>

                    {/* COLUMN 2 - Center Config */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200 min-w-[400px]">
                         <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Code size={12} />
                                Configuration
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Node Label</label>
                                <input 
                                    type="text" 
                                    value={label} 
                                    onChange={handleLabelChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="e.g., Process Data"
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Arguments Definition */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            Arguments
                                        </label>
                                        <button 
                                            onClick={addArg}
                                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                                        >
                                            <Plus size={12} /> Add Arg
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {Object.entries(config.args || {}).map(([argKey, argValue], idx) => (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <input 
                                                    type="text"
                                                    value={argKey}
                                                    onChange={(e) => handleArgChange(e.target.value, argValue as string, argKey)}
                                                    className="w-24 px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="argName"
                                                />
                                                <div className="flex-1 relative">
                                                     <input 
                                                        type="text"
                                                        value={argValue as string}
                                                        onChange={(e) => handleArgChange(argKey, e.target.value)}
                                                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                        placeholder="{{Node.value}}"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => deleteArg(argKey)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {Object.keys(config.args || {}).length === 0 && (
                                            <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-lg text-slate-400 text-xs">
                                                No arguments defined. Variables added here will be available in your code.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Language Selection */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                            Language
                                        </label>
                                        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                                            {['javascript', 'python3'].map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => handleConfigChange('language', lang)}
                                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase ${
                                                        config.language === lang 
                                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                         <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                            Output Variable
                                        </label>
                                         <input 
                                            type="text" 
                                            value={config.outputVar || 'result'} 
                                            onChange={(e) => handleConfigChange('outputVar', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-mono text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="result"
                                            readOnly 
                                            title="Always 'result' for main() function returns"
                                        />
                                    </div>
                                </div>

                                {/* Code Editor */}
                                <div className="space-y-1.5 flex-1 flex flex-col min-h-[300px]">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Code size={12} />
                                            Code Editor
                                        </label>
                                        <button 
                                            onClick={regenerateCode}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                        >
                                            <RefreshCw size={10} /> Reset Template
                                        </button>
                                    </div>
                                    <div className="flex-1 relative border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex flex-col bg-[#FAFAFA]">
                                        <textarea
                                            value={config.code || ''}
                                            onChange={(e) => handleConfigChange('code', e.target.value)}
                                            className="flex-1 w-full bg-[#FAFAFA] p-4 font-mono text-sm leading-6 resize-none focus:outline-none text-slate-800"
                                            placeholder="// Write your code here..."
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Footer */}
                         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center shrink-0 gap-3">
                             <button 
                                onClick={handleExecuteNode}
                                disabled={isExecuting}
                                className={`px-4 py-2 font-medium rounded-lg transition-all flex items-center gap-2 text-sm ${isExecuting ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                            >
                                {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                                {isExecuting ? 'Running...' : 'Run Code'}
                            </button>
                            <button 
                                onClick={() => setSelectedNode(null)}
                                className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* COLUMN 3 - Output */}
                    <div className="w-[350px] bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
                         <div className="flex border-b border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setActiveTab('output')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'output' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Output
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Logs
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50 relative p-4">
                             {executionResult ? (
                                activeTab === 'output' ? (
                                    <div className="bg-slate-50 min-h-full">
                                        <DataTreeViewer 
                                            data={executionResult.data || executionResult.output || executionResult} 
                                            truncate={true}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                         {executionResult.logs?.map((log: any, i: number) => (
                                             <div key={i} className="text-[10px] font-mono p-2 bg-white border border-slate-100 rounded">
                                                 <div className="flex justify-between text-slate-400 mb-1">
                                                     <span>{log.level}</span>
                                                     <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                 </div>
                                                 <div className="text-slate-700 break-words">{log.message}</div>
                                             </div>
                                         ))}
                                        {(!executionResult.logs || executionResult.logs.length === 0) && (
                                            <div className="text-slate-400 text-center italic text-xs mt-4">No logs available</div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <Terminal size={32} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No Execution Data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
