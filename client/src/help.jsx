import React, { useState } from "react";
import { useGlobalState } from "./context/GlobalStates";
import SimulationReport from "./components/SimulationReport";

const Help = () => {
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
    return (
      <>
        <h2>Help page coming soon!</h2>
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

export default Help;
