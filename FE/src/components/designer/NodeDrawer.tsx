import React, { useState } from 'react';
import { Search, X, MousePointerClick, Clock, Webhook, FileText, ArrowRight, Globe } from 'lucide-react';

interface NodeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NodeType {
    type: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    category: 'trigger' | 'action' | 'logic';
}

const availableNodes: NodeType[] = [
    // Triggers
    { type: 'input', label: 'Manual Trigger', description: 'Starts the workflow manually', icon: MousePointerClick, color: 'text-slate-600', category: 'trigger' },
    { type: 'webhook', label: 'Webhook', description: 'Starts when URL is called', icon: Webhook, color: 'text-slate-600', category: 'trigger' },
    { type: 'schedule', label: 'Schedule', description: 'Runs at specific intervals', icon: Clock, color: 'text-green-600', category: 'trigger' },
    
    // Actions
    { type: 'api', label: 'HTTP Request', description: 'Call any API', icon: Globe, color: 'text-blue-500', category: 'action' },
    { type: 'output', label: 'Respond to Webhook', description: 'Return data to caller', icon: ArrowRight, color: 'text-slate-600', category: 'action' },
    
    // Logic/Transform
    { type: 'transform', label: 'Code', description: 'Run JavaScript code', icon: FileText, color: 'text-orange-500', category: 'logic' },
];

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredNodes = availableNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="absolute inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`absolute top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-semibold text-slate-800 text-lg">Add Node</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus={isOpen}
                        />
                    </div>
                </div>

                {/* Node List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {filteredNodes.length > 0 ? (
                        <div className="space-y-2">
                             {filteredNodes.map((node) => (
                                <div
                                    key={node.type}
                                    className="p-3 bg-white border border-transparent hover:border-[#10b981] hover:shadow-md rounded-lg cursor-grab active:cursor-grabbing group transition-all flex items-start gap-4"
                                    onDragStart={(event) => onDragStart(event, node.type)}
                                    draggable
                                >
                                    <div className={`mt-1 p-2 bg-slate-50 rounded-md group-hover:bg-[#10b981]/10 transition-colors`}>
                                        <node.icon size={20} className={`${node.color} group-hover:text-[#10b981] transition-colors`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{node.label}</h3>
                                        <p className="text-xs text-slate-500">{node.description}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p>No nodes found</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
