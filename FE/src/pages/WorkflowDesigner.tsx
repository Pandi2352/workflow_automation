import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Zap, Plus } from 'lucide-react';
import { NodeDrawer } from '../components/designer/NodeDrawer';
import { NodeConfigPanel } from '../nodes/google-drive/NodeConfigPanel';
import { NodeConfigPanel as OneDriveNodeConfigPanel } from '../nodes/onedrive/NodeConfigPanel';
import { NodeConfigPanel as GmailNodeConfigPanel } from '../nodes/gmail/NodeConfigPanel';
import { NodeConfigPanel as ScheduleNodeConfigPanel } from '../nodes/schedule/NodeConfigPanel';
import { NodeConfigPanel as OCRNodeConfigPanel } from '../nodes/ocr/NodeConfigPanel';
import { NodeConfigPanel as IfElseNodeConfigPanel } from '../nodes/if-else/NodeConfigPanel';
import { NodeConfigPanel as ParsingNodeConfigPanel } from '../nodes/parsing/NodeConfigPanel';
import { NodeConfigPanel as MongoDBNodeConfigPanel } from '../nodes/mongodb/NodeConfigPanel';
import { NodeConfigPanel as SummarizeNodeConfigPanel } from '../nodes/summarize/NodeConfigPanel';
import { NodeConfigPanel as SmartExtractionNodeConfigPanel } from '../nodes/smart-extraction/NodeConfigPanel';
import FileUploadConfigPanel from '../nodes/file-upload/NodeConfigPanel';

import { DesignerHeader } from '../components/designer/DesignerHeader';
import { ExecutionModeView } from '../components/execution/ExecutionModeView';
import { useWorkflowStore } from '../store/workflowStore';
import { workflowService } from '../services/api/workflows';
import { WorkflowMetadataModal } from '../components/designer/WorkflowMetadataModal';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { WorkflowCanvas } from '../components/designer/WorkflowCanvas';
import { UnsavedChangesModal } from '../components/modals/UnsavedChangesModal';


