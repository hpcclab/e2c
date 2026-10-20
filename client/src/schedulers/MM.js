import { BatchHeuristicScheduler } from "./BatchHeuristicScheduler.js";
import { registerScheduler } from "./registry.js";

export class MM extends BatchHeuristicScheduler {
  constructor(options) {
    super(options);
    this.name = "MM";
  }
}

registerScheduler("MM", MM);
