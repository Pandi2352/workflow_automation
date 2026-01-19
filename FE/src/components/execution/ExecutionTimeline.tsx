import React, { memo, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, CircleEllipsis, FastForward } from 'lucide-react';

interface TimelineProps {
    executions: any[];
    onNodeSelect?: (nodeId: string) => void;
    selectedNodeId?: string | null;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-600 border-green-200';
        case 'FAILED': return 'bg-red-100 text-red-600 border-red-200';
        case 'RUNNING': return 'bg-blue-100 text-blue-600 border-blue-200 animate-pulse';
        case 'PENDING': return 'bg-gray-100 text-gray-500 border-gray-200';
        case 'QUEUED': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-gray-50 text-gray-400 border-gray-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'COMPLETED': return <CheckCircle size={14} className="text-green-600" />;
        case 'FAILED': return <XCircle size={14} className="text-red-600" />;
        case 'RUNNING': return <Clock size={14} className="text-blue-600 animate-spin" />;
        case 'QUEUED': return <CircleEllipsis size={14} className="text-amber-700" />;
        default: return <CircleEllipsis size={14} className="text-gray-400" />;
    }
};

export const ExecutionTimeline: React.FC<TimelineProps> = memo(({ executions, onNodeSelect, selectedNodeId }) => {
    if (!executions || executions.length === 0) {
        return <div className="p-4 text-center text-gray-400 text-sm">No execution steps recorded.</div>;
    }

    // Sort by start time if available, otherwise keep original order
    const sorted = useMemo(() => {
        return [...executions].sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
    }, [executions]);

    return (
        <div className="w-full overflow-x-auto p-4 custom-scrollbar">
            <div className="flex items-start gap-2 relative min-w-max">
                {sorted.map((node, index) => {
                     const isSelected = selectedNodeId === node.nodeId;
                     const duration = node.duration ? `${node.duration}ms` : '-';
                     
                     return (
                        <div key={index} className="flex flex-col items-center group relative z-10">
                            {/* Connector Line (Horizontal) */}
                            {index < sorted.length - 1 && (
                                <div className="absolute top-8 left-1/2 w-full h-[2px] bg-gray-200 -z-10 group-hover:bg-blue-100 transition-colors" 
                                     style={{ width: 'calc(100% + 8px)' }} // Overlap slightly
                                />
                            )}
                            
                            {/* Node Card */}
                            <button
                                onClick={() => onNodeSelect?.(node.nodeId)}
                                className={`
                                    w-40 p-3 rounded-lg border-2 transition-all text-left relative bg-white
                                    flex flex-col gap-2 hover:shadow-md
                                    ${isSelected 
                                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' 
                                        : 'border-gray-100 hover:border-blue-300'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <span className="font-semibold text-xs text-gray-800 truncate block max-w-[80px]" title={node.nodeName}>
                                        {node.nodeName}
                                    </span>
                                    <div className={`p-1 rounded-full ${getStatusColor(node.status)} border bg-opacity-20`}>
                                        {getStatusIcon(node.status)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-1">
                                    <FastForward size={10} />
                                    <span>{duration}</span>
                                </div>
                                
                                {/* Timestamp tooltip on hover? */}
                            </button>
                            
                            {/* Time Label Below */}
                            <div className="mt-2 text-[10px] text-gray-400 font-mono">
                                {node.startTime ? new Date(node.startTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' }) : '--:--:--'}
                            </div>
                        </div>
                     );
                })}
            </div>
        </div>
    );
});
