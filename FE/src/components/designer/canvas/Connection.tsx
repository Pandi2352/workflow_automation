import type { ConnectionLineComponent } from "@xyflow/react";

export const Connection: ConnectionLineComponent = ({
  fromX,
  fromY,
  toX,
  toY,
}) => (
  <g>
    <path
      className="animated"
      d={`M${fromX},${fromY} L${toX},${toY}`}
      fill="none"
      stroke="#94a3b8"
      strokeWidth={2}
      strokeDasharray="5,5"
    />
    <circle
      cx={toX}
      cy={toY}
      fill="#fff"
      r={4}
      stroke="#10b981"
      strokeWidth={2}
    />
  </g>
);
