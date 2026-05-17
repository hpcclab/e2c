import { BaseScheduler } from "./BaseScheduler";
import { registerScheduler } from "./registry";

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

    // Collect machine execution times
    const eets = this.machines.map((m) => ({
      machine: m,
      eet: task.estimated_time?.[m.type?.name] ?? Infinity,
    }));

    if (!eets.length) return null;

    // Find minimum EET
    const minEet = Math.min(...eets.map((e) => e.eet));

    // Find all tied machines
    const ties = eets.filter((e) => e.eet === minEet);

    if (!ties.length) return null;

    // Seeded pseudo-random selection using task.id
    const seed = task.id || 1;
    const selectedIndex = seed % ties.length;

    const assignedMachine = ties[selectedIndex].machine;

    this.map(assignedMachine);

    // console.log(
    //   `task:${task.id} assigned to:${assignedMachine.type?.name} delta:${task.deadline}`,
    // );

    return assignedMachine;
  }
}

registerScheduler("MEET", MEET);
