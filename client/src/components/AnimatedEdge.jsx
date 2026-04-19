import { BaseEdge, getBezierPath } from "@xyflow/react";
import { useRef, useEffect, useState, useCallback } from "react";
import { useGlobalState } from "../context/GlobalStates";

// Edge component
export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
  ...props
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const { setEdges, selectedEdge, setSelectedEdge } = useGlobalState();
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
    </>
  );
}
