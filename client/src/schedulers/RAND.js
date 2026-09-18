import { BaseScheduler } from "./BaseScheduler.js";
import { registerScheduler } from "./registry.js";
export class RAND extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "RAND";
    this.prev_assignment_idx = -1;
  }

  getRandMachine(machines) {
    const len = machines.length;
    if (!len) return null;

    const rm1 = Math.floor(Math.random() * len);
    const rm2 = Math.floor(Math.random() * len);

    const m1 = machines[rm1];
    const m2 = machines[rm2];

    const q1 = m1.queue?.length || 0;
    const q2 = m2.queue?.length || 0;

    return q1 <= q2 ? m1 : m2;
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

      this.choose();
    }

    const task = this.unmappedTask[this.unmappedTask.length - 1];
    const machine = this.getRandMachine(this.getEligibleMachines(task));
    if (!machine) return null;

    this.map(machine);
    return machine;
  }
}
registerScheduler("RAND", RAND);
