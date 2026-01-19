import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Zap, Plus, Sparkles, FileText } from 'lucide-react';
import { NodeDrawer } from '../components/designer/NodeDrawer';
import { AIChatDrawer } from '../components/designer/AIChatDrawer';
import { TemplatesDrawer } from '../components/designer/TemplatesDrawer';

import { NODE_CONFIG_PANELS } from '../nodes/nodeConfigPanels';

import { DesignerHeader } from '../components/designer/DesignerHeader';
import { CreateWorkflowSelector } from '../components/designer/CreateWorkflowSelector';
import { ExecutionModeView } from '../components/execution/ExecutionModeView';
import { useWorkflowStore } from '../store/workflowStore';
import { workflowService } from '../services/api/workflows';
import { WorkflowMetadataModal } from '../components/designer/WorkflowMetadataModal';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { WorkflowCanvas } from '../components/designer/WorkflowCanvas';
import { UnsavedChangesModal } from '../components/modals/UnsavedChangesModal';
import { ImportExportModal } from '../components/designer/ImportExportModal';
import { WORKFLOW_SCHEMA_VERSION, SUPPORTED_WORKFLOW_SCHEMA_VERSIONS } from '../constants/workflowSchema';
import type { WorkflowExportBundle } from '../types/workflow.types';


