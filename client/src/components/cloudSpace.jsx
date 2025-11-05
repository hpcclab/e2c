import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
export default memo(({ data, isConnectable }) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <div
        style={{
          width: 280,
          height: 250,
          textAlign: "left",
          backgroundColor: "rgba(240,240,240,0.25)",
        }}
      >
        <label htmlFor="text">Cloud</label>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});
