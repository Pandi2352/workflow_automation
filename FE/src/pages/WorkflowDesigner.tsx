import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Maximize, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import { NodeDrawer } from '../components/designer/NodeDrawer';
import { WorkflowCanvas } from '../components/designer/WorkflowCanvas';
import { NodeConfigPanel } from '../components/designer/NodeConfigPanel';
import { DesignerHeader } from '../components/designer/DesignerHeader';
import { useWorkflowStore } from '../store/workflowStore';
import { workflowService } from '../services/api/workflows';

export const WorkflowDesigner: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const navigate = useNavigate();
    const { nodes, edges, setNodes, setEdges, selectedNode } = useWorkflowStore(); // Access state directly

    useEffect(() => {
        if (id === 'new') {
             // Reset store for new workflow
             setNodes([]);
             setEdges([]);
        } else if (id) {
            loadWorkflow(id);
        }
    }, [id]);

    const loadWorkflow = async (workflowId: string) => {
        try {
            const workflow = await workflowService.getById(workflowId);
            if (workflow) {
                setNodes(workflow.nodes || []);
                setEdges(workflow.edges || []);
            }
        } catch (err) {
            console.error('Failed to load workflow', err);
        }
    };

    const handleSave = async (): Promise<string | null> => {
        setIsSaving(true);
        try {
            const workflowData = {
                nodes: nodes as any,
                edges: edges as any,
                ...(id === 'new' ? { name: 'Untitled Workflow', description: '' } : {}) 
            };

            let currentId: string | null = id || null;

            if (id === 'new') {
                const newWorkflow = await workflowService.create(workflowData);
                currentId = newWorkflow._id;
                navigate(`/workflow/${newWorkflow._id}`, { replace: true });
            } else if (id) {
                await workflowService.update(id, workflowData);
            }
            return currentId;
        } catch (error) {
            console.error('Failed to save workflow', error);
            alert('Failed to save workflow');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const executeWorkflow = async () => {
         const currentId = await handleSave();
         if (!currentId) return;

         try {
             const result = await workflowService.run(currentId);
             console.log('Execution result:', result);
             alert(`Execution Started: ${result.executionId}`);
         } catch (error) {
             console.error('Execution failed', error);
             alert('Failed to start execution');
         }
    };

    if (!id) return <div>Invalid Workflow ID</div>;

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50">
            {/* Header */}
            <DesignerHeader 
                workflowId={id || 'new'} 
                onSave={handleSave}
                isSaving={isSaving}
            />

            <div className="flex flex-1 overflow-hidden relative">
                
                {/* Main Canvas Area */}
                <div className="flex-1 relative flex bg-[#f4f4f4]">
                    <WorkflowCanvas />

                    {/* Top Right Controls */}
                    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                         <button 
                            onClick={() => setIsDrawerOpen(true)}
                            className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center text-slate-600 hover:text-[#10b981] hover:border-[#10b981] transition-all cursor-pointer"
                            title="Add Node"
                         >
                            <Plus size={24} />
                         </button>
                    </div>
                    
                    {/* Floating Bottom Bar for Execution */}
                     <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2">
                          <div className="flex bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-1 border border-slate-200">
                              <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors border-r border-slate-100 cursor-pointer">
                                 <Maximize size={18} />
                              </button>
                              <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors border-r border-slate-100 cursor-pointer">
                                 <ZoomOut size={18} />
                              </button>
                              <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors cursor-pointer">
                                 <ZoomIn size={18} />
                              </button>
                          </div>

                          <button 
                             onClick={executeWorkflow}
                             className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.3)] font-semibold text-sm flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                          >
                             <Zap size={16} fill="currentColor" />
                             Execute workflow
                          </button>
                     </div>

                    {/* Config Panel Overlay */}
                    {selectedNode && <NodeConfigPanel />}
                </div>

                {/* Node Drawer */}
                <NodeDrawer 
                    isOpen={isDrawerOpen} 
                    onClose={() => setIsDrawerOpen(false)} 
                />
            </div>
        </div>
    );
};
