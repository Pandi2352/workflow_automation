import { Handle, Position } from '@xyflow/react';
import { cn } from '../../../lib/utils';
import { NodeActionToolbar } from '../../common/NodeActionToolbar';

type ExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | undefined;

type AccentStyle = {
    border: string;
    hoverBorder: string;
    ring: string;
    shadow: string;
    text: string;
    bg: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    iconBg: string;
    fill: string;
};

const ACCENTS: Record<string, AccentStyle> = {
    emerald: {
        border: 'border-emerald-500',
        hoverBorder: 'hover:border-emerald-400',
        ring: 'ring-emerald-50',
        shadow: 'shadow-emerald-200',
        text: 'text-emerald-600',
        bg: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-100',
        badgeText: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        fill: 'fill-emerald-500',
    },
    blue: {
        border: 'border-blue-500',
        hoverBorder: 'hover:border-blue-400',
        ring: 'ring-blue-50',
        shadow: 'shadow-blue-200',
        text: 'text-blue-600',
        bg: 'bg-blue-500',
        badgeBg: 'bg-blue-50',
        badgeBorder: 'border-blue-100',
        badgeText: 'text-blue-600',
        iconBg: 'bg-blue-50',
        fill: 'fill-blue-500',
    },
    red: {
        border: 'border-red-500',
        hoverBorder: 'hover:border-red-400',
        ring: 'ring-red-50',
        shadow: 'shadow-red-200',
        text: 'text-red-600',
        bg: 'bg-red-500',
        badgeBg: 'bg-red-50',
        badgeBorder: 'border-red-100',
        badgeText: 'text-red-600',
        iconBg: 'bg-red-50',
        fill: 'fill-red-500',
    },
    indigo: {
        border: 'border-indigo-500',
        hoverBorder: 'hover:border-indigo-400',
        ring: 'ring-indigo-50',
        shadow: 'shadow-indigo-200',
        text: 'text-indigo-600',
        bg: 'bg-indigo-500',
        badgeBg: 'bg-indigo-50',
        badgeBorder: 'border-indigo-100',
        badgeText: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        fill: 'fill-indigo-500',
    },
    amber: {
        border: 'border-amber-500',
        hoverBorder: 'hover:border-amber-400',
        ring: 'ring-amber-50',
        shadow: 'shadow-amber-200',
        text: 'text-amber-600',
        bg: 'bg-amber-500',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-100',
        badgeText: 'text-amber-600',
        iconBg: 'bg-amber-50',
        fill: 'fill-amber-500',
    },
    orange: {
        border: 'border-orange-500',
        hoverBorder: 'hover:border-orange-400',
        ring: 'ring-orange-50',
        shadow: 'shadow-orange-200',
        text: 'text-orange-600',
        bg: 'bg-orange-500',
        badgeBg: 'bg-orange-50',
        badgeBorder: 'border-orange-100',
        badgeText: 'text-orange-600',
        iconBg: 'bg-orange-50',
        fill: 'fill-orange-500',
    },
};

export interface TriggerNodeBaseProps {
    id: string;
    label: string;
    badgeText: string;
    icon: React.ReactNode;
    accent?: keyof typeof ACCENTS;
    selected?: boolean;
    isConnectable?: boolean;
    executionStatus?: ExecutionStatus;
    detailText?: string;
}

export const TriggerNodeBase = ({
    id,
    label,
    badgeText,
    icon,
    accent = 'orange',
    selected,
    isConnectable,
    executionStatus,
    detailText,
}: TriggerNodeBaseProps) => {
    const accentStyle = ACCENTS[accent] || ACCENTS.orange;
    const isRunning = executionStatus === 'RUNNING';
    const isSuccess = executionStatus === 'SUCCESS';
    const isFailed = executionStatus === 'FAILED';

    return (
        <div className="group relative flex flex-col items-center">
            <NodeActionToolbar
                nodeId={id}
                nodeLabel={label}
            />
            {/* Visual Box - Scale applied here only to keep handle coordinates stable */}
            <div className={cn(
                "w-[98px] h-20 rounded-l-full rounded-r-[12px] bg-white border-2 flex items-center justify-center transition-all duration-300 relative",
                selected 
                    ? cn(accentStyle.border, "shadow-lg ring-4 ring-slate-100 scale-105") 
                    : cn("border-slate-300", "hover:border-slate-400 hover:scale-102")
            )}>
                {/* Background Animation for Running state */}
                {isRunning && (
                    <div className={cn(
                        "absolute inset-0 rounded-l-full rounded-r-[12px] animate-pulse opacity-10",
                        accentStyle.bg
                    )} />
                )}

                {/* Content Container (Icon only, slate/grey as per reference) */}
                <div className={cn(
                    "relative z-10 flex items-center justify-center text-slate-500",
                    selected ? "text-slate-800" : ""
                )}>
                    {icon}
                </div>

                {/* Status Badge - Bottom right checkmark (n8n style) */}
                {isSuccess && (
                     <div className="absolute bottom-1.5 right-2 text-green-500 z-20">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                             <polyline points="20 6 9 17 4 12" />
                         </svg>
                     </div>
                )}
                {isFailed && (
                     <div className="absolute bottom-1.5 right-2 text-red-500 z-20">
                         <div className="w-2 h-2 rounded-full bg-current" />
                     </div>
                )}

                {/* Handle: Vertical Rectangle (Optimized) */}
                <Handle
                    type="source"
                    position={Position.Right}
                    isConnectable={isConnectable}
                    className={cn(
                        "!w-1.5 !h-6 !bg-slate-300 !border-none !rounded-[2px] transition-all z-50",
                        "!absolute !-right-[3px] !top-1/2 !-translate-y-1/2",
                        "hover:!bg-slate-400 hover:!h-8",
                        selected ? cn("!h-8 !w-2 !-right-[4px]", accentStyle.bg) : ""
                    )}
                />
            </div>

            {/* Labels Section */}
            <div className="mt-3 text-center flex flex-col items-center pointer-events-none w-48">
                <span className="block text-[13px] font-semibold text-slate-800 leading-tight mb-0.5 truncate w-full px-2">
                    {label}
                </span>
                
                {detailText && (
                    <div className="text-[11px] text-slate-400 font-medium truncate w-full px-2">
                        {detailText}
                    </div>
                )}

                {/* Type Badge - Premium Style */}
                {badgeText && badgeText !== label && (
                    <div className={cn(
                        "mt-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                        "bg-slate-50 text-slate-400 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    )}>
                        {badgeText}
                    </div>
                )}
            </div>
        </div>
    );
};








