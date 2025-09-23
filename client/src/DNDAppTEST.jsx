import React, { useState } from "react";
import { DndContext } from "@dnd-kit/core";

import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";
import MachineList from "./MachineList";
import TaskList from "./TaskList";

function DNDApp() {
  const containers = ["A", "B", "C"];
  const [parent, setParent] = useState(null);

  const [machines, setMachines] = useState([
    { id: -1, name: "empty", queue: [] },
  ]);

  const [batchQ, setBatchQ] = useState({
    id: -2,
    name: "Batch Queue",
    queue: [],
  });

  return (
    <div className="bg-[#d9d9d9] min-h-screen flex flex-col relative">
      {/* Main Simulation Area */}
      <div className="flex-grow flex flex-col justify-center items-center gap-20">
        <DndContext onDragEnd={handleDragEnd}>
          {parent === null ? (
            <Draggable id="draggable">
              <MachineList machs={machines} />
            </Draggable>
          ) : null}

          {containers.map((id) => (
            // We updated the Droppable component so it would accept an `id`
            // prop and pass it to `useDroppable`
            <Droppable key={id} id={id}>
              {parent === id ? (
                <Draggable id="draggable">
                  <MachineList machs={machines} />
                </Draggable>
              ) : (
                "Drop here"
              )}
            </Droppable>
          ))}
        </DndContext>
      </div>
    </div>
  );

  function handleDragEnd(event) {
    const { over } = event;

    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null);
  }
}
export default DNDApp;
