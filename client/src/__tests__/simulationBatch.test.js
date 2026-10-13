import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SIMULATION_RUNS,
  buildSimulationBatchSummary,
  normalizeSimulationRunCount,
  normalizeSimulationSeeds,
} from "../utils/simulationBatch.js";

test("simulation batches clamp unsafe run counts", () => {
  assert.equal(normalizeSimulationRunCount(0), 1);
  assert.equal(normalizeSimulationRunCount("4"), 4);
  assert.equal(normalizeSimulationRunCount(10_000), MAX_SIMULATION_RUNS);
});

test("each run keeps its own seed and newly added runs start blank", () => {
  assert.deepEqual(
    normalizeSimulationSeeds(3, ["experiment"], ""),
    ["experiment", "", ""],
  );
  assert.deepEqual(
    normalizeSimulationSeeds(3, ["one", "", "three"], ""),
    ["one", "", "three"],
  );
});

test("legacy automatically generated run seeds are cleared", () => {
  assert.deepEqual(
    normalizeSimulationSeeds(
      4,
      ["10", "10-run-2", "custom", "10-run-4"],
      "",
    ),
    ["10", "", "custom", ""],
  );
});

function snapshot({ completed, missed, time, energyJ, cost }) {
  const completedTasks = Array.from({ length: completed }, (_, index) => ({
    id: index + 1,
    status: "COMPLETED",
  }));
  const missedTasks = Array.from({ length: missed }, (_, index) => ({
    id: completed + index + 1,
    status: "MISSED",
  }));
  return {
    time,
    totalTasks: completed + missed,
    results: [...completedTasks, ...missedTasks],
    machines: [{ energyConsumedJ: energyJ, total_cost: cost }],
    iot: [],
  };
}

test("batch reports retain per-run metrics and average completed runs only", () => {
  const summary = buildSimulationBatchSummary([
    {
      runNumber: 1,
      seed: "one",
      status: "complete",
      snapshot: snapshot({ completed: 8, missed: 2, time: 12, energyJ: 20, cost: 2 }),
    },
    {
      runNumber: 2,
      seed: "two",
      status: "complete",
      snapshot: snapshot({ completed: 10, missed: 0, time: 10, energyJ: 30, cost: 4 }),
    },
    { runNumber: 3, seed: "three", status: "running", snapshot: null },
  ]);

  assert.equal(summary.completedRuns, 2);
  assert.equal(summary.pendingRuns, 1);
  assert.equal(summary.metrics[0].completionRate, 80);
  assert.equal(summary.averages.completed, 9);
  assert.equal(summary.averages.missed, 1);
  assert.equal(summary.averages.completionRate, 90);
  assert.equal(summary.averages.simulationTime, 11);
  assert.equal(summary.averages.totalEnergyJ, 25);
  assert.equal(summary.averages.totalCost, 3);
});
