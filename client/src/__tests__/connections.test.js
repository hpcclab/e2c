import assert from "node:assert/strict";
import { test } from "node:test";
import {
  connectedSources,
  isConnectedToMachine,
} from "../utils/connections.js";
import { FCFS } from "../schedulers/FCFS.js";
import { LC } from "../schedulers/LC.js";
import { RAND } from "../schedulers/RAND.js";
import { URI } from "../schedulers/URI.js";
import { MEET } from "../schedulers/MEET.js";
import { MECT } from "../schedulers/MECT.js";

test("machine EET rows include only connected task sources", () => {
  const sources = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const edges = [
    { source: "nd_1", target: "10" },
    { source: "nd_3", target: "10" },
  ];
  assert.deepEqual(
    connectedSources(sources, 10, edges, []).map((source) => source.id),
    [1, 3],
  );
  assert.deepEqual(connectedSources(sources, null, edges, []), []);
  assert.deepEqual(
    connectedSources(sources, 10, edges.slice(1), []).map((source) => source.id),
    [3],
  );
});

test("a source connected through a load balancer can show its EET", () => {
  const edges = [
    { source: "nd_1", target: "LBNode_1" },
    { source: "LBNode_1", target: "10" },
  ];
  assert.equal(
    isConnectedToMachine("nd_1", 10, edges, [{ id: "LBNode_1", type: "LBNode" }]),
    true,
  );
  assert.equal(isConnectedToMachine("nd_1", 10, edges, []), false);
});

for (const Scheduler of [FCFS, LC, RAND, URI, MEET, MECT]) {
  test(`${Scheduler.name} assigns only to a reachable machine`, () => {
    const disconnected = {
      id: "off",
      name: "Disconnected",
      queue: [],
      eet: { Sensor: 0.1 },
      eetStdDev: { Sensor: 0 },
    };
    const connected = {
      id: "on",
      name: "Connected",
      queue: [],
      eet: { Sensor: 2 },
      eetStdDev: { Sensor: 0 },
    };
    const scheduler = new Scheduler({
      machines: [],
      iot: [],
      enqueue: (machineId, task) => {
        if (machineId === connected.id) connected.queue.push(task);
      },
      dequeue: () => connected.queue.shift(),
      isNeighbors: (sourceId, machineId) =>
        sourceId === "nd_1" && machineId === connected.id,
    });
    scheduler.setMachines([disconnected, connected]);
    scheduler.setIot([{ id: 1, properties: { task_type: "Sensor" } }]);
    scheduler.setTime(0);
    scheduler.addTask({
      task_type: "Sensor",
      source_id: 1,
      arrival_time: 0,
      deadline: 10,
    });
    scheduler.schedule();

    assert.equal(disconnected.queue.length, 0);
    assert.equal(connected.queue.length, 1);
    assert.equal(connected.queue[0].assigned_machine, "Connected");
    assert.equal(connected.queue[0].execution_time, 2);
  });
}

test("sources sharing a task type still follow their own connections", () => {
  const machine = { id: 10, queue: [] };
  const scheduler = new FCFS({
    machines: [],
    iot: [],
    enqueue: () => {},
    dequeue: () => {},
    isNeighbors: (sourceId) => sourceId === "nd_2",
  });
  scheduler.setMachines([machine]);
  scheduler.setIot([
    { id: 1, properties: { task_type: "Shared" } },
    { id: 2, properties: { task_type: "Shared" } },
  ]);

  assert.deepEqual(scheduler.getEligibleMachines({ task_type: "Shared", source_id: 1 }), []);
  assert.deepEqual(scheduler.getEligibleMachines({ task_type: "Shared", source_id: 2 }), [machine]);
});

test("connected sources with a shared task type use separate EET values", () => {
  const machine = {
    id: 10,
    name: "Machine",
    queue: [],
    eet: { "source:1": 2, "source:2": 4 },
    eetStdDev: { "source:1": 0, "source:2": 0 },
  };
  const scheduler = new FCFS({
    machines: [],
    iot: [],
    enqueue: (_id, task) => machine.queue.push(task),
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
  });
  scheduler.setMachines([machine]);
  scheduler.setIot([
    { id: 1, properties: { task_type: "Shared" } },
    { id: 2, properties: { task_type: "Shared" } },
  ]);
  scheduler.setTime(0);
  scheduler.addTask({ task_type: "Shared", source_id: 1, arrival_time: 0, deadline: 10 });
  scheduler.addTask({ task_type: "Shared", source_id: 2, arrival_time: 0, deadline: 10 });
  scheduler.schedule();
  scheduler.schedule();

  assert.deepEqual(machine.queue.map((task) => task.execution_time), [2, 4]);
});

test("an unreachable task expires without reading a machine EET", () => {
  const eet = {};
  Object.defineProperty(eet, "Sensor", {
    get() { throw new Error("unreachable EET was read"); },
  });
  const scheduler = new MEET({
    machines: [],
    iot: [],
    enqueue: () => { throw new Error("unreachable task was assigned"); },
    dequeue: () => {},
    isNeighbors: () => false,
  });
  scheduler.setMachines([{ id: 10, queue: [], eet }]);
  scheduler.setIot([{ id: 1, properties: { task_type: "Sensor" } }]);
  scheduler.setTime(0);
  scheduler.addTask({ task_type: "Sensor", source_id: 1, arrival_time: 0, deadline: 2 });
  scheduler.schedule();
  assert.equal(scheduler.unmappedTask.length, 1);

  scheduler.setTime(2);
  scheduler.processMachines();
  assert.equal(scheduler.unmappedTask.length, 0);
  assert.equal(scheduler.getStats().missed.length, 1);
  assert.equal(scheduler.getStats().missed[0].status, "DNR");
});
