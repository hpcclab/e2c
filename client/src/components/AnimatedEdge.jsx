import { BaseEdge, getBezierPath } from "@xyflow/react";
import { useRef, useEffect } from "react";
import { useGlobalState } from "../context/GlobalStates";

// Individual packet component
function Packet({ packetId, edgeId, edgePath, removePacket }) {
  const animRef = useRef(null);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;

    const handleEnd = () => {
      removePacket(edgeId, packetId);
    };

    anim.addEventListener("endEvent", handleEnd);
    return () => anim.removeEventListener("endEvent", handleEnd);
  }, [edgeId, packetId, removePacket]);

  return (
    <circle r="5" fill="#ff9800">
      <animateMotion
        ref={animRef}
        dur="0.5s"
        path={edgePath}
        repeatCount="1"
        fill="freeze"
      />
    </circle>
  );
}

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
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const { setEdges } = useGlobalState();

  const removePacket = (edgeId, packetId) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                packets: edge.data.packets.filter((p) => p !== packetId),
              },
            }
          : edge,
      ),
    );
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {data?.packets?.map((packetId) => (
        <Packet
          key={packetId}
          packetId={packetId}
          edgeId={id}
          edgePath={edgePath}
          removePacket={removePacket}
        />
      ))}
    </>
  );
}
