import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Machine } from "./Machine";
import { useGlobalState } from "../context/GlobalStates";

const MachineNode = memo(({ data, isConnectable }) => {
  const {
    setSelectedTask,
    setSelectedMachine,
    machines,
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
  } = useGlobalState();

  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus("");
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        <div className="machine-node">
          {machines.length === 0 ? (
            <div className="text-gray-500 text-sm">No machines available</div>
          ) : (
            machines.map((machine, index) => (
              <Machine
                key={machine.id}
                machine={machine}
                machineIndex={index}
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

export default MachineNode;
