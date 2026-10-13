import { SimulationEngine } from "../utils/simulationEngine.js";

const MAX_STEPS = 2_000_000;

self.onmessage = ({ data }) => {
  if (data?.type !== "RUN") return;

  try {
    const engine = new SimulationEngine(data.payload);
    let steps = 0;
    while (!engine.isComplete() && steps < MAX_STEPS) {
      engine.step();
      steps += 1;
    }

    if (!engine.isComplete()) {
      self.postMessage({
        type: "ERROR",
        runNumber: data.runNumber,
        message:
          "This run exceeded the background safety limit before it completed.",
      });
      return;
    }

    self.postMessage({
      type: "COMPLETE",
      runNumber: data.runNumber,
      snapshot: engine.getSnapshot(),
    });
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      runNumber: data.runNumber,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