export const WorkflowDesigner: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSaving, setIsSaving] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isTemplatesDrawerOpen, setIsTemplatesDrawerOpen] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    const [exportJson, setExportJson] = useState('');
    const [importJson, setImportJson] = useState('');
    const [importName, setImportName] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const navigate = useNavigate();
    const { 
        nodes, edges, setNodes, setEdges, selectedNode, addNode, activeTab,
        setWorkflowMetadata, workflowName, workflowDescription, isWorkflowActive, maxConcurrency,
        toast, showToast, hideToast, executionTrigger, 
        currentExecution, setCurrentExecution,
        isDirty, setIsDirty, resetWorkflowStore
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

    // Polling for latest execution (Background) with idle backoff
    useEffect(() => {
        if (!id || id === 'new') return;
        let isCancelled = false;
        let delay = 2000;
        const maxDelay = 10000;

        const pollLatestExecution = async () => {
            try {
                const latestMeta = await workflowService.getLatestExecution(id);

                if (latestMeta) {
                    const shouldFetch = 
                        !currentExecution || 
                        latestMeta._id !== currentExecution._id || 
                        latestMeta.status !== currentExecution.status ||
                        (latestMeta.updatedAt !== currentExecution.updatedAt);

                    if (shouldFetch) {
                        const fullExecution = await workflowService.getExecution(latestMeta._id);
                        setCurrentExecution(fullExecution);
                        delay = 2000; // reset on change
                    } else {
                        if (currentExecution?._id) {
                            const statusMeta = await workflowService.getExecutionStatus(currentExecution._id);
                            if (statusMeta && statusMeta.status !== currentExecution.status) {
                                const fullExecution = await workflowService.getExecution(currentExecution._id);
                                setCurrentExecution(fullExecution);
                                delay = 2000;
                            } else {
                                delay = Math.min(maxDelay, Math.round(delay * 1.5));
                            }
                        } else {
                            delay = Math.min(maxDelay, Math.round(delay * 1.5));
                        }
                    }
                } else {
                    delay = Math.min(maxDelay, Math.round(delay * 1.5));
                }
            } catch (error) {
                console.error('Background polling failed', error);
                delay = Math.min(maxDelay, Math.round(delay * 1.5));
            } finally {
                if (!isCancelled) {
                    setTimeout(pollLatestExecution, delay);
                }
            }
        };

        const timerId = setTimeout(pollLatestExecution, delay);

        return () => {
            isCancelled = true;
            clearTimeout(timerId);
        };
    }, [id, currentExecution?.status, currentExecution?._id]);

    useEffect(() => {
        if (id === 'new') {
             resetWorkflowStore();
             setShowSelector(true);
        } else if (id) {
            loadWorkflow(id);
        }
    }, [id]);

    const loadWorkflow = async (workflowId: string) => {
        try {
            const workflow = await workflowService.getById(workflowId);
            if (workflow) {
                const hydratedNodes = (workflow.nodes || []).map((n: any, index: number) => ({
                    ...n,
                    // Map backend array [x,y] to ReactFlow object {x,y}
                    position: Array.isArray(n.position) 
                        ? { x: n.position[0], y: n.position[1] } 
                        : (n.position || { x: 0, y: 0 }),
                    className: `${n.className || ''} node-reveal`.trim(),
                    style: { ...(n.style || {}), animationDelay: `calc(var(--node-reveal-stagger, 30ms) * ${index})` },
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
                    isWorkflowActive: workflow.isActive,
                    maxConcurrency: workflow.settings?.maxConcurrency ?? 2
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



    const handleMetadataSave = (data: { name: string; description: string; active: boolean; maxConcurrency: number }) => {
        setWorkflowMetadata({
            workflowName: data.name,
            workflowDescription: data.description,
            isWorkflowActive: data.active,
            maxConcurrency: data.maxConcurrency
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
                schemaVersion: WORKFLOW_SCHEMA_VERSION,
                isActive: overrideData?.isActive ?? isWorkflowActive,
                nodes: nodes.map(n => ({ 
                    ...n, 
                    nodeName: n.data?.label || n.id,
                    position: [n.position.x, n.position.y],
                    measured: n.measured,
                    selected: n.selected,
                    dragging: n.dragging
                })) as any,
                edges: edges as any,
                settings: {
                    maxConcurrency
                }
            };

            if (id === 'new') {
                const newWorkflow = await workflowService.create(payload);
                currentId = newWorkflow._id;
                setIsDirty(false); // Reset dirty flag BEFORE navigation
                navigate(`/workflow/${newWorkflow._id}`, { replace: true });
            } else if (id) {
                await workflowService.update(id, payload);
                setIsDirty(false);
            }
            
            showToast('Workflow saved successfully', 'success');
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

    const buildLocalExportBundle = (): WorkflowExportBundle => {
        const exportedNodes = nodes.map((node: any) => {
            const position = Array.isArray(node.position)
                ? node.position
                : [node.position?.x ?? 0, node.position?.y ?? 0];

            return {
                ...node,
                nodeName: node.nodeName || node.data?.label || node.id,
                position,
                measured: node.measured,
                selected: node.selected,
                dragging: node.dragging,
            };
        });

        return {
            schemaVersion: WORKFLOW_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            workflow: {
                name: workflowName || 'Untitled Workflow',
                description: workflowDescription || '',
                schemaVersion: WORKFLOW_SCHEMA_VERSION,
                isActive: isWorkflowActive,
                nodes: exportedNodes as any,
                edges: edges as any,
                settings: { maxConcurrency },
            },
        };
    };

    const handleOpenImportExport = async () => {
        let bundle: WorkflowExportBundle;
        if (id && id !== 'new') {
            try {
                bundle = await workflowService.exportWorkflow(id);
            } catch (error) {
                console.warn('Export via API failed, falling back to local payload', error);
                bundle = buildLocalExportBundle();
            }
        } else {
            bundle = buildLocalExportBundle();
        }

        setExportJson(JSON.stringify(bundle, null, 2));
        setIsImportExportOpen(true);
    };

    const handleCopyExport = async () => {
        try {
            await navigator.clipboard.writeText(exportJson);
            showToast('Export JSON copied', 'success');
        } catch (error) {
            console.error('Copy failed', error);
            showToast('Failed to copy JSON', 'error');
        }
    };

    const handleDownloadExport = () => {
        const blob = new Blob([exportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (workflowName || 'workflow').replace(/[^\w.-]+/g, '-');
        link.href = url;
        link.download = `${safeName}-export.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportWorkflow = async () => {
        if (!importJson.trim()) {
            showToast('Paste workflow JSON to import', 'info');
            return;
        }

        setIsImporting(true);
        try {
            const parsed = JSON.parse(importJson);
            let bundle: WorkflowExportBundle;

            if (parsed?.workflow) {
                bundle = parsed as WorkflowExportBundle;
            } else if (parsed?.nodes && parsed?.edges) {
                bundle = {
                    schemaVersion: parsed.schemaVersion ?? WORKFLOW_SCHEMA_VERSION,
                    exportedAt: new Date().toISOString(),
                    workflow: parsed,
                };
            } else {
                throw new Error('Invalid JSON format. Expecting export bundle or workflow payload.');
            }

            const schemaVersion = bundle.schemaVersion ?? WORKFLOW_SCHEMA_VERSION;
            if (!SUPPORTED_WORKFLOW_SCHEMA_VERSIONS.includes(schemaVersion)) {
                throw new Error(`Unsupported schema version: ${schemaVersion}`);
            }

            const payload = {
                ...bundle,
                schemaVersion,
                name: importName.trim() || undefined,
            };

            const imported = await workflowService.importWorkflow(payload as any);
            showToast('Workflow imported successfully', 'success');
            setIsImportExportOpen(false);
            setImportJson('');
            setImportName('');
            navigate(`/workflow/${imported._id}`, { replace: true });
        } catch (error: any) {
            console.error('Import failed', error);
            showToast('Import failed', 'error', error?.message || 'Invalid JSON');
        } finally {
            setIsImporting(false);
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
            className: 'node-reveal',
            style: { animationDelay: '0ms' },
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
                onOpenImportExport={handleOpenImportExport}
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
                        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
                             <button 
                 onClick={() => setIsAiModalOpen(true)}
                 className="w-12 h-12 p-0 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white cursor-pointer transition-all border border-white/20"
                 title="AI Workflow Architect"
             >
                 <Sparkles size={22} />
             </button>

            <button 
                 onClick={() => setIsTemplatesDrawerOpen(true)}
                 className="w-12 h-12 p-0 rounded-lg shadow-md hover:text-indigo-600 hover:border-indigo-600 flex items-center justify-center bg-white cursor-pointer border border-gray-200"
                 title="Pre-built Templates"
             >
                 <FileText size={22} className='text-gray-500' />
             </button>

             <button 
                 onClick={() => setIsDrawerOpen(true)}
                                className="w-12 h-12 p-0 rounded-lg shadow-md hover:text-[#10b981] hover:border-[#10b981] flex items-center justify-center bg-white cursor-pointer border border-gray-200"
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
                        {selectedNode && (() => {
                            if (selectedNode.type === 'FILE_UPLOAD') {
                                const FileUploadPanel = NODE_CONFIG_PANELS.FILE_UPLOAD as any;
                                return (
                                    <FileUploadPanel
                                        data={selectedNode.data}
                                        onChange={(newData: any) => {
                                            const updatedNodes = nodes.map((n) => {
                                                if (n.id === selectedNode.id) {
                                                    return { ...n, data: newData };
                                                }
                                                return n;
                                            });
                                            setNodes(updatedNodes);
                                        }}
                                    />
                                );
                            }

                            const Panel = NODE_CONFIG_PANELS[selectedNode.type as any];
                            if (Panel) {
                                return (
                                    <Panel
                                        nodeExecutionData={currentExecution?.nodeExecutions?.find(
                                            (ex: any) => ex.nodeId === selectedNode?.id
                                        )}
                                    />
                                );
                            }

                            return (
                                <div className="p-4 bg-white shadow rounded">
                                    Configuration not available for {selectedNode.type}
                                </div>
                            );
                        })()}

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
                    active: isWorkflowActive ?? true,
                    maxConcurrency
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

            <AIChatDrawer 
                isOpen={isAiModalOpen} 
                onClose={() => setIsAiModalOpen(false)} 
            />

            <TemplatesDrawer 
                isOpen={isTemplatesDrawerOpen}
                onClose={() => setIsTemplatesDrawerOpen(false)}
            />

            <ImportExportModal
                isOpen={isImportExportOpen}
                onClose={() => setIsImportExportOpen(false)}
                exportJson={exportJson}
                onCopyExport={handleCopyExport}
                onDownloadExport={handleDownloadExport}
                importJson={importJson}
                onImportJsonChange={setImportJson}
                importName={importName}
                onImportNameChange={setImportName}
                onImport={handleImportWorkflow}
                isImporting={isImporting}
            />

            {showSelector && (
                <CreateWorkflowSelector 
                    onSelectAI={() => {
                        setShowSelector(false);
                        setIsAiModalOpen(true);
                    }}
                    onSelectScratch={() => {
                        setShowSelector(false);
                        setIsMetadataModalOpen(true);
                    }}
                    onClose={() => {
                        setShowSelector(false);
                        if (nodes.length === 0) navigate('/dashboard');
                    }}
                />
            )}
        </div>
    );
};
