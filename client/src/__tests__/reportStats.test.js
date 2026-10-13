import assert from "node:assert/strict";
import test from "node:test";

import { buildTaskSummary } from "../utils/reportStats.js";

test("completed and missed report totals are mutually exclusive", () => {
  const results = [
    ...Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      status: "COMPLETED",
    })),
    ...Array.from({ length: 14 }, (_, index) => ({
      id: index + 7,
      status: index === 0 ? "DNR" : "MISSED",
    })),
  ];

  const summary = buildTaskSummary(results, 20);

  assert.equal(summary.total, 20);
  assert.equal(summary.completed.length, 6);
  assert.equal(summary.missed.length, 14);
  assert.equal(summary.inProgress, 0);
  assert.equal(summary.completionPercentage, "30.00");
});

test("unassigned and in-progress tasks fill the remaining total", () => {
  const results = [
    { id: 1, status: "COMPLETED" },
    { id: 2, status: "NEW" },
  ];

  const summary = buildTaskSummary(results, 4);

  assert.equal(summary.unassigned.length, 1);
  assert.equal(summary.inProgress, 2);
});

test("result rows prevent a stale configured total from undercounting tasks", () => {
  const results = [
    { id: 1, status: "COMPLETED" },
    { id: 2, status: "MISSED" },
  ];

  assert.equal(buildTaskSummary(results, 0).total, 2);
});

test("battery failures are counted once and separated by cause", () => {
  const summary = buildTaskSummary([
    {
      id: 1,
      status: "NOT_GENERATED",
      failure_reason: "IOT_BATTERY_DEPLETED",
    },
    {
      id: 2,
      status: "DNR",
      failure_reason: "MACHINE_BATTERY_DEPLETED",
    },
  ], 2);

  assert.equal(summary.missed.length, 2);
  assert.equal(summary.sourceBatteryFailures.length, 1);
  assert.equal(summary.machineBatteryFailures.length, 1);
  assert.equal(summary.inProgress, 0);
});
