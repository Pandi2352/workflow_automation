import React, { useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
 } from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Plus, LayoutGrid, RotateCcw, RotateCw } from 'lucide-react';
import { Controls } from './Controls'; // Import custom Controls
import { Canvas } from './Canvas'; // Import custom Canvas
import { Connection } from './Connection'; // Import custom Connection
import { Button } from '../../common/Button';

import { GenericNode } from '../../nodes/GenericNode';
import { GoogleDriveNode } from '../../nodes/google-drive/GoogleDriveNode';
import { OneDriveNode } from '../../nodes/onedrive/OneDriveNode';
import { GmailNode } from '../../nodes/gmail/GmailNode';
import { ScheduleNode } from '../../nodes/schedule/ScheduleNode';
import { OCRNode } from '../../nodes/ocr/OCRNode';
import { IfElseNode } from '../../nodes/if-else/IfElseNode';
import { ParsingNode } from '../../nodes/parsing/ParsingNode';
import { MongoDBNode } from '../../nodes/mongodb/MongoDBNode';
import { SummarizeNode } from '../../nodes/summarize/SummarizeNode';
import { OutlookNode } from '../../nodes/outlook/OutlookNode';

import { SmartExtractionNode } from '../../nodes/smart-extraction/SmartExtractionNode';
import FileUploadNode from '../../nodes/file-upload/FileUploadNode';
import { HttpNode } from '../../nodes/http-request/HttpNode';
import { DataMapperNode } from '../../nodes/data-mapper/DataMapperNode';
import { ScraperNode } from '../../nodes/scraper/ScraperNode';
import { SuryaOCRNode } from '../../nodes/surya-ocr/SuryaOCRNode';
import { TesseractOCRNode } from '../../nodes/tesseract-ocr/TesseractOCRNode';
import { CodeNode } from '../../nodes/code/CodeNode';

import { Edge } from './Edge';
import { CollaborativeCursors } from './CollaborativeCursors';
import { getLayoutedElements } from '../../utils/layoutUtils';

// Initial logic for drop
let id = 0;
const getId = () => `dndnode_${id++}`;

interface WorkflowCanvasProps {
    onToggleDrawer?: () => void;
    executionData?: any;
}

const nodeTypes = {
    GOOGLE_DRIVE: GoogleDriveNode,
    ONEDRIVE: OneDriveNode,
    GMAIL: GmailNode,
    SCHEDULE: ScheduleNode,
    OCR: OCRNode,
    IF_ELSE: IfElseNode,
    PARSING: ParsingNode,
    MONGODB: MongoDBNode,
    SUMMARIZE: SummarizeNode,
    OUTLOOK: OutlookNode,

    SMART_EXTRACTION: SmartExtractionNode,
    FILE_UPLOAD: FileUploadNode,
    HTTP_REQUEST: HttpNode,
    DATA_MAPPER: DataMapperNode,
    BROWSER_SCRAPER: ScraperNode,
    SURYA_OCR: SuryaOCRNode,
    TESSERACT_OCR: TesseractOCRNode,
    CODE: CodeNode,
    default: GenericNode, // Fallback
    input: GenericNode,
    webhook: GenericNode,
    api: GenericNode,
    transform: GenericNode,
    output: GenericNode,
};

const edgeTypes = {
  deletable: Edge.Animated, // Use Animated as default for 'deletable' or replace deletable entirely? Let's map 'deletable' to Edge.Animated for now as it's the main edge.
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

const defaultEdgeOptions = {
    type: 'animated', // Default to animated
    animated: true,
};

const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({ onToggleDrawer, executionData }) => {
  const { id } = useParams<{ id: string }>();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
      nodes, 
      edges, 
      onNodesChange, 
      onEdgesChange, 
      onConnect, 
      addNode, 
      setNodes, 
      setEdges, 
      setSelectedNode,
      undo,
      redo,
      past,
      future,
      pushToHistory
  } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();
  const proOptions = { hideAttribution: true };


  // Merge nodes with execution status
  const nodesWithStatus = useMemo(() => {
      if (!executionData || !executionData.nodeExecutions) return nodes;

      return nodes.map((node) => {
          const execution = executionData.nodeExecutions.find((ex: any) => ex.nodeId === node.id);
          if (!execution) return node;

          let statusClass = '';
          if (execution.status === 'SUCCESS') statusClass = '!border-gray-500 !rounded-sm';
          else if (execution.status === 'FAILED') statusClass = '!border-gray-500';
          else if (execution.status === 'RUNNING') statusClass = '!border-gray-500';

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

  const onLayout = useCallback((direction: string) => {
    pushToHistory(); // Save state before auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [pushToHistory, nodes, edges, setNodes, setEdges]);

  return (
    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
      <Canvas
        nodes={nodesWithStatus}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        edges={edges}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={Connection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
        minZoom={0.5}
        maxZoom={2}
        className="bg-slate-50"
        proOptions={proOptions}
      >
        <Controls>
             <Button 
                onClick={() => onLayout('LR')} 
                title="Auto Layout" 
                size="icon" 
                variant="ghost"
                className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
             >
                <LayoutGrid className="size-4" />
             </Button>
             <Button 
                onClick={() => undo()} 
                disabled={past.length === 0} 
                title="Undo" 
                size="icon" 
                variant="ghost"
                className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
             >
                <RotateCcw className={`size-4 ${past.length === 0 ? "opacity-30" : ""}`} />
             </Button>
             <Button 
                onClick={() => redo()} 
                disabled={future.length === 0} 
                title="Redo" 
                size="icon" 
                variant="ghost"
                className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-none shadow-none"
             >
                <RotateCw className={`size-4 ${future.length === 0 ? "opacity-30" : ""}`} />
             </Button>
        </Controls>
        {useWorkflowStore.getState().showMinimap && (
            <MiniMap
                className="bg-white rounded-lg border border-gray-200"
                nodeColor="#e5e7eb"
                maskColor="rgba(0,0,0,0.1)"
                draggable
                pannable
                zoomable
            />
        )}
        
      </Canvas>

      <CollaborativeCursors workflowId={executionData?.workflowId || id || 'global-room'} />

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
