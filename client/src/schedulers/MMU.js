import {
  BatchHeuristicScheduler,
  compareByUrgency,
} from "./BatchHeuristicScheduler.js";
import { registerScheduler } from "./registry.js";

export class MMU extends BatchHeuristicScheduler {
  constructor(options) {
    super(options);
    this.name = "MMU";
  }

  compareCandidates(first, second) {
    return compareByUrgency(first, second);
  }
}

registerScheduler("MMU", MMU);
