import React, { useState } from "react";
import ScenarioTab from "./workload/tabs/ScenarioTab";
import TaskTypesTab from "./workload/tabs/TaskTypesTab";
import MachineTypesTab from "./workload/tabs/MachineTypesTab";
import EETTab from "./workload/tabs/EETTab";
import WorkloadPreviewTab from "./workload/tabs/WorkloadPreviewTab";

const TABS = [
  { key: "taskTypes", label: "Task Types" },
  { key: "machineTypes", label: "Machine Types" },
  { key: "scenario", label: "Scenario" },
  { key: "workload", label: "Workload" },
  { key: "eet", label: "EET" },
];

const WorkloadGenerator = () => {
  const [activeTab, setActiveTab] = useState("scenario");
  const [scenarioRows, setScenarioRows] = useState([]);  
  const [taskTypes, setTaskTypes] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [eet, setEET] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [workloadTableData, setWorkloadTableData] = useState([]);
  const numTasks = scenarioRows.reduce((sum, row) => sum + Number(row.numTasks || 0), 0);
  const [workloadFiles, setWorkloadFiles] = useState([]); // <-- add this
  const [selectedWorkloadIdx, setSelectedWorkloadIdx] = useState(0); // <-- add this

  // --- Save Config Handler ---
  const handleSaveConfig = () => {
    const configData = {
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
      task_types: taskTypes.map((t, idx) => ({
        id: idx + 1,
        name: t.name,
        urgency: t.urgency || "BestEffort",
        deadline: Number(t.slack) || 10.0,
      })),
      battery: [
        {
          capacity: 5000.0,
        },
      ],
      machines: machineTypes.map((m) => ({
        name: m.name,
        power: Number(m.power),
        idle_power: Number(m.idlePower),
        replicas: Number(m.replicas),
      })),
      cloud: [
        {
          bandwidth: 15000.0,
          network_latency: 0.015,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "scenario":
        return (
          <ScenarioTab
            scenarioRows={scenarioRows}
            setScenarioRows={setScenarioRows}
            setActiveTab={setActiveTab}
            setWorkloadTableData={setWorkloadTableData}
            taskTypes={taskTypes}
            setWorkloadFiles={setWorkloadFiles}
            setSelectedWorkloadIdx={setSelectedWorkloadIdx}
          />
        );
      case "taskTypes":
        return (
          <TaskTypesTab
            taskTypes={taskTypes}
            setTaskTypes={setTaskTypes}
            setActiveTab={setActiveTab}
          />
        );
      case "machineTypes":
        return (
          <MachineTypesTab
            machineTypes={machineTypes}
            setMachineTypes={setMachineTypes}
            setActiveTab={setActiveTab}
            handleSaveConfig={handleSaveConfig}
          />
        );
      case "eet":
        return (
          <EETTab
            eet={eet}
            setEET={setEET}
            taskTypes={taskTypes}
            numTasks={numTasks}
            machineTypes={machineTypes}
          />
        );
      case "workload":
        return (
          <WorkloadPreviewTab
            workloadFiles={workloadFiles}
            selectedWorkloadIdx={selectedWorkloadIdx}
            setSelectedWorkloadIdx={setSelectedWorkloadIdx}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 space-y-2">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Workload Generator</h2>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`block w-full text-left px-4 py-2 rounded transition ${
              activeTab === tab.key
                ? "bg-blue-500 text-white font-semibold"
                : "hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        {/* Save Config Button */}
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded mt-6 w-full"
          onClick={handleSaveConfig}
        >
          Save Config
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto bg-white shadow rounded-xl p-8">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default WorkloadGenerator;