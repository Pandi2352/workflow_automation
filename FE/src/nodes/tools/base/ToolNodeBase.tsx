import { Handle, Position } from '@xyflow/react';
import { cn } from '../../../lib/utils';
import { Play, Power, Trash2, Copy } from 'lucide-react';
import { useWorkflowStore } from '../../../store/workflowStore';

type ExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | undefined;

type AccentStyle = {
    border: string;
    hoverBorder: string;
    ring: string;
    shadow: string;
    text: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    iconBg: string;
};

const ACCENTS: Record<string, AccentStyle> = {
    amber: {
        border: 'border-amber-500',
        hoverBorder: 'hover:border-amber-400',
        ring: 'ring-amber-50',
        shadow: 'shadow-amber-200',
        text: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeBorder: 'border-amber-100',
        badgeText: 'text-amber-700',
        iconBg: 'bg-amber-50',
    },
    orange: {
        border: 'border-orange-500',
        hoverBorder: 'hover:border-orange-400',
        ring: 'ring-orange-50',
        shadow: 'shadow-orange-200',
        text: 'text-orange-600',
        badgeBg: 'bg-orange-50',
        badgeBorder: 'border-orange-100',
        badgeText: 'text-orange-700',
        iconBg: 'bg-orange-50',
    },
    blue: {
        border: 'border-blue-500',
        hoverBorder: 'hover:border-blue-400',
        ring: 'ring-blue-50',
        shadow: 'shadow-blue-200',
        text: 'text-blue-600',
        badgeBg: 'bg-blue-50',
        badgeBorder: 'border-blue-100',
        badgeText: 'text-blue-700',
        iconBg: 'bg-blue-50',
    },
};

export interface ToolNodeBaseProps {
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

export const ToolNodeBase = ({
    id,
    label,
    badgeText,
    icon,
    accent = 'amber',
    selected,
    isConnectable,
    executionStatus,
    detailText,
}: ToolNodeBaseProps) => {
    const accentStyle = ACCENTS[accent] || ACCENTS.amber;
    const isRunning = executionStatus === 'RUNNING';
    const isSuccess = executionStatus === 'SUCCESS';
    const { deleteNode, duplicateNode } = useWorkflowStore();

    return (
        <div className={cn(
            "group relative flex flex-col items-center justify-center transition-all duration-300",
            selected ? "scale-105" : "hover:scale-102"
        )}>
            {/* Hover Toolbar (Stable interaction) */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-2.5 pt-1 pb-5 bg-transparent opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-50 transition-all duration-200">
                <div className="flex items-center gap-3 px-2.5 py-1 bg-gray-80">
                    <button 
                        className="text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                        title="Execute Node"
                    >
                        <Play size={11} fill="currentColor" />
                    </button>
                    <button 
                        className="text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                        title="Deactivate Node"
                    >
                        <Power size={11} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                        className="text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete Node"
                    >
                        <Trash2 size={11} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); duplicateNode(id); }}
                        className="text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
                        title="Duplicate Node"
                    >
                        <Copy size={11} />
                    </button>
                </div>
            </div>

            <div className={cn(
                "w-20 h-20 rounded-full bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden",
                selected ? cn(accentStyle.border, accentStyle.shadow, accentStyle.ring, "ring-4") : cn("border-slate-200", accentStyle.hoverBorder, "shadow-slate-100")
            )}>
                {(isRunning || isSuccess) && (
                    <div className={cn(
                        "absolute inset-0",
                        isRunning ? "animate-pulse" : "",
                        accentStyle.badgeBg
                    )} />
                )}

                <div className={cn("relative z-10 flex items-center justify-center", accentStyle.text)}>
                    <div className={cn("p-2 rounded-full", accentStyle.iconBg)}>
                        {icon}
                    </div>
                </div>

                {isSuccess && (
                     <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-emerald-500 z-20">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                             <polyline points="20 6 9 17 4 12" />
                         </svg>
                     </div>
                )}
            </div>

            <div className="mt-3 text-center max-w-[140px]">
                <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1 truncate">
                    {label}
                </span>
                <div className={cn("flex items-center justify-center gap-1 px-2 py-0.5 rounded-md border", accentStyle.badgeBg, accentStyle.badgeBorder)}>
                    <span className={cn("text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap truncate max-w-[120px]", accentStyle.badgeText)}>
                        {badgeText}
                    </span>
                </div>
                {detailText && (
                    <div className="mt-1 text-[9px] text-slate-400 font-medium truncate">
                        {detailText}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Top}
                isConnectable={isConnectable}
                className={cn(
                    "!w-4 !h-4 !bg-white !border-gray-200 !left-8 !top-1 !border-2 !rounded-none !rotate-45 transition-all hover:scale-110 flex items-center justify-center",
                    accentStyle.border,
                )}
            >
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full !-rotate-45",
                    accentStyle.iconBg.replace('bg-', 'bg-').replace('50', '500'), // Use a darker version of the iconBg for the dot
                    accent === 'amber' ? 'bg-amber-500' : 
                    accent === 'orange' ? 'bg-orange-500' : 
                    accent === 'blue' ? 'bg-blue-500' : 'bg-slate-500'
                )} />
            </Handle>
        </div>
    );
};

