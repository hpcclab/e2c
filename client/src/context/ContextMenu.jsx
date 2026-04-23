import React, { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useGlobalState } from "./GlobalStates";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import "../assets/ContextMenu.css";

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
  edgeSidebar,
  ...props
}) {
  const { getNode, setNodes, setEdges, addNodes } = useReactFlow();
  const {
    machines,
    setMachines,
    iot,
    setIot,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    setSelectedEdge,
  } = useGlobalState();

  const extractNumericId = (nodeId) => {
    const parts = nodeId.split("-");
    const last = parts[parts.length - 1];
    const n = Number(last);
    return isNaN(n) ? null : n;
  };

  const generateNewNumericId = (list) => {
    if (!list || list.length === 0) return 1;
    const ids = list.map((item) => Number(item.id)).filter((n) => !isNaN(n));
    return Date.now();
  };
  // Node functions

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const numericId = extractNumericId(id);

    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    const newNodeId = `${id}-copy-${Date.now()}`;

    addNodes({
      ...node,
      id: newNodeId,
      selected: false,
      dragging: false,
      position,
    });

    if (node.type === "machineNode") {
      const original = machines.find((m) => Number(m.id) === numericId);
      if (original) {
        const newMachineId = generateNewNumericId(machines);

        setMachines((prev) => [
          ...prev,
          {
            ...original,
            id: newMachineId,
            name: `${original.name}_copy`,
            position,
            queue: [...original.queue],
          },
        ]);
      }
    }

    if (node.type === "iotNode") {
      const original = iot.find((i) => Number(i.id) === numericId);
      if (original) {
        const newIotId = generateNewNumericId(iot);

        const newIot = {
          ...original,
          id: newIotId,
          name: `${original.name}_copy`,
          position,
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
      }
    }
  }, [id, getNode, machines, iot, addNodes, setMachines, setIot]);

  const deleteNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    let numericId;
    let iotId;

    if (id[2] === "_") {
      // is an iot node with intitial: "nd_"
      numericId = id;
      iotId = Number(id.substring(3));
    } else {
      numericId = extractNumericId(id);
    }

    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) =>
      edges.filter((e) => e.source !== id && e.target !== id),
    );

    if (node.type === "machineNode") {
      setMachines((prev) => prev.filter((m) => Number(m.id) !== numericId));
    }

    if (node.type === "iotNode") {
      setIot((prev) => prev.filter((i) => i.id !== iotId));
      setScenarioRows((prev) => prev.filter((o) => o.srcID !== iotId));
      setTaskTypes((prev) => prev.filter((o) => o.srcID !== iotId));
    }
  }, [id, getNode, setNodes, setEdges, setMachines, setIot]);
  // Edge functions

  return (
    <div
      style={{ top, left, right, bottom }}
      className="context-men"
      {...props}
    >
      <div className="menu-header">Node</div>
      <div className="menu-sub">{id}</div>
      {id[0] === "e" ? (
        <button className="menu-item" onClick={edgeSidebar}>
          <FiCopy className="icon" />
          Edge Properties
        </button>
      ) : (
        <>
          <button className="menu-item" onClick={duplicateNode}>
            <FiCopy className="icon" />
            Duplicate
          </button>
          <button className="menu-item danger" onClick={deleteNode}>
            <FiTrash2 className="icon" />
            Delete
          </button>
        </>
      )}
    </div>
  );
}
