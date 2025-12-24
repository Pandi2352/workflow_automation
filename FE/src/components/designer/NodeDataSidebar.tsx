import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DataTreeViewer } from '../../common/DataTreeViewer';

interface NodeDataSidebarProps {
    availableNodes: {
        nodeId: string;
        nodeName: string;
        data: any;
        status: string;
    }[];
    onDragStart: (e: React.DragEvent, variablePath: string) => void;
}




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
                                    <DataTreeViewer 
                                        data={node.data} 
                                        pathPrefix={`${node.nodeName}.outputs`} 
                                        onDragStart={onDragStart} 
                                        initiallyExpanded={true}
                                        truncate={true}
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
