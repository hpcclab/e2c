import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useGlobalState } from "../context/GlobalStates";
import IoT from "./IoT";

export default memo(({ data, isConnectable }) => {
  const {
    setSelectedIOT,
    setSidebarMode,
    setShowSidebar,
    setSubmissionStatus,
  } = useGlobalState();
  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus("");
  };

  const iot = data.iot;
  return (
    <>
      <div>
        {iot ? (
          <IoT
            key={iot.id}
            iot={iot}
            setSelectedIOT={setSelectedIOT}
            onClicked={() => openSidebar("IOT")}
          />
        ) : (
          <div className="text-gray-500 text-sm p-4">No IOT data</div>
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
