import { getTaskColor } from "./taskColors.js";
import { buildTaskSummary } from "./reportStats.js";

const machineMatchesTask = (machine, task) => {
  const assignedMachine = String(task?.assigned_machine ?? "");
  const machineName = String(machine?.name ?? "");
  return (
    assignedMachine === machineName ||
    assignedMachine.startsWith(`${machineName} #`)
  );
};

const actualTaskRuntime = (task) => {
  const start = Number(task?.start_time);
  const end = Number(task?.end_time);
  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
    return end - start;
  }

  const executionTime = Number(task?.execution_time);
  return Number.isFinite(executionTime) && executionTime > 0
    ? executionTime
    : 0;
};

const sourceIdentity = (task, sourceById, sourceByTaskType) => {
  const source = sourceById.get(String(task?.source_id)) ??
    sourceByTaskType.get(String(task?.task_type));
  if (source) return { key: `source_${source.id}`, source };

  const taskType = String(task?.task_type || "Unknown IoT");
  return {
    key: `task_type_${taskType.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    source: {
      id: taskType,
      name: taskType,
      properties: { taskColor: "Slate" },
    },
  };
};

export function buildMachineChartData({
  machines = [],
  tasks = [],
  sources = [],
} = {}) {
  const machineList = machines.filter((machine) => machine?.id !== -1);
  const sourceById = new Map(
    sources.map((source) => [String(source?.id), source]),
  );
  const sourceByTaskType = new Map(
    sources.map((source) => [String(source?.properties?.task_type), source]),
  );
  const segmentsByKey = new Map();

  const machineGroups = machineList.map((machine) => {
    const assignedTasks = tasks.filter((task) => machineMatchesTask(machine, task));
    const bySource = new Map();

    assignedTasks.forEach((task) => {
      const identity = sourceIdentity(task, sourceById, sourceByTaskType);
      const current = bySource.get(identity.key) ?? {
        count: 0,
        runtimeSeconds: 0,
        processingEnergyJ: 0,
        hasProcessingEnergy: false,
      };
      current.count += 1;
      current.runtimeSeconds += actualTaskRuntime(task);
      if (Number.isFinite(Number(task?.processing_energy_j))) {
        current.processingEnergyJ += Math.max(
          0,
          Number(task.processing_energy_j),
        );
        current.hasProcessingEnergy = true;
      }
      bySource.set(identity.key, current);

      if (!segmentsByKey.has(identity.key)) {
        segmentsByKey.set(identity.key, {
          key: identity.key,
          name: identity.source.name ||
            identity.source.properties?.task_type ||
            "Unknown IoT",
          color: getTaskColor(identity.source.properties?.taskColor).bg,
        });
      }
    });

    return { machine, assignedTasks, bySource };
  });

  const segments = [...segmentsByKey.values()];
  const taskCounts = [];
  const energy = [];
  const cost = [];

  machineGroups.forEach(({ machine, assignedTasks, bySource }) => {
    const taskRow = { name: machine.name };
    const energyRow = { name: machine.name };
    const costRow = { name: machine.name };
    const totalRuntime = [...bySource.values()].reduce(
      (sum, value) => sum + value.runtimeSeconds,
      0,
    );
    const hasTaskEnergy = [...bySource.values()].some(
      (value) => value.hasProcessingEnergy,
    );
    const legacyTotalEnergy =
      ((Number(machine.power) || 0) *
        (Number(machine.utilization_time) || 0)) /
      1000;
    const totalCost =
      (Number(machine.price) || 0) *
      (Number(machine.utilization_time) || 0) *
      3600;

    segments.forEach(({ key }) => {
      const values = bySource.get(key) ?? {
        count: 0,
        runtimeSeconds: 0,
        processingEnergyJ: 0,
        hasProcessingEnergy: false,
      };
      const share = totalRuntime > 0
        ? values.runtimeSeconds / totalRuntime
        : assignedTasks.length > 0
          ? values.count / assignedTasks.length
          : 0;

      taskRow[key] = values.count;
      energyRow[key] = hasTaskEnergy
        ? values.processingEnergyJ / 3_600_000
        : legacyTotalEnergy * share;
      costRow[key] = totalCost * share;
    });

    taskCounts.push(taskRow);
    energy.push(energyRow);
    cost.push(costRow);
  });

  return { segments, taskCounts, energy, cost };
}

export function buildPercentageChartData(rows = [], keys = []) {
  const total = rows.reduce(
    (chartSum, row) =>
      chartSum +
      keys.reduce((rowSum, key) => rowSum + (Number(row[key]) || 0), 0),
    0,
  );

  return rows.map((row) => {
    const percentages = { name: row.name, __exact: {} };
    keys.forEach((key) => {
      const exact = Number(row[key]) || 0;
      percentages[key] = total > 0 ? (exact / total) * 100 : 0;
      percentages.__exact[key] = exact;
    });
    return percentages;
  });
}

const T_CRITICAL_95 = [
  0,
  12.706,
  4.303,
  3.182,
  2.776,
  2.571,
  2.447,
  2.365,
  2.306,
  2.262,
  2.228,
  2.201,
  2.179,
  2.16,
  2.145,
  2.131,
  2.12,
  2.11,
  2.101,
  2.093,
  2.086,
  2.08,
  2.074,
  2.069,
  2.064,
  2.06,
  2.056,
  2.052,
  2.048,
  2.045,
  2.042,
];

const sampleStats = (values) => {
  if (!values.length) return { mean: 0, standardDeviation: 0, ci95: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (values.length === 1) return { mean, standardDeviation: 0, ci95: 0 };

  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  );
  const standardDeviation = Math.sqrt(
    squaredDifferences / (values.length - 1),
  );
  const degreesOfFreedom = values.length - 1;
  const criticalValue =
    T_CRITICAL_95[degreesOfFreedom] ?? (degreesOfFreedom < 60 ? 2 : 1.96);

  return {
    mean,
    standardDeviation,
    ci95: criticalValue * (standardDeviation / Math.sqrt(values.length)),
  };
};

const aggregateCategoryValues = (runs, valueKey) => {
  const names = [
    ...new Set(runs.flatMap((run) => [...run[valueKey].keys()])),
  ];

  return names.map((name) => {
    const exactValues = runs.map((run) => run[valueKey].get(name) || 0);
    const percentageValues = runs.map((run) => {
      const total = [...run[valueKey].values()].reduce(
        (sum, value) => sum + value,
        0,
      );
      return total > 0 ? ((run[valueKey].get(name) || 0) / total) * 100 : 0;
    });
    const exact = sampleStats(exactValues);
    const percentage = sampleStats(percentageValues);

    return {
      name,
      percentage: percentage.mean,
      standardDeviation: percentage.standardDeviation,
      confidenceInterval95: percentage.ci95,
      confidenceInterval95Error: [
        Math.min(percentage.ci95, percentage.mean),
        Math.min(percentage.ci95, 100 - percentage.mean),
      ],
      exactMean: exact.mean,
      exactStandardDeviation: exact.standardDeviation,
      exactConfidenceInterval95: exact.ci95,
    };
  });
};

const valuesByMachine = (chartData, key) =>
  new Map(
    chartData[key].map((row) => [
      row.name,
      chartData.segments.reduce(
        (sum, segment) => sum + (Number(row[segment.key]) || 0),
        0,
      ),
    ]),
  );

export function buildAggregateChartData(entries = []) {
  const completed = entries.filter(
    (entry) => entry.status === "complete" && entry.snapshot,
  );
  const runs = completed.map((entry) => {
    const snapshot = entry.snapshot;
    const tasks = snapshot.results || [];
    const chartData = buildMachineChartData({
      machines: snapshot.machines || [],
      tasks,
      sources: snapshot.iot || [],
    });
    const taskSummary = buildTaskSummary(tasks, snapshot.totalTasks);
    const missedByType = new Map();
    taskSummary.missed.forEach((task) => {
      const type = task.task_type || "Unknown";
      missedByType.set(type, (missedByType.get(type) || 0) + 1);
    });

    return {
      taskCounts: valuesByMachine(chartData, "taskCounts"),
      energy: valuesByMachine(chartData, "energy"),
      cost: valuesByMachine(chartData, "cost"),
      missedByType,
      taskStatus: new Map([
        ["Completed", taskSummary.completed.length],
        ["Missed", taskSummary.missed.length],
        ["Cancelled", taskSummary.cancelled.length],
        ["Unassigned", taskSummary.unassigned.length],
        ["In Progress", taskSummary.inProgress],
      ]),
    };
  });

  return {
    runCount: runs.length,
    taskStatus: aggregateCategoryValues(runs, "taskStatus").filter(
      (row) => row.percentage > 0,
    ),
    taskCounts: aggregateCategoryValues(runs, "taskCounts"),
    energy: aggregateCategoryValues(runs, "energy"),
    cost: aggregateCategoryValues(runs, "cost"),
    missedByType: aggregateCategoryValues(runs, "missedByType").filter(
      (row) => row.percentage > 0,
    ),
  };
}
