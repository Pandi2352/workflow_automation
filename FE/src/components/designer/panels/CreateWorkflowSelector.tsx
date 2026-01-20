import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

interface CreateWorkflowSelectorProps {
    onSelectAI: () => void;
    onSelectScratch: () => void;
    onClose: () => void;
}

export const CreateWorkflowSelector: React.FC<CreateWorkflowSelectorProps> = ({
    onSelectAI,
    onSelectScratch,
    onClose
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Create New Workflow</h2>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Grid */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AI Option */}
                    <button
                        onClick={onSelectAI}
                        className="group relative flex flex-col items-start p-6 bg-white border-2 border-slate-100 hover:border-indigo-500 rounded-2xl transition-all hover:shadow-xl hover:shadow-indigo-500/10 text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Build with AI</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Describe your objective and let our AI generate a complete, production-ready workflow for you.
                        </p>
                        <div className="mt-auto inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                            Start generating →
                        </div>
                    </button>

                    {/* Scratch Option */}
                    <button
                        onClick={onSelectScratch}
                        className="group relative flex flex-col items-start p-6 bg-white border-2 border-slate-100 hover:border-slate-300 rounded-2xl transition-all hover:shadow-lg text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-4 group-hover:bg-slate-200 transition-colors">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Start from Scratch</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Begin with a blank canvas and build your workflow node by node for maximum control.
                        </p>
                        <div className="mt-auto inline-flex items-center text-sm font-semibold text-slate-600 group-hover:translate-x-1 transition-transform">
                            Open canvas →
                        </div>
                    </button>
                </div>

                {/* Footer Tip */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={12} className="text-indigo-400" />
                        Tip: You can always use the AI assistant later inside the designer
                    </p>
                </div>
            </div>
        </div>
    );
};

