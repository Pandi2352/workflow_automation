import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    description?: string;
    variant?: ToastVariant;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
    message, 
    description,
    variant = 'success', 
    isVisible, 
    onClose, 
    duration = 3000 
}) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const variants = {
        success: {
            icon: Check,
            iconBg: 'bg-[#10b981]',
            iconColor: 'text-white',
        },
        error: {
            icon: AlertCircle,
            iconBg: 'bg-red-500',
            iconColor: 'text-white',
        },
        info: {
            icon: Info,
            iconBg: 'bg-blue-500',
            iconColor: 'text-white',
        }
    };

    const currentVariant = variants[variant];
    const Icon = currentVariant.icon;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 p-4 flex items-start gap-3 min-w-[320px] max-w-[400px]">
                <div className={`${currentVariant.iconBg} ${currentVariant.iconColor} p-1 rounded-full flex-shrink-0`}>
                    <Icon size={16} strokeWidth={3} />
                </div>
                
                <div className="flex-1 pt-0.5">
                    <h4 className="text-sm font-semibold text-slate-800 leading-none mb-1">
                        {message}
                    </h4>
                    {description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
