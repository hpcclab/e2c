import assert from "node:assert/strict";
import test from "node:test";
import { SimulationEngine } from "../utils/simulationEngine.js";
import {
  getSchedulingPolicyOptions,
  normalizeSchedulingPolicyAlias,
} from "../utils/scheduling.js";

const source = (id, taskType) => ({
  id,
  properties: { task_type: taskType },
});

const task = (id, sourceId, taskType, deadline) => ({
  id,
  source_id: sourceId,
  task_type: taskType,
  generation_time: 0,
  arrival_time: 0,
  deadline,
  status: "NEW",
});

const machine = (id, name, eet) => ({
  id,
  name,
  queue: [],
  eet,
  eetStdDev: Object.fromEntries(
    Object.keys(eet).map((key) => [key, 0]),
  ),
});

function batchEngine({ policyAlias, machines, iot, tasks }) {
  return new SimulationEngine({
    policyAlias,
    schedulingMode: "batch",
    batchIntervalSeconds: 1,
    deadlinePolicy: "continue",
    machines,
    iot,
    tasks,
    edges: iot.flatMap((taskSource) =>
      machines.map((candidate) => ({
        source: `nd_${taskSource.id}`,
        target: String(candidate.id),
      })),
    ),
  });
}

test("periodic mode exposes only MM, MMU, and MSD", () => {
  assert.deepEqual(
    getSchedulingPolicyOptions("batch").map(({ alias }) => alias),
    ["MM", "MMU", "MSD"],
  );
  assert.equal(normalizeSchedulingPolicyAlias("FCFS", "batch"), "MM");
  assert.equal(normalizeSchedulingPolicyAlias("MMU", "immediate"), "FCFS");
});

test("MM assigns the globally minimum-completion pair first", () => {
  const sources = [source(7, "A"), source(8, "B")];
  const machines = [
    machine(1, "M1", { A: 1, B: 10 }),
    machine(2, "M2", { A: 2, B: 3 }),
  ];
  const snapshot = batchEngine({
    policyAlias: "MM",
    machines,
    iot: sources,
    tasks: [task(1, 7, "A", 100), task(2, 8, "B", 100)],
  }).advanceTo(1);

  assert.deepEqual(snapshot.machines[0].queue.map(({ id }) => id), [1]);
  assert.deepEqual(snapshot.machines[1].queue.map(({ id }) => id), [2]);
});

test("MMU prioritizes the task with the smallest predicted slack", () => {
  const sources = [source(7, "Short"), source(8, "Long")];
  const snapshot = batchEngine({
    policyAlias: "MMU",
    machines: [machine(1, "M1", { Short: 1, Long: 5 })],
    iot: sources,
    tasks: [
      task(1, 7, "Short", 5),
      task(2, 8, "Long", 6),
    ],
  }).advanceTo(1);

  assert.deepEqual(snapshot.machines[0].queue.map(({ id }) => id), [2, 1]);
});

test("MSD prioritizes the soonest deadline and uses completion time as a tie-breaker", () => {
  const sources = [source(7, "Short"), source(8, "Long")];
  const snapshot = batchEngine({
    policyAlias: "MSD",
    machines: [machine(1, "M1", { Short: 1, Long: 5 })],
    iot: sources,
    tasks: [
      task(1, 7, "Short", 5),
      task(2, 8, "Long", 6),
    ],
  }).advanceTo(1);

  assert.deepEqual(snapshot.machines[0].queue.map(({ id }) => id), [1, 2]);
});

test("batch policies keep excess tasks at the load balancer when queues reach L", () => {
  const tasks = [1, 2, 3].map((id) => task(id, 7, "A", 100));
  const snapshot = batchEngine({
    policyAlias: "MM",
    machines: [machine(1, "M1", { A: 1 })],
    iot: [source(7, "A")],
    tasks,
  }).advanceTo(1);

  assert.equal(snapshot.machines[0].queue.length, 2);
  assert.equal(snapshot.unassigned.length, 1);
  assert.equal(snapshot.unassigned[0].status, "WAITING_FOR_BATCH");
});
