
import React, { useState } from 'react';
import { X, Maximize2, Minimize2, FileText, Code } from 'lucide-react';

const formatTime = (dateString: string, includeMs = false) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return includeMs 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionDigits: 3 })
            : date.toLocaleTimeString();
    } catch (e) { return '-'; }
};

interface ExecutionDetailsPanelProps {
    execution: any;
    selectedNodeId?: string | null;
}

export const ExecutionDetailsPanel: React.FC<ExecutionDetailsPanelProps> = ({ execution, selectedNodeId }) => {
    const [activeTab, setActiveTab] = useState<'logs' | 'output'>('output');

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
        <div className="h-72 bg-white border-t border-gray-200 flex flex-col shadow-inner relative z-20">
            {/* Toolbar */}
            <div className="h-10 border-b border-gray-200 flex items-center px-4 bg-gray-50 justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                        {nodeExecution ? `Node: ${nodeExecution.nodeName}` : 'Workflow Execution'}
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-0">
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
