import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Rss, Radio, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkflowStore } from '../../store/workflowStore';

export const RSSNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const config = (data.config || {}) as any;
    
    // Find execution status
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isSuccess = nodeStatus === 'SUCCESS';
    const isRunning = nodeStatus === 'RUNNING';

    return (
        <div className={cn(
            "group relative flex flex-col items-center justify-center transition-all duration-300",
            selected ? "scale-105" : "hover:scale-102"
        )}>
            {/* Main Circular Body */}
            <div className={cn(
                "w-24 h-24 rounded-full bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden",
                selected ? "border-orange-500 shadow-orange-200 ring-4 ring-orange-50" : "border-slate-200 hover:border-orange-400 shadow-slate-100"
            )}>
                {/* Status Indicator Background */}
                {isRunning && (
                     <div className="absolute inset-0 bg-orange-50/50 animate-pulse" />
                )}
                {isSuccess && (
                     <div className="absolute inset-0 bg-green-50/50 animate-pulse" />
                )}

                {/* Internal Content */}
                <div className={cn(
                    "relative z-10 flex flex-col items-center gap-1",
                    isSuccess ? "text-green-600" : "text-orange-600"
                )}>
                    {/* RSS Style Logo/Icon */}
                    <div className="relative">
                        <div className={cn(
                            "p-2 rounded-full",
                            isSuccess ? "bg-green-100" : "bg-orange-100"
                        )}>
                            <Rss size={28} className={cn(
                                "transition-transform duration-500",
                                isRunning ? "animate-bounce" : (selected ? "scale-110" : "group-hover:scale-105")
                            )} />
                        </div>
                        <Radio size={12} className="absolute -top-1 -right-1 text-orange-400 animate-pulse" />
                    </div>
                </div>

                {/* Status Badge */}
                {isSuccess && (
                    <div className="absolute bottom-2 right-6 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm z-20">
                         <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,1)]" />
                    </div>
                )}
            </div>

            {/* Labels outside the circle */}
            <div className="mt-3 text-center max-w-[120px]">
                <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1 truncate">
                    {String(data.label || 'RSS Feed')}
                </span>
                <div className="flex items-center justify-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                    <Wifi size={8} className="text-orange-500" />
                    <span className="text-[8px] font-bold text-orange-600 uppercase tracking-tighter truncate max-w-[80px]">
                        {config.url ? new URL(config.url).hostname : 'NO URL'}
                    </span>
                </div>
            </div>

            {/* Handles */}
            <Handle
                type="source"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-orange-500 !shadow-md transition-all hover:scale-125 hover:!bg-orange-500"
            />
        </div>
    );
});

export default RSSNode;
