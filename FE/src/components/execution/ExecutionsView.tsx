import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, RotateCcw, CheckCircle2, XCircle, ChevronRight, LayoutList } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ExecutionLogsPanel } from './ExecutionLogsPanel';
import { workflowService } from '../../services/api/workflows';

export const ExecutionsView: React.FC = () => {
    const { id: workflowId } = useParams<{ id: string }>();
    const [executions, setExecutions] = useState<any[]>([]);
    const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
    const [logsHeight, setLogsHeight] = useState(300);
    const [isResizing, setIsResizing] = useState(false);

    const fetchExecutions = async () => {
        if (!workflowId) return;
        try {
            const res = await workflowService.getExecutions(workflowId);
            const list = res.data || [];
            setExecutions(list);
            if (!selectedExecutionId && list.length > 0) {
                setSelectedExecutionId(list[0]._id);
            }
        } catch (err) {
            console.error('Failed to fetch executions', err);
        }
    };

    useEffect(() => {
        fetchExecutions();
        const interval = setInterval(fetchExecutions, 2000); // Poll every 2s for live updates
        return () => clearInterval(interval);
    }, [workflowId]);

    const selectedExecution = executions.find(e => e._id === selectedExecutionId);

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'failed': return <XCircle size={16} className="text-red-500" />;
            case 'running': 
            case 'pending': return <RotateCcw size={16} className="text-blue-500 animate-spin" />;
            default: return <RotateCcw size={16} className="text-slate-400" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'failed': return 'error';
            case 'running': 
            case 'pending': return 'default';
            default: return 'default';
        }
    };

    const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);

        const startHeight = logsHeight;
        const startY = mouseDownEvent.clientY;

        const onMouseMove = (mouseMoveEvent: MouseEvent) => {
            const delta = startY - mouseMoveEvent.clientY;
            const newHeight = Math.max(100, Math.min(600, startHeight + delta));
            setLogsHeight(newHeight);
        };

        const onMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [logsHeight]);

    return (
        <div className="flex h-full w-full bg-[#f4f4f4]">
            {/* Left Sidebar: List */}
            <div className="w-[300px] flex flex-col bg-white border-r border-slate-200">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 text-sm">Executions</h3>
                    <span className="text-xs text-slate-400 font-normal">No active executions</span>
                </div>

                 <div className="p-3 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <div className="bg-red-500 w-3 h-3 rounded flex items-center justify-center">
                                 <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                             <span className="text-xs text-slate-600 font-medium">Auto refresh</span>
                         </div>
                         <Button variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600">
                             <Filter size={14} />
                         </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {executions.map(exec => (
                        <div 
                            key={exec._id}
                            onClick={() => setSelectedExecutionId(exec._id)}
                            className={`
                                group flex items-center p-3 border-l-4 cursor-pointer transition-all border-b border-slate-50
                                ${selectedExecutionId === exec._id 
                                    ? 'bg-green-50/50 border-l-[#10b981]' 
                                    : 'bg-white border-l-transparent hover:bg-slate-50'}
                            `}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-700">
                                        {new Date(exec.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                     <span className={
                                         exec.status === 'COMPLETED' ? 'text-green-600' : 
                                         exec.status === 'FAILED' ? 'text-red-500' : 'text-blue-500'
                                     }>
                                         {exec.status}
                                     </span>
                                     {/* <span>in {exec.duration || '...'}</span> */}
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-slate-400">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Main Content: Details */}
            <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden relative">
                {selectedExecution ? (
                    <>
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Detail Header */}
                            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(selectedExecution.status)}
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                            {new Date(selectedExecution.createdAt).toLocaleString()}
                                            <Badge variant={getStatusBadgeVariant(selectedExecution.status)} size="sm">
                                                ID#{selectedExecution._id.substring(0, 8)}...
                                            </Badge>
                                        </h2>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            Succeeded in {selectedExecution.duration}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="outline" size="sm" className="bg-white">Copy to editor</Button>
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-slate-200 bg-white"><LayoutList size={14} /></Button>
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100"><XCircle size={14} /></Button>
                                </div>
                            </div>

                            {/* Detail Body (Center) */}
                            <div className="flex-1 p-8 flex items-center justify-center bg-[url('https://res.cloudinary.com/dvzfa428o/image/upload/v1707834710/grid-pattern_q5m5da.svg')] overflow-y-auto">
                                 <div className="text-center">
                                     <div className="w-20 h-20 bg-emerald-50 rounded-xl border-2 border-[#10b981] mx-auto flex items-center justify-center relative shadow-sm mb-4">
                                         <div className="absolute -right-1.5 -bottom-1.5 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                                             <CheckCircle2 size={14} className="text-[#10b981] fill-white" />
                                         </div>
                                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10b981]"><path d="M12 2v4"/><path d="m9 2 2 2.5"/><path d="m15 2-2 2.5"/><line x1="12" x2="12" y1="12" y2="22"/><line x1="12" x2="16" y1="12" y2="16"/><line x1="12" x2="8" y1="12" y2="16"/></svg>
                                     </div>
                                     <h3 className="text-slate-900 font-medium mb-1">When clicking 'Execute workflow'</h3>
                                     <p className="text-slate-500 text-xs">Run {selectedExecution._id}</p>
                                 </div>
                            </div>
                        </div>

                        {/* Drag Handle */}
                        <div
                            onMouseDown={startResizing}
                            className={`
                                h-1 w-full cursor-ns-resize hover:bg-[#10b981] transition-colors z-10
                                ${isResizing ? 'bg-[#10b981]' : 'bg-transparent border-t border-slate-200'}
                            `}
                        />

                        {/* Bottom Output Pane */}
                        <ExecutionLogsPanel height={logsHeight} className="shrink-0" />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        Select an execution to view details
                    </div>
                )}
            </div>
        </div>
    );
};
