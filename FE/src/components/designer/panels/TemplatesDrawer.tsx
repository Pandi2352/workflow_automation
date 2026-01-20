import React from 'react';
import { X, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
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
        <div className="fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-2xl border-r border-gray-100 flex flex-col animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <FileText size={20} className="text-indigo-600" />
                    <h2 className="font-bold text-slate-800">Templates</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={18} className="text-slate-500" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {WORKFLOW_TEMPLATES.map((template) => (
                <div 
                    key={template.id}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
                    onClick={() => loadTemplate(template)}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={20} />
                        </div>
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                           <CheckCircle2 size={10} /> Verified
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                        {template.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        {template.description}
                    </p>
                    <div className="flex items-center text-[10px] font-medium text-slate-400 group-hover:text-indigo-500 transition-colors">
                        Click to load <ArrowRight size={12} className="ml-1" />
                    </div>
                </div>
                ))}

                {/* Placeholder for future templates */}
                <div className="p-4 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center opacity-60">
                    <span className="text-sm font-medium text-slate-400">More coming soon...</span>
                    <p className="text-[10px] text-slate-400 mt-1">Ticket Auto-Triage, Price Monitoring, etc.</p>
                </div>
            </div>
        </div>
    );
};

