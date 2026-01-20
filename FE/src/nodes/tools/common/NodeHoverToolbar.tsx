import React from 'react';
import { Play, Power, Trash2, Copy } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';

interface NodeHoverToolbarProps {
    id: string;
    onExecute?: () => void;
    onDeactivate?: () => void;
    showExecute?: boolean;
    showDeactivate?: boolean;
    showDelete?: boolean;
    showDuplicate?: boolean;
}

export const NodeHoverToolbar: React.FC<NodeHoverToolbarProps> = ({
    id,
    onExecute,
    onDeactivate,
    showExecute = true,
    showDeactivate = true,
    showDelete = true,
    showDuplicate = true
}) => {
    const { deleteNode, duplicateNode, executeNode } = useWorkflowStore();

    return (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-2.5 pt-1 pb-5 bg-transparent opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-50 transition-all duration-200">
            <div className="flex items-center gap-3 px-2.5 py-1 bg-gray-80">
                {showExecute && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onExecute) onExecute();
                            else executeNode(id); 
                        }}
                        className="text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                        title="Execute Node"
                    >
                        <Play size={11} fill="currentColor" />
                    </button>
                )}
                {showDeactivate && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation();
                            if (onDeactivate) onDeactivate();
                            // Optional: Implement deactivate logic in store if needed
                        }}
                        className="text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                        title="Deactivate Node"
                    >
                        <Power size={11} />
                    </button>
                )}
                {showDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                        className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Node"
                    >
                        <Trash2 size={11} />
                    </button>
                )}
                {showDuplicate && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); duplicateNode(id); }}
                        className="text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
                        title="Duplicate Node"
                    >
                        <Copy size={11} />
                    </button>
                )}
            </div>
        </div>
    );
};
