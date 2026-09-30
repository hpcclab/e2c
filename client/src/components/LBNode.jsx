import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";

export default memo(({ id, data, isConnectable }) => {
  const {
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
    loadBalancerRef,
    setNodes,
  } = useGlobalState();
  const openSidebar = (mode) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    );
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus(""); // Reset submission status when opening the sidebar
  };
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <div>
        {/* Load Balancer Button */}
        <div
          ref={loadBalancerRef}
          onClick={() => openSidebar("loadBalancer")}
          className="bg-gray-800 text-white text-lg font-semibold w-25 h-25 flex items-center justify-center rounded-full cursor-pointer hover:scale-110 transition text-center px-2"
        >
          Load
          <br />
          Balancer
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});
