// GlobalState.js
import React, { createContext, useContext, useState, useRef } from "react";
import { useEdgesState, useNodesState } from "@xyflow/react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  // Define States

  const [selectedMachine, setSelectedMachine] = useState({
    id: -1,
    name: "empty machine",
    queue: [],
  });
  const [selectedIOT, setSelectedIOT] = useState({
    id: -3,
    name: "empty iot",
    properties: [],
  });
  const [simulationTime, setSimulationTime] = useState(0); //TIME

  const [selectedTask, setSelectedTask] = useState({
    id: -1,
    task_type: "empty",
    data_size: "",
    arrival_time: "",
    assigned_machine: "",
    deadline: "",
    start: "",
    end: "",
    status: "",
  });
  const [machines, setMachines] = useState([
    { id: -1, name: "empty", queue: [] },
  ]);
  const [iot, setIot] = useState([{ id: -3, name: "empty", properties: {} }]);
  const [batchQ, setBatchQ] = useState({
    id: -2,
    name: "Batch Queue",
    queue: [],
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const onDragStop = (event, node) => {
    if (node.type === "machineNode") {
      setMachines((prev) =>
        prev.map((m) =>
          `machine-${m.id}` === node.id
            ? { ...m, position: node.position } // update position in state
            : m
        )
      );
    } else if (node.type === "iotNode") {
      setIot((prev) =>
        prev.map((i) =>
          `IOT-${i.id}` === node.id
            ? { ...i, position: node.position } // update position in state
            : i
        )
      );
    }
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "lb",
      type: "LBNode",
      data: { machine: machines },
      position: { x: 520, y: 60 },
    },

    {
      id: "wl",
      type: "workloadNode",
      data: { machine: machines },
      position: { x: 0, y: 60 },
    },
    {
      id: "bq",
      type: "QueueNode",
      data: { machine: machines },
      position: { x: 160, y: 90 },
    },
  ]);
  /* future Node reference
{
      id: "edgeType",
      type: "edgeSpace",
      position: { x: -100, y: 200 },
      data: { label: "edges" },
    },
    {
      id: "cloudType",
      type: "cloudSpace",
      position: { x: 230, y: 200 },
      data: { label: "edges" },
    },
    {
      id: "A-2",
      type: "edgeLockedNode",
      data: { label: "Child Node 2" },
      position: { x: 10, y: 90 },
      parentId: "edgeType",
      extent: "parent",
    },
  */
  const [submissionStatus, setSubmissionStatus] = useState(""); // Track submission status
  const [workloadSubmissionStatus, setWorkloadSubmissionStatus] = useState(""); // Track workload submission status
  const machinesRef = useRef([]);
  const batchSlotsRef = useRef([]);
  const machineSlotsRef = useRef({});
  const loadBalancerRef = useRef(null);
  // End Define States

  const value = {
    selectedMachine,
    setSelectedMachine,
    selectedIOT,
    setSelectedIOT,
    simulationTime,
    setSimulationTime,
    selectedTask,
    setSelectedTask,
    machines,
    setMachines,
    iot,
    onDragStop,
    setIot,
    batchQ,
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
    loadBalancerRef,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

// Custom hook for easy access
export const useGlobalState = () => useContext(GlobalContext);
