
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkflowStore } from '../../store/workflowStore';

export const GeminiModelNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
    const config = (data.config || {}) as any;
    
    // Find execution status
    const nodeStatus = data.executionStatus || currentExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === id)?.status;
    const isSuccess = nodeStatus === 'SUCCESS';

    return (
        <div className={cn(
            "group relative flex flex-col items-center justify-center transition-all duration-300",
            selected ? "scale-105" : "hover:scale-102"
        )}>
            {/* Main Circular Body */}
            <div className={cn(
                "w-24 h-24 rounded-full bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden",
                selected ? "border-blue-500 shadow-blue-200 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-400 shadow-slate-100"
            )}>
                {/* Status Indicator Background */}
                {isSuccess && (
                     <div className="absolute inset-0 bg-green-50/50 animate-pulse" />
                )}

                {/* Internal Content */}
                <div className={cn(
                    "relative z-10 flex flex-col items-center gap-1",
                    isSuccess ? "text-green-600" : "text-blue-600"
                )}>
                    {/* Google Gemini Style Logo/Icon */}
                    <div className="relative">
                        <BrainCircuit size={32} className={cn(
                            "transition-transform duration-500",
                            selected ? "rotate-12 scale-110" : "group-hover:rotate-6"
                        )} />
                        <Sparkles size={12} className="absolute -top-1 -right-1 animate-pulse text-amber-400" />
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
            <div className="mt-3 text-center">
                <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">
                    {String(data.label || 'Gemini Model')}
                </span>
                <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                    {config.modelName || 'gemini-1.5-flash'}
                </span>
            </div>

            {/* Handle - Top position for connecting to Agent bottom handles */}
            <Handle
                type="source"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-blue-500 !shadow-md transition-all hover:scale-125 hover:!bg-blue-500"
            />
        </div>
    );
});

export default GeminiModelNode;
