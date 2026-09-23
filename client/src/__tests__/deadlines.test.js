import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { BaseScheduler } from "../schedulers/BaseScheduler.js";
import {
  deadlineFromArrival,
  nonNegativeSlack,
} from "../utils/deadlines.js";

let vite;
let generateWorkload;

before(async () => {
  vite = await createServer({
    appType: "custom",
    server: { middlewareMode: true },
  });
  ({ generateWorkload } = await vite.ssrLoadModule(
    "/src/workload/tabs/ScenarioTab.jsx",
  ));
});

after(async () => {
  await vite?.close();
});

test("slack is numeric and never negative", () => {
  assert.equal(nonNegativeSlack(-3), 0);
  assert.equal(nonNegativeSlack("2.5"), 2.5);
  assert.equal(nonNegativeSlack(undefined), 0);
  assert.equal(deadlineFromArrival(2.25, "3.5"), 5.75);
});

test("workload deadlines use arrival plus the source's slack", () => {
  const scenario = [{
    srcID: 42,
    taskType: "Task A",
    numTasks: 1,
    startTime: 2,
    endTime: 2,
    distribution: "uniform",
  }];
  const source = [{ srcID: 42, name: "Different display name", slack: 3 }];

  assert.equal(generateWorkload(scenario, source)[0].deadline, 5);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: 0 }])[0].deadline, 2);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: -4 }])[0].deadline, 2);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: "3" }])[0].deadline, 5);
});

function processTask({ start, deadline, eet, now, deadlinePolicy = "drop" }) {
  const task = { task_type: "Task A", start_time: start, deadline, status: "RUNNING" };
  const machine = { id: 1, eet: { "Task A": eet }, queue: [task] };
  const scheduler = new BaseScheduler({
    machines: [],
    iot: [],
    enqueue: () => {},
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
    config: { deadlinePolicy },
  });
  scheduler.setMachines([machine]);
  scheduler.setTime(now);
  scheduler.processMachines();
  return { task, machine, scheduler, stats: scheduler.getStats() };
}

test("a task completing exactly at its absolute deadline is completed", () => {
  const { task, machine, stats } = processTask({
    start: 11,
    deadline: 13,
    eet: 2,
    now: 13,
  });
  assert.equal(task.status, "COMPLETED");
  assert.equal(stats.completed.length, 1);
  assert.equal(stats.missed.length, 0);
  assert.equal(machine.queue.length, 0);
});

test("a task that cannot finish by the absolute deadline is missed", () => {
  const { task, machine, stats } = processTask({
    start: 11,
    deadline: 13,
    eet: 4,
    now: 13,
  });
  assert.equal(task.status, "MISSED");
  assert.equal(task.end_time, 13);
  assert.equal(stats.completed.length, 0);
  assert.equal(stats.missed.length, 1);
  assert.equal(machine.queue.length, 0);
});

test("a late simulation tick does not turn a missed task into a completion", () => {
  const { task, stats } = processTask({
    start: 11,
    deadline: 13,
    eet: 4,
    now: 15,
  });
  assert.equal(task.status, "MISSED");
  assert.equal(task.end_time, 13);
  assert.equal(stats.completed.length, 0);
});

test("continue policy lets a running task finish after its deadline", () => {
  const { task, machine, scheduler, stats } = processTask({
    start: 11,
    deadline: 13,
    eet: 4,
    now: 13,
    deadlinePolicy: "continue",
  });

  assert.equal(task.status, "RUNNING");
  assert.equal(task.end_time, 15);
  assert.equal(machine.queue.length, 1);
  assert.equal(stats.missed.length, 0);

  scheduler.setTime(15);
  scheduler.processMachines();

  assert.equal(task.status, "MISSED");
  assert.equal(task.end_time, 15);
  assert.equal(machine.queue.length, 0);
  assert.equal(stats.missed.length, 1);
  assert.equal(scheduler.getMachineStats().get(1).total_tasks, 1);
  assert.equal(
    scheduler.getMachineStats().get(1).utilization_time,
    4 / 3600,
  );
});
