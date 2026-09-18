import { BaseScheduler } from "./BaseScheduler.js";
import { registerScheduler } from "./registry.js";
import { getMachineEetMean } from "../utils/executionTime.js";

export class MEET extends BaseScheduler {
  constructor(opts) {
    super(opts);
    this.name = "MEET";
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
    const sourceId = this.getTaskSource(task)?.id;

    // Collect machine execution times
    const eets = this.getEligibleMachines(task).map((m) => ({
      machine: m,
      eet: getMachineEetMean(m, sourceId, task.task_type),
    }));

    if (!eets.length) return null;

    // Find minimum EET
    const minEet = Math.min(...eets.map((e) => e.eet));

    // Find all tied machines
    const ties = eets.filter((e) => e.eet == minEet);

    if (!ties.length) return null;

    // Seeded pseudo-random selection using task.id
    const seed = task.id || 1;
    const selectedIndex = seed % ties.length;

    const assignedMachine = ties[selectedIndex].machine;

    this.map(assignedMachine);

    return assignedMachine;
  }
}

registerScheduler("MEET", MEET);
