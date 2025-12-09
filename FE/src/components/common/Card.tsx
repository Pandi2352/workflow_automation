import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
    children, 
    className = '', 
    noPadding = false,
    header,
    footer 
}) => {
    return (
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col ${className}`}>
            {header && (
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    {header}
                </div>
            )}
            
            <div className={`${!noPadding ? 'p-4' : ''} flex-1`}>
                {children}
            </div>

            {footer && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {footer}
                </div>
            )}
        </div>
    );
};
