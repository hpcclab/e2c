import React, { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useGlobalState } from "./GlobalStates";

export default function ContextMenu({
  id,
  top,
  left,
  right,
  bottom,
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
    return Math.max(...ids) + 1;
  };

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

        const newMachine = {
          ...original,
          id: newMachineId,
          name: `${original.name}_copy`,
          position,
          queue: [...original.queue],
        };

        setMachines((prev) => [...prev, newMachine]);
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

    const numericId = extractNumericId(id);

    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) =>
      edges.filter((e) => e.source !== id && e.target !== id),
    );

    if (node.type === "machineNode") {
      setMachines((prev) => prev.filter((m) => Number(m.id) !== numericId));
    }

    if (node.type === "iotNode") {
      // setIot((prev) => prev.filter((i) => Number(i.id) !== numericId));
      setIot((prev) => prev.filter((i) => Number(i.id) !== numericId));
      setScenarioRows(scenarioRows.filter((o) => o.srcID !== numericId));
      setTaskTypes(taskTypes.filter((o) => o.srcID !== numericId));
    }
  }, [id, getNode, setNodes, setEdges, setMachines, setIot]);

  return (
    <div
      style={{ top, left, right, bottom }}
      className="context-menu"
      {...props}
    >
      <p style={{ margin: "0.5em" }}>
        <small>node: {id}</small>
      </p>
      <button onClick={duplicateNode}>duplicate</button>
      <button onClick={deleteNode}>delete</button>
    </div>
  );
}
