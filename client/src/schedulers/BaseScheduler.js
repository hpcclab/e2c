export class BaseScheduler {
  constructor({ machines, iot, enqueue, dequeue, isNeighbors, config }) {
    this.machines = [];
    this.iot = [];
    this.enqueue = enqueue;
    this.dequeue = dequeue;
    this.isNeighbors = isNeighbors;

    this.config = config;
    this.task_counter = 0;

    this.batchQueue = [];
    this.unmappedTask = [];
    this.currentTime = 0;

    this.stats = {
      mapped: [],
      missed: [],
      completed: [],
    };
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
    this.batchQueue.push(task);
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

    const iotIndex = this.iot.findIndex(
      (m) => m.properties?.task_type === task.task_type,
    );

    const iotSrc = this.iot[iotIndex];
    if (!iotSrc) return;

    if (!this.isNeighbors(`nd_${iotSrc.id}`, machine.id)) {
      this.unmappedTask.push(task);
      return;
    }

    // Assign execution metadata (pure, no time mutation)
    task.start_time = Number(this.getTime().toFixed(3));
    task.assigned_machine = machine.name;

    const eet = machine.eet?.[task.task_type];
    if (eet != null) {
      task.execution_time = Number(eet);
      task.end_time = Number(
        (task.start_time + task.execution_time).toFixed(3),
      );
    }

    this.enqueue(machine.id, task);
    this.stats.mapped.push(task);
    console.log(this.stats);
  }

  processMachines() {
    for (let m of this.machines) {
      if (!m.queue?.length) continue;

      let task = m.queue[0];
      const eet = m.eet?.[task.task_type];

      // If no execution time defined, skip safely
      if (eet == null) continue;

      const life = this.getTime() - task.start_time;
      if (life >= task.deadline) {
        task.status = "MISSED";
        this.stats.missed.push(task);
        this.dequeue(m.id);
      } else if (life >= eet && life < task.deadline) {
        task.status = "COMPLETED";
        this.stats.completed.push(task);
        this.dequeue(m.id);
      }
    }
  }
}
