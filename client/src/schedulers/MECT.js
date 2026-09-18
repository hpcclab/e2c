import { BaseScheduler } from "./BaseScheduler.js";
import { registerScheduler } from "./registry.js";
import { getMachineEetMean } from "../utils/executionTime.js";

export class MECT extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "MECT";
  }

  schedule() {
    if (!this.batchQueue.length && !this.unmappedTask.length) {
      return null;
    }

    // Only choose a new task when none are waiting to map
    if (!this.unmappedTask.length) {
      const nextTask = this.batchQueue[0];

      if (!nextTask) return null;

      if (nextTask.arrival_time > this.getTime()) {
        return null;
      }

      this.choose();
    }

    const task = this.unmappedTask[this.unmappedTask.length - 1];
    if (!task) return null;

    // Calculate provisional completion times
    const pcts = this.getEligibleMachines(task).map((machine) => ({
      machine,
      pct: machine.queue.reduce((sum, t) => {
        sum += getMachineEetMean(
          machine,
          this.getTaskSource(t)?.id,
          t.task_type,
        );
        return sum;
      }, 0),
    }));

    if (!pcts.length) return null;

    // Find minimum provisional completion time
    const minPct = Math.min(...pcts.map((p) => p.pct));

    // Find all tied machines
    const ties = pcts.filter((p) => p.pct == minPct);

    if (!ties.length) return null;

    // Deterministic pseudo-random selection using task.id
    const seed = task.id || 1;
    const selectedIndex = seed % ties.length;

    const assignedMachine = ties[selectedIndex].machine;

    this.map(assignedMachine);

    return assignedMachine;
  }
}

registerScheduler("MECT", MECT);
