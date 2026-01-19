
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, BrainCircuit, Sparkles, Key, Settings2, RefreshCw } from 'lucide-react';
import { NodeHelpButton } from '../../common/NodeHelpButton';

export const NodeConfigPanel: React.FC<{ nodeExecutionData?: any }> = () => {
    const { updateNodeData, deleteNode, selectedNode, setSelectedNode } = useWorkflowStore();

    const [label, setLabel] = useState('');
    const [config, setConfig] = useState<any>({});

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || 'Gemini Model');
            const currentConfig = (selectedNode.data?.config as any) || {};
            setConfig({
                modelName: 'gemini-2.5-flash',
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.95,
                topK: 40,
                ...currentConfig
            });
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        updateNodeData(selectedNode.id, { config: newConfig });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none">
            <div className="w-[450px] h-full bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <BrainCircuit size={22} />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => {
                                    setLabel(e.target.value);
                                    updateNodeData(selectedNode.id, { label: e.target.value });
                                }}
                                className="text-sm font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                                placeholder="Model Name"
                            />
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} /> Chat Model
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="GEMINI_MODEL" />
                        <button 
                            onClick={() => setSelectedNode(null)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Settings2 size={16} className="text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-900">Model Configuration</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Model Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</label>
                                <select
                                    value={config.modelName}
                                    onChange={(e) => handleConfigChange('modelName', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                </select>
                            </div>

                            {/* Temperature */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temperature</label>
                                    <span className="text-[10px] font-bold text-blue-600">{config.temperature}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={config.temperature}
                                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                    <span>Focused</span>
                                    <span>Creative</span>
                                </div>
                            </div>

                            {/* Authentication */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Key size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authentication</span>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">API Key</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={config.apiKey || ''}
                                            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                                            placeholder="Enter Gemini API Key..."
                                        />
                                        <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-tight">
                                        Direct API key usage. For production, consider using standard credentials.
                                    </p>
                                </div>

                                <button className="w-full py-2 px-4 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                                    <RefreshCw size={12} /> SELECT CREDENTIALS
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-blue-800 leading-relaxed font-medium">
                            Connect this node to an <span className="font-bold">AI Agent</span> or <span className="font-bold">Summarize</span> node to provide the underlying intelligence for your workflow.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (confirm('Delete this model node?')) {
                                deleteNode(selectedNode.id);
                                setSelectedNode(null);
                            }
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 tracking-tight"
                    >
                        DELETE NODE
                    </button>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="px-6 py-2 bg-slate-900 rounded-xl text-xs font-bold text-white shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};
