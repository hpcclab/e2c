export class BaseScheduler {
  constructor({ machines, iot, enqueue, dequeue, isNeighbors, config }) {
    this.machines = [];
    this.iot = [];
    this.enqueue = enqueue;
    this.dequeue = dequeue;
    this.isNeighbors = isNeighbors;

    this.config = config;
    this.maxQueueSize = config?.maxQueueSize ?? 2; // cap max Q at  per machine
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
    const iotIndex = this.iot.findIndex(
      (m) => m.properties?.task_type === task.task_type,
    );

    const iotSrc = this.iot[iotIndex];
    if (!iotSrc) return;

    if (!this.isNeighbors(`nd_${iotSrc.id}`, machine.id)) {
      this.unmappedTask.push(task);
      return;
    }

    // Assign execution metadata
    task.start_time = Number(this.getTime().toFixed(3));
    task.assigned_machine = machine.name;

    // If no execution time defined, assume default of 1 ms
    const eet = machine.eet?.[task.task_type] || 1;

    if (eet != null) {
      task.execution_time = Number(eet);
      // console.log(task.execution_time);
      task.end_time = Number(
        (task.start_time + task.execution_time).toFixed(3),
      );
    }

    this.enqueue(machine.id, task);
    this.stats.mapped.push(task);
  }

  processMachines() {
    for (let m of this.machines) {
      if (!m.queue?.length) continue;

      let task = m.queue[0];
      // If no execution time defined, assume default of 1 ms
      const eet = m.eet?.[task.task_type] || 1;
      if (eet == null) continue;

      const life = this.getTime() - task.start_time;
      if (life >= task.deadline) {
        task.status = "MISSED";
        this.stats.missed.push(task);
        this.dequeue(m.id);
      }
      if (life >= eet && life < task.deadline) {
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
      }
    }
  }

  getMachineStats() {
    return this.machineStats;
  }
}
