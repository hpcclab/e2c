import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import {
  formatDataRate,
  getEdgeNetworkVisual,
  resolveEdgeNetwork,
} from "../utils/edgeNetwork";
import { useGlobalState } from "../context/GlobalStates";

export default function AnimatedEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}) {
  const { iot } = useGlobalState();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const sourceId = String(source ?? "").replace(/^nd_/, "");
  const sourceProperties = iot.find(
    (candidate) => String(candidate.id) === sourceId,
  )?.properties;
  const network = resolveEdgeNetwork({ data }, sourceProperties);
  const visual = getEdgeNetworkVisual(network.networkType);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={26}
        style={{
          ...style,
          stroke: visual.color,
          strokeWidth: 3,
          strokeDasharray: visual.dash,
          strokeLinecap: "round",
          cursor: "pointer",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none rounded-full border bg-white/95 px-2 py-1 text-[10px] font-semibold shadow-sm"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            color: visual.color,
            borderColor: `${visual.color}66`,
          }}
        >
          {network.networkType} · {formatDataRate(network.dataRateKbps)}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
