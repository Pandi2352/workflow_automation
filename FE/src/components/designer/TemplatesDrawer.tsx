import React from 'react';
import { X, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface Template {
    id: string;
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    metadata?: {
        name: string;
        description: string;
    }
}

const INVOICE_TEMPLATE: Template = {
    id: 'invoice-processing',
    name: 'Intelligent Invoice Processing',
    description: 'Automate AP by extracting data from invoice emails and saving to DB.',
    metadata: {
        name: "Invoice Operations",
        description: "Automated invoice processing pipeline with OCR and Smart Extraction."
    },
    nodes: [
        {
            id: 'node_1',
            type: 'GMAIL',
            position: { x: 100, y: 100 },
            data: { 
                label: 'Watch Invoices', 
                config: { query: 'label:invoices' } 
            }
        },
        {
            id: 'node_2',
            type: 'OCR',
            position: { x: 100, y: 250 },
            data: { 
                label: 'Extract Text (OCR)', 
                config: { model: 'gemini-1.5-flash-001' } 
            }
        },
        {
            id: 'node_3',
            type: 'SMART_EXTRACTION',
            position: { x: 100, y: 400 },
            data: { 
                label: 'Parse Invoice Data', 
                config: { 
                    fields: ['invoice_number', 'vendor_name', 'date', 'total_amount', 'line_items'],
                    model: 'gemini-1.5-flash-001'
                } 
            }
        },
        {
            id: 'node_4',
            type: 'IF_ELSE',
            position: { x: 100, y: 550 },
            data: { 
                label: 'Check High Value', 
                config: { 
                    condition: 'total_amount > 1000' 
                } 
            }
        },
        {
            id: 'node_5',
            type: 'GMAIL',
            position: { x: -100, y: 700 },
            data: { 
                label: 'Email Manager', 
                config: { 
                    to: 'manager@example.com',
                    subject: 'High Value Invoice Approval Needed'
                } 
            }
        },
        {
            id: 'node_6',
            type: 'MONGODB',
            position: { x: 300, y: 700 },
            data: { 
                label: 'Save into Database', 
                config: { 
                    collection: 'invoices'
                } 
            }
        }
    ],
    edges: [
        { id: 'edge_1', source: 'node_1', target: 'node_2' },
        { id: 'edge_2', source: 'node_2', target: 'node_3' },
        { id: 'edge_3', source: 'node_3', target: 'node_4' },
        { id: 'edge_4', source: 'node_4', target: 'node_5', sourceHandle: 'true' }, // Assuming IF_ELSE has 'true' handle
        { id: 'edge_5', source: 'node_4', target: 'node_6', sourceHandle: 'false' }, // Assuming IF_ELSE has 'false' handle
    ]
};

interface TemplatesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TemplatesDrawer: React.FC<TemplatesDrawerProps> = ({ isOpen, onClose }) => {
    const { setNodes, setEdges, setWorkflowMetadata, setIsDirty } = useWorkflowStore();

    const loadTemplate = (template: Template) => {
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
                <div 
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
                    onClick={() => loadTemplate(INVOICE_TEMPLATE)}
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
                        {INVOICE_TEMPLATE.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        {INVOICE_TEMPLATE.description}
                    </p>
                    <div className="flex items-center text-[10px] font-medium text-slate-400 group-hover:text-indigo-500 transition-colors">
                        Click to load <ArrowRight size={12} className="ml-1" />
                    </div>
                </div>

                {/* Placeholder for future templates */}
                <div className="p-4 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center opacity-60">
                    <span className="text-sm font-medium text-slate-400">More coming soon...</span>
                    <p className="text-[10px] text-slate-400 mt-1">Ticket Auto-Triage, Price Monitoring, etc.</p>
                </div>
            </div>
        </div>
    );
};
