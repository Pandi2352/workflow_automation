
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionSidebar } from './ExecutionSidebar';
import { ExecutionDetailsPanel } from './ExecutionDetailsPanel';
import { ExecutionCanvas } from './ExecutionCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import { FileText, X } from 'lucide-react';
import { NodeConfigPanel as GoogleDriveConfigPanel } from '../../nodes/google-drive/NodeConfigPanel';
import { NodeConfigPanel as OneDriveConfigPanel } from '../../nodes/onedrive/NodeConfigPanel';
import { NodeConfigPanel as GmailConfigPanel } from '../../nodes/gmail/NodeConfigPanel';
import { NodeConfigPanel as ScheduleConfigPanel } from '../../nodes/schedule/NodeConfigPanel';
import { NodeConfigPanel as OCRConfigPanel } from '../../nodes/ocr/NodeConfigPanel';
import { NodeConfigPanel as IfElseConfigPanel } from '../../nodes/if-else/NodeConfigPanel';
import { NodeConfigPanel as ParsingConfigPanel } from '../../nodes/parsing/NodeConfigPanel';
import { NodeConfigPanel as MongoDBConfigPanel } from '../../nodes/mongodb/NodeConfigPanel';
import { NodeConfigPanel as SummarizeConfigPanel } from '../../nodes/summarize/NodeConfigPanel';

import { NodeConfigPanel as SmartExtractionConfigPanel } from '../../nodes/smart-extraction/NodeConfigPanel';
import FileUploadConfigPanel from '../../nodes/file-upload/NodeConfigPanel';
import { workflowService } from '../../services/api/workflows';

