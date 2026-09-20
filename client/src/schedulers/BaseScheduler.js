import {
  getMachineEetMean,
  getMachineEetStdDev,
  sampleExecutionTime,
} from "../utils/executionTime.js";

export class BaseScheduler {
  constructor({ machines, iot, enqueue, dequeue, isNeighbors, config }) {
    this.machines = [];
    this.iot = [];
    this.enqueue = enqueue;
    this.dequeue = dequeue;
    this.isNeighbors = isNeighbors;

    this.config = config;
    this.maxQueueSize = config?.maxQueueSize ?? 2; // cap max Q at  per machine
    this.random = config?.random ?? Math.random;
    this.task_counter = 0;
    this.totalTasks = 0;

    this.batchQueue = [];
    this.unmappedTask = [];
    this.currentTime = 0;

    this.stats = {
      mapped: [],
      missed: [],
      completed: [],
    };

    this.machineStats = new Map(); // machineId -> { utilization_time, total_tasks }
  }

  setTime(t) {
    this.currentTime = t;
  }

  setMachines(machines) {
    this.machines = machines;
  }
  setIot(iot) {
    this.iot = iot;
  }

  addTask(task) {
    this.totalTasks = this.totalTasks + 1;
    this.batchQueue.push(task);
  }

  clearBatchQ() {
    // defacto "reset scheduler"
    this.batchQueue = [];
    this.totalTasks = 0;
    this.task_counter = 0;
    this.unmappedTask = [];
    this.currentTime = 0;

    this.stats = {
      mapped: [],
      missed: [],
      completed: [],
    };
    this.machineStats = new Map(); // machineId -> { utilization_time, total_tasks }
  }

  getTotalTasks() {
    return this.totalTasks;
  }
  getBatchQ() {
    return this.batchQueue;
  }

  getTime() {
    return this.currentTime;
  }
  getStats() {
    return this.stats;
  }

  choose() {
    const task = this.batchQueue.shift();
    if (task) {
      this.unmappedTask.push(task);
    }
    this.task_counter += 1;
    task.id = this.task_counter;
    return task;
  }

  getTaskSource(task) {
    if (!task) return null;
    if (task.source_id !== undefined && task.source_id !== null) {
      return this.iot.find((source) => String(source.id) === String(task.source_id));
    }
    return this.iot.find(
      (source) => source.properties?.task_type === task.task_type,
    );
  }

  getEligibleMachines(task) {
    const source = this.getTaskSource(task);
    if (!source) return [];
    return this.machines.filter((machine) =>
      this.isNeighbors(`nd_${source.id}`, machine.id),
    );
  }

  map(machine) {
    const task = this.unmappedTask.pop();
    if (!task || !machine) return;
    // Queue capacity enforcement
    const currentQueueSize = machine.queue?.length || 0;

    if (currentQueueSize >= this.maxQueueSize) {
      // Put task back since machine is full
      this.unmappedTask.push(task);
      return null;
    }
    const iotSrc = this.getTaskSource(task);
    if (!iotSrc) {
      this.unmappedTask.push(task);
      return;
    }

    if (!this.isNeighbors(`nd_${iotSrc.id}`, machine.id)) {
      this.unmappedTask.push(task);
      return;
    }

    // Assign execution metadata
    task.start_time = currentQueueSize === 0 ? Number(this.getTime().toFixed(3)) : null;
    task.assigned_machine = machine.name;

    task.execution_time = sampleExecutionTime(
      getMachineEetMean(machine, iotSrc.id, task.task_type),
      getMachineEetStdDev(machine, iotSrc.id, task.task_type),
      this.random,
    );
    task.end_time = task.start_time === null
      ? null
      : Number((task.start_time + task.execution_time).toFixed(3));

    this.enqueue(machine.id, task);
    this.stats.mapped.push(task);
  }

  processMachines() {
    const now = this.getTime();
    this.unmappedTask = this.unmappedTask.filter((task) => {
      const deadline = Number(task.deadline);
      if (!Number.isFinite(deadline) || now < deadline) return true;
      task.status = "MISSED";
      this.stats.missed.push(task);
      return false;
    });

    for (let m of this.machines) {
      if (!m.queue?.length) continue;

      let task = m.queue[0];
      if (task.start_time === null || task.start_time === undefined) {
        if (now >= task.deadline) {
          task.start_time = Number(task.arrival_time);
          task.status = "MISSED";
          this.stats.missed.push(task);
          this.dequeue(m.id);
          continue;
        }
        task.start_time = Number(now.toFixed(3));
      }

      const executionTime = task.execution_time ?? getMachineEetMean(
        m,
        this.getTaskSource(task)?.id,
        task.task_type,
      );
      task.execution_time = executionTime;
      const expectedEnd = task.start_time + executionTime;
      task.end_time = Number(expectedEnd.toFixed(3));
      if (now >= expectedEnd && expectedEnd <= task.deadline) {
        task.status = "COMPLETED";
        this.stats.completed.push(task);
        const prev = this.machineStats.get(m.id) ?? {
          utilization_time: 0,
          total_tasks: 0,
        };
        this.machineStats.set(m.id, {
          utilization_time:
            prev.utilization_time + (task.execution_time || 0) / 3600,
          total_tasks: prev.total_tasks + 1,
        });
        this.dequeue(m.id);
      } else if (now >= task.deadline) {
        task.status = "MISSED";
        this.stats.missed.push(task);
        this.dequeue(m.id);
      }
    }
  }

  getMachineStats() {
    return this.machineStats;
  }
}
