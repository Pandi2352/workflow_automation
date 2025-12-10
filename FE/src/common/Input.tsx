import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ 
    label, 
    error, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    className = '', 
    ...props 
}, ref) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1.5`}>
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        {leftIcon}
                    </div>
                )}
                
                <input
                    ref={ref}
                    className={`
                        w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all
                        disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${error ? 'border-red-500 focus:ring-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
                
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