export const ExecutionModeView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedExecution, setSelectedExecution] = useState<any>(null);
    const [isNodeLogsOpen, setIsNodeLogsOpen] = useState(false);
    const [nodeLogs, setNodeLogs] = useState<any[]>([]);
    const [nodeLogsPage, setNodeLogsPage] = useState(1);
    const [nodeLogsHasNextPage, setNodeLogsHasNextPage] = useState(false);
    const [isNodeLogsLoading, setIsNodeLogsLoading] = useState(false);
    const [isNodeLogsLoadingMore, setIsNodeLogsLoadingMore] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
    const { 
        selectedNode, 
        setSelectedNode,
        nodes 
    }: any = useWorkflowStore();

    const handleNodeSelect = (nodeId: string) => {
        const node = nodes.find((n: any) => n.id === nodeId);
        if (node) {
            setSelectedNode(node);
        }
    };

    const handleReplayFromNode = async (nodeId: string) => {
        if (!selectedExecution?._id) return;
        try {
            const res = await workflowService.replayExecution(selectedExecution._id, nodeId);
            if (res?.executionId) {
                const full = await workflowService.getExecution(res.executionId);
                setSelectedExecution(full);
            }
        } catch (error) {
            console.error('Failed to replay from node', error);
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'Escape') {
                setContextMenu(null);
                setIsNodeLogsOpen(false);
            }
            if (e.key.toLowerCase() === 'r' && selectedNode?.id) {
                e.preventDefault();
                handleReplayFromNode(selectedNode.id);
            }
            if (e.key.toLowerCase() === 'l' && selectedNode?.id) {
                e.preventDefault();
                setIsNodeLogsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode?.id, selectedExecution?._id]);

    const fetchNodeLogs = async () => {
        if (!selectedExecution?._id || !selectedNode?.id) return;
        setIsNodeLogsLoading(true);
        try {
            const res = await workflowService.getNodeExecutionLogs(selectedExecution._id, selectedNode.id, 1, 200);
            setNodeLogs(res.logs || []);
            setNodeLogsPage(1);
            setNodeLogsHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to fetch node logs', error);
        } finally {
            setIsNodeLogsLoading(false);
        }
    };

    const loadMoreNodeLogs = async () => {
        if (!selectedExecution?._id || !selectedNode?.id || isNodeLogsLoadingMore || !nodeLogsHasNextPage) return;
        setIsNodeLogsLoadingMore(true);
        try {
            const nextPage = nodeLogsPage + 1;
            const res = await workflowService.getNodeExecutionLogs(selectedExecution._id, selectedNode.id, nextPage, 200);
            setNodeLogs(prev => [...prev, ...(res.logs || [])]);
            setNodeLogsPage(nextPage);
            setNodeLogsHasNextPage(Boolean(res.pagination?.hasNextPage));
        } catch (error) {
            console.error('Failed to load more node logs', error);
        } finally {
            setIsNodeLogsLoadingMore(false);
        }
    };

    React.useEffect(() => {
        if (!isNodeLogsOpen) return;
        fetchNodeLogs();
    }, [isNodeLogsOpen, selectedExecution?._id, selectedNode?.id]);

    React.useEffect(() => {
        if (selectedNode) {
            setIsNodeLogsOpen(true);
        }
    }, [selectedNode?.id]);

    // Poll selected execution if it is running (idle backoff)
    React.useEffect(() => {
        if (!selectedExecution || (selectedExecution.status !== 'RUNNING' && selectedExecution.status !== 'PENDING' && selectedExecution.status !== 'QUEUED')) return;
        let isCancelled = false;
        let delay = 2000;
        const maxDelay = 10000;

        const poll = async () => {
            try {
                const latestMeta = await workflowService.getLatestExecution(id!);
                const isLatest = !selectedExecution.executionNumber || (latestMeta && latestMeta._id === selectedExecution._id);

                if (isLatest) {
                    const meta = await workflowService.getLatestExecution(id!);
                    if (meta && meta.status !== selectedExecution.status) {
                        const updated = await workflowService.getExecution(selectedExecution._id);
                        setSelectedExecution(updated);
                        delay = 2000;
                    } else {
                        delay = Math.min(maxDelay, Math.round(delay * 1.5));
                    }
                } else {
                    const statusMeta = await workflowService.getExecutionStatus(selectedExecution._id);
                    if (statusMeta && statusMeta.status !== selectedExecution.status) {
                        const updated = await workflowService.getExecution(selectedExecution._id);
                        setSelectedExecution(updated);
                        delay = 2000;
                    } else {
                        delay = Math.min(maxDelay, Math.round(delay * 1.5));
                    }
                }
            } catch (error) {
                console.error('Failed to poll execution details', error);
                delay = Math.min(maxDelay, Math.round(delay * 1.5));
            } finally {
                if (!isCancelled) {
                    setTimeout(poll, delay);
                }
            }
        };

        const timerId = setTimeout(poll, delay);
        return () => {
            isCancelled = true;
            clearTimeout(timerId);
        };
    }, [selectedExecution?._id, selectedExecution?.status, id]);

    React.useEffect(() => {
        if (!selectedExecution?._id) {
            setIsNodeLogsOpen(false);
            setNodeLogs([]);
            setNodeLogsPage(1);
            setNodeLogsHasNextPage(false);
        }
    }, [selectedExecution?._id]);

    const selectedNodeData = selectedExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === selectedNode?.id);

    const handleExecutionTriggered = async (executionId: string) => {
        try {
            const full = await workflowService.getExecution(executionId);
            setSelectedExecution(full);
        } catch (error) {
            console.error('Failed to load replayed execution', error);
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden">
            {/* Left Sidebar: Execution History */}
            <div className="h-full bg-white border-r border-gray-200 z-10 flex-shrink-0">
                <ExecutionSidebar 
                    workflowId={id!} 
                    onSelectExecution={setSelectedExecution}
                    updatedExecution={selectedExecution}
                />
            </div>

            {/* Main Area: Canvas + Bottom Panel */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Canvas Area - 2/3 height roughly, or flex-1 */}
                <div className="flex-1 relative bg-slate-50" onClick={() => setContextMenu(null)}>
                    <ExecutionCanvas 
                        executionData={selectedExecution} 
                        onNodeContextMenu={(nodeId, position) => {
                            setContextMenu({ x: position.x, y: position.y, nodeId });
                        }}
                    />

                    {/* Node Logs Toggle */}
                    {selectedNode && (
                        <button
                            onClick={() => setIsNodeLogsOpen(true)}
                            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                            title="View selected node logs"
                        >
                            <FileText size={14} />
                            Node Logs
                        </button>
                    )}

                    {selectedNode && (
                        <div className="absolute top-16 right-4 z-20 text-[10px] text-slate-500 bg-white/90 border border-slate-200 px-2 py-1">
                            Shortcuts: R = Replay, L = Logs, Esc = Close
                        </div>
                    )}
                    
                    {/* Node Config Popup Overlay */}
                    {selectedNode && (
                        <>
                            {(() => {
                                switch (selectedNode.type) {
                                    case 'ONEDRIVE':
                                        return <OneDriveConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'GOOGLE_DRIVE':
                                        return <GoogleDriveConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'GMAIL':
                                        return <GmailConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'SCHEDULE':
                                        return <ScheduleConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'OCR':
                                        return <OCRConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'IF_ELSE':
                                        return <IfElseConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'PARSING':
                                        return <ParsingConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'MONGODB':
                                        return <MongoDBConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'SUMMARIZE':
                                        return <SummarizeConfigPanel nodeExecutionData={selectedNodeData} />;

                                    case 'SMART_EXTRACTION':
                                        return <SmartExtractionConfigPanel nodeExecutionData={selectedNodeData} />;
                                    case 'FILE_UPLOAD':
                                        return <FileUploadConfigPanel nodeExecutionData={selectedNodeData} />;
                                    default:
                                        return <div className="p-4 bg-white shadow rounded">Configuration not available for {selectedNode.type}</div>;
                                }
                            })()}
                        </>
                    )}
                    {contextMenu && (
                        <div
                            className="fixed z-50 bg-white border border-slate-200 shadow-lg text-xs font-medium text-slate-700"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <button
                                onClick={() => {
                                    handleNodeSelect(contextMenu.nodeId);
                                    setIsNodeLogsOpen(true);
                                    setContextMenu(null);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-slate-50"
                            >
                                View Node Logs
                            </button>
                            <button
                                onClick={() => {
                                    handleReplayFromNode(contextMenu.nodeId);
                                    setContextMenu(null);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-slate-50 border-t border-slate-100"
                            >
                                Replay From Node
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Panel: Logs/Data - Always show workflow level output now */}
                <ExecutionDetailsPanel 
                    execution={selectedExecution}
                    selectedNodeId={selectedNode?.id} 
                    onNodeSelect={handleNodeSelect}
                    onExecutionTriggered={handleExecutionTriggered}
                />
            </div>

            {/* Right Drawer: Node Logs */}
            {isNodeLogsOpen && (
                <div className="w-[360px] h-full bg-white border-l border-slate-200 z-20 flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-500" />
                            <div>
                                <div className="text-sm font-semibold text-slate-800">Node Logs</div>
                                <div className="text-[10px] text-slate-400">{selectedNode?.data?.label || selectedNode?.id}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsNodeLogsOpen(false)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                        {isNodeLogsLoading && nodeLogs.length === 0 && (
                            <div className="text-slate-400 italic">Loading logs...</div>
                        )}
                        {!isNodeLogsLoading && nodeLogs.length === 0 && (
                            <div className="text-slate-400 italic">No logs available.</div>
                        )}
                        {nodeLogs.map((log, i) => (
                            <div key={i} className="border-b border-slate-100 pb-2 mb-2">
                                <div className="text-slate-400">
                                    [{new Date(log.timestamp).toLocaleTimeString()}] <span className="font-semibold">{log.level}</span>
                                </div>
                                <div className="text-slate-700 mt-1 break-words">{log.message}</div>
                                {log.data && (
                                    <pre className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}

                        {nodeLogsHasNextPage && (
                            <div className="mt-3 text-center">
                                <button
                                    onClick={loadMoreNodeLogs}
                                    disabled={isNodeLogsLoadingMore}
                                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-60"
                                >
                                    {isNodeLogsLoadingMore ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
