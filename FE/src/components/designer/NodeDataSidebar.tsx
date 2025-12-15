import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Box, Type, Hash, Calendar, ToggleLeft, MoreHorizontal, Copy, Search } from 'lucide-react';

interface NodeDataSidebarProps {
    availableNodes: {
        nodeId: string;
        nodeName: string;
        data: any;
        status: string;
    }[];
    onDragStart: (e: React.DragEvent, variablePath: string) => void;
}

const getTypeIcon = (value: any) => {
    if (value === null || value === undefined) return <MoreHorizontal size={12} className="text-gray-400" />;
    if (typeof value === 'string') return <Type size={12} className="text-green-600" />;
    if (typeof value === 'number') return <Hash size={12} className="text-blue-600" />;
    if (typeof value === 'boolean') return <ToggleLeft size={12} className="text-orange-600" />;
    if (value instanceof Date) return <Calendar size={12} className="text-purple-600" />;
    if (Array.isArray(value)) return <Box size={12} className="text-indigo-600" />;
    if (typeof value === 'object') return <Box size={12} className="text-indigo-600" />;
    return <Box size={12} className="text-gray-400" />;
};

const JsonTreeNode: React.FC<{
    name: string;
    value: any;
    path: string;
    level?: number;
    onDragStart: (e: React.DragEvent, path: string) => void;
}> = ({ name, value, path, level = 0, onDragStart }) => {
    const [isExpanded, setIsExpanded] = useState(false); // Default collapsed for array items/objects
    const [isHovered, setIsHovered] = useState(false);

    const isObject = value !== null && typeof value === 'object';
    const isEmpty = isObject && Object.keys(value).length === 0;

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', `{{${path}}}`);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(e, `{{${path}}}`);
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    if (isObject && !isEmpty) {
        return (
            <div className="select-none">
                <div 
                    className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-slate-100 group transition-colors ${isHovered ? 'bg-slate-50' : ''}`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={toggleExpand}
                    draggable
                    onDragStart={handleDragStart}
                >
                    <button onClick={toggleExpand} className="p-0.5 rounded hover:bg-slate-200 text-slate-500">
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
                        {Array.isArray(value) ? '[]' : '{}'}
                    </span>
                    <span className="text-xs font-medium text-slate-700 font-mono group-hover:text-indigo-600">
                        {name}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                         Drag to use
                    </span>
                </div>
                
                {isExpanded && (
                    <div className="border-l border-slate-200 ml-4">
                        {Object.entries(value).map(([key, val]) => (
                             <JsonTreeNode
                                key={key}
                                name={key}
                                value={val}
                                path={`${path}${Array.isArray(value) ? `[${key}]` : `.${key}`}`} // Handle array index syntax vs object dot notation
                                level={level + 1}
                                onDragStart={onDragStart}
                             />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            className="flex items-center gap-2 py-1 px-2 rounded cursor-grab hover:bg-indigo-50 group transition-colors active:cursor-grabbing"
            style={{ paddingLeft: `${level * 12 + 20}px` }}
            draggable
            onDragStart={handleDragStart}
        >
             <div className="shrink-0 opacity-70 group-hover:opacity-100">
                {getTypeIcon(value)}
             </div>
             <span className="text-xs font-medium text-slate-700 font-mono group-hover:text-indigo-700 truncate max-w-[120px]">
                {name}
             </span>
             <span className="text-[10px] text-slate-400 truncate max-w-[100px] group-hover:text-indigo-500">
                {String(value).substring(0, 30)}
             </span>
        </div>
    );
};


export const NodeDataSidebar: React.FC<NodeDataSidebarProps> = ({ availableNodes, onDragStart }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNodes = availableNodes.filter(node => 
        node.nodeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-full overflow-hidden">
             {/* Header */}
             <div className="p-3 border-b border-slate-200 bg-white shrink-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Previous Outputs
                </h3>
                <div className="relative">
                    <Search className="absolute left-2 top-1.5 text-slate-400" size={12} />
                    <input 
                        type="text" 
                        placeholder="Filter variables..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                {filteredNodes.length === 0 ? (
                    <div className="text-center text-slate-400 py-10">
                        <span className="text-xs">No data available</span>
                    </div>
                ) : (
                    filteredNodes.map(node => (
                        <div key={node.nodeId} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-2 last:mb-0">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">{node.nodeName}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                    node.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                    node.status === 'NOT_Run' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {node.status}
                                </span>
                            </div>
                            <div className="p-1">
                                {node.data ? (
                                    <JsonTreeNode 
                                        name="output" 
                                        value={node.data} 
                                        path={`${node.nodeName}.output`} // Start path: NodeName.output
                                        onDragStart={onDragStart} 
                                    />
                                ) : (
                                    <div className="p-2 text-center">
                                        <span className="text-[10px] text-slate-300 italic">Empty output</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
