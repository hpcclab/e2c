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
  SCHEDULING_MODES,
  normalizeBatchIntervalSeconds,
  normalizeMachineQueueLimit,
  normalizeMachineQueueLimits,
  normalizeSchedulingPolicyAlias,
  normalizeSchedulingMode,
} from "./scheduling.js";
import {
  getSourceLoadBalancerId,
  isConnectedThroughLoadBalancer,
} from "./loadBalancers.js";

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
    this.batchIntervalSeconds = normalizeBatchIntervalSeconds(
      batchIntervalSeconds,
    );
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
    const loadBalancerNodes = this.nodes.filter(
      (node) => node.type === "LBNode",
    );
    this.schedulerContexts = loadBalancerNodes.map((node) =>
      this.createSchedulerContext({
        id: String(node.id),
        policyAlias: node.data?.policyAlias ?? this.policyAlias,
        deadlinePolicy: node.data?.deadlinePolicy ?? deadlinePolicy,
        schedulingMode: node.data?.schedulingMode ?? this.schedulingMode,
        batchIntervalSeconds:
          node.data?.batchIntervalSeconds ?? this.batchIntervalSeconds,
        machineQueueLimits: node.data?.machineQueueLimits,
        machineQueueLimit: node.data?.machineQueueLimit,
        random: simulationRandom,
      }),
    );
    this.defaultSchedulerContext = this.createSchedulerContext({
      id: null,
      policyAlias: this.policyAlias,
      deadlinePolicy,
      schedulingMode: this.schedulingMode,
      batchIntervalSeconds: this.batchIntervalSeconds,
      machineQueueLimits: {},
      machineQueueLimit: null,
      random: simulationRandom,
    });
    this.schedulerContexts.push(this.defaultSchedulerContext);
    this.scheduler =
      (loadBalancerNodes.length
        ? this.schedulerContexts[0]
        : this.defaultSchedulerContext
      ).scheduler;
    this.pendingGeneration = tasks
      .map((task, index) => ({
        task: {
          ...task,
          load_balancer_id:
            task.load_balancer_id ??
            getSourceLoadBalancerId(
              `nd_${task.source_id}`,
              this.edges,
              this.nodes,
            ),
        },
        index,
      }))
      .sort(
        (a, b) =>
          numericTime(a.task.generation_time) -
            numericTime(b.task.generation_time) || a.index - b.index,
      )
      .map(({ task, index }) => ({ ...task, id: task.id ?? index + 1 }));
    this.releaseGeneratedTasks();
    this.failImpossibleFutureTasks();
  }

  createSchedulerContext({
    id,
    policyAlias,
    deadlinePolicy,
    schedulingMode,
    batchIntervalSeconds,
    machineQueueLimits,
    machineQueueLimit,
    random,
  }) {
    const normalizedMode = normalizeSchedulingMode(schedulingMode);
    const normalizedPolicy = normalizeSchedulingPolicyAlias(
      policyAlias,
      normalizedMode,
    );
    const SchedulerClass = SCHEDULER_REGISTRY[normalizedPolicy];
    if (!SchedulerClass) throw new Error(`Unknown scheduler: ${normalizedPolicy}`);
    const interval = normalizeBatchIntervalSeconds(batchIntervalSeconds);
    const normalizedMachineQueueLimits =
      normalizedMode === SCHEDULING_MODES.PERIODIC_BATCH
        ? normalizeMachineQueueLimits(machineQueueLimits)
        : {};
    const scheduler = new SchedulerClass({
      machines: this.machines,
      iot: this.iot,
      enqueue: (machineId, task) => this.enqueue(machineId, task),
      dequeue: (machineId) => this.dequeue(machineId),
      isNeighbors: (sourceId, machineId) =>
        id === null
          ? isConnectedToMachine(
              sourceId,
              machineId,
              this.edges,
              this.nodes,
            )
          : isConnectedThroughLoadBalancer(
              sourceId,
              machineId,
              id,
              this.edges,
              this.nodes,
            ),
      config: {
        deadlinePolicy,
        random,
        schedulingMode: normalizedMode,
        schedulerId: id,
        machineQueueLimits: normalizedMachineQueueLimits,
        maxQueueSize:
          normalizedMode === SCHEDULING_MODES.PERIODIC_BATCH
            ? normalizeMachineQueueLimit(machineQueueLimit)
            : null,
      },
    });
    scheduler.setMachines(this.machines);
    scheduler.setIot(this.iot);
    return {
      id,
      scheduler,
      policyAlias: normalizedPolicy,
      deadlinePolicy: deadlinePolicy === "continue" ? "continue" : "drop",
      schedulingMode: normalizedMode,
      batchIntervalSeconds: interval,
      machineQueueLimits: normalizedMachineQueueLimits,
      machineQueueLimit:
        normalizedMode === SCHEDULING_MODES.PERIODIC_BATCH
          ? normalizeMachineQueueLimit(machineQueueLimit)
          : null,
      batchNumber: 0,
      nextBatchTime: interval,
    };
  }

  getSchedulerContext(task) {
    const loadBalancerId = task?.load_balancer_id ?? null;
    if (loadBalancerId === null) return this.defaultSchedulerContext;
    return (
      this.schedulerContexts.find(
        (context) =>
          context.id !== null &&
          String(context.id) === String(loadBalancerId),
      ) ?? this.defaultSchedulerContext
    );
  }

  getCombinedStats() {
    return this.schedulerContexts.reduce(
      (combined, { scheduler }) => {
        const stats = scheduler.getStats();
        combined.mapped.push(...stats.mapped);
        combined.missed.push(...stats.missed);
        combined.completed.push(...stats.completed);
        return combined;
      },
      { mapped: [], missed: [], completed: [] },
    );
  }

  syncMachineStats() {
    this.machines.forEach((machine) => {
      const aggregate = this.schedulerContexts.reduce(
        (stats, { scheduler }) => {
          const current = scheduler.getMachineStats().get(machine.id);
          stats.utilization_time += current?.utilization_time || 0;
          stats.total_tasks += current?.total_tasks || 0;
          return stats;
        },
        { utilization_time: 0, total_tasks: 0 },
      );
      machine.utilization_time = aggregate.utilization_time;
      machine.total_tasks = aggregate.total_tasks;
      machine.total_cost =
        (Number(machine.price) || 0) * aggregate.utilization_time * 3600;
    });
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
      this.getSchedulerContext(task).scheduler.addTask(task);
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

    const pendingByContext = new Map(
      this.schedulerContexts.map((context) => [context, []]),
    );
    this.pendingGeneration.forEach((task) => {
      pendingByContext.get(this.getSchedulerContext(task)).push(task);
    });
    this.pendingGeneration = this.schedulerContexts.flatMap((context) =>
      context.scheduler.failBatteryBlockedTasks(
        pendingByContext.get(context) || [],
      ),
    );
    this.pendingGeneration.sort(
      (first, second) =>
        numericTime(first.generation_time) - numericTime(second.generation_time) ||
        Number(first.id || 0) - Number(second.id || 0),
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

    machine.queue.shift();
  }

  sortWaitingTasks(context) {
    context.scheduler.batchQueue.sort(
      (first, second) =>
        numericTime(first.arrival_time) - numericTime(second.arrival_time) ||
        numericTime(first.generation_time) - numericTime(second.generation_time) ||
        Number(first.id || 0) - Number(second.id || 0),
    );
  }

  dispatchPeriodicBatch(context) {
    if (this.currentTime + Number.EPSILON < context.nextBatchTime) return;

    context.batchNumber += 1;
    const releaseTime = Number(this.currentTime.toFixed(3));
    context.scheduler.setBatchDispatch({
      batchNumber: context.batchNumber,
      releaseTime,
    });
    this.sortWaitingTasks(context);

    context.scheduler.scheduleBatch();

    context.scheduler.setBatchDispatch(null);
    context.nextBatchTime = Number(
      (
        (context.batchNumber + 1) * context.batchIntervalSeconds
      ).toFixed(3),
    );
  }

  step() {
    if (this.isComplete()) return this.getSnapshot();
    this.currentTime = Number((this.currentTime + TICK_SECONDS).toFixed(3));
    this.releaseGeneratedTasks();
    this.schedulerContexts.forEach((context) => {
      context.scheduler.setTime(this.currentTime);
      context.scheduler.setMachines(this.machines);
      context.scheduler.setIot(this.iot);
      context.scheduler.expireWaitingTasks();
      if (context.schedulingMode === SCHEDULING_MODES.PERIODIC_BATCH) {
        this.dispatchPeriodicBatch(context);
      } else {
        this.sortWaitingTasks(context);
        context.scheduler.schedule();
      }
    });
    this.schedulerContexts.forEach((context) =>
      context.scheduler.processMachines(),
    );
    this.syncMachineStats();
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
    const stats = this.getCombinedStats();
    return (
      stats.completed.length +
        stats.missed.length +
        this.sourceFailures.length >=
      this.totalTasks
    );
  }

  getSnapshot() {
    const stats = this.getCombinedStats();
    const waitingTasks = this.schedulerContexts.flatMap(({ scheduler }) => [
      ...scheduler.getBatchQ(),
      ...scheduler.unmappedTask,
    ]);
    const unassigned = waitingTasks.map((task) => ({
      ...task,
      status:
        numericTime(task.arrival_time) > this.currentTime
          ? "IN_TRANSIT"
          : this.getSchedulerContext(task).schedulingMode ===
                SCHEDULING_MODES.PERIODIC_BATCH
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
          ? this.defaultSchedulerContext.nextBatchTime
          : null,
      loadBalancerSettings: this.schedulerContexts
        .filter((context) => context.id !== null)
        .map((context) => ({
          id: context.id,
          policyAlias: context.policyAlias,
          deadlinePolicy: context.deadlinePolicy,
          schedulingMode: context.schedulingMode,
          batchIntervalSeconds: context.batchIntervalSeconds,
          nextBatchTime: context.nextBatchTime,
        })),
      complete: this.isComplete(),
    };
  }
}

export { TICK_SECONDS };
