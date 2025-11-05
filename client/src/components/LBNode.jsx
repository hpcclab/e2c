import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";

export default memo(({ data, isConnectable }) => {
  const {
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
    loadBalancerRef,
  } = useGlobalState();
  const openSidebar = (mode) => {
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
