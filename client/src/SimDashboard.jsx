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
    workloadFileName,
    setWorkloadFileName,
    workloadTableData,
    setWorkloadTableData,
    configFileName,
    setConfigFileName,
    configFileUploaded,
    setConfigFileUploaded,
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
    workspaces,
    setWorkspaces,
    ld_workspace,
    generateWorkload,
    generateMachineConfig,
    isNeighbors,
    getNeighbors,
    getNode,
  } = useGlobalState();
  // End Global States

  // DND
  const reactFlowWrapper = useRef(null);

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
              // animate: false,
              // onAnimationEnd: (edgeId) => stopAnimation(edgeId),
              animationKey: 0,
              packets: [],
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

  const openSidebar = (mode) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus(""); // Reset submission status when opening the sidebar
  };

  const filesReady =
    workloadFileUploaded && profilingFileUploaded && configFileUploaded;

  // - Sim results handlers
  const simulationIntervalRef = useRef(null);
  const [dataResults, setDataResults] = useState([]);
  const [animatedMachines, setAnimatedMachines] = useState(machines); // ANIMATION
  const [animatedIOTs, setAnimatedIOTs] = useState(iot);
  const [flyers, setFlyers] = useState([]);
  const [missedTasks, setMissedTasks] = useState([]);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [animatedTaskIds, setAnimatedTaskIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [machine_index, setMachine_index] = useState(0);
  const [prev_machine_index, setPrev_machine_index] = useState(-1);
  const [iot_index, setIot_index] = useState(0);
  const [task_counter, setTask_counter] = useState(0);
  const [taskLoaded, setTaskLoaded] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  const handleResetSim = () => {
    // Clear the batch queue visually
    setBatchQ({});
    setMachines([]);
    setIot([]);
    handleConfigUpload(configFileName);
    handleWorkloadUpload(workloadFileName);

    // handleWorkloadUpload()
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
  const runDataSimulation = async () => {
    try {
      // Ensure required files are uploaded
      const machinesHaveEET = machines.some(
        (m) =>
          m.eet &&
          Object.values(m.eet).some((v) => v !== "" && v !== undefined),
      );
      const canvasHasWorkload = scenarioRows.length > 0;
      // if (
      //   (!workloadFileUploaded && !canvasHasWorkload) ||
      //   (!profilingFileUploaded && !machinesHaveEET) ||
      //   !configFileUploaded
      // ) {
      //   alert(
      //     "Please provide a workload (upload a .wkl file or add IoT nodes with scenario data), a configuration (.json) file, and either a profiling table (.eet) or set EET values on machines.",
      //   );
      //   return;
      // }

      // Clear any existing simulation interval
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      setIsRunning(true);
      const workspace = ld_workspace();

      // console.log(workload);
      console.log(workspace);

      // Build EET table from machine canvas data if no .eet file was uploaded
      if (!profilingFileUploaded && machinesHaveEET) {
        const eetObj = {};
        machines.forEach((machine) => {
          if (machine.eet && Object.keys(machine.eet).length > 0) {
            eetObj[machine.name] = machine.eet;
          }
        });
        eetTable.loadFromObject(eetObj);
        setEetLoaded(true);
      }

      // Auto-map machine names (EET CSV machines to config machines by order)
      const configMachines = machinesRef.current.filter((m) => m.id !== -1);
      autoMapMachineNames(configMachines);

      // // Prepare data for the simulation
      const simulationData = {
        schedulingPolicy: policy, // Load balancing policy type
        configFilename: configFileName, // Configuration file name
        machineConfig: generateMachineConfig(machines, taskTypes), // Configuration file name
        // profilingData: profilingTableData, // Profiling data parsed from the .eet file
        tasks: workloadFileUploaded
          ? workloadTableData
          : generateWorkload(scenarioRows, taskTypes),
      };

      // const animateAdmissions = (admissionEvents, baseMachines) => {
      //   const resetMachines = baseMachines.map((m) => ({
      //     ...m,
      //     queue: [],
      //     replica_instances:
      //       m.replica_instances?.map((r) => ({ ...r, queue: [] })) ?? [],
      //   }));
      //   animatedMachinesRef.current = resetMachines;
      //   setAnimatedMachines(resetMachines); // Reset queues

      //   // Returns true if this machine group owns the target replica ID
      //   const machineOwnsReplica = (machine, targetId) =>
      //     machine.id === targetId ||
      //     machine.replica_instances?.some((r) => r.id === targetId);

      //   // Add task to the correct replica_instance queue within its machine group
      //   const addTaskToMachine = (prev, targetId, event) =>
      //     prev.map((machine) => {
      //       if (!machineOwnsReplica(machine, targetId)) return machine;
      //       if (machine.replica_instances?.length > 0) {
      //         const updatedReplicas = machine.replica_instances.map((r) =>
      //           r.id === targetId ? { ...r, queue: [...r.queue, event] } : r,
      //         );
      //         return { ...machine, replica_instances: updatedReplicas };
      //       }
      //       return { ...machine, queue: [...machine.queue, event] };
      //     });

      //   const play = (idx, currentQueues) => {
      //     if (idx >= admissionEvents.length) return;

      //     const event = admissionEvents[idx];
      //     const targetMachineId = event.machineId;
      //     const nextSlotIndex = currentQueues[targetMachineId] || 0;

      //     const fromEl = loadBalancerRef.current;
      //     const toEl = (machineSlotsRef.current[targetMachineId] || [])[
      //       nextSlotIndex
      //     ];

      //     const from = getCenter(fromEl);
      //     const to = getCenter(toEl);

      //     if (!from || !to) {
      //       setAnimatedMachines((prev) =>
      //         addTaskToMachine(prev, targetMachineId, event),
      //       );
      //       const updated = {
      //         ...currentQueues,
      //         [targetMachineId]: nextSlotIndex + 1,
      //       };
      //       setTimeout(() => play(idx + 1, updated), 50);
      //       return;
      //     }

      //     const flyerKey = `${event.taskId}-${idx}-${Date.now()}`;
      //     const flyer = {
      //       key: flyerKey,
      //       from,
      //       to,
      //       label: event.taskId,
      //       onComplete: () => {
      //         setFlyers((fs) => fs.filter((f) => f.key !== flyerKey));
      //         setAnimatedMachines((prev) =>
      //           addTaskToMachine(prev, targetMachineId, event),
      //         );
      //         const updated = {
      //           ...currentQueues,
      //           [targetMachineId]: nextSlotIndex + 1,
      //         };
      //         setTimeout(() => play(idx + 1, updated), 50);
      //       },
      //     };

      //     setFlyers((fs) => [...fs, flyer]);
      //   };

      //   setTimeout(() => {
      //     const initialQueues = {};
      //     baseMachines.forEach((m) => {
      //       // Register all replica IDs so slot tracking works per physical machine
      //       if (m.replica_instances?.length > 0) {
      //         m.replica_instances.forEach((r) => {
      //           initialQueues[r.id] = 0;
      //         });
      //       } else {
      //         initialQueues[m.id] = 0;
      //       }
      //     });
      //     play(0, initialQueues);
      //   }, 100);
      // };

      const response = await axios.post(
        "http://localhost:5001/api/workload/simulate/data",
        simulationData,
      );

      const {
        results,
        simulationTime: totalSimTime,
        machine_stats,
      } = response.data;
      setDataResults(results);
      setShowReport(true); // Show the report when results are ready

      // const admissionEvents = [...results]
      //   .filter((task) => task.start != null)
      //   .sort((a, b) => a.start - b.start);

      // const baseMachines = machinesRef.current.filter((m) => m.id !== -1);

      // animateAdmissions(admissionEvents, baseMachines);

      // Simulation loop with EET-based dequeue
      let current = 0;
      const step = 0.01;
      const intervalMs = 10;

      setSimulationTime(0);
      setCompletedTasks([]);
      setUnassignedTasks([]);

      simulationIntervalRef.current = setInterval(() => {
        current = parseFloat((current + step).toFixed(3));
        setSimulationTime(current);

        // Process dequeue based on EET if loaded
        // Read from ref (not functional updater) so StrictMode double-invocation
        // doesn't cause setCompletedTasks / setMissedTasks to fire twice per tick.
        if (eetLoaded) {
          const {
            machines: updated,
            completed,
            deadlineMissed,
          } = processDequeue(animatedMachinesRef.current, current);
          animatedMachinesRef.current = updated;
          setAnimatedMachines(updated);

          if (completed.length > 0) {
            setCompletedTasks((prev) => [...prev, ...completed]);
            console.log(
              `Completed ${completed.length} task(s) at t=${current.toFixed(3)}`,
            );
          }

          if (deadlineMissed.length > 0) {
            setMissedTasks((prev) => [...prev, ...deadlineMissed]);
            console.log(
              `Deadline missed: ${deadlineMissed.length} task(s) at t=${current.toFixed(3)}`,
            );
          }
        }

        // Surface CANCELLED/unstarted tasks as simulation time passes their deadline
        const nowMissed = [];
        while (
          pendingMissedRef.current.length > 0 &&
          (pendingMissedRef.current[0].deadline ?? Infinity) <= current
        ) {
          nowMissed.push(pendingMissedRef.current.shift());
        }
        if (nowMissed.length > 0) {
          setMissedTasks((prev) => [...prev, ...nowMissed]);
        }

        if (current >= totalSimTime) {
          // Flush any remaining tasks that never met their deadline by end of simulation
          if (pendingMissedRef.current.length > 0) {
            setMissedTasks((prev) => [...prev, ...pendingMissedRef.current]);
            pendingMissedRef.current = [];
          }
          setSimulationTime(Number(totalSimTime));
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
          console.log("Simulation complete!");
        }
      }, intervalMs);

      // Update machines with stats from simulation
      const updatedMachines = machines.map((machine) => {
        const stats = machine_stats?.find((s) => s.base_name === machine.name);

        if (stats) {
          const totalUtilization = stats.replicas.reduce(
            (sum, r) => sum + r.utilization_hours,
            0,
          );
          const totalCost = stats.replicas.reduce((sum, r) => sum + r.cost, 0);
          const totalTasks = stats.replicas.reduce(
            (sum, r) => sum + r.tasks_completed,
            0,
          );

          return {
            ...machine,
            utilization_time: totalUtilization,
            total_cost: totalCost,
            total_tasks: totalTasks,
            replica_stats: stats.replicas,
          };
        }

        return machine;
      });

      // Update all machine states
      setMachines(updatedMachines);
      setAnimatedMachines(updatedMachines);
      machinesRef.current = updatedMachines;

      // If a machine is currently selected, update it with new data
      if (selectedMachine && selectedMachine.id !== undefined) {
        const updatedSelectedMachine = updatedMachines.find(
          (m) => m.id === selectedMachine.id,
        );
        if (updatedSelectedMachine) {
          setSelectedMachine(updatedSelectedMachine);

          // Also update performance params
          setPerformanceParams({
            id: updatedSelectedMachine.id,
            name: updatedSelectedMachine.name,
            // queue: updatedSelectedMachine.queue,
            power: updatedSelectedMachine.power,
            idle_power: updatedSelectedMachine.idle_power,
            replicas: updatedSelectedMachine.replicas,
            price: updatedSelectedMachine.price,
            cost: updatedSelectedMachine.cost,
            utilization_time: updatedSelectedMachine.utilization_time,
            total_cost: updatedSelectedMachine.total_cost,
            total_tasks: updatedSelectedMachine.total_tasks,
          });
        }
      }

      // Tasks never assigned to any machine (queue was full / size constraint)
      setUnassignedTasks(results.filter((t) => t.machineId === null));

      // Late-completion misses come from processDequeue; no static list needed
      pendingMissedRef.current = [];
      setMissedTasks([]); // accumulates dynamically during the simulation loop

      console.log("Simulation results:", results);
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
    (targetId, sender, LB = false, LB_ID = "LBNode_2") => {
      // TODO fix hard coded LB id
      // const job = sender?.queue?.shift();
      const job = sender;
      console.log(job);
      if (!job) return;
      // setTask_counter(task_counter + 1);
      job.id = job.arrival_time; // unique id for tracking animation
      // if (LB) {
      //   startAnimation(`e-${sender.id}-${LB_ID}`);
      //   startAnimation(`e-${LB_ID}-${targetId}`);
      // } else {
      //   startAnimation(`e-${sender}-${targetId}`);
      // }
      setMachines((prevMachines) =>
        prevMachines.map((machine) =>
          machine.id === targetId
            ? { ...machine, queue: [...(machine.queue || []), job] }
            : machine,
        ),
      );
      return;
    },
    [setEdges, setMachines],
  );
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Update Machines
  useEffect(() => {
    // TODO get policy
    // based on batch Q run policy
    // for example first-come-first-served hard coded. FIXME
    if (!isRunning) {
      setTask_counter(0);
      setMachine_index(0);
      setIot_index(0);
      return;
    }

    if (!batchQ.queue.length) return;
    if (!taskLoaded) {
      setTask(batchQ.queue[task_counter % batchQ.queue.length]);
      setTaskLoaded(true);
      setTask_counter(task_counter + 1);
    }

    if (taskLoaded && simulationTime >= task.arrival_time) {
      machine_count = machines.length;
      setMachine_index((prev_machine_index + 1) % machine_count);
      setPrev_machine_index(machine_index);
      setIot_index(iot.findIndex((m) => m.name == task.task_type));
      let sender = task;
      const mecha = machines[machine_index].id;
      const iotSrc = iot[iot_index];
      const iID = `nd_${iotSrc.id}`;

      if (isNeighbors(iID, mecha)) {
        enqueue(mecha, sender, true, LB_ID);
      }

      setTaskLoaded(false);
    }

    machines.forEach((m) => {
      if (!m.queue?.length) return;
      let task_life = simulationTime - m.queue[0].arrival_time;
      if (task_life >= m.eet?.[task.task_type]) dequeue(m.id);
    });
  }, [simulationTime, isRunning]);
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
  // /* -------------------- WORKSPACE, MACHINE and IOT NODES -------------------- */
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
              {/* View Report Button - Top Right */}
              {dataResults.length > 0 && (
                <Panel position="top-right">
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold transition"
                  >
                    {showReport ? "Hide Report" : "View Report"}
                  </button>
                </Panel>
              )}

              {/* Cancelled Tasks Panel - Bottom Left */}
              <Panel position="bottom-left">
                <div
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition bg-white rounded-lg shadow-lg p-4"
                  onClick={() => openSidebar("cancelledTasks")}
                >
                  <TrashIcon className="w-10 h-10 text-red-600" />
                  <span className="text-gray-800 text-sm font-semibold mt-2">
                    Cancelled Tasks
                  </span>
                </div>
              </Panel>

              {/* Missed Tasks Panel - Bottom Right */}
              <Panel position="bottom-right">
                <div
                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition bg-white rounded-lg shadow-lg p-4"
                  onClick={() => openSidebar("missedTasks")}
                >
                  <TrashIcon className="w-10 h-10 text-orange-600" />
                  <span className="text-gray-800 text-sm font-semibold mt-2">
                    Missed Tasks
                  </span>
                </div>
              </Panel>
            </ReactFlow>
          </div>
          <Sidebar setNodes={setNodes} />
        </div>

        {/* Simulation Report Component */}
        {showReport && dataResults.length > 0 && (
          <SimulationReport
            dataResults={dataResults}
            completedTasks={completedTasks}
            missedTasks={missedTasks}
            unassignedTasks={unassignedTasks}
            simulationTime={simulationTime}
            machines={machines}
            onClose={() => {
              setDataResults([]);
              setShowReport(false);
            }}
            onMinimize={() => setShowReport(false)}
            onRunSimulation={runDataSimulation}
          />
        )}

        {/* Play Button Overlay - Bottom Center (when no report) */}
        {!showReport && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex space-x-4 bg-white rounded-full shadow-lg px-6 py-3">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition"
                onClick={handleResetSim}
              >
                ⟲
              </button>
              <button
                onClick={runDataSimulation}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-md"
              >
                ▶
              </button>
              <button className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition">
                ⏸
              </button>
            </div>
          </div>
        )}
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
                    : sidebarMode === "cancelledTasks"
                      ? "Cancelled Tasks"
                      : sidebarMode === "missedTasks"
                        ? "Missed Tasks"
                        : sidebarMode === "task"
                          ? `Task: ${String(selectedTask.name)}`
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
                // profilingFileUploaded={profilingFileUploaded}
                // profilingFileName={profilingFileName}
                // profilingTableData={profilingTableData}
                // workloadFileUploaded={workloadFileUploaded}
                // workloadFileName={workloadFileName}
                // workloadTableData={workloadTableData}
                // configFileUploaded={configFileUploaded}
                // configFileName={configFileName}
                // handleProfilingUpload={handleProfilingUpload}
                // handleWorkloadUpload={handleWorkloadUpload}
                // handleConfigUpload={handleConfigUpload}
                handleSubmitWorkloadAndProfiling={
                  handleSubmitWorkloadAndProfiling
                }
                handleResetWorkload={handleResetWorkload}
                workloadSubmissionStatus={workloadSubmissionStatus}
                // setProfilingFileName={setProfilingFileName}
                // setProfilingFileUploaded={setProfilingFileUploaded}
                // setProfilingTableData={setProfilingTableData}
                // setWorkloadFileName={setWorkloadFileName}
                // setWorkloadFileUploaded={setWorkloadFileUploaded}
                // setWorkloadTableData={setWorkloadTableData}
                // setConfigFileName={setConfigFileName}
                // setConfigFileUploaded={setConfigFileUploaded}
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

                    {/*
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
                    */}
                  </div>
                </div>

                {/*
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
                */}

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
                      missedTasks.map((task, index) => (
                        <tr key={`missed-task-${task.taskId}-${index}`}>
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
