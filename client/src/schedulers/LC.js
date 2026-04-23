import { BaseScheduler } from "./BaseScheduler";
import { registerScheduler } from "./registry";
export class LC extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "LC";
    this.prev_assignment_idx = -1;
  }

  selectMin() {
    if (!this.machines.length) return null;

    let chosen = this.machines[0];
    let min = this.machines[0].queue?.length || 0;

    for (const m of this.machines) {
      const len = m.queue?.length || 0;
      if (len < min) {
        min = len;
        chosen = m;
      }
    }

    return chosen;
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

    const machine = this.selectMin();
    if (!machine) return null;

    this.map(machine);
    return machine;
  }
}
registerScheduler("LC", LC);
