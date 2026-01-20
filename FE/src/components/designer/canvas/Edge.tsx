import React, { useState } from "react";
import {
  BaseEdge,
  type EdgeProps,
  getSmoothStepPath,
  getBezierPath,
  getSimpleBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
  Position,
} from "@xyflow/react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) => {
  // Use Bezier for Tool nodes (Top/Bottom handles)
  const isToolConnection = sourcePosition === Position.Top || sourcePosition === Position.Bottom || 
                           targetPosition === Position.Top || targetPosition === Position.Bottom;

  const [edgePath] = isToolConnection 
    ? getSimpleBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    : getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 });

  return (
    <BaseEdge
      className="stroke-1"
      id={id}
      path={edgePath}
      style={{
        stroke: "#94a3b8",
        strokeDasharray: "5, 5",
      }}
    />
  );
};


const Animated = ({ 
    id, 
    style, 
    selected, 
    markerEnd, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition,
    source,
    target 
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  // Use Bezier for Tool nodes (Top/Bottom handles)
  const isToolConnection = sourcePosition === Position.Top || sourcePosition === Position.Bottom || 
                           targetPosition === Position.Top || targetPosition === Position.Bottom;

  const [edgePath, labelX, labelY] = isToolConnection
    ? getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    : getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 12 });


  const isActive = isHovered || selected;

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  const onAddNodeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    const event = new CustomEvent('add-node-between', { 
        detail: { 
            edgeId: id,
            sourceId: source,
            targetId: target,
            position: { x: labelX, y: labelY }
        } 
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Main edge line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isActive ? "#6366f1" : "#cbd5e1"}
        strokeWidth={isActive ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-150"
        markerEnd={markerEnd}
      />

      {/* Invisible interaction path for better hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ cursor: "pointer", pointerEvents: "stroke" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1.5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Add Node Button */}
          <button
            className={cn(
              "w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-full cursor-pointer flex items-center justify-center transition-all shadow-md hover:border-emerald-500 hover:text-emerald-500 hover:scale-110",
              isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
            onClick={onAddNodeClick}
            aria-label="Add Node"
            title="Add Node Between"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>

          {/* Delete Edge Button */}
          <button
            className={cn(
              "w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-full cursor-pointer flex items-center justify-center transition-all shadow-md hover:border-red-500 hover:text-red-500 hover:scale-110",
              isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
            onClick={onEdgeClick}
            aria-label="Delete Edge"
            title="Delete Connection"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export const Edge = {
  Temporary,
  Animated,
};
