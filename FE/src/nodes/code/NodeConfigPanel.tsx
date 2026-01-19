
import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Code, Database, Plus, RefreshCw, Terminal, Trash2, Settings, Zap, History, Sparkles, Bot, Send, BrainCircuit, Key, Box } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { GeminiCredentialModal } from '../../components/credentials/GeminiCredentialModal';
import { DataTreeViewer } from '../../common/DataTreeViewer';
import { NodeDataSidebar } from '../../components/designer/NodeDataSidebar';
import { cn } from '../../lib/utils';
// @ts-ignore
import Editor from 'react-simple-code-editor';
// @ts-ignore
import prism from 'prismjs';
// @ts-ignore
import 'prismjs/components/prism-javascript';
// @ts-ignore
import 'prismjs/components/prism-python';
// import 'prismjs/themes/prism-tomorrow.css';


// Helper to generate code template
const generateCodeTemplate = (language: string, args: Record<string, string>) => {
    const argNames = Object.keys(args).join(', ');
    
    if (language === 'python3') {
        const pyArgs = Object.keys(args).map(k => `${k}`).join(', ');
        return `def main(${pyArgs}):
    # Your logic here
    # Variables passed from Arguments are available as local variables
    
    result = "Hello " + str(${Object.keys(args)[0] || '""'})
    
    return {
        "result": result
    }
`;
    } else {
        return `async function main(${argNames}) {
    // Your logic here
    // Arguments are passed as function parameters
    
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
    const [activeTab, setActiveTab] = useState<'config' | 'editor' | 'ai' | 'output'>('config');
    
    // AI Assistant State
    const { fetchCredentials, credentials } = useWorkflowStore();
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiIdeas, setAiIdeas] = useState<string[]>([]);
    const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai', content: string, code?: string }[]>([]);
    const [userPrompt, setUserPrompt] = useState('');
    const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

    // Fetch credentials on mount
    useEffect(() => {
        fetchCredentials('GEMINI');
    }, [fetchCredentials]);

    const geminiCredentials = useMemo(() => {
        return credentials.filter((c: any) => c.provider === 'GEMINI');
    }, [credentials]);

    const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode) {
            const isNewNode = selectedNode.id !== prevSelectedId;
            
            if (isNewNode) {
                setLabel((selectedNode.data?.label as string) || '');
                setPrevSelectedId(selectedNode.id);
            }
            
            const currentConfig = (selectedNode.data?.config as any) || {};
            const initialLanguage = currentConfig.language || 'javascript';
            const initialArgs = currentConfig.args || {};
            
            // If code is empty, generate from template
            let initialCode = currentConfig.code;
            if (!initialCode) {
                initialCode = generateCodeTemplate(initialLanguage, initialArgs);
            }

            // Only update local config state if it's a new node or if we don't have code yet
            // This prevents overwriting the user's current typing in the editor
            if (isNewNode || !config.code) {
                setConfig({
                    language: initialLanguage,
                    args: initialArgs,
                    code: initialCode,
                    outputVar: currentConfig.outputVar || 'result'
                });
            }

            if (isNewNode) {
                if (!nodeExecutionData) {
                    setExecutionResult(null);
                }
                setActiveTab('config');
            }
        } else {
            setPrevSelectedId(null);
        }
    }, [selectedNode, prevSelectedId]);

    useEffect(() => {
        if (nodeExecutionData) {
            setExecutionResult({
                success: nodeExecutionData.status === 'SUCCESS',
                output: nodeExecutionData.outputs || nodeExecutionData.value || nodeExecutionData.data,
                logs: nodeExecutionData.logs,
                status: nodeExecutionData.status
            });
            if (nodeExecutionData.status) {
                setActiveTab('output');
            }
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

    const addArg = (name?: string, path?: string) => {
        const count = Object.keys(config.args || {}).length + 1;
        const argKey = name || `arg${count}`;
        handleArgChange(argKey, path || '');
    };
    
    const regenerateCode = () => {
        if (window.confirm('This will overwrite your current code. Continue?')) {
            const newCode = generateCodeTemplate(config.language, config.args);
            handleConfigChange('code', newCode);
        }
    };

    const handleExecuteNode = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setActiveTab('output');
        try {
            const rawInputs = inputData.map(d => ({
                 nodeId: d.nodeId,
                 nodeName: d.nodeLabel, 
                 value: d.outputs
            }));

            const response = await axiosInstance.post('/sample-workflows/nodes/test', {
                nodeType: 'CODE',
                nodeData: { ...config, forceProcess: true },
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

    // Drag & Drop into Editor logic
    const handleDropOnEditor = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
            // Data is in format "NodeLabel.field.subfield"
            const parts = data.split('.');
            const fieldPath = parts.slice(1).join('.');
            
            // Generate a clean variable name
            const cleanVarName = fieldPath.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '_') || 'inputVar';
            
            // Check if this path is already an mapped as an arg
            let existingArg = Object.entries(config.args).find(([_, path]) => path === `{{${data}}}`);
            let argName = existingArg ? existingArg[0] : cleanVarName;

            // If it doesn't exist, add it
            if (!existingArg) {
                // Ensure unique argName
                let finalArgName = argName;
                let counter = 1;
                while (config.args[finalArgName]) {
                    finalArgName = `${argName}_${counter++}`;
                }
                addArg(finalArgName, `{{${data}}}`);
                argName = finalArgName;
            }

            // Insert into editor at drop position (if possible) or just append
            const currentCode = config.code || '';
            const newCode = currentCode + (currentCode.endsWith('\n') ? '' : '\n') + `// Use ${argName} here\n`;
            handleConfigChange('code', newCode);
            setActiveTab('editor');
        }
    };

    // AI Assistant Logic
    const getAiIdeas = async () => {
        const selectedCred = credentials.find(c => c._id === config.credentialId) || geminiCredentials[0];
        if (!selectedCred) {
            setIsCredentialModalOpen(true);
            return;
        }

        setIsAiLoading(true);
        try {
            const context = inputData.map(d => `${d.nodeLabel}: ${JSON.stringify(d.outputs)}`).join('\n');
            const response = await axiosInstance.post('/sample-workflows/ai/assist', {
                type: 'SUGGEST_IDEAS',
                context,
                language: config.language,
                credentialId: config.credentialId || (geminiCredentials[0]?._id),
                modelName: config.modelName
            });
            setAiIdeas(response.data);
        } catch (error) {
            console.error('Failed to get AI ideas:', error);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiGenerate = async (prompt: string) => {
        const selectedCred = credentials.find(c => c._id === config.credentialId) || geminiCredentials[0];
        if (!selectedCred) {
            setIsCredentialModalOpen(true);
            return;
        }

        setAiChat(prev => [...prev, { role: 'user', content: prompt }]);
        setIsAiLoading(true);
        setUserPrompt('');
        
        try {
            const context = inputData.map(d => `${d.nodeLabel}: ${JSON.stringify(d.outputs)}`).join('\n');
            const response = await axiosInstance.post('/sample-workflows/ai/assist', {
                type: 'GENERATE_CODE',
                context,
                currentCode: config.code,
                prompt,
                language: config.language,
                credentialId: config.credentialId || (geminiCredentials[0]?._id),
                modelName: config.modelName
            });
            
            setAiChat(prev => [...prev, { 
                role: 'ai', 
                content: "I've generated the code based on your request. You can review and apply it below.",
                code: response.data.code
            }]);
        } catch (error) {
            setAiChat(prev => [...prev, { 
                role: 'ai', 
                content: "I'm sorry, I encountered an error while generating the code."
            }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Auto-fetch ideas when switching to AI tab
    useEffect(() => {
        if (activeTab === 'ai' && aiIdeas.length === 0) {
            getAiIdeas();
        }
    }, [activeTab]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 animate-in fade-in duration-200"
                onClick={() => setSelectedNode(null)}
            />
            
            {/* Sliding Panel Container */}
            <div className="relative z-50 h-full flex flex-row animate-in slide-in-from-right duration-300 mr-0">
                
                {/* Variable Sidebar (Left of Drawer) */}
                <div className="w-80 h-full bg-slate-50 border-r border-slate-200 shadow-2xl flex flex-col -mr-[1px]">
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

                {/* Main Drawer */}
                <div className="w-[600px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-100">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Code Execution</h3>
                                <p className="text-xs text-slate-600">Node ID: {selectedNode.id}</p>
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
                    <div className="flex border-b border-slate-100 px-4 bg-white relative z-10">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'config' 
                                    ? "border-indigo-500 text-indigo-600" 
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Settings size={14} />
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'editor' 
                                    ? "border-indigo-500 text-indigo-600" 
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Code size={14} />
                            Code Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'ai' 
                                    ? "border-indigo-500 text-indigo-600" 
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Sparkles size={14} className={activeTab === 'ai' ? "text-amber-500" : ""} />
                            AI Assistant
                        </button>
                        <button
                            onClick={() => setActiveTab('output')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'output' 
                                    ? "border-indigo-500 text-indigo-600" 
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <History size={14} />
                            Output & Logs
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-slate-50/30 flex flex-col">
                        {activeTab === 'config' && (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
                                {/* Node Label */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Node Label</label>
                                    <input 
                                        type="text" 
                                        value={label} 
                                        onChange={handleLabelChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="e.g., Data Processor"
                                    />
                                </div>

                                {/* Arguments Mapping */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Database size={12} />
                                            Arguments Mapping
                                        </label>
                                        <button 
                                            onClick={() => addArg()}
                                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                                        >
                                            <Plus size={12} /> Add Argument
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {Object.entries(config.args || {}).map(([argKey, argValue], idx) => (
                                            <div key={idx} className="flex gap-2 items-center group">
                                                <input 
                                                    type="text"
                                                    value={argKey}
                                                    onChange={(e) => handleArgChange(e.target.value, argValue as string, argKey)}
                                                    className="w-28 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    placeholder="arg_name"
                                                />
                                                <div className="flex-1 relative">
                                                     <input 
                                                        type="text"
                                                        value={argValue as string}
                                                        onChange={(e) => handleArgChange(argKey, e.target.value)}
                                                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                        placeholder="{{Node.value}}"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => deleteArg(argKey)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {Object.keys(config.args || {}).length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-500 text-xs italic font-medium">
                                                Drag variables from the left sidebar or click "+" to add arguments.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Language Switcher */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                        Execution Language
                                    </label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                                        {['javascript', 'python3'].map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => handleConfigChange('language', lang)}
                                                className={cn(
                                                    "px-6 py-1.5 text-xs font-bold rounded-md transition-all uppercase",
                                                    config.language === lang 
                                                        ? "bg-white text-indigo-600 shadow-sm" 
                                                        : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                {lang === 'python3' ? 'Python 3' : 'Node.js'}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                                        Note: Changing language will prompt to reset your code template.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                    {/* Introduction */}
                                    <div className="flex gap-4 items-start">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                                            <Bot size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-slate-900 mb-1">Code Assistant</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                I can help you write {config.language === 'python3' ? 'Python' : 'JavaScript'} code based on the data from previous nodes. What would you like to achieve?
                                            </p>
                                        </div>
                                    </div>

                                    {/* AI Settings (Credentials & Model) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Key size={12} /> Credentials
                                                </label>
                                                <button 
                                                    onClick={() => setIsCredentialModalOpen(true)}
                                                    className="text-[9px] text-indigo-600 font-bold hover:underline"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                            <select
                                                value={config.credentialId || ''}
                                                onChange={(e) => handleConfigChange('credentialId', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="">Select Key...</option>
                                                {geminiCredentials.map((cred: any) => (
                                                    <option key={cred._id} value={cred._id}>
                                                        {cred.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                <Box size={12} /> Model
                                            </label>
                                            <select
                                                value={config.modelName || 'gemini-1.5-flash'}
                                                onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <option value="gemini-1.5-flash">1.5 Flash</option>
                                                <option value="gemini-1.5-pro">1.5 Pro</option>
                                                <option value="gemini-2.5-flash">2.5 Flash</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Ideas Shelf */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <BrainCircuit size={12} />
                                                Suggested Ideas
                                            </label>
                                            <button 
                                                onClick={getAiIdeas} 
                                                disabled={isAiLoading}
                                                className="text-[10px] text-indigo-600 font-bold hover:underline disabled:opacity-50"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {isAiLoading && aiIdeas.length === 0 ? (
                                                Array(3).fill(0).map((_, i) => (
                                                    <div key={i} className="h-10 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
                                                ))
                                            ) : (
                                                aiIdeas.map((idea, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleAiGenerate(idea)}
                                                        disabled={isAiLoading}
                                                        className="text-left px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all group flex items-center justify-between"
                                                    >
                                                        <span>{idea}</span>
                                                        <Plus size={12} className="text-slate-300 group-hover:text-indigo-500" />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Chat History */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        {aiChat.map((msg, i) => (
                                            <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 mt-1", msg.role === 'user' ? "bg-slate-500" : "bg-indigo-600")}>
                                                    {msg.role === 'user' ? <Terminal size={12} /> : <Bot size={12} />}
                                                </div>
                                                <div className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                                                    <div className={cn(
                                                        "px-3 py-2 rounded-xl text-xs",
                                                        msg.role === 'user' ? "bg-slate-100 text-slate-800 rounded-tr-none" : "bg-indigo-50 text-indigo-900 rounded-tl-none"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                    {msg.code && (
                                                        <div className="mt-2 w-full bg-[#f6f8fa] border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                                            <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-200 bg-slate-50">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{config.language}</span>
                                                                <button 
                                                                    onClick={() => {
                                                                        handleConfigChange('code', msg.code);
                                                                        setActiveTab('editor');
                                                                    }}
                                                                    className="text-[9px] text-indigo-600 font-bold hover:underline py-0.5 px-2 rounded hover:bg-indigo-50"
                                                                >
                                                                    Apply Code
                                                                </button>
                                                            </div>
                                                            <pre className="p-3 text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                                                                {msg.code}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {isAiLoading && <div className="flex justify-center"><RefreshCw className="animate-spin text-indigo-400" size={20} /></div>}
                                </div>

                                {/* Chat Input */}
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="relative">
                                        <textarea
                                            value={userPrompt}
                                            onChange={(e) => setUserPrompt(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAiGenerate(userPrompt);
                                                }
                                            }}
                                            placeholder="Ask me to write code..."
                                            rows={2}
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                                        />
                                        <button 
                                            onClick={() => handleAiGenerate(userPrompt)}
                                            disabled={!userPrompt.trim() || isAiLoading}
                                            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-90"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'editor' && (
                            <div 
                                className="flex-1 flex flex-col p-4 overflow-hidden relative"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDropOnEditor}
                            >
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Code size={10} /> {config.language === 'python3' ? 'main.py' : 'index.js'}
                                    </span>
                                    <button 
                                        onClick={regenerateCode}
                                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold flex items-center gap-1"
                                    >
                                        <RefreshCw size={10} /> Reset Template
                                    </button>
                                </div>
                                <div className="flex-1 bg-[#f6f8fa] rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col group relative">
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <Editor
                                            value={config.code || ''}
                                            onValueChange={(code: string) => handleConfigChange('code', code)}
                                            highlight={(code: string) => prism.highlight(code, config.language === 'python3' ? prism.languages.python : prism.languages.javascript, config.language)}
                                            padding={20}
                                            style={{
                                                fontFamily: '"Fira Code", "Fira Mono", "Cascadia Code", monospace',
                                                fontSize: 13,
                                                minHeight: '100%',
                                                backgroundColor: 'transparent'
                                            }}
                                            className="prism-editor"
                                            placeholder="// Write your code here..."
                                        />
                                    </div>
                                    
                                    {/* Line mapping hint */}
                                    <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity">
                                        <div className="text-[10px] text-slate-400 space-y-1">
                                            {/* Could add line numbers here if manually calculated */}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-[10px] text-slate-500 font-medium italic flex items-center gap-2">
                                    <Zap size={10} className="text-yellow-500" />
                                    Tip: Drag variables from the left directly into the editor to auto-map them.
                                </div>
                            </div>
                        )}

                        {activeTab === 'output' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {executionResult ? (
                                    <div className="space-y-6">
                                        {/* Status Banner */}
                                        <div className={cn(
                                            "p-4 rounded-xl border border-l-4 shadow-sm",
                                            executionResult.success ? "bg-emerald-50 border-emerald-200 border-l-emerald-500" : "bg-red-50 border-red-200 border-l-red-500"
                                        )}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={cn("text-sm font-bold", executionResult.success ? "text-emerald-700" : "text-red-700")}>
                                                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                                    {executionResult.status}
                                                </span>
                                            </div>
                                            {executionResult.error && (
                                                <p className="text-xs text-red-600 mt-1 font-mono italic">{executionResult.error}</p>
                                            )}
                                        </div>

                                        {/* Data Viewer */}
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Output Result</span>
                                                <button 
                                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 uppercase font-bold"
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(executionResult.output, null, 2))}
                                                >
                                                    Copy JSON
                                                </button>
                                            </div>
                                            <div className="p-4 bg-white min-h-[100px]">
                                                <DataTreeViewer data={executionResult.output} truncate={false} />
                                            </div>
                                        </div>

                                        {/* Logs */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Console Logs</label>
                                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {executionResult.logs && executionResult.logs.length > 0 ? (
                                                    <div className="space-y-1.5 font-mono">
                                                        {executionResult.logs.map((log: any, i: number) => (
                                                            <div key={i} className="text-[11px] border-b border-white/5 pb-1 mb-1 last:border-0 last:mb-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className={cn(
                                                                        "text-[9px] font-bold px-1 rounded",
                                                                        log.level === 'ERROR' ? "bg-red-500 text-white" :
                                                                        log.level === 'WARN' ? "bg-yellow-500 text-black" : "bg-blue-500 text-white"
                                                                    )}>
                                                                        {log.level}
                                                                    </span>
                                                                    <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                                </div>
                                                                <div className="text-slate-300 break-words whitespace-pre-wrap">{log.message}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-6 text-center text-slate-500 text-xs italic">
                                                        No console output detected.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                        <Terminal size={48} className="mb-4 opacity-10" />
                                        <p className="text-sm font-medium">No Execution Data</p>
                                        <p className="text-xs opacity-60 mt-1">Run the code to see output and logs here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Action Bar */}
                    <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="px-6 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handleExecuteNode}
                            disabled={isExecuting}
                            className={cn(
                                "flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all",
                                isExecuting 
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:scale-[1.02] active:scale-95"
                            )}
                        >
                            {isExecuting ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                            {isExecuting ? 'Executing...' : 'Run & Test Code'}
                        </button>
                    </div>
                </div>
            </div>
            <GeminiCredentialModal 
                isOpen={isCredentialModalOpen}
                onClose={() => setIsCredentialModalOpen(false)}
                onSuccess={() => fetchCredentials('GEMINI')}
            />
        </div>
    );
};
