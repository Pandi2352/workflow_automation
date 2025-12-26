import React from 'react';
import { Sparkles, FileText } from 'lucide-react';

interface CreateWorkflowSelectorProps {
    onSelectAi: () => void;
    onSelectScratch: () => void;
}

export const CreateWorkflowSelector: React.FC<CreateWorkflowSelectorProps> = ({
    onSelectAi,
    onSelectScratch
}) => {
    return (
        <div className="fixed inset-0 z-[60] bg-white overflow-hidden flex items-center justify-center">
            <div className="max-w-4xl w-full px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create New Workflow</h2>
                    <p className="text-slate-500">Choose how you want to start building your automation.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Try AI Workflow */}
                    <button
                        onClick={onSelectAi}
                        className="group relative flex flex-col items-center justify-center p-16 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
                            <Sparkles size={40} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Try an AI workflow</h3>
                        <p className="text-sm text-slate-500 max-w-[240px]">Describe your needs in plain English and let AI build it for you.</p>
                    </button>

                    {/* Start from Scratch */}
                    <button
                        onClick={onSelectScratch}
                        className="group relative flex flex-col items-center justify-center p-16 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-slate-500/10 hover:border-slate-300 transition-all duration-300 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-110 group-hover:bg-slate-100 transition-all duration-300">
                            <FileText size={40} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Start from scratch</h3>
                        <p className="text-sm text-slate-500 max-w-[240px]">Begin with a clean canvas and build your workflow manually.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};
