import React, { useState, useEffect, useRef } from 'react';
import { 
    Code, GripHorizontal, 
    LayoutDashboard, Monitor, Database, Activity, ChevronUp, GitCommitHorizontal
} from 'lucide-react';
import { ExecutionTimeline } from './ExecutionTimeline';
import { ExecutionDataTree } from './ExecutionDataTree';
import { workflowService } from '../../services/api/workflows';

const formatTime = (dateString: string, includeMs = false) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return includeMs 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
            : date.toLocaleTimeString();
    } catch (e) { return '-'; }
};

const getExecutionStatusTextClass = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'text-green-600';
        case 'FAILED':
            return 'text-red-600';
        case 'QUEUED':
            return 'text-amber-700';
        case 'RUNNING':
            return 'text-blue-600';
        case 'PENDING':
        default:
            return 'text-gray-600';
    }
};

const getExecutionStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-100 text-green-700';
        case 'FAILED':
            return 'bg-red-100 text-red-700';
        case 'QUEUED':
            return 'bg-amber-100 text-amber-700';
        case 'RUNNING':
            return 'bg-blue-100 text-blue-700';
        case 'PENDING':
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

interface ExecutionDetailsPanelProps {
    execution: any;
    selectedNodeId?: string | null;
    onNodeSelect?: (nodeId: string) => void;
}

type TabType = 'overview' | 'timeline' | 'client_info' | 'outputs' | 'logs' | 'json';

