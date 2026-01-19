import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface DocumentationButtonProps {
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    label?: string;
}

export const DocumentationButton: React.FC<DocumentationButtonProps> = ({ onClick, className, label = "Read Doc" }) => {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black uppercase tracking-widest text-[10px] gap-2 border border-indigo-100/50 rounded-xl px-4",
                className
            )}
            leftIcon={<BookOpen size={14} className="group-hover:scale-110 transition-transform" />}
        >
            {label}
        </Button>
    );
};
