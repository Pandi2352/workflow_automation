import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer,
    size = 'md'
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            <div className={`
                relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all
                flex flex-col max-h-[90vh]
            `}>
                {(title || true) && (
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="p-4 overflow-y-auto">
                    {children}
                </div>

                {footer && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-lg flex justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
