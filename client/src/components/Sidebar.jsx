import { useDraggable } from "@neodrag/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useRef, useState } from "react";
import { useGlobalState } from "../context/GlobalStates";

// Simple ID generator for nodes
let id = 0;
const getId = (type) => `${type}_${id++}`;
const machine = { id: -1, name: "empty machine", queue: [] };
const iot = { id: -2, name: "empty iot", queue: [] };

function DraggableNode({ className, children, nodeType, onDrop }) {
  const draggableRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useDraggable(draggableRef, {
    position: position,
    onDrag: ({ offsetX, offsetY }) => {
      setPosition({
        x: offsetX,
        y: offsetY,
      });
    },
    onDragEnd: ({ event }) => {
      const rect = draggableRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setPosition({ x: 0, y: 0 });

      // Shift drop coordinates by the center
      onDrop(nodeType, {
        x: event.clientX - centerX,
        y: event.clientY - centerY,
      });
    },
  });

  return (
    <div className={className} ref={draggableRef}>
      {children}
    </div>
  );
}

export default function Sidebar() {
  const {
    setMachines,
    setIot,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
  } = useGlobalState();
  const { setNodes, screenToFlowPosition, fitView } = useReactFlow();
  const distributionOptions = ["uniform", "normal", "exponential", "spiky"];
  const handleNodeDrop = useCallback(
    (nodeType, screenPosition) => {
      const flow = document.querySelector(".react-flow");
      const flowRect = flow?.getBoundingClientRect();

      const isInFlow =
        flowRect &&
        screenPosition.x >= flowRect.left &&
        screenPosition.x <= flowRect.right &&
        screenPosition.y >= flowRect.top &&
        screenPosition.y <= flowRect.bottom;

      if (!isInFlow) return;

      const position = screenToFlowPosition(screenPosition);

      if (nodeType === "machineNode") {
        const newMachine = {
          id: Date.now(), // unique ID
          name: `Machine ${Date.now().toString().slice(-4)}`,
          queue: [],
          power: 0,
          idle_power: 0,
          replicas: 1,
          price: 0,
          cost: 0,
          position,
          eet: {},
        };

        setMachines((prev) => [...prev, newMachine]);
      } else if (nodeType === "iotNode") {
        const newIot = {
          id: Date.now(), // unique ID
          name: `IOT ${Date.now().toString().slice(-4)}`,
          properties: {
            task_type: `IOT ${Date.now().toString().slice(-4)}`,
            dataInput: "default",
            meanSize: 6,
            urgency: "BestEffort",
            slack: 0,
            numTasks: 10,
            startTime: 0,
            endTime: 30,
            distribution: distributionOptions[0],
          },
          queue: [],
          position,
        };

        setTaskTypes((prev) => [
          ...prev,
          {
            srcID: newIot.id,
            name: newIot.name,
            dataInput: newIot.properties.dataInput,
            meanSize: newIot.properties.meanSize,
            urgency: newIot.properties.urgency,
            slack: newIot.properties.slack,
            numTasks: newIot.properties.numTasks,
            startTime: newIot.properties.startTime,
            endTime: newIot.properties.endTime,
          },
        ]);

        setScenarioRows((prev) => [
          ...prev,
          {
            srcID: newIot.id,
            taskType: newIot.properties.task_type,
            numTasks: newIot.properties.numTasks,
            startTime: newIot.properties.startTime,
            endTime: newIot.properties.endTime,
            distribution: newIot.properties.distribution,
          },
        ]);

        setIot((prev) => [...prev, newIot]);
        setMachines((prev) =>
          prev.map((m) => ({
            ...m,
            eet: { ...(m.eet || {}), [newIot.name]: "" },
          })),
        );
      } else {
        const newNode = {
          id: getId(nodeType),
          type: nodeType,
          position,
          data: {},
        };
        setNodes((nds) => nds.concat(newNode));
      }
      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
    },
    [setNodes, screenToFlowPosition, setMachines, setIot],
  );

  return (
    <aside className="mr-10">
      <div className="description">
        You can drag these nodes to the pane to create new nodes.
      </div>
      <div className="nodes">
        <DraggableNode
          className="dndnode edge"
          nodeType="edgeSpace"
          onDrop={handleNodeDrop}
        >
          Edge Space
        </DraggableNode>
        <DraggableNode
          className="dndnode cloud"
          nodeType="cloudSpace"
          onDrop={handleNodeDrop}
        >
          Cloud Space
        </DraggableNode>
        <DraggableNode
          className="dndnode machine"
          nodeType="machineNode"
          onDrop={handleNodeDrop}
        >
          Machine
        </DraggableNode>
        <DraggableNode
          className="dndnode iot"
          nodeType="iotNode"
          onDrop={handleNodeDrop}
        >
          IoT
        </DraggableNode>

        <DraggableNode
          className="dndnode"
          nodeType="workloadNode"
          onDrop={handleNodeDrop}
        >
          Work Space
        </DraggableNode>
        <DraggableNode
          className="dndnode text-wrap"
          nodeType="LBNode"
          onDrop={handleNodeDrop}
        >
          Load Balancer
        </DraggableNode>
      </div>
    </aside>
  );
}
