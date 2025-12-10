
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Maximize2, Minimize2, FileText, Code, GripHorizontal, 
    LayoutDashboard, Monitor, Database, Activity
} from 'lucide-react';

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

type TabType = 'overview' | 'client_info' | 'outputs' | 'logs' | 'json';

export const ExecutionDetailsPanel: React.FC<ExecutionDetailsPanelProps> = ({ execution, selectedNodeId }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
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

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Status</span>
                                <div className={`mt-1 font-bold ${execution.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'}`}>
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
                            <div className="bg-slate-900 rounded-lg p-3 overflow-hidden">
                                <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap break-all">
                                    {JSON.stringify(execution.finalResult?.value, null, 2)}
                                </pre>
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
                                <div className="p-3 bg-white max-h-60 overflow-auto">
                                     <pre className="font-mono text-xs text-gray-600 whitespace-pre-wrap">
                                        {JSON.stringify(output.value, null, 2)}
                                     </pre>
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
                        {(execution.logs || []).map((log: any, i: number) => (
                            <div key={i} className="border-b border-gray-100 p-2 flex gap-3 hover:bg-gray-50">
                                <span className="text-gray-400 min-w-[80px]">{formatTime(log.timestamp, true)}</span>
                                <span className={`font-semibold min-w-[60px] ${log.level === 'ERROR' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {log.level}
                                </span>
                                <span className="text-gray-800 break-all">{log.message}</span>
                            </div>
                        ))}
                    </div>
                );

            case 'json':
                return (
                    <div className="p-2">
                        <pre className="font-mono text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(execution, null, 2)}
                        </pre>
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
            className="bg-white border-t border-gray-200 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-20"
            style={{ height: `${height}px` }}
        >
            {/* Resize Handle */}
            <div 
                className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-500/50 transition-colors z-30"
                onMouseDown={handleMouseDown}
            />
            
            <div className="flex flex-1 overflow-hidden pt-2">
                {/* Internal Sidebar */}
                <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Execution Data</h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto">
                        <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
                        <SidebarItem id="client_info" icon={Monitor} label="Client Info" />
                        <SidebarItem id="outputs" icon={Database} label="Node Outputs" />
                        <SidebarItem id="logs" icon={Activity} label="Logs" />
                        <SidebarItem id="json" icon={Code} label="Raw JSON" />
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-white p-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
