import React from 'react';
import { X, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from '../../../data/workflowTemplates';

interface TemplatesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TemplatesDrawer: React.FC<TemplatesDrawerProps> = ({ isOpen, onClose }) => {
    const { setNodes, setEdges, setWorkflowMetadata, setIsDirty } = useWorkflowStore();

    const loadTemplate = (template: WorkflowTemplate) => {
        if (confirm('Loading a template will replace your current workflow. Continue?')) {
            setNodes(template.nodes);
            setEdges(template.edges);
            
            if (template.metadata) {
                setWorkflowMetadata({
                    workflowName: template.metadata.name,
                    workflowDescription: template.metadata.description,
                    isWorkflowActive: true
                });
            }
            
            setIsDirty(true);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                .drawer-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .drawer-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .drawer-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .drawer-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>

            <div className="fixed inset-y-0 left-0 z-50 w-[360px] bg-white border-r border-slate-100 flex flex-col animate-in slide-in-from-left duration-300 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                <FileText size={18} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 tracking-tight leading-tight">
                                Library
                            </h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 font-medium tracking-tight px-0.5">
                        Select a blueprint to accelerate your automation workflow.
                    </p>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto px-0 py-2 drawer-scrollbar">
                    <div className="space-y-0">
                        {WORKFLOW_TEMPLATES.map((template) => (
                            <div 
                                key={template.id}
                                className="relative group flex items-start gap-4 px-6 py-4 hover:bg-emerald-50/30 border-l-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all duration-150"
                                onClick={() => loadTemplate(template)}
                            >
                                <div className="mt-0.5 shrink-0 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                    <FileText size={20} strokeWidth={1.5} />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-emerald-900 transition-colors">
                                            {template.name}
                                        </h3>
                                        {/* Status Tag */}
                                        <span className="text-[9px] font-bold bg-slate-100/80 group-hover:bg-emerald-100/50 text-slate-400 group-hover:text-emerald-600 px-1.5 py-0.5 rounded tracking-tighter uppercase transition-colors">
                                            Verified
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed pr-6 group-hover:text-emerald-700/70 line-clamp-2">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="mt-0.5 shrink-0 text-slate-300 group-hover:text-emerald-400 transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Separator / Future State */}
                    <div className="mx-6 h-px bg-slate-100 my-4" />
                    
                    <div className="px-6 py-4 opacity-60">
                         <div className="flex items-center gap-2 text-slate-300 mb-1">
                            <Sparkles size={14} />
                            <span className="text-[11px] font-semibold uppercase tracking-widest">Pipeline Expansion</span>
                         </div>
                         <p className="text-[10px] text-slate-400 italic">Advanced triage & monitoring modules coming soon.</p>
                    </div>
                </div>

                {/* Footer bar */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium">Verified by Antigravity v1.0</p>
                </div>
            </div>
        </>
    );
};
