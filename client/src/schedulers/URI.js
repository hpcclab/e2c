import { BaseScheduler } from "./BaseScheduler";
import { registerScheduler } from "./registry";
export class URI extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "URI";
    this.prev_assignment_idx = -1;

    this.machineQ = [];
    this.hashMap = {};
    this.hasHashed = false;
  }

  hashTasks() {
    const hashkey = 37;

    // Collect unique task types from the batch queue
    const taskTypes = new Set(this.batchQueue.map((task) => task.task_type));

    for (const taskType of taskTypes) {
      let sum = 0;

      for (const char of taskType) {
        sum += char.charCodeAt(0);
      }

      const index = (sum * hashkey) % this.machines.length;
      this.hashMap[taskType] = index;
    }

    this.hasHashed = true;
  }

  schedule() {
    if (!this.batchQueue.length && !this.unmappedTask.length) {
      return null;
    }

    if (!this.unmappedTask.length) {
      if (!this.batchQueue.length) return null;

      const nextTask = this.batchQueue[0];
      if (!nextTask) return null;

      if (nextTask.arrival_time > this.getTime()) {
        return null;
      }

      if (!this.hasHashed && this.batchQueue.length > 0) {
        this.hashTasks();
      }

      const currTask = this.choose();
      const machineIdx = this.hashMap[currTask.task_type];

      // attach metadata to task (like Python setattr)
      this.unmappedTask[this.unmappedTask.length - 1]._uri_machine_idx =
        machineIdx;
    }

    const task = this.unmappedTask[this.unmappedTask.length - 1];
    const machineIdx = task?._uri_machine_idx ?? 0;

    const machine = this.machines[machineIdx];
    if (!machine) return null;

    this.map(machine);
    return machine;
  }
}
registerScheduler("URI", URI);
