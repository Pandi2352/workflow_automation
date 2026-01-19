import React, { useEffect, useState } from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
import { workflowService } from '../../services/api/workflows';

interface ExecutionLogsPanelProps {
    height: number;
    className?: string;
    executionId?: string | null;
    status?: string;
    duration?: number | null;
}

export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({ height, className = '', executionId, status, duration }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchLogs = async () => {
        if (!executionId) return;
        setIsLoading(true);
        try {
            const res = await workflowService.getExecutionLogs(executionId, 1, 200);
            setLogs(res.logs || []);
            setPage(1);
            setHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to fetch execution logs', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!executionId || isLoadingMore || !hasNextPage) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await workflowService.getExecutionLogs(executionId, nextPage, 200);
            setLogs(prev => [...prev, ...(res.logs || [])]);
            setPage(nextPage);
            setHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to load more logs', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        setLogs([]);
        setPage(1);
        setHasNextPage(false);
        if (executionId) {
            fetchLogs();
        }
    }, [executionId]);

    return (
        <div 
            style={{ height }}
            className={`flex flex-col bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] ${className}`}
        >
            <div className="flex items-center h-9 px-4 border-b border-slate-100 bg-slate-50 select-none">
                <div className="text-xs font-medium text-slate-700 flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    Logs
                </div>
                <div className="flex-1" />
                <div className="flex items-center text-xs text-slate-400 gap-1">
                    {status ? <span>{status}{duration ? ` in ${duration}ms` : ''}</span> : <span>---</span>}
                </div>
            </div>
            <div className="flex-1 p-0 flex flex-col min-h-0">
                <div className="px-4 py-2 bg-white border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">OUTPUT</span>
                </div>
                <div className="flex-1 p-4 bg-white overflow-y-auto">
                    {isLoading && logs.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                            <AlertCircle size={14} />
                            Loading logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                            <AlertCircle size={14} />
                            No logs available.
                        </div>
                    ) : (
                        <div className="space-y-1 font-mono text-xs text-slate-700">
                            {logs.map((log, i) => (
                                <div key={i} className="border-b border-slate-50 pb-1">
                                    <span className="text-slate-400 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span className="font-semibold">{log.level}</span>: {log.message}
                                </div>
                            ))}
                        </div>
                    )}
                    {hasNextPage && (
                        <div className="mt-3 text-center">
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
        </div>
    );
};
