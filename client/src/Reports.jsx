import React, { useEffect } from "react";
import { useGlobalState } from "./context/GlobalStates";
import SimulationReport from "./components/SimulationReport";

const Reports = () => {
  const {
    unassignedTasks,
    missedTasks,
    dataResults,
    totalTasks,
    completedTasks,
    simulationTime,
    machines,
    setIsPaused,
  } = useGlobalState();

  useEffect(() => {
    setIsPaused(true);
  }, [setIsPaused]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <main className="flex-1 p-8">
        <div className="max-w-screen mx-auto bg-white shadow rounded-xl p-8">
          <SimulationReport
            dataResults={dataResults}
            totTasks={totalTasks}
            completedTasks={completedTasks}
            missedTasks={missedTasks}
            unassignedTasks={unassignedTasks}
            simulationTime={simulationTime}
            machines={machines}
          />
        </div>
      </main>
    </div>
  );
};

export default Reports;
