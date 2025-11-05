// GlobalState.js
import React, { createContext, useContext, useState } from "react";
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
    id: -1,
    name: "empty iot",
    properties: {},
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
  const [iot, setIot] = useState([{ id: -1, name: "empty", properties: {} }]);
  const [batchQ, setBatchQ] = useState({
    id: -2,
    name: "Batch Queue",
    queue: [],
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "machineNode",
      data: { machine: machines },
      position: { x: 250, y: 70 },
    },

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
  ]);
  const [submissionStatus, setSubmissionStatus] = useState(""); // Track submission status
  const [workloadSubmissionStatus, setWorkloadSubmissionStatus] = useState(""); // Track workload submission status
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
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

// Custom hook for easy access
export const useGlobalState = () => useContext(GlobalContext);
