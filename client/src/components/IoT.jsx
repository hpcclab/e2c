import React from "react";
import { IOT_ICON_MAP } from "../utils/iotIcons";
import BatteryIndicator from "./BatteryIndicator";
import { isBatteryDepleted } from "../utils/energy";

export default function IoT({ iot, setSelectedIOT, onClicked }) {
  const isHumanUser = Boolean(iot.properties?.user);
  const displayIconKey = isHumanUser ? "MdPerson" : iot.icon;
  const depleted = isBatteryDepleted(iot);

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
      className={`border-4 p-3 rounded-lg shadow-md flex flex-col items-center cursor-pointer transition min-w-[72px] ${
        depleted
          ? "bg-gray-200 border-gray-400 opacity-50 grayscale"
          : "bg-white hover:scale-105"
      }`}
    >
      {displayIconKey && IOT_ICON_MAP[displayIconKey] ? (
        <>
          {(() => {
            const Icon = IOT_ICON_MAP[displayIconKey];
            return <Icon size={28} className="text-blue-600" />;
          })()}
          <span className="text-xs text-gray-700 font-semibold mt-1 text-center max-w-[80px] truncate">
            {iot.name}
          </span>
        </>
      ) : (
        <div className="text-white bg-blue-600 font-semibold w-16 h-10 rounded-full flex items-center justify-center">
          {iot.name}
        </div>
      )}
      <BatteryIndicator device={iot} className="mt-1" />
    </div>
  );
}
