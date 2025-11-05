// machineNode.jsx
import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Machine } from "./Machine";
import { useGlobalState } from "../context/GlobalStates";

export default memo(({ data, isConnectable }) => {
  const {
    setSelectedTask,
    setSelectedMachine,
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
  } = useGlobalState();

  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus("");
  };

  const machine = data.machine;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div className="machine-node">
        <Machine
          key={machine.id}
          machine={machine}
          setSelectedTask={setSelectedTask}
          setSelectedMachine={setSelectedMachine}
          onTaskClicked={() => openSidebar("task")}
          onClicked={() => openSidebar("machine")}
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
