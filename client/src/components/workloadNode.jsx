import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";

export default memo(({ data, isConnectable }) => {
  const { setSidebarMode, setShowSidebar, setSubmissionStatus } =
    useGlobalState();
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
        {/* Workload Button */}
        <div
          onClick={() => openSidebar("workload")}
          className="bg-gray-800 text-white text-sm font-semibold w-25 h-25 flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition"
        >
          Workload
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
