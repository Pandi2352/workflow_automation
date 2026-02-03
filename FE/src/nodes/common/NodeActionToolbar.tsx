import React from 'react';
import { Play, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface NodeActionToolbarProps {
    nodeId: string;
    nodeLabel?: string;
    onExecute?: (event: React.MouseEvent) => void;
    onDelete?: (event: React.MouseEvent) => void;
    showExecute?: boolean;
    showDelete?: boolean;
    executeTitle?: string;
    deleteTitle?: string;
}

export const NodeActionToolbar: React.FC<NodeActionToolbarProps> = ({
    nodeId,
    nodeLabel,
    onExecute,
    onDelete,
    showExecute = true,
    showDelete = true,
    executeTitle = 'Test Node',
    deleteTitle = 'Delete Node',
}) => {
    const { executeNode, deleteNode } = useWorkflowStore();

    const handleExecute = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onExecute) {
            onExecute(event);
            return;
        }
        executeNode(nodeId);
    };

    const handleDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onDelete) {
            onDelete(event);
            return;
        }
        deleteNode(nodeId);
    };

    return (
        <div className="absolute bottom-full right-0 pb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white shadow-sm px-1 py-0.5">
                {showExecute && (
                    <button
                        onClick={handleExecute}
                        className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title={executeTitle}
                    >
                        <Play size={13} fill="currentColor" />
                    </button>
                )}
                {showDelete && (
                    <button
                        onClick={handleDelete}
                        className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title={deleteTitle}
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default NodeActionToolbar;
