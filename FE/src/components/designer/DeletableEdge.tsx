import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps, // Fix: Use type-only import
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';

export const DeletableEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const { setEdges } = useReactFlow();
  // Using getSmoothStepPath directly gives us the path and label coordinates
  // similar to type="smoothstep"
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20, // Rounded corners for smoothstep
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="w-5 h-5 bg-white border border-red-200 text-red-500 rounded-full cursor-pointer flex items-center justify-center hover:bg-red-50 hover:border-red-400 transition-all shadow-sm opacity-0 group-hover:opacity-100 hover:opacity-100"
            onClick={onEdgeClick}
            aria-label="Delete Edge"
            title="Delete Connection"
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
