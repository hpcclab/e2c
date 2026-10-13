import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { BaseScheduler } from "../schedulers/BaseScheduler.js";
import {
  deadlineFromGeneration,
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
  assert.equal(deadlineFromGeneration(2.25, "3.5"), 5.75);
});

test("workload deadlines use generation time plus the source's slack", () => {
  const scenario = [{
    srcID: 42,
    taskType: "Task A",
    numTasks: 1,
    startTime: 2,
    endTime: 2,
    distribution: "uniform",
  }];
  const source = [{
    srcID: 42,
    name: "Different display name",
    meanSize: 100,
    dataSizeStdDev: 0,
    connectivity: "Bluetooth",
    slack: 3,
  }];

  const task = generateWorkload(scenario, source)[0];
  assert.equal(task.generation_time, 2);
  assert.equal(task.travel_time, 1);
  assert.equal(task.arrival_time, 3);
  assert.equal(task.deadline, 5);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: 0 }])[0].deadline, 2);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: -4 }])[0].deadline, 2);
  assert.equal(generateWorkload(scenario, [{ ...source[0], slack: "3" }])[0].deadline, 5);
});

test("workload travel time uses the source edge instead of the IoT default", () => {
  const scenario = [{
    srcID: 42,
    taskType: "Task A",
    numTasks: 1,
    startTime: 2,
    endTime: 2,
    distribution: "uniform",
  }];
  const source = [{
    srcID: 42,
    name: "Task A",
    meanSize: 100,
    dataSizeStdDev: 0,
    connectivity: "WiFi",
    dataRateKbps: 54000,
    slack: 3,
  }];
  const edges = [{
    source: "nd_42",
    target: "1",
    data: {
      properties: {
        networkType: "Bluetooth",
        dataRateKbps: 800,
        uploadPowerW: 2,
      },
    },
  }];

  const task = generateWorkload(scenario, source, 0, edges)[0];
  assert.equal(task.connectivity, "Bluetooth");
  assert.equal(task.data_rate_kbps, 800);
  assert.equal(task.travel_time, 1);
  assert.equal(task.arrival_time, 3);
  assert.equal(task.network_upload_power_w, 2);
  assert.equal(task.network_energy_j, 2);
});

test("data size standard deviation controls generated task-size variation", () => {
  const scenario = [{
    srcID: 7,
    taskType: "Task B",
    numTasks: 2,
    startTime: 0,
    endTime: 0,
    distribution: "uniform",
  }];
  const source = [{
    srcID: 7,
    name: "Task B",
    meanSize: 100,
    dataSizeStdDev: 10,
    connectivity: "WiFi",
    slack: 5,
  }];
  const tasks = generateWorkload(scenario, source, 0, [], "variation-test");
  assert.equal(tasks.some((task) => task.data_size !== 100), true);
  const constantTasks = generateWorkload(
    scenario,
    [{ ...source[0], dataSizeStdDev: 0 }],
    0,
    [],
    "variation-test",
  );
  assert.deepEqual(constantTasks.map((task) => task.data_size), [100, 100]);
});

test("one simulation seed reproduces generation times and data sizes", () => {
  const scenario = [{
    srcID: 9,
    taskType: "Seeded Task",
    numTasks: 8,
    startTime: 0,
    endTime: 20,
    distribution: "normal",
  }];
  const source = [{
    srcID: 9,
    name: "Seeded Task",
    meanSize: 100,
    dataSizeStdDev: 15,
    connectivity: "WiFi",
    dataRateKbps: 54000,
    slack: 5,
  }];

  const first = generateWorkload(scenario, source, 0, [], "simulation-42");
  const repeated = generateWorkload(
    scenario,
    source,
    0,
    [],
    "simulation-42",
  );

  assert.deepEqual(
    repeated.map(({ generation_time, data_size }) => ({
      generation_time,
      data_size,
    })),
    first.map(({ generation_time, data_size }) => ({
      generation_time,
      data_size,
    })),
  );

  const changed = generateWorkload(scenario, source, 0, [], "simulation-43");
  assert.notDeepEqual(
    changed.map((task) => task.generation_time),
    first.map((task) => task.generation_time),
  );
  assert.notDeepEqual(
    changed.map((task) => task.data_size),
    first.map((task) => task.data_size),
  );
});

test("legacy per-IoT seeds no longer override the simulation seed", () => {
  const scenario = [{
    srcID: 9,
    taskType: "Seeded Task",
    numTasks: 5,
    startTime: 0,
    endTime: 10,
    distribution: "uniform",
    arrivalSeed: "legacy-arrival-a",
  }];
  const source = [{
    srcID: 9,
    name: "Seeded Task",
    meanSize: 50,
    dataSizeStdDev: 5,
    dataSizeSeed: "legacy-size-a",
    connectivity: "WiFi",
  }];

  const first = generateWorkload(scenario, source, 0, [], "global-seed");
  const repeated = generateWorkload(
    [{ ...scenario[0], arrivalSeed: "legacy-arrival-b" }],
    [{ ...source[0], dataSizeSeed: "legacy-size-b" }],
    0,
    [],
    "global-seed",
  );

  assert.deepEqual(repeated, first);
});

test("spiky generation keeps every task when the count is not divisible by its spike count", () => {
  const tasks = generateWorkload(
    [{
      srcID: 4,
      taskType: "Spiky Task",
      numTasks: 25,
      startTime: 0,
      endTime: 10,
      distribution: "spiky",
    }],
    [{
      srcID: 4,
      name: "Spiky Task",
      meanSize: 1,
      dataSizeStdDev: 0,
      connectivity: "WiFi",
    }],
    0,
    [],
    "spiky-seed",
  );

  assert.equal(tasks.length, 25);
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

test("continue policy keeps an expired unmapped task until it can run", () => {
  const task = {
    task_type: "Task A",
    source_id: 20,
    arrival_time: 1,
    deadline: 2,
  };
  const machine = {
    id: 1,
    name: "Machine",
    queue: [],
    eet: { "Task A": 1 },
    eetStdDev: { "Task A": 0 },
  };
  const scheduler = new BaseScheduler({
    machines: [],
    iot: [],
    enqueue: (_id, queuedTask) => machine.queue.push(queuedTask),
    dequeue: () => machine.queue.shift(),
    isNeighbors: () => true,
    config: { deadlinePolicy: "continue" },
  });
  scheduler.setMachines([machine]);
  scheduler.setIot([{ id: 20, properties: { task_type: "Task A" } }]);
  scheduler.unmappedTask.push(task);
  scheduler.setTime(2.5);

  scheduler.processMachines();

  assert.equal(scheduler.unmappedTask.length, 1);
  assert.equal(scheduler.getStats().missed.length, 0);

  scheduler.map(machine);
  scheduler.setTime(3.5);
  scheduler.processMachines();

  assert.equal(task.status, "MISSED");
  assert.equal(task.start_time, 2.5);
  assert.equal(task.end_time, 3.5);
  assert.equal(machine.queue.length, 0);
  assert.equal(scheduler.getStats().missed.length, 1);
});
