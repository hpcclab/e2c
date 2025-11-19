import React from "react";

export default function IoT({ iot, onIoTClicked, setSelectedIOT, onClicked }) {
  function handleChildClick(event) {
    event.stopPropagation();
    setSelectedIOT({
      id: iot.id,
      name: iot.name,
      properties: iot.properties,
    });
    onClicked();
  }
  return (
    <div
      key={iot.id}
      className="bg-white border-4 p-4 rounded-lg shadow-md flex items-center space-x-4"
    >
      <div
        onClick={handleChildClick}
        className="text-white bg-blue-600 font-semibold w-16 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition"
      >
        {iot.name}
      </div>
    </div>
  );
}
