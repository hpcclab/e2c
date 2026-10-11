import React, { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useGlobalState } from "./GlobalStates";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import { colorMemory } from "../components/Task";
import {
  getNextTaskColor,
  sourceTaskColorKey,
  TASK_COLOR_NAMES,
} from "../utils/taskColors";
import "../assets/ContextMenu.css";

export default function ContextMenu({
  id,
  kind,
  onDuplicateEdge,
  onDuplicateSelection,
  selectedNodeIds = [],
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
    setTaskTypes,
    setScenarioRows,
    setWorkspaces,
    setLoadBalancers,
  } = useGlobalState();

  const generateNewNumericId = (list) => {
    const ids = new Set(
      (list ?? []).map((item) => Number(item.id)).filter(Number.isFinite),
    );
    let candidate = Date.now();
    while (ids.has(candidate)) candidate += 1;
    return candidate;
  };
  // Node functions

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    if (node.type === "machineNode") {
      const original =
        node.data?.machine ??
        machines.find((machine) => String(machine.id) === String(id));
      if (original) {
        const newMachineId = generateNewNumericId(machines);
        const newMachine = {
          ...original,
          id: newMachineId,
          name: `${original.name}_copy`,
          position,
          queue: [...(original.queue ?? [])],
          eet: { ...(original.eet ?? {}) },
          eetStdDev: { ...(original.eetStdDev ?? {}) },
        };

        setMachines((prev) => [...prev, newMachine]);
        if (newMachine.parentId) {
          setWorkspaces((prev) =>
            prev.map((workspace) =>
              String(workspace.id) === newMachine.parentId.replace("nd-", "")
                ? {
                    ...workspace,
                    machines: [...(workspace.machines ?? []), newMachineId],
                  }
                : workspace,
            ),
          );
        }
      }
      return;
    }

    if (node.type === "iotNode" || node.type === "userNode") {
      const original =
        node.data?.iot ??
        iot.find((source) => `nd_${source.id}` === String(id));
      if (original) {
        const newIotId = generateNewNumericId(iot);
        const originalTaskColor = original.properties?.taskColor ?? "Slate";
        const copiedTaskColor = getNextTaskColor(originalTaskColor, iot);

        const newIot = {
          ...original,
          id: newIotId,
          name: `${original.name}_copy`,
          position,
          queue: [...(original.queue ?? [])],
          properties: {
            ...original.properties,
            taskColor: copiedTaskColor,
          },
        };

        const originalColorIndex = TASK_COLOR_NAMES.indexOf(originalTaskColor);
        const copiedColorIndex = TASK_COLOR_NAMES.indexOf(copiedTaskColor);
        colorMemory[sourceTaskColorKey(original.id)] =
          originalColorIndex >= 0 ? originalColorIndex : 0;
        colorMemory[sourceTaskColorKey(newIot.id)] = copiedColorIndex;
        window.dispatchEvent(new Event("taskColorChanged"));

        setIot((prev) => [...prev, newIot]);

        setTaskTypes((prev) => [
          ...prev,
          {
            srcID: newIot.id,
            name: newIot.name,
            dataInput: newIot.properties.dataInput,
            meanSize: newIot.properties.meanSize,
            dataSizeStdDev:
              newIot.properties.dataSizeStdDev ?? newIot.properties.stdv ?? 1,
            dataSizeSeed: newIot.properties.dataSizeSeed ?? "",
            connectivity: newIot.properties.connectivity,
            dataRateKbps: newIot.properties.dataRateKbps ?? 54000,
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
            arrivalSeed: newIot.properties.arrivalSeed ?? "",
          },
        ]);

        if (newIot.parentId) {
          setWorkspaces((prev) =>
            prev.map((workspace) =>
              String(workspace.id) === newIot.parentId.replace("nd-", "")
                ? {
                    ...workspace,
                    iots: [...(workspace.iots ?? []), newIotId],
                  }
                : workspace,
            ),
          );
        }
      }
      return;
    }

    const newNodeId = `${id}-copy-${Date.now()}`;
    addNodes({
      ...node,
      id: newNodeId,
      selected: false,
      dragging: false,
      position,
    });

    if (node.type === "LBNode") {
      setLoadBalancers((prev) => [...prev, newNodeId]);
    }
  }, [
    id,
    getNode,
    machines,
    iot,
    addNodes,
    setMachines,
    setIot,
    setTaskTypes,
    setScenarioRows,
    setWorkspaces,
    setLoadBalancers,
  ]);

  const deleteEdge = useCallback(() => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
  }, [id, setEdges]);

  const deleteNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    const machineId = Number(node.data?.machine?.id ?? id);
    const sourceId = Number(
      node.data?.iot?.id ?? (id.startsWith("nd_") ? id.substring(3) : NaN),
    );

    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) =>
      edges.filter((e) => e.source !== id && e.target !== id),
    );

    if (node.type === "machineNode") {
      setMachines((prev) => prev.filter((m) => Number(m.id) !== machineId));
    }

    if (node.type === "iotNode" || node.type === "userNode") {
      setIot((prev) => prev.filter((i) => Number(i.id) !== sourceId));
      setScenarioRows((prev) =>
        prev.filter((row) => Number(row.srcID) !== sourceId),
      );
      setTaskTypes((prev) =>
        prev.filter((taskType) => Number(taskType.srcID) !== sourceId),
      );
    }
  }, [
    id,
    getNode,
    setNodes,
    setEdges,
    setMachines,
    setIot,
    setScenarioRows,
    setTaskTypes,
  ]);
  // Edge functions

  const isEdgeMenu = kind === "edge" || (kind === undefined && id[0] === "e");
  const isSelectionMenu = kind === "selection";
  const duplicatesSelection =
    !isEdgeMenu &&
    selectedNodeIds.length > 1 &&
    (isSelectionMenu || selectedNodeIds.includes(id));

  return (
    <div
      style={{ top, left, right, bottom }}
      className="context-men"
      {...props}
    >
      <div className="menu-header">
        {isSelectionMenu ? "Selection" : isEdgeMenu ? "Connection" : "Node"}
      </div>
      <div className="menu-sub">
        {isSelectionMenu ? `${selectedNodeIds.length} objects` : id}
      </div>
      {isEdgeMenu ? (
        <>
          <button
            className="menu-item"
            onClick={(event) => onDuplicateEdge?.(id, event)}
          >
            <FiCopy className="icon" />
            Duplicate properties
          </button>
          <button className="menu-item danger" onClick={deleteEdge}>
            <FiTrash2 className="icon" />
            Delete
          </button>
        </>
      ) : (
        <>
          <button
            className="menu-item"
            onClick={
              duplicatesSelection
                ? (event) => onDuplicateSelection?.(selectedNodeIds, event)
                : duplicateNode
            }
          >
            <FiCopy className="icon" />
            {duplicatesSelection
              ? `Duplicate selection (${selectedNodeIds.length})`
              : "Duplicate"}
          </button>
          {!isSelectionMenu && (
            <button className="menu-item danger" onClick={deleteNode}>
              <FiTrash2 className="icon" />
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}
