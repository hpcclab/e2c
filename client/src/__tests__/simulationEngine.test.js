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

test("the simulation seed reproduces execution-time randomness", () => {
  const tasks = Array.from({ length: 6 }, (_, index) => ({
    task_type: "Task A",
    source_id: 7,
    generation_time: 0,
    arrival_time: 0,
    deadline: 100,
    status: "NEW",
    id: index + 1,
  }));
  const overrides = {
    simulationSeed: "complete-experiment-seed",
    machines: [{
      id: 1,
      name: "Machine 1",
      price: 0,
      queue: [],
      eet: { "7::Task A": 1, "Task A": 1 },
      eetStdDev: { "7::Task A": 0.25, "Task A": 0.25 },
    }],
    tasks,
  };

  const first = buildEngine(overrides).advanceTo(100).results;
  const repeated = buildEngine(overrides).advanceTo(100).results;
  const changed = buildEngine({
    ...overrides,
    simulationSeed: "another-experiment-seed",
  }).advanceTo(100).results;

  assert.deepEqual(
    repeated.map((task) => task.execution_time),
    first.map((task) => task.execution_time),
  );
  assert.notDeepEqual(
    changed.map((task) => task.execution_time),
    first.map((task) => task.execution_time),
  );
});

test("an IoT battery limits generation and reports ungenerated tasks", () => {
  const tasks = Array.from({ length: 3 }, (_, index) => ({
    task_type: "Task A",
    source_id: 7,
    generation_time: index * 0.01,
    arrival_time: index * 0.01,
    deadline: 5,
    status: "NEW",
  }));
  const engine = buildEngine({
    iot: [{
      id: 7,
      properties: {
        task_type: "Task A",
        energySource: "Battery",
        batteryCapacityJ: 2,
        generationEnergyPerTaskJ: 1,
      },
    }],
    tasks,
  });

  assert.equal(engine.getSnapshot().iot[0].properties.batteryRemainingJ, 1);

  const snapshot = engine.advanceTo(1);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.completed.length, 2);
  assert.equal(snapshot.missed.length, 1);
  assert.equal(snapshot.missed[0].status, "NOT_GENERATED");
  assert.equal(snapshot.missed[0].failure_reason, "IOT_BATTERY_DEPLETED");
  assert.equal(snapshot.iot[0].properties.batteryRemainingJ, 0);
});

test("a machine battery limits processing and reports DNR tasks", () => {
  const tasks = Array.from({ length: 3 }, () => ({
    task_type: "Task A",
    source_id: 7,
    generation_time: 0,
    arrival_time: 0,
    deadline: 5,
    status: "NEW",
  }));
  const engine = buildEngine({
    machines: [{
      id: 1,
      name: "Machine 1",
      energySource: "Battery",
      batteryCapacityJ: 2,
      processingEnergyPerTaskJ: 1,
      queue: [],
      eet: { "7::Task A": 0.1, "Task A": 0.1 },
      eetStdDev: { "7::Task A": 0, "Task A": 0 },
    }],
    tasks,
  });

  const snapshot = engine.advanceTo(1);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.completed.length, 2);
  assert.equal(snapshot.missed.length, 1);
  assert.equal(snapshot.missed[0].status, "DNR");
  assert.equal(snapshot.missed[0].failure_reason, "MACHINE_BATTERY_DEPLETED");
  assert.equal(snapshot.machines[0].batteryRemainingJ, 0);
  assert.equal(snapshot.machines[0].energyConsumedJ, 2);
});

test("a zero-capacity battery stops the simulation instead of hanging", () => {
  const engine = buildEngine({
    machines: [{
      id: 1,
      name: "Machine 1",
      energySource: "Battery",
      batteryCapacityJ: 0,
      processingEnergyPerTaskJ: 1,
      queue: [],
      eet: { "Task A": 0.1 },
      eetStdDev: { "Task A": 0 },
    }],
  });

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.time, 0);
  assert.equal(snapshot.missed[0].failure_reason, "MACHINE_BATTERY_DEPLETED");
});

