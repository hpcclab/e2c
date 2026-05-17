import React, { useState } from "react";
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

  const renderTab = () => {
    setIsPaused(true); // pauses the simulation to persist data, however this causes a bad state call error.
    return (
      <>
        <SimulationReport
          dataResults={dataResults}
          totTasks={totalTasks}
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
