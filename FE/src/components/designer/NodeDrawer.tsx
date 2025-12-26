import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight, Zap, Split, ArrowUpRight, Clock, FileText, Database, Cpu, BrainCircuit, Upload, Earth } from 'lucide-react';
import googleDriveIcon from '../../assets/nodeIcons/google-drive-svgrepo-com.svg';
import oneDriveIcon from '../../assets/nodeIcons/ms-onedrive-svgrepo-com.svg';
import gmailIcon from '../../assets/nodeIcons/gmail-icon-logo-svgrepo-com.svg';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

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
    // { type: 'input', label: 'Manual Trigger', description: 'Starts the workflow manually', icon: MousePointerClick, color: 'text-slate-600', category: 'TRIGGER' },
    { type: 'WEBHOOK', label: 'Webhook', description: 'Start workflow via HTTP request', icon: Zap, color: 'text-amber-500', category: 'TRIGGER' },
    { type: 'SCHEDULE', label: 'Schedule', description: 'Run workflow on a schedule', icon: Clock, color: 'text-purple-500', category: 'TRIGGER' },
    { type: 'GMAIL', label: 'Gmail', description: 'Fetch emails from Gmail', icon: ({size}: any) => <img src={gmailIcon} style={{width: size, height: size}} />, color: 'text-red-600', category: 'TRIGGER' },
    { type: 'GOOGLE_DRIVE', label: 'Google Drive', description: 'Interact with Google Drive', icon: ({size}: any) => <img src={googleDriveIcon} style={{width: size, height: size}} />, color: 'text-green-600', category: 'TRIGGER' },
    { type: 'ONEDRIVE', label: 'OneDrive', description: 'Interact with Microsoft OneDrive', icon: ({size}: any) => <img src={oneDriveIcon} style={{width: size, height: size}} />, color: 'text-blue-600', category: 'TRIGGER' },
    { type: 'FILE_UPLOAD', label: 'File Upload', description: 'Upload a file manually', icon: Upload, color: 'text-blue-500', category: 'TRIGGER' },

    // Actions
    // { type: 'GOOGLE_DRIVE', label: 'Google Drive', description: 'Interact with Google Drive', icon: ({size}: any) => <img src={googleDriveIcon} style={{width: size, height: size}} />, color: 'text-green-600', category: 'ACTION' },
    // { type: 'ONEDRIVE', label: 'OneDrive', description: 'Interact with Microsoft OneDrive', icon: ({size}: any) => <img src={oneDriveIcon} style={{width: size, height: size}} />, color: 'text-blue-600', category: 'ACTION' },
    
    // Logic/Conditional
    { type: 'IF_ELSE', label: 'If / Else', description: 'Branch workflow based on conditions', icon: Split, color: 'text-indigo-500', category: 'CONDITIONAL' },

    // AI / ML
    { type: 'OCR', label: 'OCR Processing', description: 'Extract text using Gemini AI', icon: FileText, color: 'text-indigo-600', category: 'ACTION' },
    { type: 'PARSING', label: 'AI Parsing', description: 'Extract structured data', icon: Cpu, color: 'text-indigo-600', category: 'ACTION' },
    { type: 'SUMMARIZE', label: 'Summarize', description: 'Generate text summaries', icon: FileText, color: 'text-violet-600', category: 'ACTION' },

    { type: 'SMART_EXTRACTION', label: 'Smart Extract', description: 'Extract specific data points from documents', icon: BrainCircuit, color: 'text-indigo-600', category: 'ACTION' },
    { type: 'MONGODB', label: 'MongoDB', description: 'Store data for review', icon: Database, color: 'text-green-600', category: 'ACTION' },
    { type: 'BROWSER_SCRAPER', label: 'Web Scraper', description: 'Fetch and extract data from URLs', icon: Earth, color: 'text-indigo-500', category: 'ACTION' },
    
    // Export
    { type: 'HTTP_REQUEST', label: 'HTTP Request', description: 'Send data to external API', icon: ArrowUpRight, color: 'text-cyan-500', category: 'EXPORT' },
    
    // Logic/Data
    { type: 'DATA_MAPPER', label: 'Data Mapper', description: 'Transform data between nodes', icon: Split, color: 'text-pink-500', category: 'CONDITIONAL' },
];

const categoryLabels: Record<NodeCategory, string> = {
    'TRIGGER': 'Trigger Nodes',
    'ACTION': 'Action Nodes',
    'CONDITIONAL': 'Conditional Logic',
    'EXPORT': 'Export / Output'
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
        
        // Initialize order
        const order: NodeCategory[] = ['TRIGGER', 'ACTION', 'CONDITIONAL', 'EXPORT'];
        
        filtered.forEach(node => {
            if (!groups[node.category]) {
                groups[node.category] = [];
            }
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
            {/* Transparent Backdrop for click-outside */}
            {isOpen && (
                <div 
                    className="absolute inset-0 z-40" 
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`absolute top-0 left-0 h-full w-[380px] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg tracking-tight">Add Node</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Drag to canvas</p>
                    </div>
                    <Button 
                        onClick={onClose}
                        variant="ghost"
                        className="p-1.5 h-auto text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full"
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <Input
                        placeholder="Search nodes..."
                        leftIcon={<Search size={16} />}
                        rightIcon={searchTerm ? (
                            <button 
                                onClick={() => setSearchTerm('')} 
                                className="hover:text-slate-700 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        ) : null}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus={isOpen}
                        fullWidth
                        className="!py-2 !text-sm shadow-sm"
                    />
                </div>

                {/* Node List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {groupedNodes.length > 0 ? (
                        <div className="space-y-5 mt-2">
                             {groupedNodes.map((group) => (
                                <div key={group.category}>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        {group.label}
                                    </h3>
                                    <div className="space-y-2">
                                        {group.nodes.map((node) => (
                                            <div
                                                key={node.type}
                                                draggable
                                                onDragStart={(event) => onDragStart(event, node.type)}
                                                onClick={() => onNodeSelect?.(node.type)}
                                                className="group flex items-center gap-3 p-2.5 bg-white border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200"
                                            >
                                                {/* Icon */}
                                                <div className={`p-2 rounded-md bg-slate-50 group-hover:bg-white transition-colors border border-slate-100/50 group-hover:border-slate-200 ${node.color}`}>
                                                    <node.icon size={20} strokeWidth={1.5} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-700 mb-0.5 group-hover:text-slate-900 transition-colors">
                                                        {node.label}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-1 group-hover:text-slate-500">
                                                        {node.description}
                                                    </p>
                                                </div>

                                                {/* Right Actions */}
                                                <div className="text-slate-300 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
                                                     <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <Search size={40} strokeWidth={1} className="text-slate-200 mb-3" />
                            <p className="font-medium text-slate-600 text-sm">No nodes found</p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Drag & Drop available</p>
                </div>
            </div>
        </>
    );
};
