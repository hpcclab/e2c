import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export default memo(({ data, isConnectable }) => {
  return (
    <>
      {/* <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      /> */}
      <div>
        {/* Load Balancer Button */}
        <div className="bg-gray-800 text-white text-lg font-semibold w-40 h-40 flex items-center justify-center rounded-full cursor-pointer hover:scale-110 transition text-center px-2">
          Auto Scaler
          <br />
          Functiality <br />
          Coming Soon!
        </div>
      </div>
      {/* <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      /> */}
    </>
  );
});
