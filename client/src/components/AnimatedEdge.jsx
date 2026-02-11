import { BaseEdge, getBezierPath } from "@xyflow/react";

export default function AnimatedEdge(props) {
  const { sourceX, sourceY, targetX, targetY, markerEnd, style, data } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      {/* Normal edge line */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Animated dot */}
      {data && data.animate && (
        <circle r="5" fill="#ff9800">
          <animateMotion dur="0.5s" path={edgePath} repeatCount="1" />
        </circle>
      )}
    </>
  );
}