export const WorkflowDesigner: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSaving, setIsSaving] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const navigate = useNavigate();
    const { 
        nodes, edges, setNodes, setEdges, selectedNode, addNode, activeTab,
        setWorkflowMetadata, workflowName, workflowDescription, isWorkflowActive,
        toast, showToast, hideToast, executionTrigger, 
        currentExecution, setCurrentExecution,
        isDirty, setIsDirty
    } = useWorkflowStore(); 

    // -- Unsaved Changes Blocking Logic --
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
    
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    
    // Listen for execution triggers from nodes
    useEffect(() => {
        if (executionTrigger > 0) {
            executeWorkflow();
        }
    }, [executionTrigger]);

    // Polling for latest execution (Background)
    useEffect(() => {
        if (!id || id === 'new') return;

        const pollLatestExecution = async () => {
             try {
                // 1. Lightweight check
                const latestMeta = await workflowService.getLatestExecution(id);
                
                if (latestMeta) {
                    const shouldFetch = 
                        !currentExecution || 
                        latestMeta._id !== currentExecution._id || 
                        latestMeta.status !== currentExecution.status ||
                        (latestMeta.updatedAt !== currentExecution.updatedAt);

                    if (shouldFetch) {
                         // 2. Heavy fetch only if needed
                        const fullExecution = await workflowService.getExecution(latestMeta._id);
                        setCurrentExecution(fullExecution);
                    }
                }
             } catch (error) {
                 console.error('Background polling failed', error);
             }
        };

        // Poll more frequently if active logic implies we expect triggers, or if currently viewing a running one
        const intervalId = setInterval(pollLatestExecution, 3000); 

        return () => clearInterval(intervalId);
    }, [id, currentExecution?.status, currentExecution?._id]);

    useEffect(() => {
        if (id === 'new') {
             setNodes([]);
             setEdges([]);
             setIsMetadataModalOpen(true);
        } else if (id) {
            loadWorkflow(id);
        }
    }, [id]);

    const loadWorkflow = async (workflowId: string) => {
        try {
            const workflow = await workflowService.getById(workflowId);
            if (workflow) {
                const hydratedNodes = (workflow.nodes || []).map((n: any) => ({
                    ...n,
                    // Map backend array [x,y] to ReactFlow object {x,y}
                    position: Array.isArray(n.position) 
                        ? { x: n.position[0], y: n.position[1] } 
                        : (n.position || { x: 0, y: 0 }),
                    data: {
                        ...n.data,
                        label: n.nodeName || n.id
                    }
                }));
                setNodes(hydratedNodes);
                setEdges(workflow.edges || []);
                setWorkflowMetadata({
                    workflowName: workflow.name,
                    workflowDescription: workflow.description,
                    isWorkflowActive: workflow.isActive
                });
                setIsDirty(false); // Reset dirty flag

                // Restore latest execution context
                try {
                    const executions = await workflowService.getExecutions(workflowId, 1, 1);
                    const list = Array.isArray(executions) ? executions : (executions.data || []);
                    const latest = list[0];
                    
                    if (latest && latest._id) {
                         const fullExecution = await workflowService.getExecution(latest._id);
                         setCurrentExecution(fullExecution);
                         // Optional: notify user
                         // showToast('Restored previous execution context', 'info');
                    }
                } catch (execErr) {
                    console.warn('Failed to fetch previous executions', execErr);
                }
            }
        } catch (err) {
            console.error('Failed to load workflow', err);
            showToast('Failed to load workflow', 'error');
        }
    };

    const handleMetadataSave = (data: { name: string; description: string; active: boolean }) => {
        setWorkflowMetadata({
            workflowName: data.name,
            workflowDescription: data.description,
            isWorkflowActive: data.active
        });
    };

    const handleSave = async (overrideData?: Partial<any>): Promise<string | null> => {
        setIsSaving(true);
        try {
            let currentId: string | null = id || null;
            
            // Use store values for save, but allow overrides (e.g. for immediate toggle)
            const payload = {
                name: overrideData?.name ?? (workflowName || 'Untitled Workflow'),
                description: overrideData?.description ?? (workflowDescription || ''),
                isActive: overrideData?.isActive ?? isWorkflowActive,
                nodes: nodes.map(n => ({ 
                    ...n, 
                    nodeName: n.data?.label || n.id,
                    position: [n.position.x, n.position.y],
                    measured: n.measured,
                    selected: n.selected,
                    dragging: n.dragging
                })) as any,
                edges: edges as any
            };

            if (id === 'new') {
                const newWorkflow = await workflowService.create(payload);
                currentId = newWorkflow._id;
                navigate(`/workflow/${newWorkflow._id}`, { replace: true });
            } else if (id) {
                await workflowService.update(id, payload);
            }
            
            showToast('Workflow saved successfully', 'success');
            setIsDirty(false);
            return currentId;
        } catch (error: any) {
            console.error('Failed to save workflow', error);
            
            const errorData = error.response?.data;
            const validationError = errorData?.error?.errors?.[0]?.message;
            // const mainMessage = errorData?.message || 'Failed to save workflow';
            
            showToast(
                validationError ? 'Validation Failed' : 'Save Failed', 
                'error', 
                validationError || error.message
            );
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const executeWorkflow = async () => {
         const currentId = await handleSave();
         if (!currentId) return;

         try {
             // 1. Initialize execution
             const initResult = await workflowService.initiate(currentId);
             showToast('Execution initialized', 'info');
             
             // Set initial state
             setCurrentExecution({ ...initResult, status: 'RUNNING', nodeExecutions: [] });

             // 2. Start the actual execution
             await workflowService.start(initResult.executionId);
             
             // 3. Poll for updates
             const interval = setInterval(async () => {
                 try {
                     const execData = await workflowService.getExecution(initResult.executionId);
                     setCurrentExecution(execData);
                     
                     if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execData.status)) {
                         clearInterval(interval);
                         showToast(`Execution ${execData.status.toLowerCase()}`, execData.status === 'COMPLETED' ? 'success' : 'error');
                     }
                 } catch (e) {
                     console.error('Polling failed', e);
                     clearInterval(interval);
                 }
             }, 1000); 

         } catch (error: any) {
             console.error('Execution failed', error);
             showToast('Failed to start execution', 'error', error.response?.data?.message || error.message);
         }
    };

    const handleAddNode = (type: string) => {
        const nodeId = `node_${Date.now()}`;
        const baseLabel = type.replace('_', ' '); 
        let label = baseLabel;
        let counter = 1;

        while (nodes.some(n => (n as any).nodeName === label || n.data?.label === label)) {
            label = `${baseLabel} ${counter}`;
            counter++;
        }

        const newNode = {
            id: nodeId,
            type, 
            position: { x: 100, y: 100 + nodes.length * 50 },
            data: { label },
            nodeName: label
        };
        
        addNode(newNode);
        setIsDrawerOpen(false);
    };

    // Node Types Definition


    if (!id) return <div>Invalid Workflow ID</div>;

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50">
            {/* Header */}
            <DesignerHeader 
                workflowId={id || 'new'} 
                onSave={() => handleSave()}
                isSaving={isSaving}
                onActiveChange={(active) => {
                    setWorkflowMetadata({ isWorkflowActive: active });
                    handleSave({ isActive: active }); // Key fix: Save immediately with new state
                }}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {activeTab === 'executions' ? (
                    <ExecutionModeView />
                ) : (
                    /* Editor Mode */
                    <div className="flex-1 relative flex bg-[#f4f4f4]">
                        <WorkflowCanvas 
                            onToggleDrawer={() => setIsDrawerOpen(prev => !prev)} 
                            executionData={currentExecution}
                        />

                        {/* Top Left Controls */}
                        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 border border-gray-400 rounded-lg">
                            <button 
                            onClick={() => setIsDrawerOpen(true)}
                            className="w-12 h-12 p-0 rounded-lg shadow-none hover:text-[#10b981] hover:border-[#10b981] flex items-center justify-center bg-white cursor-pointer"
                            title="Add Node"
                            >
                            <Plus size={22} className='text-gray-500' />
                            </button>
                        </div>
                        
                        {/* Execute Button */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2">
                                <Button 
                                onClick={executeWorkflow}
                                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.3)] font-semibold text-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                                leftIcon={<Zap size={16} fill="currentColor" />}
                                >
                                Execute workflow
                                </Button>
                        </div>

                        {/* Overlays */}
                        {selectedNode && selectedNode.type === 'ONEDRIVE' ? (
                            <OneDriveNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'GMAIL' ? (
                            <GmailNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'SCHEDULE' ? (
                            <ScheduleNodeConfigPanel 
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'OCR' ? (
                            <OCRNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'IF_ELSE' ? (
                            <IfElseNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'PARSING' ? (
                            <ParsingNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'MONGODB' ? (
                            <MongoDBNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'SUMMARIZE' ? (
                            <SummarizeNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'SMART_EXTRACTION' ? (
                            <SmartExtractionNodeConfigPanel
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        ) : selectedNode && selectedNode.type === 'FILE_UPLOAD' ? (
                            <FileUploadConfigPanel
                                data={selectedNode.data}
                                onChange={(newData) => {
                                    const updatedNodes = nodes.map((n) => {
                                        if (n.id === selectedNode.id) {
                                            return { ...n, data: newData };
                                        }
                                        return n;
                                    });
                                    setNodes(updatedNodes);
                                }}
                            />
                        ) : selectedNode && (
                            <NodeConfigPanel 
                                nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                    (ex: any) => ex.nodeId === selectedNode?.id
                                )} 
                            />
                        )}

                        <NodeDrawer 
                            isOpen={isDrawerOpen} 
                            onClose={() => setIsDrawerOpen(false)}
                            onNodeSelect={handleAddNode}
                        />
                    </div>
                )}
            </div>
            
            <Toast 
                message={toast.message}
                description={toast.description}
                variant={toast.variant} 
                isVisible={toast.isVisible} 
                onClose={hideToast} 
            />

            <WorkflowMetadataModal 
                isOpen={isMetadataModalOpen}
                onClose={() => setIsMetadataModalOpen(false)}
                onSave={handleMetadataSave}
                initialData={{
                    name: workflowName,
                    description: workflowDescription || '',
                    active: isWorkflowActive ?? true
                }}
            />

            <UnsavedChangesModal 
                isOpen={blocker.state === 'blocked'}
                onSaveAndExit={async () => {
                    const savedId = await handleSave();
                    if (savedId) {
                        blocker.proceed?.();
                    }
                }}
                onDiscard={() => {
                    setIsDirty(false);
                    blocker.proceed?.();
                }}
                onCancel={() => {
                    blocker.reset?.();
                }}
            />
        </div>
    );
};
