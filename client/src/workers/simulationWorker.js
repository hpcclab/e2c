import { SimulationEngine } from "../utils/simulationEngine.js";

const UPDATE_INTERVAL_MS = 50;

let engine = null;
let timer = null;
let paused = false;
let runStartedAt = 0;
let simulationStartedAt = 0;

function stopTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}

function postSnapshot(type = "SNAPSHOT") {
  if (!engine) return;
  self.postMessage({ type, snapshot: engine.getSnapshot() });
}

function advanceFromElapsedTime() {
  if (!engine || paused) return;
  const elapsedSeconds = (performance.now() - runStartedAt) / 1000;
  engine.advanceTo(simulationStartedAt + elapsedSeconds);
  if (engine.isComplete()) {
    stopTimer();
    postSnapshot("COMPLETE");
  } else {
    postSnapshot();
  }
}

function startTimer() {
  stopTimer();
  runStartedAt = performance.now();
  simulationStartedAt = engine?.currentTime ?? 0;
  timer = setInterval(advanceFromElapsedTime, UPDATE_INTERVAL_MS);
}

self.onmessage = ({ data }) => {
  switch (data?.type) {
    case "START":
      stopTimer();
      engine = new SimulationEngine(data.payload);
      paused = false;
      postSnapshot();
      if (engine.isComplete()) postSnapshot("COMPLETE");
      else startTimer();
      break;
    case "PAUSE":
      if (!engine) break;
      advanceFromElapsedTime();
      if (engine.isComplete()) break;
      paused = true;
      stopTimer();
      postSnapshot("PAUSED");
      break;
    case "RESUME":
      if (!engine || engine.isComplete()) break;
      paused = false;
      startTimer();
      postSnapshot("RESUMED");
      break;
    case "STOP":
      stopTimer();
      engine = null;
      paused = false;
      self.postMessage({ type: "STOPPED" });
      break;
    default:
      break;
  }
};
