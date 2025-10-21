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
  const [setWorkloadTableData] = useState([]);
  const [workloadFiles, setWorkloadFiles] = useState([]); // Array of workload arrays
  const [selectedWorkloadIdx, setSelectedWorkloadIdx] = useState(0);
  
  const numTasks = taskTypes.length;

  const renderTab = () => {
    switch (activeTab) {
      case "scenario":
        return (
          <ScenarioTab
            scenarioRows={scenarioRows}
            setScenarioRows={setScenarioRows}
            setActiveTab={setActiveTab}
            setWorkloadTableData={setWorkloadTableData}
            setWorkloadFiles={setWorkloadFiles}
            setSelectedWorkloadIdx={setSelectedWorkloadIdx}
            taskTypes={taskTypes}
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
          />
        );
      case "eet":
        return (
          <EETTab
            eet={eet}
            setEET={setEET}
            taskTypes={taskTypes}
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