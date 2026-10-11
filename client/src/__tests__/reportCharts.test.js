import assert from "node:assert/strict";
import test from "node:test";

import { buildMachineChartData } from "../utils/reportCharts.js";

const machines = [
  {
    id: 10,
    name: "Machine A",
    power: 100,
    price: 2,
    utilization_time: 3 / 3600,
  },
  {
    id: 11,
    name: "Machine B",
    power: 50,
    price: 1,
    utilization_time: 0,
  },
];

const sources = [
  {
    id: 1,
    name: "Camera",
    properties: { task_type: "image", taskColor: "Sky" },
  },
  {
    id: 2,
    name: "Thermostat",
    properties: { task_type: "temperature", taskColor: "Rose" },
  },
];

test("segments each machine by IoT and uses the IoT task colors", () => {
  const result = buildMachineChartData({
    machines,
    sources,
    tasks: [
      {
        source_id: 1,
        task_type: "image",
        assigned_machine: "Machine A",
        start_time: 0,
        end_time: 1,
      },
      {
        source_id: 2,
        task_type: "temperature",
        assigned_machine: "Machine A",
        start_time: 1,
        end_time: 3,
      },
    ],
  });

  assert.deepEqual(result.segments, [
    { key: "source_1", name: "Camera", color: "#0369a1" },
    { key: "source_2", name: "Thermostat", color: "#9f1239" },
  ]);
  assert.deepEqual(result.taskCounts[0], {
    name: "Machine A",
    source_1: 1,
    source_2: 1,
  });
  assert.equal(result.taskCounts[1].source_1, 0);
  assert.equal(result.taskCounts[1].source_2, 0);
});

test("splits machine energy and cost by each IoT's actual runtime", () => {
  const result = buildMachineChartData({
    machines,
    sources,
    tasks: [
      {
        source_id: 1,
        assigned_machine: "Machine A",
        start_time: 0,
        end_time: 1,
      },
      {
        source_id: 2,
        assigned_machine: "Machine A #2",
        start_time: 1,
        end_time: 3,
      },
    ],
  });

  const totalEnergy = result.energy[0].source_1 + result.energy[0].source_2;
  const totalCost = result.cost[0].source_1 + result.cost[0].source_2;

  assert.ok(Math.abs(result.energy[0].source_2 / totalEnergy - 2 / 3) < 1e-12);
  assert.ok(Math.abs(totalEnergy - (100 * (3 / 3600)) / 1000) < 1e-12);
  assert.equal(totalCost, 6);
});
