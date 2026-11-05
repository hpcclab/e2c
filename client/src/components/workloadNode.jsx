import React, { memo } from "react";
import { useGlobalState } from "../context/GlobalStates";
import { Handle, NodeResizer, Position } from "@xyflow/react";

function WorkloadNode({ id, data, selected, isConnectable }) {
  const {
    setSelectedWorkspace,
    workspaces,
    setNodes,
  } = useGlobalState();
  const isCloud = data.workspaceType === "cloud";
  const gatewayColor = isCloud ? "#4f46e5" : "#0284c7";

  const handleChildClick = () => {
    // event.stopPropagation();
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    );
    const workspace = workspaces.find((w) => w.id === data.workspaceId);
    if (!workspace) return;
    setSelectedWorkspace({
      id: workspace.id,
      job_q: workspace?.job_q,
      system_config: workspace?.system_config,
      machines: workspace?.machines,
      iots: workspace?.iots,
    });
  };

  return (
    // when to change parent box within node, go to sidebar.jsx and change workspace node styles.
    <div
      onClick={handleChildClick}
      style={{
        width: "100%",
        height: "100%",
        minWidth: 280,
        minHeight: 250,
        textAlign: "left",
        backgroundColor: isCloud
          ? "rgba(129,140,248,0.08)"
          : "rgba(56,189,248,0.08)",
        border: `2px solid ${isCloud ? "rgba(79,70,229,0.35)" : "rgba(2,132,199,0.35)"}`,
        borderRadius: 8,
        padding: 8,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ width: 14, height: 14, background: gatewayColor }}
      />
      <div
        className={`${isCloud ? "bg-indigo-700" : "bg-sky-700"} text-white text-sm font-semibold w-full min-h-8 flex items-center justify-center rounded-lg cursor-pointer hover:scale-[1.02] transition`}
        title="Connect this space to another space, load balancer, or machine"
      >
        <span>{data.name || "Workspace"}</span>
      </div>
      <NodeResizer
        handleStyle={{ width: 12, height: 12, borderRadius: "50%" }}
        minWidth={280}
        minHeight={250}
        isVisible={selected}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: 14, height: 14, background: gatewayColor }}
      />
    </div>
  );
}

export default memo(WorkloadNode);
