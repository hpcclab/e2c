import assert from "node:assert/strict";
import test from "node:test";
import { SimulationEngine } from "../utils/simulationEngine.js";

function buildEngine(overrides = {}) {
  return new SimulationEngine({
    policyAlias: "FCFS",
    deadlinePolicy: "drop",
    machines: [{
      id: 1,
      name: "Machine 1",
      price: 2,
      queue: [],
      eet: { "7::Task A": 0.1, "Task A": 0.1 },
      eetStdDev: { "7::Task A": 0, "Task A": 0 },
    }],
    iot: [{ id: 7, properties: { task_type: "Task A" } }],
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      arrival_time: 0,
      deadline: 1,
      status: "NEW",
      start_time: 0,
      end_time: 0,
    }],
    edges: [{ source: "nd_7", target: "1" }],
    nodes: [],
    ...overrides,
  });
}

test("worker engine advances scheduling independently of React", () => {
  const engine = buildEngine();
  const snapshot = engine.advanceTo(0.2);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.completed.length, 1);
  assert.equal(snapshot.missed.length, 0);
  assert.equal(snapshot.machines[0].total_tasks, 1);
});

test("advancing by elapsed time catches up across a background pause", () => {
  const engine = buildEngine({
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      arrival_time: 1.5,
      deadline: 3,
      status: "NEW",
      start_time: 1.5,
      end_time: 0,
    }],
  });
  const snapshot = engine.advanceTo(2);
  assert.equal(snapshot.time >= 1.6, true);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.completed.length, 1);
});

test("pause-compatible snapshots preserve unfinished work", () => {
  const engine = buildEngine({
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      arrival_time: 5,
      deadline: 6,
      status: "NEW",
      start_time: 5,
      end_time: 0,
    }],
  });
  engine.advanceTo(1);
  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.complete, false);
  assert.equal(snapshot.unassigned.length, 1);
  assert.equal(snapshot.time, 1);
});
