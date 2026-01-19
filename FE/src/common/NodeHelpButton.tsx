import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { getDocForNode } from '../data/nodeDocumentation';

interface NodeHelpButtonProps {
    active?: boolean;
    onClick?: () => void;
    nodeType?: string;
    className?: string;
    title?: string;
}

export const NodeHelpButton: React.FC<NodeHelpButtonProps> = ({ 
    active = false, 
    onClick, 
    nodeType,
    className,
    title = "Node Documentation"
}) => {
    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (nodeType) {
            const doc = getDocForNode(nodeType);
            if (doc) {
                window.open(`/documentation?node=${doc.id}`, '_blank');
                return;
            }
        }
        
        if (onClick) {
            onClick();
        }
    };

    return (
        <button 
            onClick={handleAction}
            className={cn(
                "p-2 rounded-full transition-all duration-200 cursor-pointer",
                active 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100",
                className
            )}
            title={title}
        >
            <BookOpen size={20} className={cn(active && "animate-pulse")} />
        </button>
    );
};
