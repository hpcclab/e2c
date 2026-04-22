import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useForceUpdate,
  animate,
} from "framer-motion";
import { TrashIcon } from "@heroicons/react/24/outline";

import { WorkloadSidebar } from "./components/SidebarContent";
import AdmissionsOverlay from "./components/AdmissionsOverlay";
import EditMachineProperties from "./components/EditMachineProperties";
import EditIoTProperties from "./components/EditIoTProperties";
import EditEdgeProperties from "./components/EditEdgeProperties";
import SimulationReport from "./components/SimulationReport";
import { processDequeue, autoMapMachineNames } from "./utils/dequeueProcess";
import { eetTable } from "./utils/exportCSV";

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
import SaveLoadPanel from "./components/SaveLoadPanel";
import AnimatedEdge from "./components/AnimatedEdge";
import { FCFS } from "./schedulers/FCFS";

const edgeTypes = {
  packet: AnimatedEdge,
};
const nodeTypes = {
  machineNode: machineNode,
  iotNode: iotNode,
  edgeSpace: edgeSpace,
  cloudSpace: cloudSpace,
  edgeLockedNode: edgeLockedNode,
  group: workloadNode,
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
    completedTasks,
    setCompletedTasks,
    eetLoaded,
    setEetLoaded,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    workspaces,
    setWorkspaces,
    ld_workspace,
    generateWorkload,
    generateMachineConfig,
    isNeighbors,
    getNeighbors,
    getNode,
    EDGE_PROPERTIES,
    selectedEdge,
    setSelectedEdge,
    getEdge,
    showReport,
    setShowReport,
    unassignedTasks,
    setUnassignedTasks,
    missedTasks,
    setMissedTasks,
    dataResults,
    setDataResults,
  } = useGlobalState();
  // End Global States

  // DND
  const reactFlowWrapper = useRef(null);

  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus("");
  };

  const onConnect = useCallback(
    (params) => {
      const edgeId = `e-${params.source}-${params.target}`;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: edgeId,
            type: "packet",
            data: {
              properties: EDGE_PROPERTIES,
            },
          },
          eds,
        ),
      );
    },
    [setEdges],
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
    [setMenu],
  );
  const onEdgeContextMenu = useCallback(
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
        edgeSidebar: () => openSidebar("edgeProps"),
      });
      if (node.id[0] === "e") {
        const selectedEdge = getEdge(node.id);
        setSelectedEdge(selectedEdge);
      }
    },
    [setMenu],
  );
  const onPaneClick = useCallback(() => setMenu(null), [setMenu]); // Close the context menu if it's open whenever the window is clicked.

  const stopAnimation = (edgeId) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, animate: false } }
          : edge,
      ),
    );
  };

  const startAnimation = (edgeId) => {
    const packetId = `${edgeId}-${Date.now()}`;

    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                packets: [...(edge.data?.packets ?? []), packetId],
              },
            }
          : edge,
      ),
    );
  };

  // END DND

  // State assignments and functions
  // - Load balancer handlers
  const schedulerRef = useRef(null);

  useEffect(() => {
    schedulerRef.current = new FCFS({
      machines,
      iot,
      enqueue,
      dequeue,
      isNeighbors,
      config: { LB_ID },
    });
  }, []);
  useEffect(() => {
    if (!schedulerRef.current) return;

    const scheduler = schedulerRef.current;

    batchQ.queue.forEach((task) => {
      scheduler.addTask(task);
    });

    // Clear original queue so tasks aren't duplicated
    batchQ.queue = [];
  }, [batchQ.queue]);

  // End EET Parse

  const [scheduling, setScheduling] = useState("immediate");
  const [policy, setPolicy] = useState("FirstCome-FirstServe");
  const [queueSize, setQueueSize] = useState("unlimited");
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
    arrival_time: "",
    deadline: "",
    start_time: "",
    end_time: "",
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

  // - Sidebar tab handlers
  const [machineTab, setMachineTab] = useState("details");
  const [IOTTab, setIOTTab] = useState("details");
  const pendingMissedRef = useRef([]);
  const animatedMachinesRef = useRef([]);

  const [profilingFileContents, setProfilingFileContents] = useState("");
  const [profilingSubmissionStatus, setProfilingSubmissionStatus] =
    useState(""); // Track profiling submission status

  // -- Workload handlers

  const [workloadFileContents, setWorkloadFileContents] = useState("");

  const filesReady =
    workloadFileUploaded && profilingFileUploaded && configFileUploaded;

  // - Sim results handlers
  const simulationIntervalRef = useRef(null);
  const simCurrentRef = useRef(0);
  const totalSimTimeRef = useRef(Infinity);
  const totalTasksRef = useRef(0);

  const [animatedMachines, setAnimatedMachines] = useState(machines); // ANIMATION
  const [animatedIOTs, setAnimatedIOTs] = useState(iot);
  const [flyers, setFlyers] = useState([]);
  const [animatedTaskIds, setAnimatedTaskIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [machine_index, setMachine_index] = useState(0);
  const [prev_machine_index, setPrev_machine_index] = useState(-1);
  const [iot_index, setIot_index] = useState(0);
  const [task_counter, setTask_counter] = useState(0);
  const [taskLoaded, setTaskLoaded] = useState(false);

  const [task, setTask] = useState({
    id: -1,
    task_type: "empty",
    data_size: "",
    arrival_time: 999999999999,
    deadline: "",
  });
  let machine_count;
  let LB_ID = "LBNode_2";
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
      arrival_time: selectedTask.arrival_time,
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
    if (
      !workloadFileUploaded ||
      !profilingFileUploaded ||
      !configFileUploaded
    ) {
      alert(
        "Please upload the workload (.wkl), profiling table (.eet), and configuration (.json) files before submitting.",
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

  const handlePauseSim = () => {
    clearInterval(simulationIntervalRef.current);
    simulationIntervalRef.current = null;
    setIsPaused(true);
  };

  const handleResumeSim = () => {
    setIsPaused(false);
    startSimInterval();
  };

  const handleRestartSim = () => {
    clearInterval(simulationIntervalRef.current);
    simulationIntervalRef.current = null;
    simCurrentRef.current = 0;
    setIsPaused(false);

    // Fresh scheduler clears all stats, queues, and unmapped tasks
    schedulerRef.current = new FCFS({
      machines: [],
      iot: [],
      enqueue,
      dequeue,
      isNeighbors,
      config: { LB_ID },
    });

    // Clear machine queues from the previous run
    const clearedMachines = machines.map((m) => ({ ...m, queue: [] }));
    setMachines(clearedMachines);
    machinesRef.current = clearedMachines;

    runDataSimulation();
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
      setMachines((prev) =>
        prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m)),
      );
      // Update the machines ref
      machinesRef.current = machinesRef.current.map((machine) =>
        machine.id === updatedMachine.id ? updatedMachine : machine,
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
        updatedConfig,
      );
      console.log("Config update response:", response.data);
      console.log("Machine properties updated successfully");
    } catch (error) {
      // Config sync failed (e.g. server not running) — state already updated, just warn
      console.warn("Config sync failed (non-fatal):", error.message);
    }
  };
  const handleIOTPropertySave = async (updatedIOT) => {
    setIot((prev) =>
      prev.map((i) => (i.id === updatedIOT.id ? updatedIOT : i)),
    );
    const updatedIotType = {
      srcID: updatedIOT.id,
      name: updatedIOT.name,
      dataInput: updatedIOT.properties.dataInput,
      meanSize: updatedIOT.properties.meanSize,
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
  const startSimInterval = () => {
    clearInterval(simulationIntervalRef.current);
    simulationIntervalRef.current = setInterval(() => {
      simCurrentRef.current = parseFloat((simCurrentRef.current + 0.01).toFixed(3));
      setSimulationTime(simCurrentRef.current);
      if (simCurrentRef.current >= totalSimTimeRef.current) {
        if (pendingMissedRef.current.length > 0) {
          setMissedTasks((prev) => [...prev, ...pendingMissedRef.current]);
          pendingMissedRef.current = [];
        }
        setSimulationTime(Number(totalSimTimeRef.current));
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
        setIsRunning(false);
        setIsPaused(false);
        console.log("Simulation complete!");
      }
    }, 10);
  };

  const runDataSimulation = async () => {
    try {
      // ensure possible to run
      if (!iot?.length || !machines?.length) {
        alert("Failed to run simulation. Missing IoTs or Machines");
        return;
      }

      setIsRunning(true);
      setIsPaused(false);
      ld_workspace();

      setShowReport(true); // Show the report when results are ready

      simCurrentRef.current = 0;
      setSimulationTime(0);
      setCompletedTasks([]);
      setUnassignedTasks([]);
      setMissedTasks([]);
      const scheduler = schedulerRef.current;
      totalTasksRef.current = scheduler.getBatchQ().length;
      totalSimTimeRef.current = scheduler.getBatchQ().at(-1)?.end_time || Infinity;

      startSimInterval();

      // // Update machines with stats from simulation
      // const updatedMachines = machines.map((machine) => {
      //   const stats = machine_stats?.find((s) => s.base_name === machine.name);

      //   if (stats) {
      //     const totalUtilization = stats.replicas.reduce(
      //       (sum, r) => sum + r.utilization_hours,
      //       0,
      //     );
      //     const totalCost = stats.replicas.reduce((sum, r) => sum + r.cost, 0);
      //     const totalTasks = stats.replicas.reduce(
      //       (sum, r) => sum + r.tasks_completed,
      //       0,
      //     );

      //     return {
      //       ...machine,
      //       utilization_time: totalUtilization,
      //       total_cost: totalCost,
      //       total_tasks: totalTasks,
      //       replica_stats: stats.replicas,
      //     };
      //   }

      //   return machine;
      // });

      // // Update all machine states
      // setMachines(updatedMachines);
      // setAnimatedMachines(updatedMachines);
      // machinesRef.current = updatedMachines;

      // If a machine is currently selected, update it with new data
      // if (selectedMachine && selectedMachine.id !== undefined) {
      //   const updatedSelectedMachine = updatedMachines.find(
      //     (m) => m.id === selectedMachine.id,
      //   );
      //   if (updatedSelectedMachine) {
      //     setSelectedMachine(updatedSelectedMachine);

      //     // Also update performance params
      //     setPerformanceParams({
      //       id: updatedSelectedMachine.id,
      //       name: updatedSelectedMachine.name,
      //       // queue: updatedSelectedMachine.queue,
      //       power: updatedSelectedMachine.power,
      //       idle_power: updatedSelectedMachine.idle_power,
      //       replicas: updatedSelectedMachine.replicas,
      //       price: updatedSelectedMachine.price,
      //       cost: updatedSelectedMachine.cost,
      //       utilization_time: updatedSelectedMachine.utilization_time,
      //       total_cost: updatedSelectedMachine.total_cost,
      //       total_tasks: updatedSelectedMachine.total_tasks,
      //     });
      //   }
      // }

      // // Late-completion misses come from processDequeue; no static list needed
      // pendingMissedRef.current = [];
      // setMissedTasks([]); // accumulates dynamically during the simulation loop

      // console.log("Simulation results:", results);
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Failed to run simulation.");
    }
  };

  // Keep animatedMachinesRef in sync so the interval can read it without a functional updater
  useEffect(() => {
    animatedMachinesRef.current = animatedMachines;
  }, [animatedMachines]);

  /*queue fns */
  const enqueue = useCallback(
    (targetId, sender) => {
      const job = sender;
      if (!job) return;
      setMachines((prevMachines) =>
        prevMachines.map((machine) =>
          machine.id === targetId
            ? { ...machine, queue: [...(machine.queue || []), job] }
            : machine,
        ),
      );
      return;
    },
    [setMachines],
  );
  const dequeue = useCallback(
    (machineId) => {
      setMachines((prevMachines) =>
        prevMachines.map((machine) =>
          machine.id === machineId
            ? {
                ...machine,
                queue: (machine.queue || []).slice(1),
              }
            : machine,
        ),
      );
    },
    [setMachines],
  );
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Update schedular
  useEffect(() => {
    if (!isRunning || !schedulerRef.current) {
      setTask_counter(0);
      return;
    }

    const scheduler = schedulerRef.current;

    // Sync simulation time
    scheduler.setTime(simulationTime);
    scheduler.setMachines(machines);
    scheduler.setIot(iot);

    // Run ONE scheduling step
    scheduler.schedule();

    // Process running tasks (completion)
    scheduler.processMachines();
    setCompletedTasks([...scheduler.getStats().completed]);
    setUnassignedTasks(
      scheduler.getBatchQ().filter((t) => t.machineId === null),
    );
    setMissedTasks([...scheduler.getStats().missed]);
    setDataResults([...unassignedTasks, ...completedTasks, ...missedTasks]);

    const finished = scheduler.getStats().completed.length + scheduler.getStats().missed.length;
    if (totalTasksRef.current > 0 && finished >= totalTasksRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsRunning(false);
      setIsPaused(false);
      console.log("Simulation complete!");
    }
  }, [simulationTime, isRunning]);

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
          type: "iotNode",
          data: { iot: i },
          position: i.position ?? { x: 0, y: 80 + index * 150 },
          parentId: parentExists ? i.parentId : undefined,
          extent: parentExists && i.parentId ? "parent" : undefined,
          draggable: true,
        };
      });

      const otherNodes = prev.filter((n) => n.type !== "iotNode");

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
    <div className=" bg-[#d9d9d9] m-5 h-720 max-h-screen max-w-1600 flex flex-col relative ">
      {/* DND */}

      <div className=" p-3 bg-gray-100 size-dvw max-w-screen max-h-screen relative">
        <div className="dndflow">
          <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onNodeDragStop={onDragStop}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              fitView
              fitViewOptions={{
                padding: 0.5,
                duration: 600,
                interpolate: "smooth",
              }}
            >
              <Controls position="center-left" />
              <Background />
              {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
              <SaveLoadPanel />
            </ReactFlow>
          </div>
          <Sidebar setNodes={setNodes} />
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col gap-1">
            {isRunning ? (
              <div className="bg-white rounded-full shadow-lg px-6 py-3">
                <h3 className="text-xl font-bold text-gray-800 bg-white">
                  Sim Time: {simulationTime.toFixed(2)} seconds
                </h3>
              </div>
            ) : (
              ""
            )}
            <div className="flex justify-between space-x-4 bg-white rounded-full shadow-lg px-6 py-3">
              <>
                <button
                  onClick={runDataSimulation}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-md"
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
                  className={`${isRunning ? (isPaused ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400 hover:bg-gray-500") : "bg-gray-300 cursor-not-allowed"} text-white rounded-full w-12 h-12 flex items-center justify-center transition`}
                  onClick={isRunning ? (isPaused ? handleResumeSim : handlePauseSim) : undefined}
                  disabled={!isRunning}
                >
                  {isPaused ? "▶" : "⏸"}
                </button>
              </>
            </div>
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
                handleSubmitWorkloadAndProfiling={
                  handleSubmitWorkloadAndProfiling
                }
                handleResetWorkload={handleResetWorkload}
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
                      <option>Uniform-Resender-Identifier</option>
                      <option>Least-Connection</option>
                    </select>
                  </div>
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
                          Status
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
          </motion.div>
        )}
      </AnimatePresence>
      <AdmissionsOverlay flyers={flyers} />
    </div>
  );
};

export default SimDashboard;
