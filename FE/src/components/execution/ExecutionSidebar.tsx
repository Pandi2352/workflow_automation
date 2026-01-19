
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
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(activeExecutionId || null);
    const [scrollTop, setScrollTop] = useState(0);
    const [listHeight, setListHeight] = useState(0);
    const listRef = React.useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 72;
    const OVERSCAN = 6;

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
            const data = await workflowService.getExecutions(workflowId, 1, 20);
            const list = data.data || [];
            setExecutions(list);
            setPage(1);
            setHasNextPage(Boolean(data.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to fetch executions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (isLoadingMore || !hasNextPage) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const data = await workflowService.getExecutions(workflowId, nextPage, 20);
            const list = data.data || [];
            setExecutions(prev => {
                const byId = new Map<string, any>();
                [...prev, ...list].forEach((exec) => byId.set(exec._id, exec));
                return Array.from(byId.values()).sort((a, b) => {
                    const aTime = new Date(a.createdAt).getTime();
                    const bTime = new Date(b.createdAt).getTime();
                    return bTime - aTime;
                });
            });
            setPage(nextPage);
            setHasNextPage(Boolean(data.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to load more executions', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchExecutions();
    }, [workflowId]);

    // Poll for list updates (new executions) with idle backoff
    useEffect(() => {
        if (!workflowId) return;
        let isCancelled = false;
        let delay = 2000;
        const maxDelay = 10000;

        const pollLatest = async () => {
            try {
                const latestMeta = await workflowService.getLatestExecution(workflowId);
                
                if (latestMeta && executions.length > 0) {
                    const currentLatestId = executions[0]._id;
                    if (latestMeta._id !== currentLatestId) {
                        fetchExecutions();
                        delay = 2000;
                    } else {
                        if (selectedId) {
                            const statusMeta = await workflowService.getExecutionStatus(selectedId);
                            const current = executions.find(e => e._id === selectedId);
                            if (statusMeta && current && statusMeta.status !== current.status) {
                                fetchExecutions();
                                delay = 2000;
                            } else {
                                delay = Math.min(maxDelay, Math.round(delay * 1.5));
                            }
                        } else {
                            delay = Math.min(maxDelay, Math.round(delay * 1.5));
                        }
                    }
                } else if (latestMeta && executions.length === 0) {
                    fetchExecutions();
                    delay = 2000;
                } else {
                    delay = Math.min(maxDelay, Math.round(delay * 1.5));
                }
            } catch (error) {
                delay = Math.min(maxDelay, Math.round(delay * 1.5));
            } finally {
                if (!isCancelled) {
                    setTimeout(pollLatest, delay);
                }
            }
        };

        const timerId = setTimeout(pollLatest, delay);

        return () => {
            isCancelled = true;
            clearTimeout(timerId);
        };
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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        setScrollTop(target.scrollTop);
        const threshold = 80;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < threshold) {
            loadMore();
        }
    };
    
    useEffect(() => {
        if (listRef.current) {
            setListHeight(listRef.current.clientHeight);
        }
    }, []);

    const visibleCount = listHeight ? Math.ceil(listHeight / ITEM_HEIGHT) + OVERSCAN : executions.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(executions.length, startIndex + visibleCount);
    const visibleExecutions = executions.slice(startIndex, endIndex);
    const paddingTop = startIndex * ITEM_HEIGHT;
    const paddingBottom = Math.max(0, (executions.length - endIndex) * ITEM_HEIGHT);

    return (
        <div className="w-80 h-full border-r border-gray-200 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Executions</h3>
                <button onClick={fetchExecutions} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <RefreshCw size={16} className={isLoading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto" onScroll={handleScroll} ref={listRef}>
                <div style={{ paddingTop, paddingBottom }}>
                {visibleExecutions.map((exec) => (
                    <div 
                        key={exec._id}
                        onClick={() => handleSelect(exec)}
                        className={`group p-4 border-b border-gray-100 cursor-pointer transition-all
                            ${selectedId === exec._id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent hover:bg-gray-50'}
                        `}
                        style={{ height: ITEM_HEIGHT }}
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <span className="font-medium text-gray-900 text-sm">
                                {new Date(exec.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                ${exec.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                  exec.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                                  exec.status === 'QUEUED' ? 'bg-amber-100 text-amber-700' :
                                  exec.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'}`}>
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
                </div>
                
                {executions.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No executions yet
                    </div>
                )}

                {hasNextPage && (
                    <div className="p-3 text-center">
                        <button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-60"
                        >
                            {isLoadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
