import React, { useState } from "react";
import ScenarioTab from "./workload/tabs/ScenarioTab";
import TaskTypesTab from "./workload/tabs/TaskTypesTab";
import MachineTypesTab from "./workload/tabs/MachineTypesTab";
import EETTab from "./workload/tabs/EETTab";
import WorkloadPreviewTab from "./workload/tabs/WorkloadPreviewTab";
import { useGlobalState } from "./context/GlobalStates";
import SimulationReport from "./components/SimulationReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("scenario");

  const {
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    machineTypes,
    setMachineTypes,
    showReport,
    setShowReport,
    unassignedTasks,
    setUnassignedTasks,
    missedTasks,
    setMissedTasks,
    dataResults,
    setDataResults,
    completedTasks,
    simulationTime,
    machines,
  } = useGlobalState();

  const [eet, setEET] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [setWorkloadTableData] = useState([]);
  const [workloadFiles, setWorkloadFiles] = useState([]); // Array of workload arrays
  const [selectedWorkloadIdx, setSelectedWorkloadIdx] = useState(0);

  const renderTab = () => {
    return (
      <>
        <SimulationReport
          dataResults={dataResults}
          completedTasks={completedTasks}
          missedTasks={missedTasks}
          unassignedTasks={unassignedTasks}
          simulationTime={simulationTime}
          machines={machines}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <main className="flex-1 p-8">
        <div className="max-w-screen mx-auto bg-white shadow rounded-xl p-8">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};

export default Reports;
