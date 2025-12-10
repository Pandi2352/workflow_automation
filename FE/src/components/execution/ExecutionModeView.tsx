
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExecutionSidebar } from './ExecutionSidebar';
import { ExecutionDetailsPanel } from './ExecutionDetailsPanel';
import { ExecutionCanvas } from './ExecutionCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import { NodeConfigPanel } from '../../nodes/google-drive/NodeConfigPanel';

export const ExecutionModeView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedExecution, setSelectedExecution] = useState<any>(null);
    const { selectedNode, } = useWorkflowStore();

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden">
            {/* Left Sidebar: Execution History */}
            <div className="h-full bg-white border-r border-gray-200 z-10 flex-shrink-0">
                <ExecutionSidebar 
                    workflowId={id!} 
                    onSelectExecution={setSelectedExecution}
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
                    {selectedNode && <NodeConfigPanel />}
                </div>

                {/* Bottom Panel: Logs/Data - Always show workflow level output now */}
                <ExecutionDetailsPanel 
                    execution={selectedExecution}
                    selectedNodeId={null} 
                />
            </div>
        </div>
    );
};
