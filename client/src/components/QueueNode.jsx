import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";
import TaskList from "./TaskList";

export default memo(({ data, isConnectable }) => {
  const {
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
    batchQ,
    isBatchQueue,
    setSelectedTask,
    registerBatchSlotRef,
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
        <TaskList
          machine={batchQ}
          isBatchQueue={true}
          setSelectedTask={setSelectedTask}
          onClicked={() => openSidebar("task")}
          registerSlotRef={registerBatchSlotRef}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});
