
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Clock } from 'lucide-react';
import { workflowService } from '../../services/api/workflows';

// Simple date formatter to avoid external dependencies
const formatTime = (dateString: string, includeMs = false) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        let time = `${hours}:${minutes}:${seconds}`;
        
        if (includeMs) {
            const ms = date.getMilliseconds().toString().padStart(3, '0');
            time += `.${ms}`;
        }
        return time;
    } catch (e) {
        return '-';
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-500 text-green-700';
        case 'FAILED':
            return 'bg-red-500 text-red-700';
        case 'QUEUED':
            return 'bg-amber-500 text-amber-800';
        case 'RUNNING':
            return 'bg-blue-500 text-blue-700';
        case 'PENDING':
        default:
            return 'bg-gray-400 text-gray-800';
    }
};

interface ExecutionPanelProps {
    workflowId: string;
    isOpen: boolean;
    onClose: () => void;
    onExecutionSelect: (execution: any) => void;
    activeExecutionId?: string | null;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ 
    workflowId, 
    isOpen, 
    onClose,
    onExecutionSelect,
    activeExecutionId
}) => {
    const [executions, setExecutions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(activeExecutionId || null);

    const fetchExecutions = async () => {
        setIsLoading(true);
        try {
            const data = await workflowService.getExecutions(workflowId, 1, 50);
            setExecutions(data.data || []);
            
            // Auto-select first if none selected
            if (!selectedId && data.data && data.data.length > 0) {
              handleSelect(data.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch executions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchExecutions();
            // Poll for updates
            const interval = setInterval(fetchExecutions, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, workflowId]);
    
    useEffect(() => {
        if (activeExecutionId) {
            setSelectedId(activeExecutionId);
            const found = executions.find(e => e._id === activeExecutionId);
            if (found) onExecutionSelect(found);
        }
    }, [activeExecutionId, executions]);

    const handleSelect = (execution: any) => {
        setSelectedId(execution._id);
        onExecutionSelect(execution);
    };

    const selectedExecution = executions.find(e => e._id === selectedId);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-white border-t border-gray-200 shadow-xl flex z-40 transition-transform duration-300 ease-in-out transform">
            {/* Sidebar List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h3 className="font-semibold text-gray-700 text-sm">Executions</h3>
                    <button onClick={fetchExecutions} className="p-1 hover:bg-gray-100 rounded">
                        <RefreshCw size={14} className={isLoading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {executions.map((exec) => (
                        <div 
                            key={exec._id}
                            onClick={() => handleSelect(exec)}
                            className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors
                                ${selectedId === exec._id ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : 'border-l-4 border-l-transparent'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-opacity-10 
                                    ${getStatusBadgeClass(exec.status)}`}>
                                    {exec.status}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {formatTime(exec.createdAt)}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {exec.duration ? `${exec.duration}ms` : exec.status === 'QUEUED' ? 'Queued' : 'Running...'}
                            </div>
                        </div>
                    ))}
                    {executions.length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-sm">No executions yet</div>
                    )}
                </div>
            </div>

            {/* Details Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-2 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                     <div className="flex items-center gap-2">
                        {selectedExecution && (
                            <>
                                <span className="font-medium text-sm text-gray-700">Execution Details</span>
                                <span className="text-xs text-gray-400">ID: {selectedExecution._id}</span>
                            </>
                        )}
                     </div>
                     <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                        <X size={18} />
                     </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    {selectedExecution ? (
                       <div className="space-y-6">
                            {/* Logs */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Execution Logs</h4>
                                <div className="bg-gray-900 rounded-md p-3 font-mono text-xs text-gray-300 max-h-60 overflow-y-auto">
                                    {selectedExecution.logs?.map((log: any, i: number) => (
                                        <div key={i} className="mb-0.5 flex gap-2">
                                            <span className="text-gray-500">[{formatTime(log.timestamp, true)}]</span>
                                            <span className={log.level === 'ERROR' ? 'text-red-400' : 'text-green-400'}>{log.level}</span>: 
                                            <span className="text-gray-100">{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Raw JSON Data Preview */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Full JSON Output</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto max-h-80">
                                    <pre className="text-xs text-gray-700 font-mono">
                                        {JSON.stringify(selectedExecution, null, 2)}
                                    </pre>
                                </div>
                            </div>
                       </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Select an execution to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
