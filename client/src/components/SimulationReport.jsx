import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  exportSimulationReport,
  exportCombinedReport,
} from "../utils/exportCSV";
import TaskLifecycle from "./TaskLifecycle";

const SimulationReport = ({
  dataResults,
  completedTasks = [],
  missedTasks,
  unassignedTasks = [],
  simulationTime,
  machines = [],
  onClose,
  onMinimize,
  onRunSimulation,
}) => {
  const [reportSize, setReportSize] = useState({ width: 1000, height: 600 });
  const [reportPosition, setReportPosition] = useState({ x: 100, y: 100 });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [exportType, setExportType] = useState("combined");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lifecycleTask, setLifecycleTask] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");

  // Handle CSV Export
  const handleExport = () => {
    const reportData = {
      dataResults,
      missedTasks,
      machines,
      simulationTime,
    };

    if (exportType === "combined") {
      exportCombinedReport(reportData);
    } else {
      exportSimulationReport(reportData);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const results = Array.isArray(dataResults) ? dataResults : [];
    const missed = Array.isArray(missedTasks) ? missedTasks : [];
    const done = Array.isArray(completedTasks) ? completedTasks : [];
    const unassigned = Array.isArray(unassignedTasks) ? unassignedTasks : [];
    const machineList = Array.isArray(machines)
      ? machines.filter((m) => m.id !== -1)
      : [];

    const totalTasks = results.length;
    // Dynamic: tasks that have been fully processed (completed + missed) so far
    const tasksMapped = done.length + missed.length;
    const tasksCancelled = results.filter(
      (t) => t.status === "CANCELLED",
    ).length;
    // Dynamic: count from the live completedTasks accumulator
    const tasksCompleted = done.length;
    // Tasks never assigned to any machine (queue capacity constraint)
    const tasksUnassigned = unassigned.length;
    const unassignedByType = unassigned.reduce((acc, task) => {
      const type = task.task_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate tasks per machine by matching the machine name prefix
    const tasksPerMachine = {};

    machineList.forEach((machine) => {
      // Count tasks where assigned_machine starts with the machine name
      const count = results.filter((task) => {
        const assignedMachine = task.assigned_machine || "";
        // Match "machineName #X" pattern
        return (
          assignedMachine.startsWith(machine.name + " #") ||
          assignedMachine === machine.name
        );
      }).length;

      tasksPerMachine[machine.id] = count;
      tasksPerMachine[machine.name] = count;
    });

    // Group missed tasks by type
    const missedByType = missed.reduce((acc, task) => {
      const type = task.task_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const completionPercentage =
      totalTasks > 0 ? ((tasksMapped / totalTasks) * 100).toFixed(2) : "0.00";

    const totalEnergyConsumed = machineList.reduce((sum, machine) => {
      const power = machine.power || 0;
      const utilizationTime = machine.utilization_time || 0;
      return sum + (power * utilizationTime) / 1000;
    }, 0);

    const totalCost = machineList.reduce(
      (sum, m) => sum + (m.price || 0) * (m.utilization_time || 0),
      0,
    );

    return {
      totalTasks,
      tasksMapped,
      tasksCancelled,
      tasksCompleted,
      tasksUnassigned,
      unassignedByType,
      missedByType,
      totalMissed: missed.length,
      completionPercentage,
      totalEnergyConsumed,
      totalCost,
      tasksPerMachine,
    };
  }, [dataResults, completedTasks, missedTasks, unassignedTasks, machines]);

  useEffect(() => {
    console.log("=== DEBUG dataResults ===");
    console.log("First 3 tasks:", dataResults.slice(0, 3));
    console.log(
      "Sample task keys:",
      dataResults[0] ? Object.keys(dataResults[0]) : "No tasks",
    );
    console.log(
      "execution_time values:",
      dataResults.slice(0, 5).map((t) => ({
        id: t.id,
        execution_time: t.execution_time,
        deadline: t.deadline,
      })),
    );
  }, [dataResults]);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains("report-header")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - reportPosition.x,
        y: e.clientY - reportPosition.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        setReportPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
      if (isResizing) {
        setReportSize({
          width: Math.max(400, e.clientX - reportPosition.x),
          height: Math.max(300, e.clientY - reportPosition.y),
        });
      }
    },
    [isDragging, isResizing, dragStart, reportPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-2xl flex flex-col transition-all ${
        isFullscreen ? "fixed inset-0 z-50 m-0" : "absolute z-20"
      }`}
      style={
        isFullscreen
          ? { width: "100%", height: "100%" }
          : {
              left: `${reportPosition.x}px`,
              top: `${reportPosition.y}px`,
              width: `${reportSize.width}px`,
              height: `${reportSize.height}px`,
            }
      }
      onMouseDown={handleMouseDown}
    >
      {/* Header - Draggable */}
      <div className="report-header flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg cursor-move">
        <h2 className="text-lg font-semibold">Simulation Results</h2>
        <div className="flex items-center space-x-2">
          {/* Fullscreen Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="text-white hover:bg-blue-800 rounded px-2 py-1 transition flex items-center space-x-1"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
            <span className="text-xs">{isFullscreen ? "Exit" : "Full"}</span>
          </button>

          {/* EXPORT CONTROLS */}
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="text-white text-sm rounded px-2 py-1 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="combined">Combined CSV</option>
            <option value="separate">Separate Files</option>
          </select>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 transition flex items-center space-x-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="text-white hover:bg-blue-800 rounded px-2 py-1 transition"
          >
            _
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-red-600 rounded px-2 py-1 transition text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-gray-800">
            Simulation Time: {simulationTime.toFixed(2)} seconds
          </h3>
          <p className="text-sm text-gray-700 mt-2 flex justify-center items-center space-x-4">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
              Total: {dataResults.length}
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
              Completed: {completedTasks.length}
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
              Missed: {missedTasks.length}
            </span>
          </p>
        </div>

        {/* MACHINE STATISTICS SECTION */}
        {machines.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              Machine Statistics
            </h4>
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse border border-gray-300 w-full text-sm shadow-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                      Machine
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Power (W)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Price ($/hr)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Utilization (hr)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Cost ($)
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Tasks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {machines
                    .filter((m) => m.id !== -1)
                    .map((machine, index) => {
                      // Try multiple ways to find the task count
                      const taskCount =
                        summaryStats.tasksPerMachine[`machine-${index + 1}`] ||
                        summaryStats.tasksPerMachine[`machine-${machine.id}`] ||
                        summaryStats.tasksPerMachineByIndex?.[index] || // By array index
                        summaryStats.tasksPerMachine[machine.id] || // By raw ID
                        summaryStats.tasksPerMachine[machine.name] || // By machine name
                        0;

                      return (
                        <tr
                          key={`machine-${machine.id}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {machine.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {machine.power || 0} W
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            ${machine.price || 0}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {(machine.utilization_time || 0).toFixed(4)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            $
                            {(
                              (machine.price || 0) *
                              (machine.utilization_time || 0)
                            ).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">
                            {taskCount}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {machines
                        .filter((m) => m.id !== -1)
                        .reduce((sum, m) => sum + (m.power || 0), 0)}{" "}
                      W
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      $
                      {machines
                        .filter((m) => m.id !== -1)
                        .reduce((sum, m) => sum + (m.price || 0), 0)
                        .toFixed(2)}
                      /hr
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {machines
                        .filter((m) => m.id !== -1)
                        .reduce((sum, m) => sum + (m.utilization_time || 0), 0)
                        .toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-green-800">
                      $
                      {machines
                        .filter((m) => m.id !== -1)
                        .reduce(
                          (sum, m) =>
                            sum + (m.price || 0) * (m.utilization_time || 0),
                          0,
                        )
                        .toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">
                      {machines
                        .filter((m) => m.id !== -1)
                        .reduce((sum, machine) => {
                          const taskCount =
                            summaryStats.tasksPerMachine[machine.id] ||
                            summaryStats.tasksPerMachine[machine.name] ||
                            0;
                          return sum + taskCount;
                        }, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Task Results Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-gray-800 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Task Results
            </h4>
            <input
              type="text"
              placeholder="Search by ID, type, machine, status..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm shadow-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-200 z-10">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Task ID
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Task Type
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Assigned Machine
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Arrival
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Start
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    End
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Exec Time
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Deadline
                  </th>
                  <th className="border border-gray-300 px-3 py-2 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataResults
                  .filter((task) => {
                    if (!taskSearch) return true;
                    const q = taskSearch.toLowerCase();
                    return (
                      String(task.taskId ?? task.id)
                        .toLowerCase()
                        .includes(q) ||
                      (task.task_type || "").toLowerCase().includes(q) ||
                      (task.assigned_machine || "").toLowerCase().includes(q) ||
                      (task.status || "").toLowerCase().includes(q)
                    );
                  })
                  .map((task, index) => {
                    // Check if deadline was missed
                    const deadlineMissed = task.status === "DEADLINE_MISSED";
                    const isUnassigned = task.machineId === null;

                    return (
                      <tr
                        key={`task-${task.taskId || task.id}-${index}`}
                        onClick={() => setLifecycleTask(task)}
                        className={`cursor-pointer hover:bg-blue-50 transition ${
                          lifecycleTask?.taskId === task.taskId
                            ? "ring-2 ring-inset ring-blue-400"
                            : isUnassigned
                              ? "bg-amber-50"
                              : task.status === "CANCELLED"
                                ? "bg-red-50"
                                : deadlineMissed
                                  ? "bg-orange-50"
                                  : ""
                        }`}
                      >
                        <td className="border border-gray-300 px-3 py-2 font-medium">
                          {task.taskId ?? task.id}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {task.task_type}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {task.assigned_machine ?? "N/A"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {task.arrival_time?.toFixed(3) ?? "-"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {task.start?.toFixed(3) ?? "-"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          {task.end?.toFixed(3) ?? "-"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-purple-700 font-medium">
                          {task.execution_time?.toFixed(3) ?? "-"}
                        </td>
                        <td
                          className={`border border-gray-300 px-3 py-2 ${
                            deadlineMissed ? "text-red-600 font-semibold" : ""
                          }`}
                        >
                          {task.deadline?.toFixed(3) ?? "-"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              task.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : isUnassigned
                                  ? "bg-amber-100 text-amber-800"
                                  : task.status === "CANCELLED"
                                    ? "bg-orange-100 text-orange-600"
                                    : deadlineMissed
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isUnassigned ? "UNASSIGNED" : task.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {lifecycleTask && (
            <div className="px-2 pb-2">
              <TaskLifecycle task={lifecycleTask} />
            </div>
          )}
        </div>

        {/* Summary Statistics Section */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Summary Statistics
          </h4>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Tasks */}
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {summaryStats.totalTasks}
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Total Tasks
              </div>
            </div>

            {/* Tasks Mapped */}
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-700">
                {summaryStats.tasksMapped}
              </div>
              <div className="text-sm text-green-600 font-medium">
                Tasks Mapped
              </div>
            </div>

            {/* Tasks Unassigned */}
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-700">
                {summaryStats.tasksUnassigned}
              </div>
              <div className="text-sm text-amber-600 font-medium">
                Tasks Unassigned
              </div>
            </div>

            {/* Total Missed */}
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-700">
                {summaryStats.totalMissed}
              </div>
              <div className="text-sm text-red-600 font-medium">
                Tasks Missed
              </div>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <table className="table-auto border-collapse border border-gray-300 w-full text-sm mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Metric
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Total Tasks
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {summaryStats.totalTasks}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Tasks Mapped
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {summaryStats.tasksMapped}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Tasks Cancelled
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {summaryStats.tasksCancelled}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Tasks Unassigned
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {summaryStats.tasksUnassigned}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Tasks Missed
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {summaryStats.totalMissed}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-blue-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold">
                  Completion Rate
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-blue-700">
                  {summaryStats.completionPercentage}%
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-yellow-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold">
                  Total Energy Consumed
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-yellow-700">
                  {summaryStats.totalEnergyConsumed.toFixed(4)} kWh
                </td>
              </tr>
              <tr className="hover:bg-gray-50 bg-green-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold">
                  Total Cost
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-700">
                  ${summaryStats.totalCost.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Missed Tasks by Type */}
          {summaryStats.missedByType &&
            Object.keys(summaryStats.missedByType).length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Missed Tasks by Type
                </h5>
                <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Task Type
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        Count
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        % of Missed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryStats.missedByType).map(
                      ([type, count], index) => (
                        <tr
                          key={`missed-type-${type}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {type}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {count}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {((count / summaryStats.totalMissed) * 100).toFixed(
                              1,
                            )}
                            %
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Unassigned Tasks by Type */}
          {summaryStats.unassignedByType &&
            Object.keys(summaryStats.unassignedByType).length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  Unassigned Tasks by Type
                </h5>
                <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Task Type
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        Count
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        % of Unassigned
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryStats.unassignedByType).map(
                      ([type, count], index) => (
                        <tr
                          key={`unassigned-type-${type}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {type}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {count}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {(
                              (count / summaryStats.tasksUnassigned) *
                              100
                            ).toFixed(1)}
                            %
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Energy Breakdown by Machine */}
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">
              Energy Consumption by Machine
            </h5>
            <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Machine
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Power (W)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Utilization (hr)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Energy (kWh)
                  </th>
                </tr>
              </thead>
              <tbody>
                {machines
                  .filter((m) => m.id !== -1)
                  .map((machine, index) => {
                    return (
                      <tr
                        key={`machine-${machine.id}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {machine.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {machine.power || 0} W
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          ${machine.price || 0}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {(machine.utilization_time || 0).toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-yellow-100 font-semibold">
                <tr>
                  <td className="border border-gray-300 px-4 py-2" colSpan="3">
                    Total
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {summaryStats.totalEnergyConsumed.toFixed(4)} kWh
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Resize Handle - Only show when not fullscreen */}
      {!isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-gray-300 hover:bg-gray-400 rounded-tl-lg flex items-center justify-center"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M14 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 0H4" />
          </svg>
        </div>
      )}

      {/* Play Controls at Bottom */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-lg">
        <div className="flex justify-center space-x-4">
          <button className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-md">
            ⟲
          </button>
          <button
            onClick={onRunSimulation}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-lg transform hover:scale-110"
          >
            ▶
          </button>
          <button className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition shadow-md">
            ⏸
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationReport;
