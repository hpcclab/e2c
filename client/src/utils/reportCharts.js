import { getTaskColor } from "./taskColors.js";

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
      };
      current.count += 1;
      current.runtimeSeconds += actualTaskRuntime(task);
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
    const totalEnergy =
      ((Number(machine.power) || 0) *
        (Number(machine.utilization_time) || 0)) /
      1000;
    const totalCost =
      (Number(machine.price) || 0) *
      (Number(machine.utilization_time) || 0) *
      3600;

    segments.forEach(({ key }) => {
      const values = bySource.get(key) ?? { count: 0, runtimeSeconds: 0 };
      const share = totalRuntime > 0
        ? values.runtimeSeconds / totalRuntime
        : assignedTasks.length > 0
          ? values.count / assignedTasks.length
          : 0;

      taskRow[key] = values.count;
      energyRow[key] = totalEnergy * share;
      costRow[key] = totalCost * share;
    });

    taskCounts.push(taskRow);
    energy.push(energyRow);
    cost.push(costRow);
  });

  return { segments, taskCounts, energy, cost };
}