export const ExecutionDetailsPanel: React.FC<ExecutionDetailsPanelProps> = ({ execution, selectedNodeId, onNodeSelect }) => {
    const [activeTab, setActiveTab] = useState<TabType>('timeline');
    const [height, setHeight] = useState(350);
    const [isCollapsed, setIsCollapsed] = useState(false); // Default open
    const [isDragging, setIsDragging] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [logsPage, setLogsPage] = useState(1);
    const [logsHasNextPage, setLogsHasNextPage] = useState(false);
    const [isLogsLoading, setIsLogsLoading] = useState(false);
    const [isLogsLoadingMore, setIsLogsLoadingMore] = useState(false);
    
    // Performance Optimization: Use ref for direct DOM manipulation during drag
    const panelRef = useRef<HTMLDivElement>(null);
    const heightRef = useRef(350);

    // Sync ref when state changes (e.g. initial load or expand)
    useEffect(() => {
        if (!isDragging) heightRef.current = height;
    }, [height, isDragging]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !panelRef.current) return;
            
            const availableHeight = window.innerHeight;
            const maxH = availableHeight - 100; // Leave space for header
            const minH = 200;
            
            // Calculate height from bottom of screen
            const newHeight = Math.max(minH, Math.min(availableHeight - e.clientY, maxH));
            
            // Direct DOM update (Performance: No React Re-render loop)
            panelRef.current.style.height = `${newHeight}px`;
            heightRef.current = newHeight;
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                setHeight(heightRef.current); // Sync state on release
                document.body.style.cursor = 'default';
                document.body.classList.remove('select-none');
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.classList.add('select-none');
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); 
        setIsDragging(true);
    };

    const fetchLogs = async () => {
        if (!execution?._id) return;
        setIsLogsLoading(true);
        try {
            const res = await workflowService.getExecutionLogs(execution._id, 1, 200);
            setLogs(res.logs || []);
            setLogsPage(1);
            setLogsHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to fetch execution logs', error);
        } finally {
            setIsLogsLoading(false);
        }
    };

    const loadMoreLogs = async () => {
        if (!execution?._id || isLogsLoadingMore || !logsHasNextPage) return;
        setIsLogsLoadingMore(true);
        try {
            const nextPage = logsPage + 1;
            const res = await workflowService.getExecutionLogs(execution._id, nextPage, 200);
            const list = res.logs || [];
            setLogs(prev => [...prev, ...list]);
            setLogsPage(nextPage);
            setLogsHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to load more execution logs', error);
        } finally {
            setIsLogsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'logs' || !execution?._id) return;
        fetchLogs();
    }, [activeTab, execution?._id]);

    if (!execution) {
        return (
            <div className="h-10 border-t border-gray-200 bg-gray-50 flex items-center px-4 text-gray-400 text-xs shadow-inner">
                Select an execution to view details
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'timeline':
                return (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-700">Execution Timeline</h3>
                            <span className="text-xs text-gray-500">
                                Total Duration: {execution.duration || execution.metrics?.totalDuration || 0}ms
                            </span>
                        </div>
                        <div className="flex-1 overflow-hidden bg-gray-50/30">
                            <ExecutionTimeline 
                                executions={execution.nodeExecutions || []} 
                                onNodeSelect={onNodeSelect}
                                selectedNodeId={selectedNodeId}
                            />
                        </div>
                    </div>
                );

            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Status</span>
                                <div className={`mt-1 font-bold ${getExecutionStatusTextClass(execution.status)}`}>
                                    {execution.status}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Usage</span>
                                <div className="mt-1 font-mono text-sm text-gray-700">
                                    {execution.metrics?.totalDuration || 0}ms
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Nodes</span>
                                <div className="mt-1 font-mono text-sm text-gray-700">
                                    {execution.metrics?.completedNodes || 0} / {execution.metrics?.totalNodes || 0}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Started</span>
                                <div className="mt-1 text-sm text-gray-700 truncate" title={new Date(execution.startTime).toLocaleString()}>
                                    {formatTime(execution.startTime)}
                                </div>
                            </div>
                        </div>

                        {/* Final Result */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Database size={14} className="text-blue-500"/> Final Result
                            </h4>
                            <div className=" rounded-lg p-3 overflow-hidden">
                                <ExecutionDataTree data={execution.finalResult?.value} />
                            </div>
                        </div>
                    </div>
                );
            
            case 'client_info':
                return (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Client Environment</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs uppercase mb-1">Browser</span>
                                <div className="font-medium">{execution.clientInfo?.browser?.name} {execution.clientInfo?.browser?.version}</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase mb-1">OS</span>
                                <div className="font-medium">{execution.clientInfo?.system?.os} ({execution.clientInfo?.system?.osVersion})</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase mb-1">Engine</span>
                                <div className="font-medium">{execution.clientInfo?.engine?.name}</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase mb-1">IP Address</span>
                                <div className="font-medium font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                                    {execution.clientInfo?.ip}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500 block text-xs uppercase mb-1">User Agent</span>
                                <div className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 break-all">
                                    {execution.clientInfo?.userAgent}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'outputs':
                return (
                    <div className="space-y-4">
                        {execution.nodeOutputs?.map((output: any, idx: number) => (
                            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <span className="font-medium text-sm text-gray-700">{output.nodeName}</span>
                                    <span className="text-xs text-gray-500 font-mono">{output.type}</span>
                                </div>
                                <div className="p-3 bg-white max-h-96 overflow-auto custom-scrollbar">
                                     <ExecutionDataTree data={output.value} />
                                </div>
                            </div>
                        ))}
                        {(!execution.nodeOutputs || execution.nodeOutputs.length === 0) && (
                            <div className="text-center text-gray-400 py-8">No node outputs recorded</div>
                        )}
                    </div>
                );

            case 'logs':
                return (
                    <div className="font-mono text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="py-2 px-3 w-24">Time</th>
                                    <th className="py-2 px-3 w-20">Level</th>
                                    <th className="py-2 px-3">Message</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLogsLoading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                                            Loading logs...
                                        </td>
                                    </tr>
                                )}
                                {(logs || []).map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                                            {formatTime(log.timestamp, true)}
                                        </td>
                                        <td className="py-2 px-3">
                                            <span className={`
                                                inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border
                                                ${log.level === 'ERROR' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                  log.level === 'WARN' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                  'bg-blue-50 text-blue-600 border-blue-100'}
                                            `}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-gray-800 break-words">
                                            {log.message}
                                            {log.data && (
                                                <div className="mt-1 opacity-75">
                                                    <ExecutionDataTree data={log.data} level={1} initiallyExpanded={false} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!isLogsLoading && (!logs || logs.length === 0)) && (
                                     <tr>
                                         <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                                             No logs available
                                         </td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                        {logsHasNextPage && (
                            <div className="py-3 text-center">
                                <button
                                    onClick={loadMoreLogs}
                                    disabled={isLogsLoadingMore}
                                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-60"
                                >
                                    {isLogsLoadingMore ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'json':
                return (
                    <div className="p-4 bg-gray-50/30 min-h-full">
                        <ExecutionDataTree data={execution} initiallyExpanded={true} level={0} />
                    </div>
                );
                
            default:
                return null;
        }
    };

    const SidebarItem = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === id 
                    ? 'bg-white text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-r-2 border-transparent'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div 
            ref={panelRef}
            className={`bg-white border-t border-gray-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-20 flex-shrink-0 ease-in-out ${isDragging ? 'transition-none' : 'transition-[height] duration-300'}`}
            style={{ height: isCollapsed ? '48px' : `${height}px` }}
        >
            {/* Resize Handle (Only when expanded) */}
            {!isCollapsed && (
                <div 
                    className="absolute top-0 left-0 right-0 h-3 -mt-1.5 cursor-row-resize hover:bg-blue-500/10 transition-colors z-30 flex justify-center group"
                    onMouseDown={handleMouseDown}
                >
                    {/* Visible indicator line */}
                    <div className="w-full h-[1px] bg-transparent group-hover:bg-blue-400/50 mt-[7px]" />
                </div>
            )}

            {/* Header / Toggle Bar */}
            <div 
                className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-md bg-white border border-gray-200 shadow-sm transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}>
                        <ChevronUp size={14} className="text-gray-500" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                            Workflow Execution Logs
                        </span>
                        {execution && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2 
                                ${getExecutionStatusBadgeClass(execution.status)}`}>
                                {execution.status}
                            </span>
                        )}
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="text-gray-400">
                        <GripHorizontal size={14} />
                    </div>
                )}
            </div>
            
            {/* Expanded Content */}
            {!isCollapsed && (
                <div className="flex flex-1 overflow-hidden pt-0 animate-in fade-in duration-300">
                    {/* Internal Sidebar */}
                    <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                        <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Details</span>
                        </div>
                        <nav className="flex-1 overflow-y-auto">
                            <SidebarItem id="timeline" icon={GitCommitHorizontal} label="Timeline" />
                            <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
                            <SidebarItem id="outputs" icon={Database} label="Node Outputs" />
                            <SidebarItem id="logs" icon={Activity} label="Logs" />
                            <SidebarItem id="client_info" icon={Monitor} label="Client Info" />
                            <SidebarItem id="json" icon={Code} label="Raw JSON" />
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-white p-6 scrollbar-thin scrollbar-thumb-gray-200">
                        {renderContent()}
                    </div>
                </div>
            )}
        </div>
    );
};
