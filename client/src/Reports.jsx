import React, { useEffect, useState } from "react";
import { useGlobalState } from "./context/GlobalStates";
import SimulationReport from "./components/SimulationReport";
import AggregateSimulationReport from "./components/AggregateSimulationReport";

const Reports = () => {
  const {
    unassignedTasks,
    missedTasks,
    dataResults,
    totalTasks,
    completedTasks,
    simulationTime,
    machines,
    iot,
    edges,
    schedulingMode,
    batchIntervalSeconds,
    setIsPaused,
    batchRunResults,
  } = useGlobalState();
  const [selectedReport, setSelectedReport] = useState("run-1");
  const hasMultipleRuns = batchRunResults.length > 1;

  const selectedRunNumber = selectedReport.startsWith("run-")
    ? Number(selectedReport.slice(4))
    : null;
  const selectedRun = batchRunResults.find(
    (entry) => entry.runNumber === selectedRunNumber,
  );

  useEffect(() => {
    setIsPaused(true);
  }, [setIsPaused]);

  useEffect(() => {
    if (!hasMultipleRuns) {
      setSelectedReport("run-1");
      return;
    }
    if (
      selectedReport !== "average" &&
      !batchRunResults.some(
        (entry) => `run-${entry.runNumber}` === selectedReport,
      )
    ) {
      setSelectedReport("run-1");
    }
  }, [batchRunResults, hasMultipleRuns, selectedReport]);

  const liveSnapshot = {
    results: dataResults,
    totalTasks,
    completed: completedTasks,
    missed: missedTasks,
    unassigned: unassignedTasks,
    time: simulationTime,
    machines,
    iot,
    edges,
    schedulingMode,
    batchIntervalSeconds:
      schedulingMode === "batch" ? Number(batchIntervalSeconds) : null,
  };

  const reportSnapshot =
    selectedRunNumber === 1
      ? selectedRun?.status === "complete" && selectedRun.snapshot
        ? selectedRun.snapshot
        : liveSnapshot
      : selectedRun?.snapshot;

  const renderSelectedReport = () => {
    if (selectedReport === "average") {
      return <AggregateSimulationReport entries={batchRunResults} />;
    }

    if (!reportSnapshot) {
      const failed = selectedRun?.status === "error";
      return (
        <section className={`rounded-xl border p-8 text-center ${failed ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
          <h2 className="text-xl font-bold text-gray-900">
            Simulation {selectedRunNumber}
          </h2>
          <p className={`mt-2 font-semibold ${failed ? "text-red-700" : "text-blue-700"}`}>
            {failed
              ? "This simulation could not be completed."
              : "This simulation is still running in the background."}
          </p>
          {selectedRun?.error && (
            <p className="mt-2 text-sm text-red-700">{selectedRun.error}</p>
          )}
        </section>
      );
    }

    return (
      <SimulationReport
        key={selectedReport}
        dataResults={reportSnapshot.results || []}
        totTasks={reportSnapshot.totalTasks || 0}
        completedTasks={reportSnapshot.completed || []}
        missedTasks={reportSnapshot.missed || []}
        unassignedTasks={reportSnapshot.unassigned || []}
        simulationTime={reportSnapshot.time || 0}
        machines={reportSnapshot.machines || []}
        sources={reportSnapshot.iot || []}
        edges={reportSnapshot.edges || []}
        schedulingMode={reportSnapshot.schedulingMode || "immediate"}
        batchIntervalSeconds={reportSnapshot.batchIntervalSeconds}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <main className="flex-1 p-8">
        <div className="max-w-screen mx-auto bg-white shadow rounded-xl p-8">
          {hasMultipleRuns && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <label htmlFor="report-view" className="font-semibold text-gray-800">
                Report view
              </label>
              <select
                id="report-view"
                value={selectedReport}
                onChange={(event) => setSelectedReport(event.target.value)}
                className="min-w-52 rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {batchRunResults.map((entry) => (
                  <option
                    key={`report-option-${entry.runNumber}`}
                    value={`run-${entry.runNumber}`}
                  >
                    Simulation {entry.runNumber}
                    {entry.status !== "complete" ? ` (${entry.status})` : ""}
                  </option>
                ))}
                <option value="average">Aggregate Simulation Results</option>
              </select>
              {selectedRun && (
                <span className="text-sm text-gray-600">
                  Seed: {selectedRun.seed || "Fresh randomness"}
                </span>
              )}
            </div>
          )}
          {renderSelectedReport()}
        </div>
      </main>
    </div>
  );
};

export default Reports;