test("a zero-capacity IoT battery prevents generation and completes immediately", () => {
  const engine = buildEngine({
    iot: [{
      id: 7,
      properties: {
        task_type: "Task A",
        energySource: "Battery",
        batteryCapacityJ: 0,
        generationEnergyPerTaskJ: 1,
      },
    }],
  });

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.time, 0);
  assert.equal(snapshot.missed[0].status, "NOT_GENERATED");
  assert.equal(snapshot.missed[0].failure_reason, "IOT_BATTERY_DEPLETED");
});

test("grid-powered devices ignore battery capacity", () => {
  const engine = buildEngine({
    machines: [{
      id: 1,
      name: "Machine 1",
      energySource: "Grid-Powered",
      batteryCapacityJ: 0,
      processingEnergyPerTaskJ: 3,
      queue: [],
      eet: { "Task A": 0.1 },
      eetStdDev: { "Task A": 0 },
    }],
  });

  const snapshot = engine.advanceTo(1);
  assert.equal(snapshot.completed.length, 1);
  assert.equal(snapshot.missed.length, 0);
  assert.equal(snapshot.machines[0].energyConsumedJ, 3);
});

test("generation, upload, and processing energy scale with task data size", () => {
  const engine = buildEngine({
    iot: [{
      id: 7,
      properties: {
        task_type: "Task A",
        generationEnergyPerKbJ: 0.25,
      },
    }],
    machines: [{
      id: 1,
      name: "Machine 1",
      processingEnergyPerKbJ: 0.5,
      queue: [],
      eet: { "7::Task A": 0.1, "Task A": 0.1 },
      eetStdDev: { "7::Task A": 0, "Task A": 0 },
    }],
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      data_size: 8,
      generation_time: 0,
      arrival_time: 0,
      network_energy_j: 3,
      deadline: 1,
      status: "NEW",
    }],
  });

  const snapshot = engine.advanceTo(1);
  const task = snapshot.completed[0];
  assert.equal(task.generation_energy_j, 2);
  assert.equal(task.network_energy_j, 3);
  assert.equal(task.source_energy_j, 5);
  assert.equal(task.processing_energy_j, 4);
  assert.equal(snapshot.iot[0].properties.energyConsumedJ, 5);
  assert.equal(snapshot.machines[0].energyConsumedJ, 4);
});

test("an unaffordable source task exhausts the remaining IoT battery", () => {
  const engine = buildEngine({
    iot: [{
      id: 7,
      properties: {
        task_type: "Task A",
        energySource: "Battery",
        batteryCapacityJ: 10,
        generationEnergyPerKbJ: 3,
      },
    }],
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      data_size: 10,
      generation_time: 0,
      arrival_time: 0,
      deadline: 5,
      status: "NEW",
    }],
  });

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.iot[0].properties.batteryRemainingJ, 0);
  assert.equal(snapshot.iot[0].properties.energyConsumedJ, 10);
  assert.equal(snapshot.missed[0].status, "NOT_GENERATED");
});

test("an unaffordable processing task exhausts the remaining machine battery", () => {
  const engine = buildEngine({
    machines: [{
      id: 1,
      name: "Machine 1",
      energySource: "Battery",
      batteryCapacityJ: 10,
      processingEnergyPerKbJ: 3,
      queue: [],
      eet: { "7::Task A": 0.1, "Task A": 0.1 },
      eetStdDev: { "7::Task A": 0, "Task A": 0 },
    }],
    tasks: [{
      task_type: "Task A",
      source_id: 7,
      data_size: 10,
      generation_time: 0,
      arrival_time: 0,
      deadline: 5,
      status: "NEW",
    }],
  });

  const snapshot = engine.getSnapshot();
  assert.equal(snapshot.machines[0].batteryRemainingJ, 0);
  assert.equal(snapshot.machines[0].energyConsumedJ, 10);
  assert.equal(snapshot.missed[0].status, "DNR");
});
