import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({ 
    checked, 
    onChange, 
    disabled = false, 
    label,
    size = 'md'
}) => {
    const toggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    // Size configurations - using standard tailwind sizing logic
    const sizes = {
        sm: {
            switch: 'w-8 h-4',
            circle: 'w-3 h-3',
            translate: checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        },
        md: {
            switch: 'w-10 h-6',
            circle: 'w-4 h-4',
            translate: checked ? 'translate-x-[20px]' : 'translate-x-1'
        }
    };

    const currentSize = sizes[size];

    return (
        <div 
            className={`flex items-center gap-2 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={toggle}
        >
            <div className={`
                relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
                ${currentSize.switch}
                ${checked ? 'bg-[#10b981]' : 'bg-slate-200 group-hover:bg-slate-300'}
            `}>
                <span className={`
                    bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out
                    ${currentSize.circle}
                    ${currentSize.translate}
                    pointer-events-none
                `} />
            </div>
            {label && (
                <span className={`text-sm font-medium select-none transition-colors ${checked ? 'text-slate-900' : 'text-slate-500'}`}>
                    {label}
                </span>
            )}
        </div>
    );
};
