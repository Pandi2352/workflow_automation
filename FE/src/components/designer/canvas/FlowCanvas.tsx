import React from 'react';
import { MiniMap } from '@xyflow/react';
import { Canvas } from './Canvas';
import { Controls } from './Controls';
import { useWorkflowStore } from '../../../store/workflowStore';

interface FlowCanvasProps {
    nodes: any[];
    edges: any[];
    nodeTypes: any;
    edgeTypes?: any;
    defaultEdgeOptions?: any;
    connectionLineComponent?: any;
    onNodesChange?: any;
    onEdgesChange?: any;
    onConnect?: any;
    onNodeClick?: any;
    onNodeContextMenu?: any;
    onPaneClick?: any;
    onDrop?: any;
    onDragOver?: any;
    fitViewOptions?: any;
    defaultViewport?: any;
    minZoom?: number;
    maxZoom?: number;
    nodesDraggable?: boolean;
    nodesConnectable?: boolean;
    elementsSelectable?: boolean;
    className?: string;
    proOptions?: any;
    showControls?: boolean;
    showMinimap?: boolean;
    children?: React.ReactNode;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    defaultEdgeOptions,
    connectionLineComponent,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onNodeContextMenu,
    onPaneClick,
    onDrop,
    onDragOver,
    fitViewOptions,
    defaultViewport,
    minZoom,
    maxZoom,
    nodesDraggable,
    nodesConnectable,
    elementsSelectable,
    className,
    proOptions,
    showControls = true,
    showMinimap = true,
    children,
}) => {
    const { showMinimap: storeMinimap } = useWorkflowStore();
    const shouldShowMinimap = showMinimap && storeMinimap;

    return (
        <Canvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineComponent={connectionLineComponent}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitViewOptions={fitViewOptions}
            defaultViewport={defaultViewport}
            minZoom={minZoom}
            maxZoom={maxZoom}
            nodesDraggable={nodesDraggable}
            nodesConnectable={nodesConnectable}
            elementsSelectable={elementsSelectable}
            className={className}
            proOptions={proOptions}
        >
            {showControls && <Controls />}
            {shouldShowMinimap && (
                <MiniMap
                    className="bg-white rounded-lg border border-gray-200"
                    nodeColor="#e5e7eb"
                    maskColor="rgba(0,0,0,0.1)"
                    draggable
                    pannable
                    zoomable
                />
            )}
            {children}
        </Canvas>
    );
};

