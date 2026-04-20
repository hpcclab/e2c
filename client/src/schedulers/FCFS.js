import { BaseScheduler } from "./BaseScheduler";

export class FCFS extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "FCFS";
  }

  firstAvailableMachine() {
    // Prefer idle machines first
    for (const m of this.machines) {
      if (!m.queue?.length) return m;
    }

    // Otherwise pick least loaded machine
    let min = Infinity;
    let chosen = null;

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

    // Get next FCFS task only when needed
    if (!this.unmappedTask.length) {
      const nextTask = this.batchQueue[0];

      if (!nextTask) return null;

      if (nextTask.arrival_time > this.getTime()) {
        return null;
      }

      this.choose();
    }

    // Find machine
    const machine = this.firstAvailableMachine();
    if (!machine) {
      console.log("Machines Unavailable");
      return null;
    }

    this.map(machine);
    return machine;
  }
}
