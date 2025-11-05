import { useDraggable } from "@neodrag/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useRef, useState } from "react";

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
      setPosition({ x: 0, y: 0 });
      onDrop(nodeType, {
        x: event.clientX,
        y: event.clientY,
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

      if (isInFlow) {
        const position = screenToFlowPosition(screenPosition);
        if (nodeType == "edgeLockedNode") {
          const newNode = {
            id: getId(),
            type: nodeType,
            position,
            data: { machine: machine, iot: iot },
            extent: "parent",
            parentId: "edgeType",
          };
          setNodes((nds) => nds.concat(newNode));
        } else {
          const newNode = {
            id: getId(),
            type: nodeType,
            position,
            data: { machine: machine, iot: iot },
          };
          setNodes((nds) => nds.concat(newNode));
        }
      }
    },
    [setNodes, screenToFlowPosition]
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
    </aside>
  );
}
