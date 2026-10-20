import {
  BatchHeuristicScheduler,
  compareByDeadline,
} from "./BatchHeuristicScheduler.js";
import { registerScheduler } from "./registry.js";

export class MSD extends BatchHeuristicScheduler {
  constructor(options) {
    super(options);
    this.name = "MSD";
  }

  compareCandidates(first, second) {
    return compareByDeadline(first, second);
  }
}

registerScheduler("MSD", MSD);
