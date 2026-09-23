import assert from "node:assert/strict";
import { test } from "node:test";
import { BaseScheduler } from "../schedulers/BaseScheduler.js";
import {
  getEetMean,
  getEetStdDev,
  getMachineEetMean,
  getMachineEetStdDev,
  sampleExecutionTime,
  sourceEetKey,
} from "../utils/executionTime.js";

function normalDraw(z) {
  const values = [1 - Math.exp(-(z * z) / 2), z < 0 ? 0.5 : 0];
  return () => values.shift();
}

test("legacy EETs and missing standard deviations use 1 and 0.25 defaults", () => {
  assert.equal(getEetMean(undefined), 1);
  assert.equal(getEetMean("2.5"), 2.5);
  assert.equal(getEetStdDev(undefined), 0.25);
  assert.equal(getEetStdDev("0"), 0);
  assert.equal(getEetStdDev(-2), 0);
  assert.equal(getMachineEetMean({ eet: { Sensor: 3 } }, 10, "Sensor"), 3);
  assert.equal(getMachineEetStdDev({ eetStdDev: {} }, 10, "Sensor"), 0.25);
});

test("EET settings are distinct for sources with the same task type", () => {
  const machine = {
    eet: { Sensor: 9, [sourceEetKey(1)]: 2, [sourceEetKey(2)]: 4 },
    eetStdDev: { [sourceEetKey(1)]: 0.1, [sourceEetKey(2)]: 0.5 },
  };
  assert.equal(getMachineEetMean(machine, 1, "Sensor"), 2);
  assert.equal(getMachineEetMean(machine, 2, "Sensor"), 4);
  assert.equal(getMachineEetStdDev(machine, 1, "Sensor"), 0.1);
  assert.equal(getMachineEetStdDev(machine, 2, "Sensor"), 0.5);
});

test("a normal draw changes the actual duration; zero deviation is constant", () => {
  assert.ok(Math.abs(sampleExecutionTime(1, 0.25, normalDraw(1)) - 1.25) < 1e-12);
  assert.equal(sampleExecutionTime(2, 0, () => { throw new Error("should not draw"); }), 2);
});

test("negative normal draws are retried, so execution time stays positive", () => {
  const draws = [...[1 - Math.exp(-8), 0.5], ...[1 - Math.exp(-0.5), 0]];
  const sampled = sampleExecutionTime(1, 0.5, () => draws.shift());
  assert.ok(Math.abs(sampled - 1.5) < 1e-12);
});

test("scheduler samples once per task and completes using the sampled duration", () => {
  const draws = [
    1 - Math.exp(-0.5), 0, // first task: 1 + 0.25 = 1.25
    1 - Math.exp(-2), 0, // second task: 1 + 0.5 = 1.5
  ];
  const machine = {
    id: 10,
    name: "Machine",
    queue: [],
    eet: { Sensor: 1 },
    eetStdDev: { Sensor: 0.25 },
  };
  const source = { id: 20, properties: { task_type: "Sensor" } };
  const scheduler = new BaseScheduler({
    machines: [],
    iot: [],
    enqueue: (_id, task) => machine.queue.push(task),
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
    config: { random: () => draws.shift() },
  });
  scheduler.setMachines([machine]);
  scheduler.setIot([source]);
  scheduler.setTime(1);

  const first = { task_type: "Sensor", deadline: 10 };
  scheduler.unmappedTask.push(first);
  scheduler.map(machine);
  const second = { task_type: "Sensor", deadline: 10 };
  scheduler.unmappedTask.push(second);
  scheduler.map(machine);

  assert.ok(Math.abs(first.execution_time - 1.25) < 1e-12);
  assert.ok(Math.abs(second.execution_time - 1.5) < 1e-12);
  assert.equal(first.start_time, 1);
  assert.equal(second.start_time, null);

  scheduler.setTime(2.25);
  scheduler.processMachines();
  assert.equal(first.status, "COMPLETED");
  assert.equal(second.status, undefined);

  scheduler.setTime(2.26);
  scheduler.processMachines();
  assert.equal(second.start_time, 2.26);
  scheduler.setTime(3.76);
  scheduler.processMachines();
  assert.equal(second.status, "COMPLETED");
  assert.equal(scheduler.getStats().completed.length, 2);
});

test("a sampled duration beyond the deadline is reported as missed", () => {
  const machine = {
    id: 10,
    name: "Machine",
    queue: [],
    eet: { Sensor: 1 },
    eetStdDev: { Sensor: 0.25 },
  };
  const scheduler = new BaseScheduler({
    machines: [],
    iot: [],
    enqueue: (_id, task) => machine.queue.push(task),
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
    config: { random: normalDraw(2) },
  });
  scheduler.setMachines([machine]);
  scheduler.setIot([{ id: 20, properties: { task_type: "Sensor" } }]);
  scheduler.setTime(1);
  const task = { task_type: "Sensor", deadline: 2.25 };
  scheduler.unmappedTask.push(task);
  scheduler.map(machine);
  assert.ok(Math.abs(task.execution_time - 1.5) < 1e-12);
  scheduler.setTime(2.25);
  scheduler.processMachines();
  assert.equal(task.status, "MISSED");
  assert.equal(task.end_time, 2.25);
  assert.equal(machine.queue.length, 0);
  assert.equal(scheduler.getStats().missed.length, 1);
});

test("a queued task that expires before starting is marked DNR", () => {
  const task = {
    task_type: "Sensor",
    arrival_time: 1,
    start_time: null,
    end_time: null,
    execution_time: 1,
    deadline: 2,
  };
  const machine = { id: 10, queue: [task] };
  const scheduler = new BaseScheduler({
    machines: [],
    iot: [],
    enqueue: () => {},
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
  });
  scheduler.setMachines([machine]);
  scheduler.setTime(2);

  scheduler.processMachines();

  assert.equal(task.status, "DNR");
  assert.equal(task.start_time, null);
  assert.equal(task.end_time, null);
  assert.equal(scheduler.getStats().missed.length, 1);
});
