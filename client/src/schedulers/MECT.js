import { BaseScheduler } from "./BaseScheduler";
import { registerScheduler } from "./registry";

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
    const pcts = this.machines.map((machine) => ({
      machine,
      pct:
        typeof machine.provisional_map === "function"
          ? machine.provisional_map(task)
          : Infinity,
    }));

    if (!pcts.length) return null;

    // Find minimum provisional completion time
    const minPct = Math.min(...pcts.map((p) => p.pct));

    // Find all tied machines
    const ties = pcts.filter((p) => p.pct === minPct);

    if (!ties.length) return null;

    // Deterministic pseudo-random selection using task.id
    const seed = task.id || 1;
    const selectedIndex = seed % ties.length;

    const assignedMachine = ties[selectedIndex].machine;

    this.map(assignedMachine);

    // console.log(
    //   `task:${task.id} assigned to:${assignedMachine.type?.name} delta:${task.deadline} min_pct:${minPct}`,
    // );

    return assignedMachine;
  }
}

registerScheduler("MECT", MECT);
