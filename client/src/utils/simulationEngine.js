import { isConnectedToMachine } from "./connections.js";
import { SCHEDULER_REGISTRY } from "../schedulers/registry.js";
import "../schedulers/FCFS.js";
import "../schedulers/LC.js";
import "../schedulers/RAND.js";
import "../schedulers/URI.js";
import "../schedulers/MEET.js";
import "../schedulers/MECT.js";
import "../schedulers/MM.js";
import "../schedulers/MMU.js";
import "../schedulers/MSD.js";
import {
  ENERGY_FAILURE_REASONS,
  batteryCapacityJ,
  canSpendBattery,
  exhaustBattery,
  isBatteryPowered,
  networkTransferEnergyJ,
  sourceGenerationEnergyJ,
  sourceTaskEnergyJ,
} from "./energy.js";
import { createRandomGenerator } from "./randomSeed.js";
import {
  DEFAULT_MACHINE_QUEUE_LIMIT,
  SCHEDULING_MODES,
  normalizeBatchIntervalSeconds,
  normalizeSchedulingPolicyAlias,
  normalizeSchedulingMode,
} from "./scheduling.js";

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
    random,
    simulationSeed = "",
    schedulingMode = SCHEDULING_MODES.IMMEDIATE,
    batchIntervalSeconds,
  }) {
    this.currentTime = 0;
    this.schedulingMode = normalizeSchedulingMode(schedulingMode);
    this.policyAlias = normalizeSchedulingPolicyAlias(
      policyAlias,
      this.schedulingMode,
    );
    const SchedulerClass = SCHEDULER_REGISTRY[this.policyAlias];
    if (!SchedulerClass) throw new Error(`Unknown scheduler: ${this.policyAlias}`);
    this.batchIntervalSeconds = normalizeBatchIntervalSeconds(
      batchIntervalSeconds,
    );
    this.batchNumber = 0;
    this.nextBatchTime = this.batchIntervalSeconds;
    this.iot = iot.map((source) => {
      if (!isBatteryPowered(source)) {
        return {
          ...source,
          properties: { ...source.properties, energyConsumedJ: 0 },
        };
      }
      const capacity = batteryCapacityJ(source);
      return {
        ...source,
        properties: {
          ...source.properties,
          batteryCapacityJ: capacity,
          batteryRemainingJ: capacity,
          energyConsumedJ: 0,
        },
      };
    });
    this.edges = edges;
    this.nodes = nodes;
    this.machines = machines.map((machine) => {
      const normalized = {
        ...machine,
        utilization_time: 0,
        total_cost: 0,
        total_tasks: 0,
        energyConsumedJ: 0,
        queue: [],
      };
      if (!isBatteryPowered(normalized)) return normalized;
      const capacity = batteryCapacityJ(normalized);
      return {
        ...normalized,
        batteryCapacityJ: capacity,
        batteryRemainingJ: capacity,
      };
    });
    this.totalTasks = tasks.length;
    this.sourceFailures = [];

    const simulationRandom =
      random ?? createRandomGenerator(simulationSeed, "runtime-and-scheduling");
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
      config: {
        deadlinePolicy,
        random: simulationRandom,
        schedulingMode: this.schedulingMode,
        maxQueueSize: DEFAULT_MACHINE_QUEUE_LIMIT,
      },
    });
    this.scheduler.setMachines(this.machines);
    this.scheduler.setIot(this.iot);
    this.pendingGeneration = tasks
      .map((task, index) => ({ task: { ...task }, index }))
      .sort(
        (a, b) =>
          numericTime(a.task.generation_time) -
            numericTime(b.task.generation_time) || a.index - b.index,
      )
      .map(({ task, index }) => ({ ...task, id: task.id ?? index + 1 }));
    this.releaseGeneratedTasks();
    this.failImpossibleFutureTasks();
  }

  failSourceTask(task) {
    task.status = "NOT_GENERATED";
    task.failure_reason = ENERGY_FAILURE_REASONS.IOT_BATTERY_DEPLETED;
    task.assigned_machine = null;
    task.start_time = null;
    task.end_time = null;
    task.execution_time = null;
    this.sourceFailures.push(task);
  }

  releaseGeneratedTasks() {
    const futureTasks = [];

    this.pendingGeneration.forEach((task) => {
      const generationTime = numericTime(task.generation_time);
      if (generationTime > this.currentTime + Number.EPSILON) {
        futureTasks.push(task);
        return;
      }

      const source = this.iot.find(
        (candidate) => String(candidate.id) === String(task.source_id),
      );
      const energyJ = sourceTaskEnergyJ(source, task);
      if (
        source &&
        isBatteryPowered(source) &&
        !canSpendBattery(source, energyJ)
      ) {
        exhaustBattery(source);
        this.failSourceTask(task);
        return;
      }

      if (source) {
        if (isBatteryPowered(source)) {
          const remaining = Math.max(
            0,
            Number(source.properties.batteryRemainingJ) - energyJ,
          );
          source.properties.batteryRemainingJ = Number(remaining.toFixed(6));
        }
        source.properties.energyConsumedJ = Number(
          (
            (Number(source.properties.energyConsumedJ) || 0) + energyJ
          ).toFixed(6),
        );
        task.generation_energy_j = Number(
          sourceGenerationEnergyJ(source, task).toFixed(9),
        );
        task.network_energy_j = Number(
          networkTransferEnergyJ(task).toFixed(9),
        );
        task.source_energy_j = Number(energyJ.toFixed(9));
      }

      task.status = "NEW";
      this.scheduler.addTask(task);
    });

    this.pendingGeneration = futureTasks;
  }

  failImpossibleFutureTasks() {
    this.pendingGeneration = this.pendingGeneration.filter((task) => {
      const source = this.iot.find(
        (candidate) => String(candidate.id) === String(task.source_id),
      );
      if (
        !source ||
        !isBatteryPowered(source) ||
        canSpendBattery(source, sourceTaskEnergyJ(source, task))
      ) {
        return true;
      }
      exhaustBattery(source);
      this.failSourceTask(task);
      return false;
    });

    this.pendingGeneration = this.scheduler.failBatteryBlockedTasks(
      this.pendingGeneration,
    );
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

  sortWaitingTasks() {
    this.scheduler.batchQueue.sort(
      (first, second) =>
        numericTime(first.arrival_time) - numericTime(second.arrival_time) ||
        numericTime(first.generation_time) - numericTime(second.generation_time) ||
        Number(first.id || 0) - Number(second.id || 0),
    );
  }

  dispatchPeriodicBatch() {
    if (this.currentTime + Number.EPSILON < this.nextBatchTime) return;

    this.batchNumber += 1;
    const releaseTime = Number(this.currentTime.toFixed(3));
    this.scheduler.setBatchDispatch({
      batchNumber: this.batchNumber,
      releaseTime,
    });
    this.sortWaitingTasks();

    this.scheduler.scheduleBatch();

    this.scheduler.setBatchDispatch(null);
    this.nextBatchTime = Number(
      ((this.batchNumber + 1) * this.batchIntervalSeconds).toFixed(3),
    );
  }

  step() {
    if (this.isComplete()) return this.getSnapshot();
    this.currentTime = Number((this.currentTime + TICK_SECONDS).toFixed(3));
    this.releaseGeneratedTasks();
    this.scheduler.setTime(this.currentTime);
    this.scheduler.setMachines(this.machines);
    this.scheduler.setIot(this.iot);
    this.scheduler.expireWaitingTasks();
    if (this.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH) {
      this.dispatchPeriodicBatch();
    } else {
      this.sortWaitingTasks();
      this.scheduler.schedule();
    }
    this.scheduler.processMachines();
    this.failImpossibleFutureTasks();
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
    return (
      stats.completed.length +
        stats.missed.length +
        this.sourceFailures.length >=
      this.totalTasks
    );
  }

  getSnapshot() {
    const stats = this.scheduler.getStats();
    const waitingTasks = [
      ...this.scheduler.getBatchQ(),
      ...this.scheduler.unmappedTask,
    ];
    const unassigned = waitingTasks.map((task) => ({
      ...task,
      status:
        numericTime(task.arrival_time) > this.currentTime
          ? "IN_TRANSIT"
          : this.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH
            ? "WAITING_FOR_BATCH"
            : "NEW",
      start_time: null,
      end_time: null,
    }));
    const pendingGeneration = this.pendingGeneration.map((task) => ({
      ...task,
      status: "PENDING_GENERATION",
      start_time: null,
      end_time: null,
    }));
    const completed = [...stats.completed];
    const missed = [...stats.missed, ...this.sourceFailures];
    return {
      time: this.currentTime,
      machines: this.machines,
      iot: this.iot,
      edges: this.edges,
      completed,
      missed,
      unassigned,
      results: [...pendingGeneration, ...unassigned, ...completed, ...missed],
      totalTasks: this.totalTasks,
      schedulingMode: this.schedulingMode,
      batchIntervalSeconds:
        this.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH
          ? this.batchIntervalSeconds
          : null,
      nextBatchTime:
        this.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH
          ? this.nextBatchTime
          : null,
      complete: this.isComplete(),
    };
  }
}

export { TICK_SECONDS };
