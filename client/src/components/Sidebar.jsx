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
    setWorkspaces,
    workspaces,
    workspace,
    nodes,
  } = useGlobalState();
  const {
    setNodes,
    screenToFlowPosition,
    fitView,
    getNodes,
    getNodesBounds,
    getIntersectingNodes,
  } = useReactFlow();
  const distributionOptions = ["uniform", "normal", "exponential", "spiky"];
  const handleNodeDrop = useCallback(
    (nodeType, screenPosition) => {
      if (!screenToFlowPosition) return;

      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: screenPosition.x,
        y: screenPosition.y,
      });

      // Get all group nodes from React Flow instance
      const groupNodes = getNodes().filter((n) => n.type === "group");

      // Find the group node that contains this position
      let parentNode = undefined;
      for (const group of groupNodes) {
        const bounds = getNodesBounds([group]);
        if (
          position.x >= bounds.x &&
          position.x <= bounds.x + bounds.width &&
          position.y >= bounds.y &&
          position.y <= bounds.y + bounds.height
        ) {
          parentNode = group;
          break;
        }
      }

      const parentId = parentNode?.id;

      // Position relative to parent group if it exists
      const relativePosition = parentNode
        ? {
            x: position.x - parentNode.position.x,
            y: position.y - parentNode.position.y,
          }
        : position;

      // Handle different node types
      if (nodeType === "machineNode") {
        const newMachine = {
          id: Date.now(),
          name: `Machine ${Date.now().toString().slice(-4)}`,
          queue: [],
          power: 0,
          idle_power: 0,
          replicas: 1,
          price: 0,
          cost: 0,
          position: relativePosition,
          parentId, // assign parent group
          extent: parentId ? "parent" : undefined,
          eet: {},
        };
        setMachines((prev) => [...prev, newMachine]);

        if (parentId) {
          setWorkspaces((prev) =>
            prev.map((ws) => {
              const workspaceId = parentId.replace("nd-", "");
              if (ws.id.toString() === workspaceId) {
                return {
                  ...ws,
                  machines: [...ws.machines, newMachine.id],
                };
              }
              return ws;
            }),
          );
        }
      } else if (nodeType === "iotNode") {
        const newIot = {
          id: Date.now(),
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
          position: relativePosition,
          parentId, // assign parent group
          extent: parentId ? "parent" : undefined,
        };
        setIot((prev) => [...prev, newIot]);

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

        setMachines((prev) =>
          prev.map((m) => ({
            ...m,
            eet: { ...(m.eet || {}), [newIot.name]: "" },
          })),
        );

        if (parentId) {
          setWorkspaces((prev) =>
            prev.map((ws) => {
              const workspaceId = parentId.replace("nd-", "");
              if (ws.id.toString() === workspaceId) {
                return {
                  ...ws,
                  iots: [...ws.iots, newIot.id],
                };
              }
              return ws;
            }),
          );
        }
      } else if (nodeType === "workloadNode") {
        const newWorkspace = {
          id: Date.now(),
          job_q: [],
          system_config: {},
          machines: [],
          iots: [],
        };
        setWorkspaces((prev) => [...prev, newWorkspace]);

        setNodes((nds) =>
          nds.concat({
            id: `nd-${newWorkspace.id}`,
            type: "group",
            position: relativePosition,
            data: {
              workspaceId: newWorkspace.id,
              nodes: [],
            },
            resizing: true,
            style: {
              width: 280,
              height: 250,
              minWidth: 280,
              minHeight: 250,
              backgroundColor: "rgba(240,240,240,0.25)",
            },
          }),
        );
      } else {
        const newNode = {
          id: getId(),
          type: nodeType,
          position,
          data: {},
          parentId: parentId, // assign parent group
          extent: parentId ? "parent" : undefined,
        };
        setNodes((nds) => nds.concat(newNode));
      }

      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
    },
    [
      getNodes,
      setMachines,
      setIot,
      setWorkspaces,
      setTaskTypes,
      setScenarioRows,
      screenToFlowPosition,
      fitView,
    ],
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
          className="dndnode"
          nodeType="LBNode"
          onDrop={handleNodeDrop}
        >
          Load Balancer
        </DraggableNode>
      </div>
    </aside>
  );
}
