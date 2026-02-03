import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight, Zap, Split, ArrowUpRight, Clock, FileText, Database, Cpu, BrainCircuit, Upload, Type, Terminal, Mail, Rss, Sparkles, Globe } from 'lucide-react';
import googleDriveIcon from '../../../assets/nodeIcons/google-drive-svgrepo-com.svg';
import oneDriveIcon from '../../../assets/nodeIcons/ms-onedrive-svgrepo-com.svg';
import gmailIcon from '../../../assets/nodeIcons/gmail-icon-logo-svgrepo-com.svg';
import { cn } from '../../../lib/utils';

interface NodeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNodeSelect?: (type: string) => void;
}

type NodeCategory = 'TRIGGER' | 'ACTION' | 'CONDITIONAL' | 'EXPORT';

interface NodeType {
    type: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    category: NodeCategory;
}

const availableNodes: NodeType[] = [
    // Triggers
    { type: 'WEBHOOK', label: 'Webhook', description: 'Start workflow via HTTP request', icon: Zap, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'RSS', label: 'RSS Feed', description: 'Fetch items from an RSS feed', icon: Rss, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'SCHEDULE', label: 'Schedule', description: 'Run workflow on a schedule', icon: Clock, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'GMAIL', label: 'Gmail', description: 'Fetch emails from Gmail', icon: ({size}: any) => <img src={gmailIcon} style={{width: size, height: size, filter: 'grayscale(100%)', opacity: 0.6}} />, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'OUTLOOK', label: 'Outlook', description: 'Fetch emails from Outlook', icon: Mail, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'GOOGLE_DRIVE', label: 'Google Drive', description: 'Interact with Google Drive', icon: ({size}: any) => <img src={googleDriveIcon} style={{width: size, height: size, filter: 'grayscale(100%)', opacity: 0.6}} />, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'ONEDRIVE', label: 'OneDrive', description: 'Interact with Microsoft OneDrive', icon: ({size}: any) => <img src={oneDriveIcon} style={{width: size, height: size, filter: 'grayscale(100%)', opacity: 0.6}} />, color: 'text-slate-400', category: 'TRIGGER' },
    { type: 'FILE_UPLOAD', label: 'File Upload', description: 'Upload a file manually', icon: Upload, color: 'text-slate-400', category: 'TRIGGER' },

    // Logic/Conditional
    { type: 'IF_ELSE', label: 'If / Else', description: 'Branch workflow based on conditions', icon: Split, color: 'text-slate-400', category: 'CONDITIONAL' },

    // Actions
    { type: 'OCR', label: 'OCR Processing', description: 'Extract text using Gemini AI', icon: FileText, color: 'text-slate-400', category: 'ACTION' },
    { type: 'TESSERACT_OCR', label: 'Tesseract OCR', description: 'Open-source standard OCR', icon: Type, color: 'text-slate-400', category: 'ACTION' },
    { type: 'PARSING', label: 'AI Parsing', description: 'Extract structured data', icon: Cpu, color: 'text-slate-400', category: 'ACTION' },
    { type: 'SUMMARIZE', label: 'Summarize', description: 'Generate text summaries', icon: FileText, color: 'text-slate-400', category: 'ACTION' },
    { type: 'SMART_EXTRACTION', label: 'Smart Extract', description: 'Extract specific data points', icon: BrainCircuit, color: 'text-slate-400', category: 'ACTION' },
    { type: 'AI_AGENT', label: 'AI Agent', description: 'Autonomous agent that can use tools', icon: Sparkles, color: 'text-slate-400', category: 'ACTION' },
    { type: 'EMAIL_TEMPLATE', label: 'Email Template', description: 'Generate AI subject and body', icon: Mail, color: 'text-slate-400', category: 'ACTION' },
    { type: 'GEMINI_MODEL', label: 'Gemini Model', description: 'Google Gemini Chat Model', icon: Cpu, color: 'text-slate-400', category: 'ACTION' },
    { type: 'GOOGLE_SEARCH_TOOL', label: 'Google Search Tool', description: 'Give web search capability to AI Agents', icon: Globe, color: 'text-slate-400', category: 'ACTION' },
    { type: 'MONGODB', label: 'MongoDB', description: 'Store data for review', icon: Database, color: 'text-slate-400', category: 'ACTION' },
    
    // Export
    { type: 'HTTP_REQUEST', label: 'HTTP Request', description: 'Send data to external API', icon: ArrowUpRight, color: 'text-slate-400', category: 'EXPORT' },
    
    // Logic/Data
    { type: 'CODE', label: 'Code Execution', description: 'Run custom Javascript / Python', icon: Terminal, color: 'text-slate-400', category: 'CONDITIONAL' },
];

const categoryLabels: Record<NodeCategory, string> = {
    'TRIGGER': 'Triggers',
    'ACTION': 'Actions',
    'CONDITIONAL': 'Logic',
    'EXPORT': 'Connections'
};

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose, onNodeSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const groupedNodes = useMemo(() => {
        const filtered = availableNodes.filter(node => 
            node.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
            node.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups: Partial<Record<NodeCategory, NodeType[]>> = {};
        const order: NodeCategory[] = ['TRIGGER', 'ACTION', 'CONDITIONAL', 'EXPORT'];
        
        filtered.forEach(node => {
            if (!groups[node.category]) groups[node.category] = [];
            groups[node.category]?.push(node);
        });

        return order.map(cat => ({
            category: cat,
            label: categoryLabels[cat],
            nodes: groups[cat] || []
        })).filter(group => group.nodes.length > 0);
    }, [searchTerm]);

    return (
        <>
            <style>{`
                .node-drawer-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .node-drawer-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .node-drawer-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .node-drawer-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
            
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 transition-all duration-300" 
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "fixed top-0 left-0 h-full w-[360px] bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.02)]",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                            What happens next?
                        </h2>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={14} />
                        <input
                            placeholder="Search nodes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400/30 focus:border-slate-400/50 transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto px-0 py-2 node-drawer-scrollbar">
                    {groupedNodes.map((group) => (
                        <div key={group.category} className="mb-2">
                            <div className="space-y-0">
                                {group.nodes.map((node) => (
                                    <div
                                        key={node.type}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, node.type)}
                                        onClick={() => onNodeSelect?.(node.type)}
                                        className="relative group flex items-start gap-4 px-6 py-3 hover:bg-emerald-50/30 border-l-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all duration-150"
                                    >
                                        <div className="mt-0.5 shrink-0 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                            <node.icon size={20} strokeWidth={1.5} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-emerald-900 transition-colors">
                                                {node.label}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed pr-6 group-hover:text-emerald-700/70">
                                                {node.description}
                                            </p>
                                        </div>

                                        <div className="mt-0.5 shrink-0 text-slate-300 group-hover:text-emerald-400 transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mx-6 h-px bg-slate-100 my-2" />
                        </div>
                    ))}

                    {groupedNodes.length === 0 && (
                        <div className="px-6 py-10 text-center">
                            <p className="text-xs text-slate-400 font-medium">No results found for "{searchTerm}"</p>
                        </div>
                    )}
                </div>
                
                {/* Fixed bottom helper */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                        Drag items to the canvas to add them to your flow.
                    </p>
                </div>
            </div>
        </>
    );
};
