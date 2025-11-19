import { useDraggable } from "@neodrag/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useRef, useState } from "react";
import { useGlobalState } from "../context/GlobalStates";

// Simple ID generator for nodes
let id = 0;
const getId = () => `dndnode_${id++}`;
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
  const { setMachines, setIot } = useGlobalState();
  const { setNodes, screenToFlowPosition } = useReactFlow();

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
          position,
        };

        setMachines((prev) => [...prev, newMachine]);
      } else if (nodeType === "iotNode") {
        const newIot = {
          id: Date.now(), // unique ID
          name: `IOT ${Date.now().toString().slice(-4)}`,
          properties: [],
          position,
        };

        setIot((prev) => [...prev, newIot]);
      } else {
        const newNode = {
          id: getId(),
          type: nodeType,
          position,
          data: {},
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes, screenToFlowPosition, setMachines]
  );

  return (
    <aside>
      <div className="description">
        You can drag these nodes to the pane to create new nodes.
      </div>
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
        Machine Node
      </DraggableNode>
      <DraggableNode
        className="dndnode iot"
        nodeType="iotNode"
        onDrop={handleNodeDrop}
      >
        IoT Node
      </DraggableNode>
      <DraggableNode
        className="dndnode iot"
        nodeType="edgeLockedNode"
        onDrop={handleNodeDrop}
      >
        Edge Locked Node
      </DraggableNode>
      <DraggableNode
        className="dndnode iot"
        nodeType="workloadNode"
        onDrop={handleNodeDrop}
      >
        workload Node
      </DraggableNode>
      <DraggableNode
        className="dndnode iot"
        nodeType="LBNode"
        onDrop={handleNodeDrop}
      >
        Load Balancer Node
      </DraggableNode>
      <DraggableNode
        className="dndnode iot"
        nodeType="QueueNode"
        onDrop={handleNodeDrop}
      >
        Queue Node
      </DraggableNode>
    </aside>
  );
}
