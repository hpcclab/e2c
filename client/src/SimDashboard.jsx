import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence, useForceUpdate } from "framer-motion";
import { TrashIcon } from "@heroicons/react/24/outline";
import MachineList from "./components/MachineList";
import TaskList from "./components/TaskList";
import { WorkloadSidebar } from "./components/SidebarContent";
import AdmissionsOverlay from "./components/AdmissionsOverlay";
import EditMachineProperties from "./components/EditMachineProperties";

// Drag and drop imports and requirements

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import Sidebar from "./components/Sidebar";
import ContextMenu from "./context/ContextMenu";
import machineNode from "./components/machineNode";
import iotNode from "./components/iotNode";
import edgeSpace from "./components/edgeSpace";
import cloudSpace from "./components/cloudSpace";
import edgeLockedNode from "./components/edgeLockedNode";
import workloadNode from "./components/workloadNode";
import "./assets/flow.css";
import "./assets/index.css";
import { useGlobalState } from "./context/GlobalStates";
import LBNode from "./components/LBNode";
import QueueNode from "./components/QueueNode";

// import TemplatesContainer from "./components/TemplatesContainer";
// import DropZone from "./components/DropZone";
// import DragOverlayComponent from "./components/DragOverlay";
// import SidebarTemplates from "./components/SidebarTemplates";

