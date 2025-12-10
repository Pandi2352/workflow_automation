import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
    size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
    children, 
    variant = 'default',
    size = 'md'
}) => {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        outline: 'bg-white border border-slate-200 text-slate-600',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
    };

    return (
        <span className={`
            inline-flex items-center rounded-full font-medium
            ${variants[variant]}
            ${sizes[size]}
        `}>
            {children}
        </span>
    );
};
