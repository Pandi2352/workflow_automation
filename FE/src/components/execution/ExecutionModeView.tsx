
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionSidebar } from './ExecutionSidebar';
import { ExecutionDetailsPanel } from './ExecutionDetailsPanel';
import { ExecutionCanvas } from './ExecutionCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
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

    const selectedNodeData = selectedExecution?.nodeExecutions?.find((ex: any) => ex.nodeId === selectedNode?.id);

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
                <div className="flex-1 relative bg-slate-50">
                    <ExecutionCanvas 
                        executionData={selectedExecution} 
                    />
                    
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
                </div>

                {/* Bottom Panel: Logs/Data - Always show workflow level output now */}
                <ExecutionDetailsPanel 
                    execution={selectedExecution}
                    selectedNodeId={selectedNode?.id} 
                    onNodeSelect={handleNodeSelect}
                />
            </div>
        </div>
    );
};
