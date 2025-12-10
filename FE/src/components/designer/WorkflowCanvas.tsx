import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';

// Initial logic for drop
let id = 0;
const getId = () => `dndnode_${id++}`;

import { Plus } from 'lucide-react';

interface WorkflowCanvasProps {
    onToggleDrawer?: () => void;
    executionData?: any;
}

import { GenericNode } from '../../nodes/GenericNode';
import { GoogleDriveNode } from '../../nodes/google-drive/GoogleDriveNode';
import { useMemo } from 'react';

const nodeTypes = {
    GOOGLE_DRIVE: GoogleDriveNode,
    default: GenericNode, // Fallback
    input: GenericNode,
    webhook: GenericNode,
    api: GenericNode,
    transform: GenericNode,
    output: GenericNode,
    schedule: GenericNode
};

const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({ onToggleDrawer, executionData }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNode } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();
  const proOptions = { hideAttribution: true };

  // Merge nodes with execution status
  const nodesWithStatus = useMemo(() => {
      if (!executionData || !executionData.nodeExecutions) return nodes;

      return nodes.map(node => {
          const execution = executionData.nodeExecutions.find((ex: any) => ex.nodeId === node.id);
          if (!execution) return node;

          let statusClass = '';
          if (execution.status === 'SUCCESS') statusClass = '!border-green-500 !ring-2 !ring-green-200 !shadow-lg';
          else if (execution.status === 'FAILED') statusClass = '!border-red-500 !ring-2 !ring-red-200 !shadow-lg';
          else if (execution.status === 'RUNNING') statusClass = '!border-blue-500 !ring-2 !ring-blue-200 !shadow-lg';

          return {
              ...node,
              className: `${node.className || ''} ${statusClass}`,
              data: {
                  ...node.data,
                  executionStatus: execution.status,
                  executionDuration: execution.duration
              }
          };
      });
  }, [nodes, executionData]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Project coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
      setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodesWithStatus}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        className="bg-slate-50"
        proOptions={proOptions}
      >
        <Controls 
            position="bottom-left"
            orientation='horizontal'
            className="m-4 bg-white border border-slate-100 rounded-md p-1 fill-slate-500 [&>button]:border-none [&>button]:rounded-lg [&>button]:p-2 hover:[&>button]:bg-slate-50 [&>button]:transition-colors" 
        />
        <MiniMap
            className="bg-white rounded-lg border border-gray-200"
            nodeColor="#e5e7eb"
            maskColor="rgba(0,0,0,0.1)"
            draggable
            pannable
            zoomable
        />
        <Background variant={BackgroundVariant.Lines} gap={10} size={3} color="#ebedefff" />
        
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="flex items-center gap-8 pointer-events-auto">
                {/* Add First Step Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Open Drawer Clicked');
                        onToggleDrawer?.();
                    }}
                    className="group flex flex-col items-center gap-2 cursor-pointer"
                >
                    <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center bg-white hover:border-[#10b981] hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm">
                        <Plus size={32} className="text-gray-500 group-hover:text-[#10b981]" />
                    </div>
                    <span className="text-sm font-medium text-[#10b981]">Add first step...</span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
