import React, { useState } from 'react';
import { Search, X, MousePointerClick, ChevronRight, HardDrive } from 'lucide-react';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

interface NodeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNodeSelect?: (type: string) => void;
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
    
    // Actions
    { type: 'GOOGLE_DRIVE', label: 'Google Drive', description: 'Interact with Google Drive', icon: HardDrive, color: 'text-green-600', category: 'action' },
];

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ isOpen, onClose, onNodeSelect }) => {
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
            {/* Transparent Backdrop for click-outside */}
            {isOpen && (
                <div 
                    className="absolute inset-0 z-40" 
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`absolute top-0 left-0 h-full w-[400px] bg-white border-r border-gray-300 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-semibold text-slate-800 text-lg">Add Node</h2>
                    <Button 
                        onClick={onClose}
                        variant="ghost"
                        className="p-1 h-auto text-slate-500 hover:text-slate-900"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <Input
                        placeholder="Search nodes..."
                        leftIcon={<Search size={18} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus={isOpen}
                        fullWidth
                    />
                </div>

                {/* Node List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {filteredNodes.length > 0 ? (
                        <div className="space-y-1">
                             {filteredNodes.map((node) => (
                                <div
                                    key={node.type}
                                    draggable
                                    onDragStart={(event) => onDragStart(event, node.type)}
                                    onClick={() => onNodeSelect?.(node.type)}
                                    className="group flex items-start gap-4 p-3 hover:bg-slate-50 rounded-lg cursor-pointer active:cursor-grabbing transition-colors duration-200"
                                >
                                    {/* Icon */}
                                    <div className="mt-1 text-slate-500 group-hover:text-slate-700 transition-colors">
                                        <node.icon size={24} strokeWidth={1.5} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                                            {node.label}
                                        </h3>
                                        <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                                            {node.description}
                                        </p>
                                    </div>

                                    {/* Right Arrow */}
                                    <div className="mt-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                                        <ChevronRight size={16} />
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
