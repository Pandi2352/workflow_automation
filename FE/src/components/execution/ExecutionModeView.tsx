
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

    // Poll selected execution if it is running
    React.useEffect(() => {
        if (!selectedExecution || (selectedExecution.status !== 'RUNNING' && selectedExecution.status !== 'PENDING')) return;

        const intervalId = setInterval(async () => {
             try {
                // 1. Lightweight check
                const latestMeta = await workflowService.getLatestExecution(id!); // Use workflow ID to get latest? No, we need specific execution status.
                // Wait, getLatestExecution gets the LATEST execution for the workflow.
                // If we are viewing an older execution, this logic is flawed.
                // We should check the status of the *specific* execution we are viewing.
                // But we don't have a lightweight "getExecutionStatus(execId)" endpoint yet.
                // For now, let's just use getExecution (full) because users usually view the running one (which is the latest).
                // OR we can rely on `getLatestExecution` IF the selected execution IS the latest one.
                
                const isLatest = !selectedExecution.executionNumber || (latestMeta && latestMeta._id === selectedExecution._id);

                if (isLatest) {
                     const meta = await workflowService.getLatestExecution(id!);
                     if (meta && meta.status !== selectedExecution.status) {
                         const updated = await workflowService.getExecution(selectedExecution._id);
                         setSelectedExecution(updated);
                     }
                } else {
                    // Fallback for non-latest executions (rarely running, but possible)
                    const updated = await workflowService.getExecution(selectedExecution._id);
                    if (updated.status !== selectedExecution.status) {
                         setSelectedExecution(updated);
                    }
                }
            } catch (error) {
                console.error('Failed to poll execution details', error);
            }
        }, 3000);

        return () => clearInterval(intervalId);
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
