import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence, useForceUpdate } from "framer-motion";
import { TrashIcon } from '@heroicons/react/24/outline';
import MachineList from "./MachineList";
import TaskList from "./TaskList";

const SimDashboard = () => {
  const taskSlots = Array.from({ length: 6 });

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState({"id": -1, "name": "empty", "queue":[]});
  const [simulationTime, setSimulationTime] = useState(0); //TIME

  const [selectedTask, setSelectedTask] = useState(
    {"id": -1, "task_type": "empty", "data_size" : "", 
    "arrival_time" : "",
    "assigned_machine" : "",
    "deadline" : "",
    "start": "",
    "end": "",
    "status": "",});
  const [machines, setMachines] = useState([{"id": -1, "name": "empty", "queue":[]}]);
  const [batchQ, setBatchQ] = useState({"id": -2, "name": "Batch Queue", "queue":[]});

  const [scheduling, setScheduling] = useState("immediate");
  const [policy, setPolicy] = useState("FirstCome-FirstServe");
  const [queueSize, setQueueSize] = useState("unlimited");

  const [runtimeModel, setRuntimeModel] = useState("Constant");
  const [performanceParams, setPerformanceParams] = useState({ id: "", power: "", queue: ""});
  const [taskParams, setTaskParams] = useState( {
    "id": "",
    "task_type" : "",
    "assigned_machine" : "",
    "data_size" : "",
    "arrival_time" : "",
    "deadline" : "",
    "start": "",
    "end": "",
    "status": "",
  });
  const [metricParams, setMetricParams] = useState({ mean: "", std: "", mean1: "", std1: "", mean2: "", std2: "" });

  const [machineTab, setMachineTab] = useState("details");

  const [profilingFileName, setProfilingFileName] = useState("");
  const [profilingFileUploaded, setProfilingFileUploaded] = useState(false);
  const [profilingFileContents, setProfilingFileContents] = useState("");
  const [profilingTableData, setProfilingTableData] = useState([]);
  const [profilingSubmissionStatus, setProfilingSubmissionStatus] = useState(""); // Track profiling submission status

  const [workloadFileName, setWorkloadFileName] = useState("");
  const [workloadFileUploaded, setWorkloadFileUploaded] = useState(false);
  const [workloadFileContents, setWorkloadFileContents] = useState("");
  const [workloadTableData, setWorkloadTableData] = useState([]);

  const [configFileName, setConfigFileName] = useState("");
  const [configFileUploaded, setConfigFileUploaded] = useState(false);

  const [fcfsResults, setFcfsResults] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState(""); // Track submission status
  const [workloadSubmissionStatus, setWorkloadSubmissionStatus] = useState(""); // Track workload submission status

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

  const openSidebar = (mode,) => {
    setSidebarMode(mode);
    setShowSidebar(true);
    setSubmissionStatus(""); // Reset submission status when opening the sidebar
  };
  
//  update machine params
  useEffect(() => {
    setPerformanceParams(prev => ({
    ...prev,
    "id" : selectedMachine.id,
    "name" : selectedMachine.name,
    "queue": selectedMachine.queue
}))
console.log("SMQ", selectedMachine.queue)
  }, [selectedMachine])

  //  update task params
  useEffect(() => {
    setTaskParams(prev => ({
    ...prev,
    "id": selectedTask.id, 
    "task_type" : selectedTask.task_type,
    "assigned_machine" : selectedTask.assigned_machine,
    "data_size" : selectedTask.data_size, 
    "arrival_time" : selectedTask.arrival_time,
    "deadline" : selectedTask.deadline,
    "start": selectedTask.start,
    "end": selectedTask.end,
    "status": selectedTask.status,
}))
  }, [selectedTask])

 




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
    };
    reader.readAsText(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5001/api/workload/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      setBatchQ({"id": -2, "name": "Batch Queue", "queue": parseCSV(content)});
      
      console.log("raw content:", batchQ)
      setWorkloadTableData(parseCSV(content)); // Parse CSV into table data
    };
    reader.readAsText(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5001/api/workload/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      const res = await axios.post("http://localhost:5001/api/workload/upload/config", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Config upload success:", res.data);
      setMachines([...res.data.machines]);
    } catch (err) {
      console.error("Config upload error:", err);
      alert("Failed to upload configuration file.");
    }
  };

  const handleSubmitWorkloadAndProfiling = async () => {
    if (!workloadFileUploaded || !profilingFileUploaded || !configFileUploaded) {
      alert("Please upload the workload (.wkl), profiling table (.eet), and configuration (.json) files before submitting.");
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

    // Clear FCFS results if needed
    setFcfsResults([]);

    // Clear status message
    setWorkloadSubmissionStatus("");
  };

  const runFCFSSimulation = async () => {
    try {
      // Ensure required files are uploaded
      if (!workloadFileUploaded || !profilingFileUploaded || !configFileUploaded) {
        alert("Please upload the workload (.wkl), profiling table (.eet), and configuration (.json) files before running the simulation.");
        return;
      }
  
      // Prepare data for the FCFS simulation
      const simulationData = {
        schedulingPolicy: policy,          // Load balancing policy type
        configFilename: configFileName,    // Configuration file name
        profilingData: profilingTableData, // Profiling data parsed from the .eet file
        tasks: workloadTableData,          // Tasks parsed from the .wkl file
      };
  
      // Call the backend API to run the FCFS simulation
      const response = await axios.post("http://localhost:5001/api/workload/simulate/fcfs", simulationData);
  
      // Update the results state
      const results = response.data;
      setFcfsResults(results);
  
      // Update machines with assigned tasks
      const updatedMachines = machines.map((machine) => {
        const assignedTasks = results.filter((task) => task.machineId === machine.id);
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
  
      setMachines(updatedMachines);
  
      // Simulate time progression
      const interval = 0.1; // 100ms intervals
      results.forEach((_, index) => {
      setTimeout(() => {
        setSimulationTime((prevTime) => parseFloat((prevTime + interval).toFixed(1))); // Increment simulation time
      }, index * interval * 1000); // Multiply by 1000 to convert to milliseconds
      });


      alert("Simulation completed successfully!");
      console.log("Simulation results:", results);
    } catch (error) {
      console.error("Error running simulation:", error);
      alert("Failed to run simulation.");
    }
  };

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
    <div className="bg-[#d9d9d9] min-h-screen flex flex-col relative">
      {/* Main Simulation Area */}
      <div className="flex-grow flex flex-col justify-center items-center">

      {fcfsResults.length > 0 && (
  <div className="px-10 py-4">
    <h2 className="text-lg font-semibold mb-2">FCFS Results</h2>
    <table className="table-auto border-collapse border border-gray-400 w-full text-sm bg-white">
      <thead>
        <tr className="bg-gray-200">
          <th className="border px-2 py-1">Task ID</th>
          <th className="border px-2 py-1">Task Type</th>
          <th className="border px-2 py-1">Machine ID</th>
          <th className="border px-2 py-1">Assigned Machine</th> {/* Add Machine Type */}
          <th className="border px-2 py-1">Arrival Time</th>
          <th className="border px-2 py-1">Start</th>
          <th className="border px-2 py-1">End</th>
          <th className="border px-2 py-1">Status</th>
        </tr>
      </thead>
      <tbody>
        {fcfsResults.map((task) => (
          <tr key={task.taskId}>
            <td className="border px-2 py-1">{task.taskId}</td>
            <td className="border px-2 py-1">{task.task_type}</td>
            <td className="border px-2 py-1">{task.machineId ?? "N/A"}</td>
            <td className="border px-2 py-1">{task.assigned_machine ?? "N/A"}</td> {/* Display Machine Type */}
            <td className="border px-2 py-1">{task.arrival_time}</td>
            <td className="border px-2 py-1">{task.start}</td>
            <td className="border px-2 py-1">{task.end}</td>
            <td className="border px-2 py-1">{task.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="text-center mb-4">
    <h2 className="text-lg font-semibold">Simulation Time: {simulationTime.toFixed(1)} seconds </h2>
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
              <TaskList machine={batchQ} isBatchQueue={true} setSelectedTask={setSelectedTask} onClicked={() => openSidebar("task")}/>
              </div>

              {/* Load Balancer Button */}
              <div
                onClick={() => openSidebar("loadBalancer")}
                className="bg-gray-800 text-white text-sm font-semibold w-20 h-20 flex items-center justify-center rounded-full cursor-pointer hover:scale-105 transition text-center px-2"
              >
                Load<br />Balancer
              </div>
            </div>

            {/* Cancelled Tasks */}
            <div
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
              onClick={() => openSidebar("cancelledTasks")}
            >
              <TrashIcon className="w-10 h-10 text-gray-800" />
              <span className="text-gray-800 text-sm font-semibold mt-1">Cancelled Tasks</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center space-y-8 mt-8">
            <MachineList machs={machines} setSelectedMachine={setSelectedMachine} setSelectedTask={setSelectedTask} onClicked = {
              () => openSidebar("machine")} onTaskClicked={() => openSidebar("task")}
            />

            {/* Missed Tasks */}
            <div
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition"
              onClick={() => openSidebar("missedTasks")}
            >
              <TrashIcon className="w-10 h-10 text-gray-800" />
              <span className="text-gray-800 text-sm font-semibold mt-1">Missed Tasks</span>
            </div>
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
  onClick={runFCFSSimulation}
  className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-16 h-10"
> ▶</button>
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
                  : `Machine: ${selectedMachine.name?.toUpperCase()}`}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                &times;
              </button>
            </div>

            {sidebarMode === "workload" && (
              <div className="space-y-6">
                {/* Profiling Table Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Profiling Table (.eet)
                  </label>
                  {!profilingFileUploaded && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                      <label className="cursor-pointer">
                        Choose File
                        <input
                          type="file"
                          accept=".eet"
                          className="hidden"
                          onChange={handleProfilingUpload}
                        />
                      </label>
                    </button>
                  )}
                  {profilingFileName && (
                    <div className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">Uploaded File: {profilingFileName}</p>
                        <button
                          className="text-red-600 hover:text-red-800 transition"
                          onClick={() => {
                            setProfilingFileName("");
                            setProfilingFileUploaded(false);
                            setProfilingTableData([]);
                          }}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      {profilingTableData.length > 0 && (
                        <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                          <thead>
                            <tr>
                              {Object.keys(profilingTableData[0]).map((header) => (
                                <th key={header} className="border border-gray-300 px-4 py-2 bg-gray-100">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {profilingTableData.map((row, index) => (
                              <tr key={index}>
                                {Object.values(row).map((value, idx) => (
                                  <td key={idx} className="border border-gray-300 px-4 py-2">
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Workload File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Workload File (.wkl)
                  </label>
                  {!workloadFileUploaded && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                      <label className="cursor-pointer">
                        Choose File
                        <input
                          type="file"
                          accept=".wkl"
                          className="hidden"
                          onChange={handleWorkloadUpload}
                        />
                      </label>
                    </button>
                  )}
                  {workloadFileName && (
                    <div className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">Uploaded File: {workloadFileName}</p>
                        <button
                          className="text-red-600 hover:text-red-800 transition"
                          onClick={() => {
                            setWorkloadFileName("");
                            setWorkloadFileUploaded(false);
                            setWorkloadTableData([]);
                          }}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      {workloadTableData.length > 0 && (
                        <table className="table-auto border-collapse border border-gray-300 w-min text-sm">
                          <div style={{maxHeight: "300px", overflow: "auto", width: "min-content"}}>
                            <thead>
                              <tr>
                                {Object.keys(workloadTableData[0]).map((header) => (
                                  <th key={header} className="border border-gray-300 px-4 py-2 bg-gray-100">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                              <tbody>
                                {workloadTableData.map((row, index) => (
                                <tr key={index} >
                                  {Object.values(row).map((value, idx) => (
                                    <td key={idx} className="border border-gray-300 px-4 py-2">
                                      {value}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </div>
                          

                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Config File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Load Configuration File (.json)
                  </label>
                  {!configFileUploaded && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                      <label className="cursor-pointer">
                        Choose File
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleConfigUpload}
                        />
                      </label>
                    </button>
                  )}
                  {configFileName && (
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-sm text-gray-600">Uploaded File: {configFileName}</p>
                      <button
                        className="text-red-600 hover:text-red-800 transition"
                        onClick={() => {
                          setConfigFileName("");
                          setConfigFileUploaded(false);
                        }}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit and Reset Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={handleSubmitWorkloadAndProfiling}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    Submit Workload and Profiling Table
                  </button>
                  <button
                    onClick={handleResetWorkload}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    Generate New Workload
                  </button>

                  {/* Success Message */}
                  {workloadSubmissionStatus && (
                    <p className="text-sm text-center text-green-600 mt-2">{workloadSubmissionStatus}</p>
                  )}
                </div>
              </div>
            )}

            {sidebarMode === "loadBalancer" && (
              <form className="space-y-6">
                {/* Load Balancer Sidebar Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Scheduling</label>
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
                      scheduling === "immediate" ? "bg-gray-100 opacity-60" : "bg-white"
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
                  <p className="text-sm text-center text-green-600 mt-2">{submissionStatus}</p>
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
                      machineTab === "details" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setMachineTab("performance")}
                    className={`text-sm font-semibold ${
                      machineTab === "performance" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
                    }`}
                  >
                    Performance
                  </button>
                </div>

                {machineTab === "details" && (
                  <div className="space-y-6">
                    {/* Machine Details Tab */}
                    <div className="space-y-2">
                      {["ID", "Power", "Queue Size"].map((key) => (
                        <div key={key}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {key.toUpperCase()}
                          </label>
                          <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                            {String(performanceParams[key.toLowerCase()]) || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {machineTab === "performance" && (
                  <div className="space-y-4">
                    {/* Machine Performance Tab */}
                    {["Metric 1", "Metric 2", "Metric 3"].map((metric) => (
                      <div key={metric}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {metric}
                        </label>
                        <div className="w-full border px-3 py-2 text-sm rounded bg-gray-100">
                          {metricParams[metric.toLowerCase().replace(" ", "")] || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


           {sidebarMode === "task" && (
              <div className="space-y-6">
                {/* Task Sidebar Content */}
                <div className="flex space-x-4 border-b pb-2">
                  <table className="flex w-full text-left border-collapse">
                  <thead >
                    <tr className=" flex flex-col gap-3.5 ">
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Task ID</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Assigned Machine</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Arrival Time</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Start Time</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Missed Time</th>
                    </tr>
                  </thead>
                  <tbody className=" flex flex-col gap-3">
                      {["ID", "task_type", "assigned_machine", "arrival_time", "start", "missed_time"].map((key) => (
                        <td key={key} className=" w-full border px-4 py-2 text-sm rounded bg-gray-100">
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
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Task ID</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Arrival Time</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Cancellation Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="4" className="px-4 py-2 text-sm text-gray-500 text-center">
                        No data available yet. The simulation has not occurred.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {sidebarMode === "missedTasks" && (
              <div className="space-y-6">
                {/* Missed Tasks Sidebar Content */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Task ID</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Assigned Machine</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Arrival Time</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Start Time</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700">Missed Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="6" className="px-4 py-2 text-sm text-gray-500 text-center">
                        No data available yet. The simulation has not occurred.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimDashboard;
