import { isConnectedToMachine } from "./connections.js";
import { SCHEDULER_REGISTRY } from "../schedulers/registry.js";
import "../schedulers/FCFS.js";
import "../schedulers/LC.js";
import "../schedulers/RAND.js";
import "../schedulers/URI.js";
import "../schedulers/MEET.js";
import "../schedulers/MECT.js";

const TICK_SECONDS = 0.01;

function numericTime(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class SimulationEngine {
  constructor({
    policyAlias = "FCFS",
    deadlinePolicy = "drop",
    machines = [],
    iot = [],
    tasks = [],
    edges = [],
    nodes = [],
  }) {
    const SchedulerClass = SCHEDULER_REGISTRY[policyAlias];
    if (!SchedulerClass) throw new Error(`Unknown scheduler: ${policyAlias}`);

    this.currentTime = 0;
    this.iot = iot;
    this.edges = edges;
    this.nodes = nodes;
    this.machines = machines.map((machine) => ({
      ...machine,
      utilization_time: 0,
      total_cost: 0,
      total_tasks: 0,
      queue: [],
    }));
    this.totalTasks = tasks.length;

    this.scheduler = new SchedulerClass({
      machines: this.machines,
      iot: this.iot,
      enqueue: (machineId, task) => this.enqueue(machineId, task),
      dequeue: (machineId) => this.dequeue(machineId),
      isNeighbors: (sourceId, machineId) =>
        isConnectedToMachine(
          sourceId,
          machineId,
          this.edges,
          this.nodes,
        ),
      config: { deadlinePolicy },
    });
    this.scheduler.setMachines(this.machines);
    this.scheduler.setIot(this.iot);
    tasks.forEach((task) => this.scheduler.addTask({ ...task }));
  }

  enqueue(machineId, task) {
    const machine = this.machines.find(
      (candidate) => String(candidate.id) === String(machineId),
    );
    if (machine) machine.queue.push(task);
  }

  dequeue(machineId) {
    const machine = this.machines.find(
      (candidate) => String(candidate.id) === String(machineId),
    );
    if (!machine) return;

    const stats = this.scheduler.getMachineStats().get(machine.id);
    machine.utilization_time = stats?.utilization_time || 0;
    machine.total_tasks = stats?.total_tasks || 0;
    machine.total_cost =
      (Number(machine.price) || 0) * machine.utilization_time * 3600;
    machine.queue.shift();
  }

  step() {
    if (this.isComplete()) return this.getSnapshot();
    this.currentTime = Number((this.currentTime + TICK_SECONDS).toFixed(3));
    this.scheduler.setTime(this.currentTime);
    this.scheduler.setMachines(this.machines);
    this.scheduler.setIot(this.iot);
    this.scheduler.schedule();
    this.scheduler.processMachines();
    return this.getSnapshot();
  }

  advanceTo(targetTime) {
    const target = Math.max(this.currentTime, numericTime(targetTime));
    while (this.currentTime + TICK_SECONDS / 2 < target && !this.isComplete()) {
      this.step();
    }
    return this.getSnapshot();
  }

  isComplete() {
    if (this.totalTasks === 0) return true;
    const stats = this.scheduler.getStats();
    return stats.completed.length + stats.missed.length >= this.totalTasks;
  }

  getSnapshot() {
    const stats = this.scheduler.getStats();
    const unassigned = this.scheduler
      .getBatchQ()
      .filter((task) => task.status === "NEW");
    const completed = [...stats.completed];
    const missed = [...stats.missed];
    return {
      time: this.currentTime,
      machines: this.machines,
      completed,
      missed,
      unassigned,
      results: [...unassigned, ...completed, ...missed],
      totalTasks: this.totalTasks,
      complete: this.isComplete(),
    };
  }
}

export { TICK_SECONDS };
