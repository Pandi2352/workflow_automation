
import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { workflowService } from '../../services/api/workflows';

// Helper for time formatting
const formatTime = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return '-'; }
};

interface ExecutionSidebarProps {
    workflowId: string;
    onSelectExecution: (execution: any) => void;
    activeExecutionId?: string | null;
    updatedExecution?: any;
}

export const ExecutionSidebar: React.FC<ExecutionSidebarProps> = ({ 
    workflowId, 
    onSelectExecution,
    activeExecutionId,
    updatedExecution
}) => {
    const [executions, setExecutions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(activeExecutionId || null);

    // Sync updated execution into the list
    useEffect(() => {
        if (updatedExecution) {
            setExecutions(prev => prev.map(ex => 
                ex._id === updatedExecution._id 
                ? { ...ex, ...updatedExecution } // Merge updates
                : ex
            ));
        }
    }, [updatedExecution]);

    const fetchExecutions = async () => {
        setIsLoading(true);
        try {
            const data = await workflowService.getExecutions(workflowId, 1, 50);
            setExecutions(data.data || []);
        } catch (error) {
            console.error('Failed to fetch executions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExecutions();
    }, [workflowId]);

    // Poll for list updates (new executions)
    useEffect(() => {
        if (!workflowId) return;

        const interval = setInterval(async () => {
            try {
                // Lightweight check for latest execution
                const latestMeta = await workflowService.getLatestExecution(workflowId);
                
                if (latestMeta && executions.length > 0) {
                    const currentLatestId = executions[0]._id;
                    if (latestMeta._id !== currentLatestId) {
                         // New execution detected! Refresh list.
                         console.log('New execution detected, refreshing list...');
                         fetchExecutions();
                    }
                } else if (latestMeta && executions.length === 0) {
                    // First execution ever
                    fetchExecutions();
                }
            } catch (error) {
                // Fail silently on poll error
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [workflowId, executions]); // Depend on executions to compare against latest

    // Handle initial selection and prop updates
    useEffect(() => {
        if (activeExecutionId && activeExecutionId !== selectedId) {
            setSelectedId(activeExecutionId);
            const found = executions.find(e => e._id === activeExecutionId);
            if (found) onSelectExecution(found);
        } else if (!selectedId && executions.length > 0 && !activeExecutionId) {
            // Auto-select first item only if nothing selected and no active prop
            handleSelect(executions[0]);
        }
    }, [activeExecutionId, executions, selectedId]);

    // List sync handled above by [updatedExecution] effect

    const handleSelect = (execution: any) => {
        setSelectedId(execution._id);
        onSelectExecution(execution);
    };

    return (
        <div className="w-80 h-full border-r border-gray-200 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Executions</h3>
                <button onClick={fetchExecutions} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {executions.map((exec) => (
                    <div 
                        key={exec._id}
                        onClick={() => handleSelect(exec)}
                        className={`group p-4 border-b border-gray-100 cursor-pointer transition-all
                            ${selectedId === exec._id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent hover:bg-gray-50'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <span className="font-medium text-gray-900 text-sm">
                                {new Date(exec.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                ${exec.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                  exec.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                                  'bg-blue-100 text-blue-700'}`}>
                                {exec.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                             <span>{formatTime(exec.createdAt)}</span>
                             <div className="flex items-center gap-1">
                                <Clock size={12} />
                                {exec.duration ? `${exec.duration}ms` : '...'}
                             </div>
                        </div>
                    </div>
                ))}
                
                {executions.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No executions yet
                    </div>
                )}
            </div>
        </div>
    );
};
