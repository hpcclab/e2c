import React, { memo } from "react";
import { useGlobalState } from "../context/GlobalStates";
import { NodeResizer } from "@xyflow/react";

function WorkloadNode({ id, data, selected }) {
  const {
    setSelectedWorkspace,
    workspaces,
    setNodes,
  } = useGlobalState();

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
        backgroundColor: "rgba(240,240,240,0.25)",
        border: "2px solid rgba(0,0,0,0.2)",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div className="bg-gray-800 text-white text-sm font-semibold w-full h-6 flex items-center justify-center rounded-lg cursor-pointer hover:scale-105 transition">
        {data.name || ""}
      </div>
      <NodeResizer
        handleStyle={{ width: 12, height: 12, borderRadius: "50%" }}
        minWidth={280}
        minHeight={250}
        isVisible={selected}
      />
    </div>
  );
}

export default memo(WorkloadNode);
