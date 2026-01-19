
import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Search, Globe, Settings2, Sliders } from 'lucide-react';
import { NodeHelpButton } from '../../common/NodeHelpButton';

export const NodeConfigPanel: React.FC = () => {
    const { updateNodeData, deleteNode, selectedNode, setSelectedNode } = useWorkflowStore();

    const [label, setLabel] = useState('');
    const [config, setConfig] = useState<any>({});

    useEffect(() => {
        if (selectedNode) {
            setLabel((selectedNode.data?.label as string) || 'Google Search Tool');
            const currentConfig = (selectedNode.data?.config as any) || {};
            setConfig({
                toolName: 'google_search',
                description: 'Search the web for current information',
                numResults: 5,
                gl: 'us',
                hl: 'en',
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
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                            <Globe size={22} />
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
                                placeholder="Tool Name"
                            />
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <Search size={10} /> Web Tool
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NodeHelpButton nodeType="GOOGLE_SEARCH_TOOL" />
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
                            <Settings2 size={16} className="text-amber-600" />
                            <h3 className="text-sm font-bold text-slate-900">Tool Identity</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Name</label>
                                <input
                                    type="text"
                                    value={config.toolName}
                                    onChange={(e) => handleConfigChange('toolName', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-all"
                                    placeholder="e.g. google_search"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description for AI</label>
                                <textarea
                                    value={config.description}
                                    onChange={(e) => handleConfigChange('description', e.target.value)}
                                    className="w-full h-24 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 transition-all resize-none"
                                    placeholder="Tell the AI when to use this tool..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Sliders size={16} className="text-amber-600" />
                            <h3 className="text-sm font-bold text-slate-900">Search Parameters</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Results</label>
                                    <span className="text-[10px] font-bold text-amber-600">{config.numResults}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={config.numResults}
                                    onChange={(e) => handleConfigChange('numResults', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country (GL)</label>
                                    <input
                                        type="text"
                                        value={config.gl}
                                        onChange={(e) => handleConfigChange('gl', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-all"
                                        placeholder="us"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language (HL)</label>
                                    <input
                                        type="text"
                                        value={config.hl}
                                        onChange={(e) => handleConfigChange('hl', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-all"
                                        placeholder="en"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (confirm('Delete this tool?')) {
                                deleteNode(selectedNode.id);
                                setSelectedNode(null);
                            }
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 tracking-tight"
                    >
                        DELETE TOOL
                    </button>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="px-6 py-2 bg-slate-900 rounded-xl text-xs font-bold text-white shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
};
