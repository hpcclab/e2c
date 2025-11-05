import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Machine } from "./Machine";
import { useGlobalState } from "../context/GlobalStates";

export default memo(({ data, isConnectable }) => {
  const {
    setSelectedTask,
    setSelectedMachine,
    machines,
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
  } = useGlobalState();
  // const machines = Array.isArray(data.machine) ? data.machine : [];
  const handleMachineClicked = () => {
    console.log("Machine clicked!");
  };
  const handleTaskClicked = (task) => {
    console.log("Task clicked:", task);
  };
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

      <div className="space-y-4">
        <div className="machine-node">
          {machines.length === 0 ? (
            <div>No machines available</div>
          ) : (
            machines.map((machine) => (
              <Machine
                key={machine.id}
                machine={machine}
                setSelectedTask={setSelectedTask}
                setSelectedMachine={setSelectedMachine}
                onTaskClicked={() => openSidebar("task")}
                onClicked={() => openSidebar("machine")}
              />
            ))
          )}
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
