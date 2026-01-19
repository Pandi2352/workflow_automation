import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  getSimpleBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) => {
  const [edgePath] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      className="stroke-1"
      id={id}
      path={edgePath}
      style={{
        stroke: selected ? "var(--muted-foreground)" : "var(--border)",
        strokeDasharray: "5, 5",
      }}
    />
  );
};


const Animated = ({ id, style, selected, markerEnd, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) => {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.5, // Smoother curve for vertical connections
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{
          ...style,
          stroke: selected ? "#6366f1" : "var(--color-ring)",
          strokeWidth: selected ? 3 : 2,
          transition: "all 0.2s ease",
          animation: "dashdraw 0.8s linear infinite",
          strokeDasharray: 6,
          opacity: selected ? 1 : 0.8,
        }}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className={cn(
              "w-6 h-6 bg-white border border-slate-200 text-slate-400 rounded-full cursor-pointer flex items-center justify-center transition-all shadow-sm hover:border-red-400 hover:text-red-500 hover:scale-110",
              selected ? "opacity-100 scale-100" : "opacity-0 hover:opacity-100 scale-90"
            )}
            onClick={onEdgeClick}
            aria-label="Delete Edge"
            title="Delete Connection"
          >
            <X size={12} />
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
