
import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, FileText, Code, GripHorizontal } from 'lucide-react';

const formatTime = (dateString: string, includeMs = false) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return includeMs 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
            : date.toLocaleTimeString();
    } catch (e) { return '-'; }
};

interface ExecutionDetailsPanelProps {
    execution: any;
    selectedNodeId?: string | null;
}

export const ExecutionDetailsPanel: React.FC<ExecutionDetailsPanelProps> = ({ execution, selectedNodeId }) => {
    const [activeTab, setActiveTab] = useState<'logs' | 'output'>('output');
    const [height, setHeight] = useState(300);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef<number>(0);
    const dragStartHeight = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const delta = dragStartY.current - e.clientY;
            const newHeight = Math.max(200, Math.min(dragStartHeight.current + delta, window.innerHeight - 100));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = height;
    };

    if (!execution) {
        return (
            <div className="h-64 border-t border-gray-200 bg-white flex items-center justify-center text-gray-400 text-sm">
                Select an execution to view details
            </div>
        );
    }

    // If node selected, find its specific execution data
    const nodeExecution = selectedNodeId 
        ? execution.nodeExecutions?.find((n: any) => n.nodeId === selectedNodeId)
        : null;

    const displayData = nodeExecution || execution;

    return (
        <div 
            className="bg-white border-t border-gray-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-20"
            style={{ height: `${height}px` }}
        >
            {/* Resize Handle */}
            <div 
                className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-500/50 transition-colors z-30"
                onMouseDown={handleMouseDown}
            />

            {/* Toolbar */}
            <div className="h-10 border-b border-gray-200 flex items-center px-4 bg-gray-50 justify-between shrink-0 select-none">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                        {nodeExecution ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Node: {nodeExecution.nodeName}
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                Workflow Execution
                            </>
                        )}
                    </span>
                    
                    <div className="flex bg-gray-200 rounded-md p-0.5">
                        <button 
                            onClick={() => setActiveTab('output')}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${activeTab === 'output' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Output / JSON
                        </button>
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Logs
                        </button>
                    </div>
                </div>
                
                <div className="text-gray-400">
                    <GripHorizontal size={14} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {activeTab === 'output' && (
                    <div className="p-4 font-mono text-xs text-gray-700">
                         {/* Display Output JSON */}
                         <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(nodeExecution ? nodeExecution.outputs : execution, null, 2)}
                         </pre>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="font-mono text-xs">
                        {(nodeExecution?.logs || execution.logs || []).map((log: any, i: number) => (
                            <div key={i} className="border-b border-gray-100 p-2 flex gap-3 hover:bg-gray-50">
                                <span className="text-gray-400 min-w-[80px]">{formatTime(log.timestamp, true)}</span>
                                <span className={`font-semibold min-w-[60px] ${log.level === 'ERROR' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {log.level}
                                </span>
                                <span className="text-gray-800 break-all">{log.message}</span>
                            </div>
                        ))}
                        {(!execution.logs || execution.logs.length === 0) && (
                            <div className="p-4 text-gray-400">No logs available</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
