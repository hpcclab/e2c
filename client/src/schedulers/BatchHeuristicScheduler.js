import { BaseScheduler } from "./BaseScheduler.js";
import { getMachineEetMean } from "../utils/executionTime.js";

const finiteOrInfinity = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : Infinity;
};

const taskOrder = (task) => {
  const numericId = Number(task?.id);
  return Number.isFinite(numericId) ? numericId : Number.MAX_SAFE_INTEGER;
};

export class BatchHeuristicScheduler extends BaseScheduler {
  schedule() {
    return this.scheduleBatch()[0] ?? null;
  }

  expectedExecutionTime(task, machine) {
    return getMachineEetMean(
      machine,
      this.getTaskSource(task)?.id,
      task.task_type,
    );
  }

  machineReadyTime(machine) {
    return (machine.queue || []).reduce((readyTime, task, index) => {
      const executionTime =
        Number(task.execution_time) || this.expectedExecutionTime(task, machine);
      if (index !== 0 || task.start_time === null || task.start_time === undefined) {
        return readyTime + executionTime;
      }

      const expectedEnd = Number(task.end_time);
      if (Number.isFinite(expectedEnd)) {
        return readyTime + Math.max(0, expectedEnd - this.getTime());
      }
      return (
        readyTime +
        Math.max(0, executionTime - (this.getTime() - Number(task.start_time)))
      );
    }, this.getTime());
  }

  compareCandidates(first, second) {
    return (
      first.completionTime - second.completionTime ||
      taskOrder(first.task) - taskOrder(second.task)
    );
  }

  selectCandidate(candidates) {
    return [...candidates].sort((first, second) =>
      this.compareCandidates(first, second),
    )[0];
  }

  buildCandidate(task, machine, machineReadyTimes) {
    const executionTime = this.expectedExecutionTime(task, machine);
    return {
      task,
      machine,
      executionTime,
      completionTime: machineReadyTimes.get(machine.id) + executionTime,
      deadline: finiteOrInfinity(task.deadline),
    };
  }

  scheduleBatch() {
    const arrivedTasks = [
      ...this.unmappedTask,
      ...this.batchQueue.filter(
        (task) => Number(task.arrival_time) <= this.getTime() + Number.EPSILON,
      ),
    ];
    const futureTasks = this.batchQueue.filter(
      (task) => Number(task.arrival_time) > this.getTime() + Number.EPSILON,
    );
    this.unmappedTask = [];
    this.batchQueue = futureTasks;
    if (!arrivedTasks.length) return [];

    const remainingTasks = [...arrivedTasks];
    const machineReadyTimes = new Map(
      this.machines.map((machine) => [
        machine.id,
        this.machineReadyTime(machine),
      ]),
    );
    const provisionalCounts = new Map(
      this.machines.map((machine) => [machine.id, 0]),
    );
    const assignments = [];

    while (remainingTasks.length > 0) {
      const candidates = remainingTasks.flatMap((task) => {
        const eligibleMachines = this.getEligibleMachines(task).filter(
          (machine) =>
            (machine.queue?.length || 0) +
              (provisionalCounts.get(machine.id) || 0) <
            this.maxQueueSize,
        );
        if (!eligibleMachines.length) return [];

        const minimumCompletion = eligibleMachines
          .map((machine) =>
            this.buildCandidate(task, machine, machineReadyTimes),
          )
          .sort(
            (first, second) =>
              first.completionTime - second.completionTime ||
              String(first.machine.id).localeCompare(String(second.machine.id)),
          )[0];
        return [minimumCompletion];
      });
      if (!candidates.length) break;

      const selected = this.selectCandidate(candidates);
      assignments.push(selected);
      machineReadyTimes.set(selected.machine.id, selected.completionTime);
      provisionalCounts.set(
        selected.machine.id,
        (provisionalCounts.get(selected.machine.id) || 0) + 1,
      );
      remainingTasks.splice(remainingTasks.indexOf(selected.task), 1);
    }

    const mappedTasks = new Set();
    const mappedMachines = [];
    assignments.forEach(({ task, machine }) => {
      const mappedBefore = this.stats.mapped.length;
      this.unmappedTask = [task];
      this.map(machine);
      const mapped = this.stats.mapped.length > mappedBefore;
      this.unmappedTask = [];
      if (mapped) {
        mappedTasks.add(task);
        mappedMachines.push(machine);
      }
    });

    this.batchQueue.push(
      ...arrivedTasks.filter((task) => !mappedTasks.has(task)),
    );
    return mappedMachines;
  }
}

export const compareByUrgency = (first, second) =>
  first.deadline - first.completionTime -
    (second.deadline - second.completionTime) ||
  first.completionTime - second.completionTime ||
  taskOrder(first.task) - taskOrder(second.task);

export const compareByDeadline = (first, second) =>
  first.deadline - second.deadline ||
  first.completionTime - second.completionTime ||
  taskOrder(first.task) - taskOrder(second.task);
