import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Machine } from "./Machine";
import { useGlobalState } from "../context/GlobalStates";

const MachineNode = memo(({ data, isConnectable }) => {
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

  // Get the single machine and its index from data
  const machine = data.machine;
  const machineIndex = data.machineIndex || 0;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <div className="machine-node">
        {machine ? (
          <Machine
            key={machine.id}
            machine={machine}
            machineIndex={machineIndex}
            setSelectedTask={setSelectedTask}
            setSelectedMachine={setSelectedMachine}
            onTaskClicked={() => openSidebar("task")}
            onClicked={() => openSidebar("machine")}
          />
        ) : (
          <div className="text-gray-500 text-sm p-4">No machine data</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});

export default MachineNode;
