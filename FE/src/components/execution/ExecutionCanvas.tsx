
import React, { useMemo, useCallback, useRef } from 'react';
import {
  ReactFlowProvider,
} from '@xyflow/react';
import { FlowCanvas } from '../designer/FlowCanvas';
import { useWorkflowStore } from '../../store/workflowStore';
import { NODE_TYPES } from '../../nodes/nodeTypes';

interface ExecutionCanvasProps {
    executionData?: any;
    onNodeClick?: (nodeId: string) => void;
    onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
}

const nodeTypes = NODE_TYPES;

const ExecutionCanvasInner: React.FC<ExecutionCanvasProps> = ({ executionData, onNodeClick, onNodeContextMenu }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // We utilize the store for the layout, assuming the workflow structure hasn't drifted significantly.
  // In a production system, we would load the 'snapshot' of the workflow from the execution data.
  const { nodes, edges, setSelectedNode } = useWorkflowStore(); 
  
  const proOptions = { hideAttribution: true };

  // Merge nodes with execution status
  const nodesWithStatus = useMemo(() => {
    if (!executionData || !executionData.nodeExecutions) return nodes;

    // Check if we have embedded positions (New Backend Format)
    const hasEmbeddedPositions = executionData.nodeExecutions.some((ex: any) => ex.position && (Array.isArray(ex.position) || ex.position.x !== undefined));

    if (hasEmbeddedPositions) {
        // Reconstruct nodes entirely from execution history
        return executionData.nodeExecutions.map((ex: any, index: number) => {
            let statusClass = '';
            if (ex.status === 'SUCCESS') statusClass = '!border-green-500 !ring-2 !ring-green-200 !shadow-lg';
            else if (ex.status === 'FAILED') statusClass = '!border-red-500 !ring-2 !ring-red-200 !shadow-lg';
            else if (ex.status === 'RUNNING') statusClass = '!border-blue-500 !ring-2 !ring-blue-200 !shadow-lg';

            // Handle both legacy object and new array format
            let pos = { x: 0, y: 0 };
            if (Array.isArray(ex.position)) {
                pos = { x: ex.position[0], y: ex.position[1] };
            } else if (ex.position) {
                pos = ex.position;
            }

            return {
                id: ex.nodeId,
                type: ex.nodeType,
                position: pos,
                measured: ex.measured,
                draggable: false,
                connectable: false,
                className: `${statusClass} bg-white rounded-xl node-reveal`, // Ensure basic styling
                style: { animationDelay: `calc(var(--node-reveal-stagger, 30ms) * ${index})` },
                data: {
                    ...ex.data, // Use the data snapshot from execution
                    label: ex.nodeName,
                    executionStatus: ex.status,
                    executionDuration: ex.duration,
                }
            };
        });
    }

    // Fallback for legacy executions: Overlay status on CURRENT workflow nodes
    return nodes.map((node, index) => {
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
            className: `${node.className || ''} ${statusClass} node-reveal`.trim(),
            style: { ...(node.style || {}), animationDelay: `calc(var(--node-reveal-stagger, 30ms) * ${index})` },
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

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
      event.preventDefault();
      if (onNodeContextMenu) {
          onNodeContextMenu(node.id, { x: event.clientX, y: event.clientY });
      }
  }, [onNodeContextMenu]);

  return (
    <div className="flex-1 h-full relative bg-slate-50/[0.5]" ref={reactFlowWrapper}>
      <FlowCanvas
        nodes={nodesWithStatus}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        fitViewOptions={{ padding: 0.2, maxZoom: 1, duration: 200 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        className="bg-slate-50/[0.5]"
        proOptions={proOptions}
        showControls={false}
      >
        {/* Read Only Badge */}
        <div className="absolute top-4 right-4 bg-gray-100/80 backdrop-blur-sm border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 pointer-events-none z-10 selection:bg-none flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            Read Only Mode
        </div>
      </FlowCanvas>
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
