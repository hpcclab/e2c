import { BaseScheduler } from "./BaseScheduler";
import { registerScheduler } from "./registry";
export class RAND extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "RAND";
    this.prev_assignment_idx = -1;
  }

  getRandMachine() {
    const len = this.machines.length;

    const rm1 = Math.floor(Math.random() * len);
    const rm2 = Math.floor(Math.random() * len);

    const m1 = this.machines[rm1];
    const m2 = this.machines[rm2];

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

    const machine = this.getRandMachine();
    if (!machine) return null;

    this.map(machine);
    return machine;
  }
}
registerScheduler("RAND", RAND);
