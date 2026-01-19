import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock, Zap, Check } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { cn } from '../../lib/utils';

export const ScheduleNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const config = (data.config || {}) as any;
    
    // Find execution status
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isSuccess = nodeStatus === 'SUCCESS';
    const isRunning = nodeStatus === 'RUNNING';

    const interval = config.interval || 'Not set';
    const value = config.value || '';

    let label = 'Schedule';
    if (interval === 'custom') {
        label = config.cronExpression || 'Custom Cron';
    } else if (interval && value) {
        label = `Run every ${value} ${interval}`;
    }

    return (
        <div className={cn(
            "group relative flex flex-col items-center justify-center transition-all duration-300",
            selected ? "scale-105" : "hover:scale-102"
        )}>
            {/* Main D-Shaped Body */}
            <div className={cn(
                "w-24 h-24 rounded-l-full rounded-r-2xl bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden",
                selected ? "border-emerald-500 shadow-emerald-200 ring-4 ring-emerald-50" : "border-slate-200 hover:border-emerald-400 shadow-slate-100"
            )}>
                {/* Status Indicator Background */}
                {isRunning && (
                     <div className="absolute inset-0 bg-emerald-50/50 animate-pulse" />
                )}
                {isSuccess && (
                     <div className="absolute inset-0 bg-green-50/50" />
                )}

                {/* Internal Content */}
                <div className={cn(
                    "relative z-10 flex flex-col items-center gap-1",
                    isSuccess ? "text-green-600" : "text-emerald-600"
                )}>
                    <div className="p-3 bg-emerald-50 rounded-full">
                        <Clock size={32} className={cn(
                            "transition-transform duration-500",
                            isRunning ? "animate-spin-slow" : (selected ? "scale-110" : "group-hover:rotate-12")
                        )} />
                    </div>
                </div>

                {/* Status Badge - Bottom Right Checkmark */}
                {isSuccess && (
                    <div className="absolute bottom-2 right-2 bg-green-500 rounded-lg p-0.5 border-2 border-white shadow-sm z-20 flex items-center justify-center">
                         <Check size={10} className="text-white stroke-[4]" />
                    </div>
                )}
            </div>

            {/* Labels outside the body */}
            <div className="mt-3 text-center max-w-[140px]">
                <span className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-tight leading-none mb-1">
                    {String(data.label || 'Scheduler')}
                </span>
                <div className="flex items-center justify-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <Zap size={8} className="text-emerald-500 fill-emerald-500" />
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-tighter whitespace-nowrap">
                        {label}
                    </span>
                </div>
            </div>

            {/* Handle - Centered on the flat right side */}
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-emerald-500 !shadow-md transition-all hover:scale-125 hover:!bg-emerald-500"
            />
        </div>
    );
});

export default ScheduleNode;
