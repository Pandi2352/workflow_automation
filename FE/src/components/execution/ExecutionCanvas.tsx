
import React, { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';
import { GenericNode } from '../../nodes/GenericNode';
import { GoogleDriveNode } from '../../nodes/google-drive/GoogleDriveNode';

interface ExecutionCanvasProps {
    executionData?: any;
    onNodeClick?: (nodeId: string) => void;
}

const nodeTypes = {
    GOOGLE_DRIVE: GoogleDriveNode,
    default: GenericNode, 
    input: GenericNode,
    webhook: GenericNode,
    api: GenericNode,
    transform: GenericNode,
    output: GenericNode,
    schedule: GenericNode
};

const ExecutionCanvasInner: React.FC<ExecutionCanvasProps> = ({ executionData, onNodeClick }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // We utilize the store for the layout, assuming the workflow structure hasn't drifted significantly.
  // In a production system, we would load the 'snapshot' of the workflow from the execution data.
  const { nodes, edges, setSelectedNode } = useWorkflowStore(); 
  
  const proOptions = { hideAttribution: true };

  // Merge nodes with execution status
  const nodesWithStatus = useMemo(() => {
      if (!executionData || !executionData.nodeExecutions) return nodes;

      return nodes.map(node => {
          const execution = executionData.nodeExecutions.find((ex: any) => ex.nodeId === node.id);
          
          let statusClass = '';
          if (execution) {
             if (execution.status === 'SUCCESS') statusClass = '!border-green-500 !ring-2 !ring-green-200 !shadow-lg';
             else if (execution.status === 'FAILED') statusClass = '!border-red-500 !ring-2 !ring-red-200 !shadow-lg';
             else if (execution.status === 'RUNNING') statusClass = '!border-blue-500 !ring-2 !ring-blue-200 !shadow-lg';
          }

          // If this node was unrelated to the execution (e.g. added later), it stays default.
          return {
              ...node,
              className: `${node.className || ''} ${statusClass}`,
              data: {
                  ...node.data,
                  label: execution?.nodeName || node.data.label,
                  executionStatus: execution ? execution.status : undefined,
                  executionDuration: execution ? execution.duration : undefined
              }
          };
      });
  }, [nodes, executionData]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: any) => {
      setSelectedNode(node); // Update global selection if needed
      if (onNodeClick) onNodeClick(node.id);
  }, [setSelectedNode, onNodeClick]);

  return (
    <div className="flex-1 h-full relative bg-slate-50/[0.5]" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodesWithStatus}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        className="bg-slate-50/[0.5]"
        proOptions={proOptions}
      >
        <Controls 
            position="bottom-left"
            orientation='horizontal'
            className="m-4 bg-white border border-slate-100 rounded-md p-1" 
            showInteractive={false} // Hide interactive controls like lock/unlock if supported
        />
        <MiniMap
            className="bg-white rounded-lg border border-gray-200"
            nodeColor="#e5e7eb"
            maskColor="rgba(0,0,0,0.1)"
        />
        {/* Lighter background to differentiate from Editor */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        
        {/* Read Only Badge */}
        <div className="absolute top-4 right-4 bg-gray-100/80 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 pointer-events-none z-10 selection:bg-none flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            Read Only Mode
        </div>
      </ReactFlow>
    </div>
  );
};

export const ExecutionCanvas: React.FC<ExecutionCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ExecutionCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
