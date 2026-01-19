
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Search, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWorkflowStore } from '../../store/workflowStore';

export const GoogleSearchToolNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
    const { currentExecution } = useWorkflowStore();
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
                "w-20 h-20 rounded-2xl bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden",
                selected ? "border-amber-500 shadow-amber-200 ring-4 ring-amber-50" : "border-slate-200 hover:border-amber-400 shadow-slate-100"
            )}>
                {/* Internal Content */}
                <div className={cn(
                    "relative z-10 flex flex-col items-center gap-1",
                    isSuccess ? "text-green-600" : "text-amber-600"
                )}>
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <Globe size={24} className={cn(
                            "transition-transform duration-500",
                            selected ? "scale-110" : ""
                        )} />
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="absolute top-1 right-1">
                    <ShieldCheck size={10} className="text-slate-300" />
                </div>
            </div>

            {/* Labels outside */}
            <div className="mt-3 text-center">
                <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">
                    {String(data.label || 'Search Tool')}
                </span>
                <div className="flex items-center gap-1 justify-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    <Search size={8} className="text-amber-600" />
                    <span className="text-[7px] font-bold text-amber-700 uppercase tracking-tighter">
                        GOOGLE_SEARCH
                    </span>
                </div>
            </div>

            {/* Handle - Top position */}
            <Handle
                type="source"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!w-3.5 !h-3.5 !bg-white !border-2 !border-amber-500 !shadow-md transition-all hover:scale-125 hover:!bg-amber-500"
            />
        </div>
    );
});

export default GoogleSearchToolNode;
