// GlobalState.js
import React, { createContext, useContext, useState, useRef } from "react";
import {
  useEdgesState,
  useNodesState,
  useReactFlow,
  getOutgoers,
} from "@xyflow/react";
import axios from "axios";
import { eetTable } from "../utils/exportCSV";
import { generateWorkload } from "../workload/tabs/ScenarioTab";
import { generateMachineConfig } from "../workload/tabs/MachineTypesTab";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const { fitView, getEdges, getNode, getEdge, getNodes } = useReactFlow();

  // Define States
  const [colorMemory, SetcolorMemory] = useState({});
  const [selectedMachine, setSelectedMachine] = useState({
    id: -1,
    name: "",
    power: 0,
    idle_power: 0,
    replicas: 1,
    price: 0,
    cost: 0,
    utilization_time: 0,
    total_cost: 0,
    total_tasks: 0,
    eet: {},
    parentId: undefined,
    extent: undefined,
  });
  const [selectedIOT, setSelectedIOT] = useState({
    id: -3,
    name: "empty iot",
    properties: {
      task_type: "",
      dataInput: "image",
      meanSize: 0,
      urgency: "BestEffort",
      slack: 0,
      numTasks: 0,
      startTime: 0,
      endTime: 0,
      distribution: "uniform",
      deviceRole: "sensor",
      frequency: 0,
      connectivity: "WiFi",
      energySource: "Wired",
      taskColor: "Slate",
    },
    queue: [],
    parentId: undefined,
    extent: undefined,
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
  const workspace = {
    id: -3030,
    job_q: [],
    system_config: {},
    machines: [],
    iots: [],
  };

  const EDGE_PROPERTIES = {
    connectionType: "LAN",
  };

  const [selectedWorkspace, setSelectedWorkspace] = useState(workspace);
  const [selectedEdge, setSelectedEdge] = useState(EDGE_PROPERTIES);

  const [workspaces, setWorkspaces] = useState([]);
  const [machines, setMachines] = useState([]);
  const [iot, setIot] = useState([]);
  const [loadBalancers, setLoadBalancers] = useState([]);
  const [batchQ, setBatchQ] = useState({
    id: -2,
    name: "Batch Queue",
    queue: [],
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [dataResults, setDataResults] = useState([]);
  const [missedTasks, setMissedTasks] = useState([]);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const getNeighbors = (sourceID) => {
    let outies =
      getOutgoers(getNode(sourceID) ?? "", getNodes(), getEdges()) || [];
    let allOuties = outies;
    if (outies) {
      outies.map((n) => {
        if (n.type !== "LBNode") return;
        const lbOuties = getOutgoers(getNode(n.id), getNodes(), getEdges());
        allOuties = allOuties.concat(lbOuties);
      });
    }

    allOuties = allOuties.filter((n) => n.type !== "LBNode");
    return allOuties;
  };
  const isNeighbors = (sourceID, targetID) => {
    const reached = getNeighbors(sourceID);
    let isWithin = false;
    reached.map((n) => {
      if (n.id == targetID) {
        isWithin = true;
      }
    });
    return isWithin;
  };
  const onDragStop = (event, node) => {
    // Adjust viewport nicely after drag
    fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });

    // Only handle machine/iot nodes
    if (node.type !== "machineNode" && node.type !== "iotNode") return;

    const updater = node.type === "machineNode" ? setMachines : setIot;
    updater((prev) =>
      prev.map((item) => {
        let oID;
        node.type === "machineNode"
          ? (oID = `${item.id}`)
          : (oID = `nd_${item.id}`);
        return oID === node.id
          ? {
              ...item,
              // Keep the node position relative to its current parent
              position: node.position,
              // Keep parentId and extent as-is
              parentId: item.parentId,
              extent: item.extent,
            }
          : item;
      }),
    );
  };
  // Workload generator states
  const [taskTypes, setTaskTypes] = useState([]);
  const [scenarioRows, setScenarioRows] = useState([]);
  //EET Parse
  const [eetLoaded, setEetLoaded] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);
  // file submission handlers and states
  const [profilingFileName, setProfilingFileName] = useState("");
  const [profilingFileUploaded, setProfilingFileUploaded] = useState(false);
  const [profilingTableData, setProfilingTableData] = useState([]);
  const [workloadFileName, setWorkloadFileName] = useState("");
  const [workloadFileUploaded, setWorkloadFileUploaded] = useState(false);
  const [workloadTableData, setWorkloadTableData] = useState([]);
  const [configFileName, setConfigFileName] = useState("");
  const [machineConfig, setMachineConfig] = useState("");
  const [configFileUploaded, setConfigFileUploaded] = useState(false);
  const distributionOptions = ["uniform", "normal", "exponential", "spiky"];
  const parseCSV = (csvContent) => {
    const rows = csvContent.split("\n").map((row) => row.split(","));
    const headers = rows[0];
    const data = rows.slice(1).map((row) =>
      row.reduce((acc, value, index) => {
        acc[headers[index]] = value;
        return acc;
      }, {}),
    );
    return data;
  };
  // work space helpers

  const handleProfilingUpload = async (e) => {
    const file = e.target.files[0];
    console.log(e);
    if (!file || !file.name.endsWith(".eet")) {
      alert("Only .eet files are allowed for profiling.");
      return;
    }
    setProfilingFileName(file.name); // Set the profiling file name
    setProfilingFileUploaded(true); // Mark profiling file as uploaded

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setProfilingTableData(parseCSV(content)); // Parse CSV into table data

      // load into EET table for dequeue logic
      try {
        eetTable.loadFromCSV(content);
        setEetLoaded(true);

        console.log("EET Table loaded:", eetTable.toMatrix());
      } catch (err) {
        console.error("Failed to parse EET table:", err);
      }
    };
    reader.readAsText(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/workload/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      console.log("Profiling upload success:", res.data);
    } catch (err) {
      console.error("Profiling upload error:", err);
      alert("Failed to upload profiling file.");
    }
  };

  const handleWorkloadUpload = async (e) => {
    const file = e.target.files[0];
    // if (!file || !file.name.endsWith(".wkl")) {
    //   alert("Only .wkl files are allowed for workload.");
    //   return;
    // }

    setWorkloadFileName(file.name); // Set the workload file name
    setWorkloadFileUploaded(true); // Mark workload file as uploaded

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parsedCSV = parseCSV(content);
      // console.log(content);
      setBatchQ({ id: -2, name: "Batch Queue", queue: parseCSV(content) });

      console.log("raw content:", batchQ);
      setWorkloadTableData(parseCSV(content)); // Parse CSV into table data
      const taskTypeMap = [];
      parsedCSV.forEach((row) => {
        const type = row.task_type;
        if (type != "" && type != null) {
          if (!taskTypeMap[type]) taskTypeMap[type] = [];
          taskTypeMap[type].push(row);
        }
      });

      // Existing IoTs and nodes
      const existingIoTs = [...(iot || [])];
      const existingNodes = [...(nodes || [])];
      const newIoTs = [];
      const newTypes = []; // sets the basic tasks properies made by each iot
      const newScenarios = []; // sets start/end time and num of tasks to generate
      const newIoTNodes = [];

      // Layout settings
      const horizontalSpacing = 250;
      const verticalSpacing = 150;
      const maxPerRow = 5; // max nodes in one row before wrapping
      let row = 0;
      let col = existingNodes.length % maxPerRow;
      let cntr = -1;
      Object.keys(taskTypeMap).forEach((taskType) => {
        // Skip if IoT with same taskType already exists
        if (existingIoTs.some((iotObj) => iotObj.id === taskType)) return;
        cntr = cntr + 1;
        const iotObj = {
          id: Date.now() + cntr,
          name: taskType,
          queue: taskTypeMap[taskType],
          properties: {
            task_type: taskType,
            dataInput: taskType,
            meanSize: 6,
            urgency: "BestEffort",
            slack: 0,
            numTasks: 10,
            startTime: 0,
            endTime: 30,
            distribution: distributionOptions[0],
          },
          parentId: selectedWorkspace?.id,
          extent: undefined,
        };
        console.log(iotObj.parentId);
        newIoTs.push(iotObj);
        const iotType = {
          srcID: iotObj.id,
          name: iotObj.name,
          dataInput: iotObj.properties.dataInput,
          meanSize: iotObj.properties.meanSize,
          urgency: iotObj.properties.urgency,
          slack: iotObj.properties.slack,
        };
        newTypes.push(iotType);
        const iotScenarios = {
          srcID: iotObj.id,
          taskType: iotObj.properties.task_type,
          numTasks: iotObj.properties.numTasks,
          startTime: iotObj.properties.startTime,
          endTime: iotObj.properties.endTime,
          distribution: iotObj.properties.distribution,
        };
        newScenarios.push(iotScenarios);

        const iotNode = {
          id: Date.now(),
          type: "iotNode",
          data: { iot: iotObj },
          parentId: iotObj.parentId,
          extent: iotObj.parentId ? "parent" : undefined,
        };
        newIoTNodes.push(iotNode);

        col++;
        if (col >= maxPerRow) {
          col = 0;
          row++;
        }
      });

      // Update global states
      setIot((prevIot) => [...prevIot, ...newIoTs]);
      setTaskTypes((prev) => [...prev, ...newTypes]);
      setScenarioRows((prev) => [...prev, ...newScenarios]);
      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
    };

    reader.readAsText(file);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        "http://localhost:5001/api/workload/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      console.log("Workload upload success:", res.data);
      // Group tasks by task_type
    } catch (err) {
      console.error("Workload upload error:", err);
      alert("Failed to upload workload file.");
    }
  };
  const handleConfigUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".json")) {
      alert("Only .json files are allowed for configuration.");
      return;
    }
    setConfigFileName(file.name);
    setConfigFileUploaded(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      //   const res = await axios.post(
      //     "http://localhost:5001/api/workload/upload/config",
      //     formData,
      //     {
      //       headers: { "Content-Type": "multipart/form-data" },
      //     },
      //   );
      console.log("Config upload success:", res.data);
      // Group machines by base name and track replicas
      const machineMap = {};
      res.data.machines.forEach((machine) => {
        const baseName = machine.base_name || machine.name;
        if (!machineMap[baseName]) {
          machineMap[baseName] = {
            id: machine.id,
            name: baseName,
            power: machine.power || 0,
            idle_power: machine.idle_power || 0,
            replicas: machine.replicas || 1,
            price: machine.price || 0,
            cost: machine.cost || 0,
            queue: machine.queue || [],
            replica_instances: [],
            parentId: undefined,
            extent: undefined,
          };
        }
        // Add this specific replica instance
        machineMap[baseName].replica_instances.push({
          id: machine.id,
          replica_number: machine.replica_number,
          queue: machine.queue || [],
        });
      });
      const machinesWithIds = Object.values(machineMap);
      console.log("Processed machines with replicas:", machinesWithIds);
      setMachines((prev) => [...prev]);
      machinesRef.current = machinesWithIds;
      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
    } catch (err) {
      console.error("Config upload error:", err);
      alert("Failed to upload configuration file.");
    }
  };
  const [machineTypes, setMachineTypes] = useState([]);

  const ld_workspace = () => {
    const stuff = generateWorkload(scenarioRows, taskTypes);
    setBatchQ({ id: -2, name: "Batch Queue", queue: [...stuff] });
    setWorkloadTableData([...stuff]);
    // setWorkloadSubmissionStatus(true);
    setWorkloadFileUploaded(true);
    setMachineConfig(generateMachineConfig(machines, taskTypes));

    return batchQ;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
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
    profilingFileName,
    setProfilingFileName,
    profilingFileUploaded,
    setProfilingFileUploaded,
    profilingTableData,
    workloadFileUploaded,
    setWorkloadFileUploaded,
    setProfilingTableData,
    workloadFileName,
    setWorkloadFileName,
    workloadTableData,
    setWorkloadTableData,
    configFileName,
    setConfigFileName,
    configFileUploaded,
    setConfigFileUploaded,
    handleProfilingUpload,
    handleWorkloadUpload,
    handleConfigUpload,
    completedTasks,
    setCompletedTasks,
    eetLoaded,
    setEetLoaded,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    selectedWorkspace,
    setSelectedWorkspace,
    workspaces,
    workspace,
    setWorkspaces,
    ld_workspace,
    machineTypes,
    setMachineTypes,
    machineConfig,
    setMachineConfig,
    generateWorkload,
    generateMachineConfig,
    loadBalancers,
    setLoadBalancers,
    isNeighbors,
    getNeighbors,
    getNode,
    getEdge,
    selectedEdge,
    setSelectedEdge,
    EDGE_PROPERTIES,
    colorMemory,
    SetcolorMemory,
    showReport,
    setShowReport,
    unassignedTasks,
    setUnassignedTasks,
    missedTasks,
    setMissedTasks,
    dataResults,
    setDataResults,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

// Custom hook for easy access
export const useGlobalState = () => useContext(GlobalContext);
