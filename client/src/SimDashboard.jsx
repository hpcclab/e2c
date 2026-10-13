import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

import { motion, AnimatePresence } from "framer-motion";
import EditMachineProperties from "./components/EditMachineProperties";
import EditIoTProperties from "./components/EditIoTProperties";
import EditUserProperties from "./components/EditUserProperties";
import EditEdgeProperties from "./components/EditEdgeProperties";
import DeadlinePolicyHelp from "./components/DeadlinePolicyHelp";
import SchedulingPolicyHelp from "./components/SchedulingPolicyHelp";
import SimulationSeedSettings from "./components/SimulationSeedSettings";

// Drag and drop imports and requirements
import {
  Background,
  ControlButton,
  Controls,
  ReactFlow,
  SelectionMode,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import { MdDeleteOutline, MdLock, MdLockOpen } from "react-icons/md";
import { FiCopy } from "react-icons/fi";

import Sidebar from "./components/Sidebar";
import ContextMenu from "./context/ContextMenu";
import machineNode from "./components/machineNode";
import { getMachineSelection } from "./utils/machineSelection";
import iotNode from "./components/iotNode";
import edgeLockedNode from "./components/edgeLockedNode";
import workloadNode from "./components/workloadNode";
import "./assets/flow.css";
import "./assets/index.css";
import { useGlobalState } from "./context/GlobalStates";
import LBNode from "./components/LBNode";

import AutoScalerNode from "./components/AutoScalerNode";
import AnimatedEdge from "./components/AnimatedEdge";
import { colorMemory } from "./components/Task";
import {
  getNextTaskColor,
  sourceTaskColorKey,
  TASK_COLOR_NAMES,
} from "./utils/taskColors";
import {
  createEdgeNetworkProperties,
  formatDataRate,
  getEdgeNetworkVisual,
  resolveEdgeNetwork,
} from "./utils/edgeNetwork";
import { duplicateEdgeProperties } from "./utils/edgeDuplication";
import { machineProcessingEnergyRateJPerKb } from "./utils/energy";
import {
  expandSelectionWithDescendants,
  planGraphDuplication,
} from "./utils/graphDuplication";
import {
  MAX_BACKGROUND_WORKERS,
  MAX_BATCH_TASKS,
  normalizeSimulationRunCount,
  normalizeSimulationSeeds,
} from "./utils/simulationBatch";
const edgeTypes = {
  packet: AnimatedEdge,
};
const nodeTypes = {
  machineNode: machineNode,
  iotNode: iotNode,
  userNode: iotNode,
  edgeSpace: workloadNode,
  cloudSpace: workloadNode,
  edgeLockedNode: edgeLockedNode,
  group: workloadNode,
  LBNode: LBNode,
  autoScaler: AutoScalerNode,
};
// End Drag and Drop Requirements and Imports

const SimDashboard = () => {
  // Global States
  const {
    selectedMachine,
    setSelectedMachine,
    selectedIOT,
    setSelectedIOT,
    simulationTime,
    setSimulationTime,
    selectedTask,
    machines,
    setMachines,
    onDragStop,
    iot,
    setIot,
    setBatchQ,
    showSidebar,
    setShowSidebar,
    sidebarMode,
    setSidebarMode,
    edges,
    setEdges,
    onEdgesChange,
    menu,
    setMenu,
    nodes,
    setNodes,
    onNodesChange,
    submissionStatus,
    setSubmissionStatus,
    workloadSubmissionStatus,
    setWorkloadSubmissionStatus,
    machinesRef,
    machineSlotsRef,
    batchSlotsRef,
    setProfilingFileName,
    profilingFileUploaded,
    setProfilingFileUploaded,
    workloadFileUploaded,
    setWorkloadFileUploaded,
    setProfilingTableData,
    setWorkloadFileName,
    workloadTableData,
    setWorkloadTableData,
    setConfigFileName,
    configFileUploaded,
    setConfigFileUploaded,
    setCompletedTasks,
    eetLoaded,
    setEetLoaded,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    workspaces,
    setWorkspaces,
    setLoadBalancers,
    setMachineConfig,
    generateWorkload,
    generateMachineConfig,
    getNode,
    selectedEdge,
    setSelectedEdge,
    showReport,
    setShowReport,
    setUnassignedTasks,
    setMissedTasks,
    dataResults,
    setDataResults,
    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    setSimTotal,
    setTotalTasks,
    totalTasks,
    policyAlias,
    setPolicyAlias,
    deadlinePolicy,
    setDeadlinePolicy,
    simulationSeed,
    setSimulationSeed,
    simulationRunCount,
    setSimulationRunCount,
    simulationSeeds,
    setSimulationSeeds,
    batchRunResults,
    isAutoFitLocked,
    setIsAutoFitLocked,
    simCurrentRef,
    totalSimTimeRef,
    simulationWorkerError,
    startSimulationBatch,
    pauseSimulationWorker,
    resumeSimulationWorker,
    stopSimulationWorker,
  } = useGlobalState();
  // End Global States

  const applySimulationSettings = useCallback(
    ({ runCount, seeds }) => {
      const normalizedRunCount = normalizeSimulationRunCount(runCount);
      const normalizedSeeds = normalizeSimulationSeeds(
        normalizedRunCount,
        seeds,
        simulationSeed,
      );
      setSimulationRunCount(normalizedRunCount);
      setSimulationSeeds(normalizedSeeds);
      setSimulationSeed(normalizedSeeds[0] ?? "");
    },
    [
      setSimulationRunCount,
      setSimulationSeed,
      setSimulationSeeds,
      simulationSeed,
    ],
  );

  // DND
  const reactFlowWrapper = useRef(null);
  const { fitView, getNodesBounds, screenToFlowPosition } = useReactFlow();
  const [edgeCopySource, setEdgeCopySource] = useState(null);
  const [edgeCopyPointer, setEdgeCopyPointer] = useState({ x: 0, y: 0 });
  const [nodeCopySource, setNodeCopySource] = useState(null);
  const [nodeCopyPointer, setNodeCopyPointer] = useState({ x: 0, y: 0 });
  const selectedNodes = useMemo(
    () => nodes.filter((node) => node.selected),
    [nodes],
  );

  const handleAutoFitLockToggle = useCallback(() => {
    if (isAutoFitLocked) {
      setIsAutoFitLocked(false);
      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
      return;
    }
    setIsAutoFitLocked(true);
  }, [fitView, isAutoFitLocked, setIsAutoFitLocked]);

  const handleNodeClick = useCallback((event, node) => {
    if (node.type !== "machineNode" || !node.data?.machine) return;
    if (event.target.closest("button, .react-flow__handle")) return;

    setSelectedMachine(getMachineSelection(node.data.machine));
    setSidebarMode("machine");
    setShowSidebar(true);
    setSubmissionStatus("");
  }, [setSelectedMachine, setSidebarMode, setShowSidebar, setSubmissionStatus]);

  const handleEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();

      if (edgeCopySource) {
        if (edgeCopySource.id === edge.id) return;
        const updatedEdge = duplicateEdgeProperties(edgeCopySource, edge, iot);
        setEdges((currentEdges) =>
          currentEdges.map((currentEdge) =>
            currentEdge.id === edge.id ? updatedEdge : currentEdge,
          ),
        );
        setSelectedEdge(updatedEdge);
        setEdgeCopySource(null);
        setMenu(null);
        setSidebarMode("edgeProps");
        setShowSidebar(true);
        return;
      }

      setSelectedEdge(edge);
      setSidebarMode("edgeProps");
      setShowSidebar(true);
      setSubmissionStatus("");
      setMenu(null);
    },
    [
      setMenu,
      edgeCopySource,
      iot,
      setEdges,
      setSelectedEdge,
      setShowSidebar,
      setSidebarMode,
      setSubmissionStatus,
    ],
  );

  const startEdgePropertyCopy = useCallback(
    (edgeId, event) => {
      const sourceEdge = edges.find((edge) => edge.id === edgeId);
      if (!sourceEdge) return;
      setEdgeCopySource(sourceEdge);
      setEdgeCopyPointer({ x: event.clientX, y: event.clientY });
      setMenu(null);
    },
    [edges, setMenu],
  );

  const duplicateNodeSelection = useCallback((selectedNodeIds, offset) => {
    if (!selectedNodeIds.length) return;

    const usedNumericIds = new Set(
      [...machines, ...iot, ...workspaces]
        .map((item) => Number(item.id))
        .filter(Number.isFinite),
    );
    let nextNumericId = Date.now();
    const allocateNumericId = () => {
      while (usedNumericIds.has(nextNumericId)) nextNumericId += 1;
      const allocated = nextNumericId;
      usedNumericIds.add(allocated);
      nextNumericId += 1;
      return allocated;
    };
    const copyToken = Date.now();

    const plan = planGraphDuplication({
      nodes,
      edges,
      selectedNodeIds,
      offset,
      createNodeId: (node, index) => {
        if (node.type === "machineNode") return String(allocateNumericId());
        if (node.type === "iotNode" || node.type === "userNode") {
          return `nd_${allocateNumericId()}`;
        }
        if (
          node.type === "group" ||
          node.type === "edgeSpace" ||
          node.type === "cloudSpace"
        ) {
          return `nd-${allocateNumericId()}`;
        }
        return `${node.id}-copy-${copyToken}-${index}`;
      },
    });

    const duplicateByOriginalId = new Map(
      nodes
        .filter((node) => plan.idMap.has(node.id))
        .map((node) => [
          node.id,
          plan.duplicatedNodes.find(
            (duplicate) => duplicate.id === plan.idMap.get(node.id),
          ),
        ]),
    );
    const colorPool = [...iot];
    const newMachines = [];
    const newIots = [];
    const newTaskTypes = [];
    const newScenarioRows = [];

    nodes.forEach((node) => {
      const duplicateNode = duplicateByOriginalId.get(node.id);
      if (!duplicateNode) return;

      if (node.type === "machineNode") {
        const original =
          node.data?.machine ??
          machines.find((machine) => String(machine.id) === String(node.id));
        if (!original) return;
        newMachines.push({
          ...original,
          id: Number(duplicateNode.id),
          name: `${original.name}_copy`,
          position: duplicateNode.position,
          parentId: duplicateNode.parentId,
          extent: duplicateNode.parentId ? "parent" : undefined,
          queue: [...(original.queue ?? [])],
          eet: { ...(original.eet ?? {}) },
          eetStdDev: { ...(original.eetStdDev ?? {}) },
        });
        return;
      }

      if (node.type === "iotNode" || node.type === "userNode") {
        const original =
          node.data?.iot ??
          iot.find((source) => `nd_${source.id}` === String(node.id));
        if (!original) return;
        const originalTaskColor = original.properties?.taskColor ?? "Slate";
        const copiedTaskColor = getNextTaskColor(originalTaskColor, colorPool);
        const newIotId = Number(duplicateNode.id.replace(/^nd_/, ""));
        const newIot = {
          ...original,
          id: newIotId,
          name: `${original.name}_copy`,
          position: duplicateNode.position,
          parentId: duplicateNode.parentId,
          extent: duplicateNode.parentId ? "parent" : undefined,
          queue: [...(original.queue ?? [])],
          properties: {
            ...original.properties,
            taskColor: copiedTaskColor,
          },
        };
        newIots.push(newIot);
        colorPool.push(newIot);

        const sourceTaskType = taskTypes.find(
          (taskType) => Number(taskType.srcID) === Number(original.id),
        );
        newTaskTypes.push({
          ...(sourceTaskType ?? {}),
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
        });

        const sourceScenario = scenarioRows.find(
          (row) => Number(row.srcID) === Number(original.id),
        );
        newScenarioRows.push({
          ...(sourceScenario ?? {}),
          srcID: newIot.id,
          taskType: newIot.properties.task_type,
          numTasks: newIot.properties.numTasks,
          startTime: newIot.properties.startTime,
          endTime: newIot.properties.endTime,
          distribution: newIot.properties.distribution,
          arrivalSeed: newIot.properties.arrivalSeed ?? "",
        });

        const copiedColorIndex = TASK_COLOR_NAMES.indexOf(copiedTaskColor);
        colorMemory[sourceTaskColorKey(newIot.id)] = copiedColorIndex;
      }
    });

    const workspaceNodeTypes = new Set([
      "group",
      "edgeSpace",
      "cloudSpace",
    ]);
    const newWorkspaces = nodes
      .filter(
        (node) =>
          plan.idMap.has(node.id) && workspaceNodeTypes.has(node.type),
      )
      .map((node) => {
        const originalWorkspaceId =
          node.data?.workspaceId ?? Number(node.id.replace(/^nd-/, ""));
        const original = workspaces.find(
          (workspace) =>
            Number(workspace.id) === Number(originalWorkspaceId),
        );
        const newNodeId = plan.idMap.get(node.id);
        const newWorkspaceId = Number(newNodeId.replace(/^nd-/, ""));
        return {
          ...(original ?? {
            type: node.data?.workspaceType ?? "edge",
            job_q: [],
            system_config: {},
          }),
          id: newWorkspaceId,
          machines: newMachines
            .filter((machine) => machine.parentId === newNodeId)
            .map((machine) => machine.id),
          iots: newIots
            .filter((source) => source.parentId === newNodeId)
            .map((source) => source.id),
        };
      });
    const newWorkspaceNodeIds = new Set(
      newWorkspaces.map((workspace) => `nd-${workspace.id}`),
    );

    setMachines((current) => [...current, ...newMachines]);
    setIot((current) => [...current, ...newIots]);
    setTaskTypes((current) => [...current, ...newTaskTypes]);
    setScenarioRows((current) => [...current, ...newScenarioRows]);
    setWorkspaces((current) => {
      const updatedExisting = current.map((workspace) => {
        const workspaceNodeId = `nd-${workspace.id}`;
        const addedMachines = newMachines
          .filter(
            (machine) =>
              machine.parentId === workspaceNodeId &&
              !newWorkspaceNodeIds.has(machine.parentId),
          )
          .map((machine) => machine.id);
        const addedIots = newIots
          .filter(
            (source) =>
              source.parentId === workspaceNodeId &&
              !newWorkspaceNodeIds.has(source.parentId),
          )
          .map((source) => source.id);
        if (!addedMachines.length && !addedIots.length) return workspace;
        return {
          ...workspace,
          machines: [...(workspace.machines ?? []), ...addedMachines],
          iots: [...(workspace.iots ?? []), ...addedIots],
        };
      });
      return [...updatedExisting, ...newWorkspaces];
    });

    const genericDuplicates = plan.duplicatedNodes
      .filter(
        (node) =>
          node.type !== "machineNode" &&
          node.type !== "iotNode" &&
          node.type !== "userNode",
      )
      .map((node) => {
        if (!workspaceNodeTypes.has(node.type)) {
          return { ...node, selected: false };
        }
        return {
          ...node,
          selected: false,
          data: {
            ...node.data,
            workspaceId: Number(node.id.replace(/^nd-/, "")),
            name: `${node.data?.name ?? "Workspace"} Copy`,
          },
        };
      })
      .sort((a, b) => Number(Boolean(a.parentId)) - Number(Boolean(b.parentId)));

    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      ...genericDuplicates,
    ]);
    setEdges((current) => [...current, ...plan.duplicatedEdges]);
    const copiedLoadBalancers = genericDuplicates
      .filter((node) => node.type === "LBNode")
      .map((node) => node.id);
    if (copiedLoadBalancers.length) {
      setLoadBalancers((current) => [...current, ...copiedLoadBalancers]);
    }
    if (newIots.length) {
      window.dispatchEvent(new Event("taskColorChanged"));
    }
    setMenu(null);
  }, [
    edges,
    iot,
    machines,
    nodes,
    scenarioRows,
    setEdges,
    setIot,
    setLoadBalancers,
    setMachines,
    setMenu,
    setNodes,
    setScenarioRows,
    setTaskTypes,
    setWorkspaces,
    taskTypes,
    workspaces,
  ]);

  const startNodeSelectionCopy = useCallback(
    (selectedNodeIds, event) => {
      const expandedIds = expandSelectionWithDescendants(
        nodes,
        selectedNodeIds,
      );
      const copyNodes = nodes.filter((node) => expandedIds.has(node.id));
      if (copyNodes.length < 2) return;
      const copyEdges = edges.filter(
        (edge) => expandedIds.has(edge.source) && expandedIds.has(edge.target),
      );

      setNodeCopySource({
        nodeIds: [...selectedNodeIds],
        nodes: copyNodes,
        edges: copyEdges,
        bounds: getNodesBounds(copyNodes),
        paneRect: reactFlowWrapper.current.getBoundingClientRect(),
      });
      setNodeCopyPointer({ x: event.clientX, y: event.clientY });
      setEdgeCopySource(null);
      setMenu(null);
    },
    [edges, getNodesBounds, nodes, setMenu],
  );

  const placeNodeSelectionCopy = useCallback(
    (event) => {
      if (!nodeCopySource) return false;
      const placement = screenToFlowPosition({
        x: event.clientX + 14,
        y: event.clientY + 14,
      });
      duplicateNodeSelection(nodeCopySource.nodeIds, {
        x: placement.x - nodeCopySource.bounds.x,
        y: placement.y - nodeCopySource.bounds.y,
      });
      setNodeCopySource(null);
      return true;
    },
    [duplicateNodeSelection, nodeCopySource, screenToFlowPosition],
  );

  const onConnect = useCallback(
    (params) => {
      const edgeId = `e-${params.source}-${params.target}`;
      const sourceId = String(params.source).replace(/^nd_/, "");
      const source = iot.find(
        (candidate) => String(candidate.id) === sourceId,
      );
      const networkProperties = source
        ? createEdgeNetworkProperties(source.properties)
        : createEdgeNetworkProperties({ connectivity: "Ethernet" });
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: edgeId,
            type: "packet",
            data: {
              properties: networkProperties,
            },
          },
          eds,
        ),
      );
    },
    [iot, setEdges],
  );
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      const selectionIds = selectedNodes.map((selected) => selected.id);
      const useSelection = node.selected && selectionIds.length > 1;

      setMenu({
        id: useSelection ? "selection" : node.id,
        kind: useSelection ? "selection" : "node",
        selectedNodeIds: useSelection ? selectionIds : [],
        top: event.clientY < pane.height - 200 ? event.clientY : null,
        left: event.clientX < pane.width - 200 ? event.clientX : null,
        right:
          event.clientX >= pane.width - 200 ? pane.width - event.clientX : null,
        bottom:
          event.clientY >= pane.height - 200
            ? pane.height - event.clientY
            : null,
      });
    },
    [selectedNodes, setMenu],
  );
  const onPaneContextMenu = useCallback(
    (event) => {
      if (selectedNodes.length < 2) return;
      const selectionBounds = getNodesBounds(selectedNodes);
      const pointer = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const isInsideSelection =
        pointer.x >= selectionBounds.x &&
        pointer.x <= selectionBounds.x + selectionBounds.width &&
        pointer.y >= selectionBounds.y &&
        pointer.y <= selectionBounds.y + selectionBounds.height;
      if (!isInsideSelection) return;

      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      setMenu({
        id: "selection",
        kind: "selection",
        selectedNodeIds: selectedNodes.map((node) => node.id),
        top: event.clientY < pane.height - 200 ? event.clientY : null,
        left: event.clientX < pane.width - 200 ? event.clientX : null,
        right:
          event.clientX >= pane.width - 200 ? pane.width - event.clientX : null,
        bottom:
          event.clientY >= pane.height - 200
            ? pane.height - event.clientY
            : null,
      });
    }, [getNodesBounds, screenToFlowPosition, selectedNodes, setMenu]);
  const onSelectionContextMenu = useCallback(
    (event, selectionNodes) => {
      if (selectionNodes.length < 2) return;
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();
      setMenu({
        id: "selection",
        kind: "selection",
        selectedNodeIds: selectionNodes.map((node) => node.id),
        top: event.clientY < pane.height - 200 ? event.clientY : null,
        left: event.clientX < pane.width - 200 ? event.clientX : null,
        right:
          event.clientX >= pane.width - 200 ? pane.width - event.clientX : null,
        bottom:
          event.clientY >= pane.height - 200
            ? pane.height - event.clientY
            : null,
      });
    },
    [setMenu],
  );
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();

      setMenu({
        id: edge.id,
        kind: "edge",
        top: event.clientY < pane.height - 200 ? event.clientY : null,
        left: event.clientX < pane.width - 200 ? event.clientX : null,
        right:
          event.clientX >= pane.width - 200 ? pane.width - event.clientX : null,
        bottom:
          event.clientY >= pane.height - 200
            ? pane.height - event.clientY
            : null,
      });
      setSelectedEdge(edge);
    },
    [setMenu, setSelectedEdge],
  );
  const closeContextMenu = useCallback(() => setMenu(null), [setMenu]);
  const onPaneClick = useCallback((event) => {
    if (placeNodeSelectionCopy(event)) return;
    setMenu(null);
    setEdgeCopySource(null);
  }, [placeNodeSelectionCopy, setMenu]);

  useEffect(() => {
    if (!edgeCopySource) return undefined;

    const followPointer = (event) => {
      setEdgeCopyPointer({ x: event.clientX, y: event.clientY });
    };
    const cancelOnEscape = (event) => {
      if (event.key === "Escape") setEdgeCopySource(null);
    };

    window.addEventListener("pointermove", followPointer);
    window.addEventListener("keydown", cancelOnEscape);
    return () => {
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("keydown", cancelOnEscape);
    };
  }, [edgeCopySource]);

  useEffect(() => {
    if (!nodeCopySource) return undefined;

    const followPointer = (event) => {
      setNodeCopyPointer({ x: event.clientX, y: event.clientY });
    };
    const cancelOnEscape = (event) => {
      if (event.key === "Escape") setNodeCopySource(null);
    };

    window.addEventListener("pointermove", followPointer);
    window.addEventListener("keydown", cancelOnEscape);
    return () => {
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("keydown", cancelOnEscape);
    };
  }, [nodeCopySource]);

  const edgeCopyNetwork = useMemo(() => {
    if (!edgeCopySource) return null;
    const sourceId = String(edgeCopySource.source ?? "").replace(/^nd_/, "");
    const sourceProperties = iot.find(
      (source) => String(source.id) === sourceId,
    )?.properties;
    return resolveEdgeNetwork(edgeCopySource, sourceProperties);
  }, [edgeCopySource, iot]);

  const nodeCopyPreview = useMemo(() => {
    if (!nodeCopySource) return null;
    const maxWidth = 300;
    const maxHeight = 190;
    const scale = Math.min(
      1,
      maxWidth / Math.max(nodeCopySource.bounds.width, 1),
      maxHeight / Math.max(nodeCopySource.bounds.height, 1),
    );
    const positionOf = (node) =>
      node.positionAbsolute ?? node.internals?.positionAbsolute ?? node.position;
    const previewNodes = nodeCopySource.nodes.map((node) => {
      const position = positionOf(node);
      const width = node.measured?.width ?? node.width ?? 120;
      const height = node.measured?.height ?? node.height ?? 70;
      return {
        id: node.id,
        type: node.type,
        label:
          node.data?.machine?.name ??
          node.data?.iot?.name ??
          node.data?.name ??
          (node.type === "LBNode" ? "Load Balancer" : node.type),
        x: (position.x - nodeCopySource.bounds.x) * scale,
        y: (position.y - nodeCopySource.bounds.y) * scale,
        width: Math.max(width * scale, 28),
        height: Math.max(height * scale, 20),
      };
    });
    const byId = new Map(previewNodes.map((node) => [node.id, node]));
    return {
      width: Math.max(nodeCopySource.bounds.width * scale, 90),
      height: Math.max(nodeCopySource.bounds.height * scale, 55),
      nodes: previewNodes,
      edges: nodeCopySource.edges
        .map((edge) => ({
          id: edge.id,
          source: byId.get(edge.source),
          target: byId.get(edge.target),
        }))
        .filter((edge) => edge.source && edge.target),
    };
  }, [nodeCopySource]);

  // END DND

  // State assignments and functions
  // - Load balancer handlers
  const [scheduling, setScheduling] = useState("immediate");
  const [policy, setPolicy] = useState("FirstCome-FirstServe");
  const [policyUpdated, setPolicyUpdated] = useState(false);
  const [queueSize, setQueueSize] = useState("unlimited");
  const policyNames = [
    "FirstCome-FirstServe",
    "Min-Expected-Completion-Time",
    "Min-Expected-Execution-Time",
    // "Weighted-Round-Robin",
    "Random",
    "Uniform-Resender-Identifier",
    "Least-Connection",
  ];
  function generateAlias(name) {
    const specialCases = {
      Random: "RAND",
      "FirstCome-FirstServe": "FCFS",
    };

    if (specialCases[name]) return specialCases[name];
    return name
      .split("-")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  // End EET Parse

  // - Data parameter handlers
  const [runtimeModel, setRuntimeModel] = useState("Constant");
  const [performanceParams, setPerformanceParams] = useState({
    id: "",
    power: "",
    queue: "",
  });
  const [taskParams, setTaskParams] = useState({
    id: "",
    task_type: "",
    assigned_machine: "",
    data_size: "",
    generation_time: "",
    travel_time: "",
    arrival_time: "",
    connectivity: "",
    deadline: "",
    start_time: "",
    end_time: "",
    status: "",
    source: "",
  });
  const [metricParams, setMetricParams] = useState({
    mean: "",
    std: "",
    mean1: "",
    std1: "",
    mean2: "",
    std2: "",
  });

  // - Sidebar tab handlers
  const [machineTab, setMachineTab] = useState("details");
  const [IOTTab, setIOTTab] = useState("details");
  const animatedMachinesRef = useRef([]);

  const [profilingFileContents, setProfilingFileContents] = useState("");
  const [profilingSubmissionStatus, setProfilingSubmissionStatus] =
    useState(""); // Track profiling submission status

  // -- Workload handlers

  const [workloadFileContents, setWorkloadFileContents] = useState("");

  const filesReady =
    workloadFileUploaded && profilingFileUploaded && configFileUploaded;

  // - Sim results handlers

  const wasRunningRef = useRef(false);

  const [animatedMachines, setAnimatedMachines] = useState(machines); // ANIMATION
  const [animatedIOTs, setAnimatedIOTs] = useState(iot);
  const [flyers, setFlyers] = useState([]);
  const [animatedTaskIds, setAnimatedTaskIds] = useState([]);
  const [machine_index, setMachine_index] = useState(0);
  const [prev_machine_index, setPrev_machine_index] = useState(-1);
  const [iot_index, setIot_index] = useState(0);
  const [taskLoaded, setTaskLoaded] = useState(false);

  const [task, setTask] = useState({
    id: -1,
    task_type: "empty",
    data_size: "",
    generation_time: "",
    travel_time: "",
    arrival_time: 999999999999,
    connectivity: "",
    deadline: "",
  });
  let machine_count;
  // End State assignments

  // Animation references and creation
  const registerBatchSlotRef = (idx, el) => {
    batchSlotsRef.current[idx] = el || null;
  };
  const registerMachineSlotRef = (machineId, idx, el) => {
    if (!machineSlotsRef.current[machineId])
      machineSlotsRef.current[machineId] = [];
    machineSlotsRef.current[machineId][idx] = el || null;
  };
  const getCenter = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  // End Animation references and creation

  // Data Update handlers
  // - Update machine params
  useEffect(() => {
    setPerformanceParams({
      id: selectedMachine.id,
      name: selectedMachine.name,
      queue: selectedMachine.queue,
      power: selectedMachine.power,
      idle_power: selectedMachine.idle_power,
      replicas: selectedMachine.replicas,
      price: selectedMachine.price,
      cost: selectedMachine.cost,
    });
  }, [selectedMachine]);

  // - Update task params
  const uploadTasks = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5001/api/iot_sim/upload_tasks", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.iot_nodes) {
      setIot(data.iot_nodes);
    }
  };

  useEffect(() => {
    setTaskParams((prev) => ({
      ...prev,
      id: selectedTask.id,
      task_type: selectedTask.task_type,
      assigned_machine: selectedTask.assigned_machine,
      data_size: selectedTask.data_size,
      generation_time: selectedTask.generation_time,
      travel_time: selectedTask.travel_time,
      arrival_time: selectedTask.arrival_time,
      connectivity: selectedTask.connectivity,
      deadline: selectedTask.deadline,
      start_time: selectedTask.start_time,
      end_time: selectedTask.end_time,
      status: selectedTask.status,
    }));
  }, [selectedTask]);

  const handleSchedulingChange = (type) => {
    setScheduling(type);
    if (type === "immediate") {
      setQueueSize("unlimited"); // Set queue size to "unlimited" for immediate scheduling
    } else if (type === "batch") {
      setQueueSize(""); // Set queue size to "0" for batch scheduling
    }
  };

  const handleSubmitWorkloadAndProfiling = async () => {
    try {
      // Simulate submission logic
      setWorkloadSubmissionStatus("Submitting...");
      alert("CLicked");
      setWorkloadSubmissionStatus("Submission help!");
    } catch (error) {
      setWorkloadSubmissionStatus("Submission failed.");
    }
  };

  const handlePauseSim = () => {
    pauseSimulationWorker();
  };

  const handleResumeSim = () => {
    resumeSimulationWorker();
  };

  const handleRestartSim = () => {
    stopSimulationWorker();
    simCurrentRef.current = 0;

    // Clear machine queues from the previous run
    const clearedMachines = machines.map((m) => ({ ...m, queue: [] }));
    setMachines(clearedMachines);
    machinesRef.current = clearedMachines;

    runDataSimulation();
    pauseSimulationWorker();
  };

  const handleResetWorkload = () => {
    stopSimulationWorker();
    // Clear all uploaded file information
    setWorkloadFileName("");
    setWorkloadFileUploaded(false);
    setWorkloadTableData([]);
    setProfilingFileName("");
    setProfilingFileUploaded(false);
    setProfilingTableData([]);
    setConfigFileName("");
    setConfigFileUploaded(false);
    // Clear the batch queue visually
    setBatchQ({});
    setMachines([]);
    setIot([]);
    // Clear results if needed
    setDataResults([]);
    // Clear status message
    setWorkloadSubmissionStatus("");
    setFlyers([]);
  };
  // Add function to handle machine property updates
  const handleMachinePropertySave = async (updatedMachine) => {
    try {
      console.log("Saving machine properties:", updatedMachine);
      // Update React state so canvas and sidebar re-render
      // Spread existing machine first to preserve fields not in the edit form (position, parentId, etc.)
      setMachines((prev) =>
        prev.map((m) =>
          m.id === updatedMachine.id ? { ...m, ...updatedMachine } : m,
        ),
      );
      // Update the machines ref
      machinesRef.current = machinesRef.current.map((machine) =>
        machine.id === updatedMachine.id
          ? { ...machine, ...updatedMachine }
          : machine,
      );
      // Generate updated config - make sure all machines are included
      const allMachines = machinesRef.current.filter((m) => m.id !== -1);
      const updatedConfig = {
        parameters: [
          {
            machine_queue_size: 3000,
            batch_queue_size: 1,
            scheduling_method: "FCFS",
            fairness_factor: 1.0,
          },
        ],
        settings: [
          {
            path_to_output: "./output",
            path_to_workload: "./workload",
            verbosity: 3,
            gui: 1,
          },
        ],
        task_types: [],
        battery: [{ capacity: 5000.0 }],
        machines: allMachines.map((m) => ({
          name: m.name || "",
          power: Number(m.power) || 0,
          idle_power: Number(m.idle_power) || 0,
          energySource: m.energySource || "Grid-Powered",
          batteryCapacityJ: Math.max(0, Number(m.batteryCapacityJ) || 0),
          processingEnergyPerKbJ: machineProcessingEnergyRateJPerKb(m),
          replicas: Number(m.replicas) || 1,
          price: Number(m.price) || 0,
          cost: Number(m.cost) || 0,
        })),
        cloud: [
          {
            bandwidth: 15000.0,
            network_latency: 0.015,
          },
        ],
      };
      console.log("Sending config update:", updatedConfig);
      // Send updated config to backend
    } catch (error) {
      // Config sync failed (e.g. server not running) — state already updated, just warn
      console.warn("Config sync failed (non-fatal):", error.message);
    }
  };
  const handleIOTPropertySave = async (updatedIOT) => {
    setIot((prev) =>
      prev.map((i) => (i.id === updatedIOT.id ? { ...i, ...updatedIOT } : i)),
    );
    const updatedIotType = {
      srcID: updatedIOT.id,
      name: updatedIOT.name,
      dataInput: updatedIOT.properties.dataInput,
      meanSize: updatedIOT.properties.meanSize,
      dataSizeStdDev:
        updatedIOT.properties.dataSizeStdDev ?? updatedIOT.properties.stdv ?? 1,
      dataSizeSeed: updatedIOT.properties.dataSizeSeed ?? "",
      connectivity: updatedIOT.properties.connectivity,
      dataRateKbps: updatedIOT.properties.dataRateKbps ?? 54000,
      urgency: updatedIOT.properties.urgency,
      slack: updatedIOT.properties.slack,
    };

    const updatedIotScenarios = {
      srcID: updatedIOT.id,
      taskType: updatedIOT.properties.task_type,
      numTasks: updatedIOT.properties.numTasks,
      startTime: updatedIOT.properties.startTime,
      endTime: updatedIOT.properties.endTime,
      distribution: updatedIOT.properties.distribution,
      arrivalSeed: updatedIOT.properties.arrivalSeed ?? "",
    };

    setTaskTypes(
      taskTypes.map((i) => (i.srcID === updatedIOT.id ? updatedIotType : i)),
    );
    setScenarioRows(
      scenarioRows.map((i) =>
        i.srcID === updatedIOT.id ? updatedIotScenarios : i,
      ),
    );
    // generate new workload and save to workload Q
  };
  // End Data Update handlers
  const runDataSimulation = async () => {
    try {
      if (!iot?.length || !machines?.length) {
        alert("Failed to run simulation. Missing IoTs or Machines");
        return;
      }

      const runCount = normalizeSimulationRunCount(simulationRunCount);
      const runSeeds = normalizeSimulationSeeds(
        runCount,
        simulationSeeds,
        simulationSeed,
      );
      const workload = generateWorkload(
        scenarioRows,
        taskTypes,
        0,
        edges,
        runSeeds[0],
      );
      if (!workload.length) {
        alert("Failed to run simulation. No tasks were generated.");
        return;
      }
      if (workload.length * runCount > MAX_BATCH_TASKS) {
        alert(
          `This batch would process ${(
            workload.length * runCount
          ).toLocaleString()} tasks. Reduce the number of simulations or tasks so the batch stays at or below ${MAX_BATCH_TASKS.toLocaleString()} tasks.`,
        );
        return;
      }

      const clearedMachines = machines.map((m) => ({
        ...m,
        utilization_time: 0,
        total_cost: 0,
        total_tasks: 0,
        queue: [],
      }));
      setMachines(clearedMachines);
      machinesRef.current = clearedMachines;
      setBatchQ({ id: -2, name: "Batch Queue", queue: [...workload] });
      setWorkloadTableData([...workload]);
      setWorkloadFileUploaded(true);
      setMachineConfig(generateMachineConfig(clearedMachines, taskTypes));
      setShowReport(true);

      simCurrentRef.current = 0;
      setSimulationTime(0);
      setCompletedTasks([]);
      setUnassignedTasks([]);
      setMissedTasks([]);
      setDataResults([...workload]);
      setTotalTasks(workload.length);
      setSimTotal(Infinity);
      totalSimTimeRef.current = Infinity;

      const commonPayload = {
        policyAlias,
        deadlinePolicy,
        machines: clearedMachines,
        iot,
        edges: edges.map(({ source, target }) => ({ source, target })),
        nodes: nodes.map(({ id, type }) => ({ id, type })),
      };
      const backgroundRuns = runSeeds.slice(1).map((seed, index) => ({
        runNumber: index + 2,
        seed,
        payload: {
          ...commonPayload,
          tasks: generateWorkload(
            scenarioRows,
            taskTypes,
            0,
            edges,
            seed,
          ),
          simulationSeed: seed,
        },
      }));
      const started = startSimulationBatch({
        visibleRun: {
          runNumber: 1,
          seed: runSeeds[0],
          payload: {
            ...commonPayload,
            tasks: workload,
            simulationSeed: runSeeds[0],
          },
        },
        backgroundRuns,
        maxWorkers: MAX_BACKGROUND_WORKERS,
      });
      if (!started) {
        alert("Failed to start the background simulation worker.");
      }
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Failed to run simulation.");
    }
  };

  // Keep animatedMachinesRef in sync so the interval can read it without a functional updater
  useEffect(() => {
    animatedMachinesRef.current = animatedMachines;
  }, [animatedMachines]);

  useEffect(() => {
    if (simulationWorkerError) alert(simulationWorkerError);
  }, [simulationWorkerError]);

  useEffect(() => {
    if (isRunning) {
      wasRunningRef.current = true;
      return;
    }
    if (
      wasRunningRef.current &&
      totalTasks > 0 &&
      dataResults.length >= totalTasks
    ) {
      wasRunningRef.current = false;
      const backgroundRunsPending = batchRunResults.some(
        (entry) =>
          entry.runNumber > 1 &&
          (entry.status === "pending" || entry.status === "running"),
      );
      alert(
        backgroundRunsPending
          ? "The visible simulation is complete. Background runs are still finishing; Reports will update automatically."
          : "Simulation batch complete! Check the Reports page for results.",
      );
    }
  }, [batchRunResults, dataResults.length, isRunning, totalTasks]);

  // /* -------------------- WORKSPACE, EDGE, MACHINE, and IOT NODES -------------------- */
  useEffect(() => {
    setNodes((prev) => {
      const nodesMap = Object.fromEntries(prev.map((n) => [n.id, n]));

      const machineNodes = machines.map((m, index) => {
        const parentExists = m.parentId ? nodesMap[m.parentId] : true;

        return {
          id: `${m.id}`,
          type: "machineNode",
          data: { machine: m },
          position: m.position ?? { x: 600, y: 80 + index * 150 },
          parentId: parentExists ? m.parentId : undefined,
          extent: parentExists && m.parentId ? "parent" : undefined,
          draggable: true,
          expandParent: true,
        };
      });

      const otherNodes = prev.filter((n) => n.type !== "machineNode");

      return [...otherNodes, ...machineNodes];
    });
  }, [machines, setNodes]);

  useEffect(() => {
    setNodes((prev) => {
      const nodesMap = Object.fromEntries(prev.map((n) => [n.id, n]));

      const iotNodes = iot.map((i, index) => {
        const parentExists = i.parentId ? nodesMap[i.parentId] : true;

        return {
          id: `nd_${i.id}`,
          type: i.properties?.user ? "userNode" : "iotNode",
          data: { iot: i },
          position: i.position ?? { x: 0, y: 80 + index * 150 },
          parentId: parentExists ? i.parentId : undefined,
          extent: parentExists && i.parentId ? "parent" : undefined,
          draggable: true,
          expandParent: true,
        };
      });

      const otherNodes = prev.filter(
        (n) => n.type !== "iotNode" && n.type !== "userNode",
      );

      return [...otherNodes, ...iotNodes];
    });
  }, [iot, setNodes]);

  const handleSubmitLoadBalancer = async () => {
    try {
      // Simulate submission logic
      setSubmissionStatus("Submitting...");
      setPolicyUpdated(true);
      setSubmissionStatus("Submission successful!");
    } catch (error) {
      setSubmissionStatus("Submission failed.");
    }
  };

  const handleClearWorkspace = () => {
    if (
      !window.confirm(
        "Clear the current workspace and unsaved simulation data? Saved projects will not be deleted.",
      )
    ) {
      return;
    }

    stopSimulationWorker();
    simCurrentRef.current = 0;
    totalSimTimeRef.current = Infinity;
    machinesRef.current = [];
    batchSlotsRef.current = [];
    machineSlotsRef.current = {};
    animatedMachinesRef.current = [];

    setIsRunning(false);
    setIsPaused(false);
    setSimulationTime(0);
    setSimTotal(Infinity);
    setShowReport(false);
    setTotalTasks(0);
    setCompletedTasks([]);
    setUnassignedTasks([]);
    setMissedTasks([]);
    setDataResults([]);
    setNodes([]);
    setEdges([]);
    setMachines([]);
    setIot([]);
    setLoadBalancers([]);
    setWorkspaces([]);
    setTaskTypes([]);
    setScenarioRows([]);
    setMachineConfig([]);
    setBatchQ({ id: -2, name: "Batch Queue", queue: [] });
    setAnimatedMachines([]);
    setAnimatedIOTs([]);
    setFlyers([]);
    setAnimatedTaskIds([]);
    setMenu(null);
    setShowSidebar(false);
    setPolicyUpdated(true);
    setDeadlinePolicy("drop");
    Object.keys(colorMemory).forEach((key) => delete colorMemory[key]);
    window.dispatchEvent(new Event("taskColorChanged"));
  };

  return (
    <div className=" bg-[#d9d9d9] m-5 h-720 max-h-screen max-w-1500 flex flex-col relative ">
      {/* DND */}
      <div className=" p-5 bg-gray-100 h-dvh max-w-screen max-h-screen relative">
        <div className="dndflow flex gap-1">
          <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeDragStop={onDragStop}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onSelectionContextMenu={onSelectionContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              selectionKeyCode="Shift"
              selectionMode={SelectionMode.Partial}
              panOnDrag={[0, 1]}
            >
              <Controls position="center-left" showInteractive={false}>
                <ControlButton
                  onClick={handleAutoFitLockToggle}
                  title={
                    isAutoFitLocked
                      ? "Unlock automatic zoom and fit the workspace"
                      : "Lock automatic zoom"
                  }
                  aria-label={
                    isAutoFitLocked
                      ? "Unlock automatic zoom"
                      : "Lock automatic zoom"
                  }
                  className={isAutoFitLocked ? "!bg-blue-100 !text-blue-700" : ""}
                >
                  {isAutoFitLocked ? (
                    <MdLock size={16} aria-hidden="true" />
                  ) : (
                    <MdLockOpen size={16} aria-hidden="true" />
                  )}
                </ControlButton>
                <ControlButton
                  onClick={handleClearWorkspace}
                  title="Clear workspace"
                  aria-label="Clear workspace"
                >
                  <MdDeleteOutline size={16} aria-hidden="true" />
                </ControlButton>
              </Controls>
              <Background />
              {menu && (
                <ContextMenu
                  onClick={closeContextMenu}
                  onDuplicateEdge={startEdgePropertyCopy}
                  onDuplicateSelection={startNodeSelectionCopy}
                  selectedNodeIds={selectedNodes.map((node) => node.id)}
                  {...menu}
                />
              )}
            </ReactFlow>
          </div>
          <Sidebar setNodes={setNodes} />
        </div>
        {edgeCopySource && edgeCopyNetwork && (
          <div
            className="fixed z-[100000] pointer-events-none flex items-center gap-2 rounded-full border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-xl"
            style={{
              left: edgeCopyPointer.x + 14,
              top: edgeCopyPointer.y + 14,
            }}
            role="status"
            aria-live="polite"
          >
            <FiCopy className="text-blue-600" aria-hidden="true" />
            <span
              className="block w-7"
              style={{
                borderTop: `3px ${getEdgeNetworkVisual(edgeCopyNetwork.networkType).dash ? "dashed" : "solid"} ${getEdgeNetworkVisual(edgeCopyNetwork.networkType).color}`,
              }}
              aria-hidden="true"
            />
            <span>
              {edgeCopyNetwork.networkType} · {formatDataRate(edgeCopyNetwork.dataRateKbps)} · {edgeCopyNetwork.uploadPowerW} W
            </span>
            <span className="font-normal text-gray-500">Click a connection</span>
          </div>
        )}
        {nodeCopySource && (
          <div
            className="fixed z-[99999] cursor-copy"
            style={{
              left: nodeCopySource.paneRect.left,
              top: nodeCopySource.paneRect.top,
              width: nodeCopySource.paneRect.width,
              height: nodeCopySource.paneRect.height,
            }}
            onClick={placeNodeSelectionCopy}
            onContextMenu={(event) => event.preventDefault()}
            aria-label="Click to place duplicated selection"
          />
        )}
        {nodeCopySource && nodeCopyPreview && (
          <div
            className="fixed z-[100000] pointer-events-none"
            style={{
              left: nodeCopyPointer.x + 14,
              top: nodeCopyPointer.y + 14,
              width: nodeCopyPreview.width,
              height: nodeCopyPreview.height + 32,
            }}
            role="status"
            aria-live="polite"
          >
            <div
              className="relative rounded-lg border-2 border-dashed border-blue-500 bg-blue-100/70 shadow-xl backdrop-blur-sm"
              style={{
                width: nodeCopyPreview.width,
                height: nodeCopyPreview.height,
              }}
            >
              <svg
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                {nodeCopyPreview.edges.map((edge) => (
                  <line
                    key={edge.id}
                    x1={edge.source.x + edge.source.width / 2}
                    y1={edge.source.y + edge.source.height / 2}
                    x2={edge.target.x + edge.target.width / 2}
                    y2={edge.target.y + edge.target.height / 2}
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                ))}
              </svg>
              {nodeCopyPreview.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute flex items-center justify-center overflow-hidden rounded border border-blue-500 px-1 text-[10px] font-semibold text-blue-950 ${
                    node.type === "group" ||
                    node.type === "edgeSpace" ||
                    node.type === "cloudSpace"
                      ? "bg-blue-50/30"
                      : "bg-white/90"
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                  }}
                >
                  {node.label}
                </div>
              ))}
            </div>
            <div className="mt-1 rounded-full bg-blue-600 px-3 py-1 text-center text-xs font-semibold text-white shadow-lg">
              Click the canvas to place · Esc to cancel
            </div>
          </div>
        )}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between space-x-4 bg-white rounded-full shadow-lg px-6 py-3">
              <>
                <SimulationSeedSettings
                  value={simulationSeed}
                  runCount={simulationRunCount}
                  seeds={simulationSeeds}
                  onApply={applySimulationSettings}
                  disabled={isRunning}
                />
                <button
                  onClick={runDataSimulation}
                  className={` bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-md`}
                >
                  ▶
                </button>
                <button
                  className={`${isRunning ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"} text-white rounded-full w-12 h-12 flex items-center justify-center transition`}
                  onClick={isRunning ? handleRestartSim : undefined}
                  disabled={!isRunning}
                >
                  ↺
                </button>
                <button
                  className={`${isRunning ? (isPaused ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600") : "bg-gray-300 cursor-not-allowed"} text-white rounded-full w-12 h-12 flex items-center justify-center transition`}
                  onClick={
                    isRunning
                      ? isPaused
                        ? handleResumeSim
                        : handlePauseSim
                      : undefined
                  }
                  disabled={!isRunning}
                >
                  {isPaused ? "▶" : "⏸"}
                </button>
              </>
            </div>
            {isRunning ? (
              <div className="bg-white rounded-full shadow-lg px-6 py-3">
                <h3 className="text-xl font-bold text-gray-800 bg-white">
                  Sim Time: {simulationTime.toFixed(2)} seconds
                </h3>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      {/* Main Simulation Area */}

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-80 min-w-min bg-white shadow-lg z-50 p-6 border-l border-gray-300 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {sidebarMode === "workload"
                  ? "Workload & Profiling Table"
                  : sidebarMode === "loadBalancer"
                    ? "Load Balancer"
                    : sidebarMode === "task"
                      ? "Task Properties"
                      : sidebarMode === "edgeProps"
                        ? `Edge Properties`
                        : sidebarMode === "machine"
                          ? `Machine: ${selectedMachine.name?.toUpperCase()}`
                          : sidebarMode === "IOT"
                            ? `IOT: ${selectedIOT.name?.toUpperCase()}`
                            : sidebarMode === "user"
                              ? `User: ${selectedIOT.name?.toUpperCase()}`
                              : "Drag and Drop Templates"}
              </h2>
              <button
                onClick={() => {
                  setShowSidebar(false);
                  setNodes((currentNodes) =>
                    currentNodes.map((node) => ({
                      ...node,
                      selected: false,
                    })),
                  );
                }}
                className="text-xl text-gray-500 hover:text-black"
              >
                &times;
              </button>
            </div>

            {sidebarMode === "loadBalancer" && (
              <form className="space-y-6">
                {/* Load Balancer Sidebar Content */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    Load Balancing Policy
                    <SchedulingPolicyHelp selectedPolicy={policyAlias} />
                  </label>
                  <div className="space-y-1">
                    <select
                      value={policyAlias}
                      onChange={(e) => {
                        setPolicyAlias(e.target.value);
                      }}
                      className="w-full border px-3 py-2 text-sm rounded"
                    >
                      {policyNames.map((name) => {
                        const alias = generateAlias(name);
                        return (
                          <option key={name} value={alias}>
                            {name} ({alias})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    Upon missing deadline <DeadlinePolicyHelp />
                  </label>
                  <select
                    value={deadlinePolicy}
                    onChange={(e) => setDeadlinePolicy(e.target.value)}
                    className="w-full border px-3 py-2 text-sm rounded bg-white"
                  >
                    <option value="drop">Drop task at deadline</option>
                    <option value="continue">Finish all tasks</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitLoadBalancer}
                  className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                >
                  Submit
                </button>

                {submissionStatus && (
                  <p className="text-sm text-center text-green-600 mt-2">
                    {submissionStatus}
                  </p>
                )}
              </form>
            )}

            {sidebarMode === "machine" && (
              <div className="space-y-6">
                {/* Machine Sidebar Content */}
                <div className="flex space-x-4 border-b pb-2">
                  <button
                    onClick={() => setMachineTab("details")}
                    className={`text-sm font-semibold ${
                      machineTab === "details"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Properties
                  </button>
                </div>

                {machineTab === "details" && (
                  <div className="space-y-6">
                    {/* Machine Details Tab */}
                    <div className="space-y-2">
                      <EditMachineProperties
                        selectedMachine={selectedMachine}
                        setSelectedMachine={setSelectedMachine}
                        onSave={handleMachinePropertySave}
                        animatedMachines={animatedMachines}
                        setAnimatedMachines={setAnimatedMachines}
                      />
                    </div>

                    {/* Show admitted tasks */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Admitted Tasks
                      </label>
                      {performanceParams.queue &&
                      performanceParams.queue.length > 0 ? (
                        <table className="min-w-full text-xs border border-gray-300 bg-white">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 border">ID</th>
                              <th className="px-2 py-1 border">Type</th>
                              <th className="px-2 py-1 border">Status</th>
                              <th className="px-2 py-1 border">
                                Machine Arrival
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {performanceParams.queue.map((task, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1 border">{task.id}</td>
                                <td className="px-2 py-1 border">
                                  {task.task_type}
                                </td>
                                <td className="px-2 py-1 border">
                                  {task.status}
                                </td>
                                <td className="px-2 py-1 border">
                                  {task.arrival_time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          No tasks admitted
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sidebarMode === "task" && (
              <div className="space-y-6">
                {/* Task Sidebar Content */}
                <div className="flex space-x-4 border-b pb-2">
                  <table className="flex w-full text-left border-collapse">
                    <thead>
                      <tr className=" flex flex-col gap-3.5 ">
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Task ID
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Assigned Machine
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Generation Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Travel Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Arrival Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Start Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          End Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Deadline
                        </th>
                      </tr>
                    </thead>
                    <tbody className=" flex flex-col gap-3">
                      {[
                        "ID",
                        "task_type",
                        "status",
                        "assigned_machine",
                        "generation_time",
                        "travel_time",
                        "arrival_time",
                        "start_time",
                        "end_time",
                        "deadline",
                      ].map((key, index) => (
                        <td
                          key={`task-param-${key}-${index}`}
                          className=" w-full border px-4 py-2 text-sm rounded bg-gray-100"
                        >
                          {taskParams[key.toLowerCase()] || "N/A"}
                        </td>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {sidebarMode === "edgeProps" && (
              <EditEdgeProperties selectedEdge={selectedEdge} />
            )}
            {sidebarMode === "IOT" && (
              <div className="space-y-6">
                {/* IOT Sidebar Content */}
                <div className="flex space-x-4 border-b pb-2">
                  <button
                    onClick={() => setIOTTab("details")}
                    className={`text-sm font-semibold ${
                      IOTTab === "details"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Properties
                  </button>
                </div>

                {IOTTab === "details" && (
                  <div className="space-y-6">
                    {/* IOT Details Tab */}
                    <div className="space-y-2">
                      <EditIoTProperties
                        selectedIOT={selectedIOT}
                        setSelectedIOT={setSelectedIOT}
                        onSave={handleIOTPropertySave}
                        animatedIOTs={animatedIOTs}
                        setAnimatedIOTs={setAnimatedIOTs}
                      />
                    </div>

                    {/* Show admitted tasks */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Admitted Tasks
                      </label>
                      {performanceParams.queue &&
                      performanceParams.queue.length > 0 ? (
                        <table className="min-w-full text-xs border border-gray-300 bg-white">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 border">ID</th>
                              <th className="px-2 py-1 border">Type</th>
                              <th className="px-2 py-1 border">Status</th>
                              <th className="px-2 py-1 border">
                                Machine Arrival
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {performanceParams.queue.map((task, idx) => (
                              <tr key={idx}>
                                <td className="px-2 py-1 border">{task.id}</td>
                                <td className="px-2 py-1 border">
                                  {task.task_type}
                                </td>
                                <td className="px-2 py-1 border">
                                  {task.status}
                                </td>
                                <td className="px-2 py-1 border">
                                  {task.arrival_time}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          No tasks admitted
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {sidebarMode === "user" && (
              <div className="space-y-6">
                {/* IOT Sidebar Content */}
                <div className="flex space-x-4 border-b pb-2">
                  <button
                    onClick={() => setIOTTab("details")}
                    className={`text-sm font-semibold ${
                      IOTTab === "details"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    Properties
                  </button>
                </div>

                {IOTTab === "details" && (
                  <div className="space-y-6">
                    {/* IOT Details Tab */}
                    <div className="space-y-2">
                      <EditUserProperties
                        selectedIOT={selectedIOT}
                        setSelectedIOT={setSelectedIOT}
                        onSave={handleIOTPropertySave}
                        animatedIOTs={animatedIOTs}
                        setAnimatedIOTs={setAnimatedIOTs}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimDashboard;
