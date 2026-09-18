import { BaseScheduler } from "./BaseScheduler.js";
import { registerScheduler } from "./registry.js";
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

      this.hashMap[taskType] = sum * hashkey;
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
      const machineHash = this.hashMap[currTask.task_type];

      // attach metadata to task (like Python setattr)
      this.unmappedTask[this.unmappedTask.length - 1]._uri_machine_hash =
        machineHash;
    }

    const task = this.unmappedTask[this.unmappedTask.length - 1];
    const machines = this.getEligibleMachines(task);
    const machineHash = task?._uri_machine_hash ?? 0;
    const machine = machines[machineHash % machines.length];
    if (!machine) return null;

    this.map(machine);
    return machine;
  }
}
registerScheduler("URI", URI);
