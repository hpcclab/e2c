import React from "react";
import { IOT_ICON_MAP } from "../utils/iotIcons";

export default function IoT({ iot, setSelectedIOT, onClicked }) {
  function handleChildClick(event) {
    event.stopPropagation();
    setSelectedIOT({
      id: iot.id,
      name: iot.name,
      icon: iot.icon,
      queue: iot.queue,
      properties: iot.properties,
    });
    onClicked();
  }

  return (
    <div
      key={iot.id}
      onClick={handleChildClick}
      className="bg-white border-4 p-3 rounded-lg shadow-md flex flex-col items-center cursor-pointer hover:scale-105 transition min-w-[72px]"
    >
      {iot.icon && IOT_ICON_MAP[iot.icon] ? (
        <>
          {(() => { const Icon = IOT_ICON_MAP[iot.icon]; return <Icon size={28} className="text-blue-600" />; })()}
          <span className="text-xs text-gray-700 font-semibold mt-1 text-center max-w-[80px] truncate">
            {iot.name}
          </span>
        </>
      ) : (
        <div className="text-white bg-blue-600 font-semibold w-16 h-10 rounded-full flex items-center justify-center">
          {iot.name}
        </div>
      )}
    </div>
  );
}