const nodeTypes = {
  machineNode: machineNode,
  iotNode: iotNode,
  edgeSpace: edgeSpace,
  cloudSpace: cloudSpace,
  edgeLockedNode: edgeLockedNode,
  workloadNode: workloadNode,
  LBNode: LBNode,
  QueueNode: QueueNode,
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
    setSelectedTask,
    machines,
    setMachines,
    onDragStop,
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
    machinesRef,
    machineSlotsRef,
    batchSlotsRef,
    loadBalancerRef,
  } = useGlobalState();
  // End Global States
  // DND
  const reactFlowWrapper = useRef(null);
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current.getBoundingClientRect();

      setMenu({
        id: node.id,
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
    [setMenu]
  );
  // Close the context menu if it's open whenever the window is clicked.
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);
  // END DND

  const [scheduling, setScheduling] = useState("immediate");
  const [policy, setPolicy] = useState("FirstCome-FirstServe");
  const [queueSize, setQueueSize] = useState("unlimited");

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
    arrival_time: "",
    deadline: "",
    start: "",
    end: "",
    status: "",
  });
  const [metricParams, setMetricParams] = useState({
    mean: "",
    std: "",
    mean1: "",
    std1: "",
    mean2: "",
    std2: "",
  });

  const [machineTab, setMachineTab] = useState("details");
  const [IOTTab, setIOTTab] = useState("details");

  const [profilingFileName, setProfilingFileName] = useState("");
  const [profilingFileUploaded, setProfilingFileUploaded] = useState(false);
  const [profilingFileContents, setProfilingFileContents] = useState("");
  const [profilingTableData, setProfilingTableData] = useState([]);
  const [profilingSubmissionStatus, setProfilingSubmissionStatus] =
    useState(""); // Track profiling submission status

  const [workloadFileName, setWorkloadFileName] = useState("");
  const [workloadFileUploaded, setWorkloadFileUploaded] = useState(false);
  const [workloadFileContents, setWorkloadFileContents] = useState("");
  const [workloadTableData, setWorkloadTableData] = useState([]);

  const [configFileName, setConfigFileName] = useState("");
  const [configFileUploaded, setConfigFileUploaded] = useState(false);

  const [dataResults, setDataResults] = useState([]);
  const [animatedMachines, setAnimatedMachines] = useState(machines); // ANIMATION
  const [flyers, setFlyers] = useState([]);

  const [missedTasks, setMissedTasks] = useState([]);

  const [animatedTaskIds, setAnimatedTaskIds] = useState([]);

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

  const parseCSV = (csvContent) => {
    const rows = csvContent.split("\n").map((row) => row.split(","));
    const headers = rows[0];
    const data = rows.slice(1).map((row) =>
      row.reduce((acc, value, index) => {
        acc[headers[index]] = value;
        return acc;
      }, {})
    );
    return data;
  };

  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus(""); // Reset submission status when opening the sidebar
  };

  //  update machine params
  useEffect(() => {
    console.log(
      "Updating performance params with selected machine:",
      selectedMachine
    );
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

  //  update task params
  useEffect(() => {
    setTaskParams((prev) => ({
      ...prev,
      id: selectedTask.id,
      task_type: selectedTask.task_type,
      assigned_machine: selectedTask.assigned_machine,
      data_size: selectedTask.data_size,
      arrival_time: selectedTask.arrival_time,
      deadline: selectedTask.deadline,
      start: selectedTask.start,
      end: selectedTask.end,
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

  const handleProfilingUpload = async (e) => {
    const file = e.target.files[0];
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
    }; // <-- Make sure this semicolon is present
    reader.readAsText(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/workload/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Profiling upload success:", res.data);
    } catch (err) {
      console.error("Profiling upload error:", err);
      alert("Failed to upload profiling file.");
    }
  };

  const handleWorkloadUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".wkl")) {
      alert("Only .wkl files are allowed for workload.");
      return;
    }

    setWorkloadFileName(file.name); // Set the workload file name
    setWorkloadFileUploaded(true); // Mark workload file as uploaded

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setBatchQ({ id: -2, name: "Batch Queue", queue: parseCSV(content) });

      console.log("raw content:", batchQ);
      setWorkloadTableData(parseCSV(content)); // Parse CSV into table data
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
        }
      );
      console.log("Workload upload success:", res.data);
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
      const res = await axios.post(
        "http://localhost:5001/api/workload/upload/config",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Config upload success:", res.data);

      const machinesWithIds = res.data.machines.map((machine, index) => ({
        id: machine.id !== undefined ? machine.id : index,
        name: machine.name || `Machine ${index + 1}`,
        power: machine.power || 0,
        idle_power: machine.idle_power || 0,
        replicas: machine.replicas || 1,
        price: machine.price || 0,
        cost: machine.cost || 0,
        queue: machine.queue || [],
      }));

      console.log("Raw machine data from server:", res.data.machines);
      console.log("Processed machines:", machinesWithIds);

      setMachines(machinesWithIds);
      setAnimatedMachines(machinesWithIds);
      machinesRef.current = machinesWithIds;
    } catch (err) {
      console.error("Config upload error:", err);
      alert("Failed to upload configuration file.");
    }
  };

  const handleSubmitWorkloadAndProfiling = async () => {
    if (
      !workloadFileUploaded ||
      !profilingFileUploaded ||
      !configFileUploaded
    ) {
      alert(
        "Please upload the workload (.wkl), profiling table (.eet), and configuration (.json) files before submitting."
      );
      return;
    }

    try {
      // Simulate submission logic
      setWorkloadSubmissionStatus("Submitting...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call delay
      setWorkloadSubmissionStatus("Submission successful!");
    } catch (error) {
      setWorkloadSubmissionStatus("Submission failed.");
    }
  };

  const handleResetWorkload = () => {
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
    setBatchQ({ id: -2, name: "Batch Queue", queue: [] });
    setMachines([{ id: -1, name: "empty", queue: [] }]);

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

      // Update the machines ref
      machinesRef.current = machinesRef.current.map((machine) =>
        machine.id === updatedMachine.id ? updatedMachine : machine
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
      const response = await axios.post(
        "http://localhost:5001/api/config/update",
        updatedConfig
      );
      console.log("Config update response:", response.data);

      console.log("Machine properties updated successfully");
    } catch (error) {
      console.error("Failed to update machine properties:", error);
      console.error("Error details:", error.response?.data);

      // Show more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      alert(`Failed to update machine properties: ${errorMessage}`);

      throw error;
    }
  };

  const runDataSimulation = async () => {
    try {
      // Ensure required files are uploaded
      if (
        !workloadFileUploaded ||
        !profilingFileUploaded ||
        !configFileUploaded
      ) {
        alert(
          "Please upload the workload (.wkl), profiling table (.eet), and configuration (.json) files before running the simulation."
        );
        return;
      }

      // Prepare data for the simulation
      const simulationData = {
        schedulingPolicy: policy, // Load balancing policy type
        configFilename: configFileName, // Configuration file name
        profilingData: profilingTableData, // Profiling data parsed from the .eet file
        tasks: workloadTableData, // Tasks parsed from the .wkl file
      };

      const animateAdmissions = (admissionEvents, baseMachines) => {
        setAnimatedMachines(baseMachines.map((m) => ({ ...m, queue: [] }))); // Reset queues

        const play = (idx, currentQueues) => {
          if (idx >= admissionEvents.length) return;

          const event = admissionEvents[idx];
          const targetMachineId = event.machineId;
          const nextSlotIndex = currentQueues[targetMachineId] || 0;

          const fromEl = loadBalancerRef.current;
          const toEl = (machineSlotsRef.current[targetMachineId] || [])[
            nextSlotIndex
          ];

          const from = getCenter(fromEl);
          const to = getCenter(toEl);

          if (!from || !to) {
            setAnimatedMachines((prev) =>
              prev.map((machine) =>
                machine.id === targetMachineId
                  ? { ...machine, queue: [...machine.queue, event] }
                  : machine
              )
            );
            const updated = {
              ...currentQueues,
              [targetMachineId]: nextSlotIndex + 1,
            };
            setTimeout(() => play(idx + 1, updated), 50);
            return;
          }

          const flyerKey = `${event.taskId}-${idx}-${Date.now()}`;
          const flyer = {
            key: flyerKey,
            from,
            to,
            label: event.taskId,
            onComplete: () => {
              setFlyers((fs) => fs.filter((f) => f.key !== flyerKey));
              setAnimatedMachines((prev) =>
                prev.map((machine) =>
                  machine.id === targetMachineId
                    ? { ...machine, queue: [...machine.queue, event] }
                    : machine
                )
              );
              const updated = {
                ...currentQueues,
                [targetMachineId]: nextSlotIndex + 1,
              };
              setTimeout(() => play(idx + 1, updated), 50);
            },
          };

          setFlyers((fs) => [...fs, flyer]);
        };

        setTimeout(() => {
          const initialQueues = {};
          baseMachines.forEach((m) => {
            initialQueues[m.id] = 0;
          });
          play(0, initialQueues);
        }, 100);
      };

      const response = await axios.post(
        "http://localhost:5001/api/workload/simulate/data",
        simulationData
      );

      const { results, simulationTime } = response.data;
      setDataResults(results);

      const admissionEvents = [...results]
        .filter((task) => task.start != null)
        .sort((a, b) => a.start - b.start);

      const baseMachines = machinesRef.current.filter((m) => m.id !== -1);

      animateAdmissions(admissionEvents, baseMachines);

      let current = 0;
      const step = 0.01;
      const intervalMs = 10;

      setSimulationTime(0);

      const timer = setInterval(() => {
        current = parseFloat((current + step).toFixed(2));
        setSimulationTime(current);
        if (current >= simulationTime) {
          setSimulationTime(Number(simulationTime)); // Ensure exact match at end
          clearInterval(timer);
        }
      }, intervalMs);

      const updatedMachines = machines.map((machine) => {
        const assignedTasks = results.filter(
          (task) => task.machineId === machine.id
        );
        return {
          ...machine,
          queue: assignedTasks.map((task) => ({
            id: task.taskId,
            task_type: task.task_type,
            assigned_machine: task.assigned_machine,
            data_size: task.data_size,
            arrival_time: task.arrival_time,
            deadline: task.deadline,
            start: task.start,
            end: task.end,
            status: task.status,
          })),
        };
      });

      setDataResults(results);

      // Identify missed tasks: status === "CANCELLED" or (end == null && start == null) or end > deadline
      const missed = results.filter(
        (t) =>
          t.status === "CANCELLED" ||
          t.start == null ||
          (t.deadline && t.end > t.deadline)
      );
      setMissedTasks(missed);

      alert("Simulation completed successfully!");
      console.log("Simulation results:", results);
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Failed to run simulation.");
    }
  };
  // Update React Flow Machines
  useEffect(() => {
    setNodes((prevNodes) => {
      // Remove all existing machineNodes
      const otherNodes = prevNodes.filter((n) => n.type !== "machineNode");

      // Map each machine to its own node
      const machineNodes = machines.map((m, index) => ({
        id: `machine-${m.id}`,
        type: "machineNode",
        data: { machine: m },
        position: m.position ?? { x: 725, y: 70 + index * 150 }, // stacked vertically
      }));

      return [...otherNodes, ...machineNodes];
    });
  }, [machines, setNodes]);

  // Update React Flow IOT
  useEffect(() => {
    setNodes((prevNodes) => {
      // Remove all existing iotNode
      const otherNodes = prevNodes.filter((n) => n.type !== "iotNode");

      // Map each machine to its own node
      const iotNodes = iot.map((m, index) => ({
        id: `IOT-${m.id}`,
        type: "iotNode",
        data: { iot: m },
        position: m.position ?? { x: -200, y: 70 + index * 150 }, // stacked vertically
      }));

      return [...otherNodes, ...iotNodes];
    });
  }, [iot, setNodes]);

  const handleSubmitLoadBalancer = async () => {
    try {
      // Simulate submission logic
      setSubmissionStatus("Submitting...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call delay
      setSubmissionStatus("Submission successful!");
    } catch (error) {
      setSubmissionStatus("Submission failed.");
    }
  };

  const handleSubmitProfilingWorktable = async () => {
    try {
      // Simulate submission logic
      setProfilingSubmissionStatus("Submitting...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call delay
      setProfilingSubmissionStatus("Submission successful!");
    } catch (error) {
      setProfilingSubmissionStatus("Submission failed.");
    }
  };

  return (
    <div className="bg-[#d9d9d9] max-w-screen min-w-screen min-h-screen flex flex-col relative">
      {/* DND */}
      <ReactFlowProvider>
        <div className=" p-8 bg-gray-100 size-dvw max-w-screen max-h-screen min-w-screen min-h-screen">
          <div className="dndflow">
            <div className="reactflow-wrapper " ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStop={onDragStop}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                onNodeContextMenu={onNodeContextMenu}
                fitView
              >
                <Controls />
                <Background />
                {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
                <Panel position="top-left">
                  <div className="xy-theme__button-group">
                    <button
                      className={`xy-theme__button ${""}`}
                      onClick={() => {}}
                    >
                      View Mode
                    </button>
                    <button
                      className={`xy-theme__button ${""}`}
                      onClick={() => {}}
                    >
                      Wire Mode
                    </button>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
            <Sidebar setNodes={setNodes} />
          </div>
        </div>
      </ReactFlowProvider>
      {/* Main Simulation Area */}

      {dataResults.length > 0 && (
        <div className="px-10 py-4">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Task ID</th>
                <th className="border px-2 py-1">Task Type</th>
                <th className="border px-2 py-1">Machine ID</th>
                <th className="border px-2 py-1">Assigned Machine</th>
                <th className="border px-2 py-1">Arrival Time</th>
                <th className="border px-2 py-1">Start</th>
                <th className="border px-2 py-1">End</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {dataResults.map((task) => (
                <tr key={task.taskId}>
                  <td className="border px-2 py-1">{task.taskId}</td>
                  <td className="border px-2 py-1">{task.task_type}</td>
                  <td className="border px-2 py-1">
                    {task.machineId ?? "N/A"}
                  </td>
                  <td className="border px-2 py-1">
                    {task.assigned_machine ?? "N/A"}
                  </td>{" "}
                  {/* Display Machine Type */}
                  <td className="border px-2 py-1">{task.arrival_time}</td>
                  <td className="border px-2 py-1">{task.start}</td>
                  <td className="border px-2 py-1">{task.end}</td>
                  <td className="border px-2 py-1">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">
              Simulation Time: {simulationTime} seconds{" "}
            </h2>
          </div>
        </div>
      )}
      <div className="flex justify-center items-center space-x-12">
        {/* Left Side */}
        <div className="flex flex-col items-center space-y-8 mt-8">
          <div className="flex items-center space-x-12">
            {/* Workload Button */}
            <div
              onClick={() => openSidebar("workload")}
              className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition"
            >
              Workload
            </div>

            {/* Task Slots */}
            <div className="flex space-x-2 px-3 py-2 border-4 border-black rounded-xl bg-white">
              <TaskList
                machine={batchQ}
                isBatchQueue={true}
                setSelectedTask={setSelectedTask}
                onClicked={() => openSidebar("task")}
                registerSlotRef={registerBatchSlotRef}
              />
            </div>

            {/* Load Balancer Button */}
            <div
              ref={loadBalancerRef}
              onClick={() => openSidebar("loadBalancer")}
              className="bg-gray-800 text-white text-lg font-semibold w-30 h-30 flex items-center justify-center rounded-full cursor-pointer hover:scale-110 transition text-center px-2"
            >
              Load
              <br />
              Balancer
            </div>
          </div>

          {/* Cancelled Tasks */}
          <div
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
            onClick={() => openSidebar("cancelledTasks")}
          >
            <TrashIcon className="w-10 h-10 text-gray-800" />
            <span className="text-gray-800 text-sm font-semibold mt-1">
              Cancelled Tasks
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center space-y-8 mt-8">
          <MachineList
            machs={animatedMachines}
            setSelectedMachine={setSelectedMachine}
            setSelectedTask={setSelectedTask}
            onClicked={() => openSidebar("machine")}
            onTaskClicked={() => openSidebar("task")}
            registerMachineSlotRef={registerMachineSlotRef}
          />

          {/* Missed Tasks */}
          <div
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
            onClick={() => openSidebar("missedTasks")}
          >
            <TrashIcon className="w-10 h-10 text-gray-800" />
            <span className="text-gray-800 text-sm font-semibold mt-1">
              Missed Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#eeeeee] border-t border-gray-400 p-4 flex flex-col items-center space-y-4">
        <div className="flex justify-center items-center space-x-10">
          {/* Img go here */}
        </div>

        <div className="flex space-x-6">
          <button className="bg-gray-400 rounded-xl w-16 h-10">⟲</button>
          <button
            onClick={runDataSimulation}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-16 h-10"
          >
            {" "}
            ▶
          </button>
          <button className="bg-gray-400 rounded-xl w-16 h-10">⏸</button>
        </div>
        <div className="w-full max-w-md flex justify-between items-center px-4">
          <span className="text-sm text-gray-700">progress</span>
          <span className="text-sm text-gray-700">speed</span>
        </div>
      </div>

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
                  : sidebarMode === "cancelledTasks"
                  ? "Cancelled Tasks"
                  : sidebarMode === "missedTasks"
                  ? "Missed Tasks"
                  : sidebarMode === "task"
                  ? `Task: ${String(selectedTask.id)}`
                  : sidebarMode === "machine"
                  ? `Machine: ${selectedMachine.name?.toUpperCase()}`
                  : sidebarMode === "IOT"
                  ? `IOT: ${selectedIOT.name?.toUpperCase()}`
                  : "Drag and Drop Templates"}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                &times;
              </button>
            </div>

            {sidebarMode === "workload" && (
              <WorkloadSidebar
                profilingFileUploaded={profilingFileUploaded}
                profilingFileName={profilingFileName}
                profilingTableData={profilingTableData}
                workloadFileUploaded={workloadFileUploaded}
                workloadFileName={workloadFileName}
                workloadTableData={workloadTableData}
                configFileUploaded={configFileUploaded}
                configFileName={configFileName}
                handleProfilingUpload={handleProfilingUpload}
                handleWorkloadUpload={handleWorkloadUpload}
                handleConfigUpload={handleConfigUpload}
                handleSubmitWorkloadAndProfiling={
                  handleSubmitWorkloadAndProfiling
                }
                handleResetWorkload={handleResetWorkload}
                workloadSubmissionStatus={workloadSubmissionStatus}
                setProfilingFileName={setProfilingFileName}
                setProfilingFileUploaded={setProfilingFileUploaded}
                setProfilingTableData={setProfilingTableData}
                setWorkloadFileName={setWorkloadFileName}
                setWorkloadFileUploaded={setWorkloadFileUploaded}
                setWorkloadTableData={setWorkloadTableData}
                setConfigFileName={setConfigFileName}
                setConfigFileUploaded={setConfigFileUploaded}
                selectedTask={selectedTask}
              />
            )}

            {sidebarMode === "loadBalancer" && (
              <form className="space-y-6">
                {/* Load Balancer Sidebar Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Scheduling
                  </label>
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="scheduling"
                        checked={scheduling === "immediate"}
                        onChange={() => handleSchedulingChange("immediate")}
                      />
                      <span className="text-sm">Immediate Scheduling</span>
                    </label>

                    <select
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value)}
                      className="w-full border px-3 py-2 text-sm rounded"
                    >
                      <option>FirstCome-FirstServe</option>
                      <option>Min-Expected-Completion-Time</option>
                      <option>Min-Expected-Execution-Time</option>
                      <option>Weighted-Round-Robin</option>
                      <option>Random</option>
                      <option>Uniform-Resource-Identifier</option>
                      <option>Least-Connection</option>
                    </select>

                    <label className="flex items-center space-x-2 mt-2">
                      <input
                        type="radio"
                        name="scheduling"
                        checked={scheduling === "batch"}
                        onChange={() => handleSchedulingChange("batch")}
                      />
                      <span className="text-sm">Batch Scheduling</span>
                    </label>

                    <select
                      disabled={scheduling !== "batch"}
                      className="w-full border px-3 py-2 text-sm rounded bg-gray-100 disabled:opacity-60"
                    >
                      <option>MinCompletion-MinCompletion</option>
                      <option>MinCompletion-SoonestDeadline</option>
                      <option>MinCompletion-MaxUrgency</option>
                      <option>FELARE</option>
                      <option>ELARE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Machine Queue Size
                  </label>
                  <input
                    type="text"
                    value={queueSize}
                    onChange={(e) => setQueueSize(e.target.value)}
                    disabled={scheduling === "immediate"} // Disable editing for immediate scheduling
                    className={`w-full border px-3 py-2 text-sm rounded ${
                      scheduling === "immediate"
                        ? "bg-gray-100 opacity-60"
                        : "bg-white"
                    }`}
                  />
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
                              <th className="px-2 py-1 border">Arrival</th>
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
                          Assigned Machine
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Arrival Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Start Time
                        </th>
                        <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                          Missed Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className=" flex flex-col gap-3">
                      {[
                        "ID",
                        "task_type",
                        "assigned_machine",
                        "arrival_time",
                        "start",
                        "missed_time",
                      ].map((key) => (
                        <td
                          key={key}
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

            {sidebarMode === "cancelledTasks" && (
              <div className="space-y-6">
                {/* Cancelled Tasks Sidebar Content */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Task ID
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Arrival Time
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Cancellation Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-2 text-sm text-gray-500 text-center"
                      >
                        No data available yet. The simulation has not occurred.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {sidebarMode === "dndtemplates" && (
              <div className="space-y-6">
                {/* Drag and Drop Templates */}
                {/* <SidebarTemplates /> */}
              </div>
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
                      {/* <EditIOTProperties
                        selectedIOT={selectedIOT}
                        setSelectedIOT={setSelectedIOT}
                        onSave={handleIOTPropertySave}
                        animatedIOTs={animatedIOTs}
                        setAnimatedIOTs={setAnimatedIOTs}
                      /> */}
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
                              <th className="px-2 py-1 border">Arrival</th>
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
            {sidebarMode === "missedTasks" && (
              <div className="space-y-6">
                {/* Missed Tasks Sidebar Content */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Task ID
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Assigned Machine
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Arrival Time
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Start Time
                      </th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Missed Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {missedTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-2 text-sm text-gray-500 text-center"
                        >
                          No missed tasks.
                        </td>
                      </tr>
                    ) : (
                      missedTasks.map((task) => (
                        <tr key={task.taskId}>
                          <td className="px-4 py-2 border">{task.taskId}</td>
                          <td className="px-4 py-2 border">{task.task_type}</td>
                          <td className="px-4 py-2 border">
                            {task.assigned_machine ?? "N/A"}
                          </td>
                          <td className="px-4 py-2 border">
                            {task.arrival_time}
                          </td>
                          <td className="px-4 py-2 border">
                            {task.start ?? "N/A"}
                          </td>
                          <td className="px-4 py-2 border">
                            {task.deadline ?? "N/A"}
                          </td>
                          <td className="px-4 py-2 border">{task.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AdmissionsOverlay flyers={flyers} />
    </div>
  );
};

export default SimDashboard;
