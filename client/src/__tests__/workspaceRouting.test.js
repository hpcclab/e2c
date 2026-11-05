import assert from "node:assert/strict";
import test from "node:test";

import { isConnectedToMachine } from "../utils/connections.js";
import { getSourceEdgeNetwork } from "../utils/edgeNetwork.js";
import {
  getSourceLoadBalancerId,
  isConnectedThroughLoadBalancer,
} from "../utils/loadBalancers.js";
import { SimulationEngine } from "../utils/simulationEngine.js";
import { generateWorkload } from "../utils/workloadGeneration.js";
import { attachDevicesToSpaces, applyDeviceMembership } from "../utils/workspaceMembership.js";

const routedWorkspace = () => {
  const nodes = [
    { id: "edge-space", type: "group", data: { workspaceType: "edge" } },
    {
      id: "nd_1",
      type: "iotNode",
      parentId: "edge-space",
    },
    { id: "cloud-space", type: "group", data: { workspaceType: "cloud" } },
    { id: "LBNode_0", type: "LBNode", parentId: "cloud-space" },
    { id: "10", type: "machineNode", parentId: "cloud-space" },
  ];
  const edges = [
    {
      source: "edge-space",
      target: "cloud-space",
      data: {
        properties: {
          networkType: "Custom",
          dataRateKbps: 8,
          uploadPowerW: 2,
        },
      },
    },
  ];
  return { nodes, edges };
};

test("an IoT dragged into an Edge Space sends all ten tasks through the Cloud load balancer", () => {
  const initial = [
    { id: "edge", type: "group", position: { x: 100, y: 100 }, style: { width: 400, height: 400 } },
    { id: "cloud", type: "group", position: { x: 700, y: 100 }, style: { width: 600, height: 500 } },
    { id: "nd_1", type: "iotNode", position: { x: 150, y: 200 }, measured: { width: 100, height: 100 } },
    { id: "LB", type: "LBNode", position: { x: 750, y: 200 }, measured: { width: 100, height: 100 } },
    ...[10, 11, 12].map((id, index) => ({ id: String(id), type: "machineNode", position: { x: 950, y: 150 + index * 120 }, measured: { width: 250, height: 100 } })),
  ];
  const edges = [{ source: "edge", target: "cloud" }, ...[10, 11, 12].map((id) => ({ source: "LB", target: String(id) }))];
  assert.equal(isConnectedToMachine("nd_1", 10, edges, initial), false);
  const nodes = attachDevicesToSpaces(initial);
  assert.equal(nodes.find((node) => node.id === "nd_1").parentId, "edge");
  assert.deepEqual(nodes.find((node) => node.id === "nd_1").position, { x: 50, y: 100 });
  assert.deepEqual(attachDevicesToSpaces(nodes), nodes);
  const properties = { task_type: "Sensor", numTasks: 10, startTime: 0, endTime: 15, distribution: "uniform", meanSize: 6, dataSizeStdDev: 1, slack: 2 };
  const tasks = generateWorkload(
    [{ srcID: 1, taskType: "Sensor", ...properties }],
    [{ srcID: 1, name: "Sensor", ...properties }],
    0, edges, "repro", nodes,
  );
  const machines = applyDeviceMembership([10, 11, 12].map((id) => ({ id, name: `Machine ${id}`, eet: { Sensor: 1 }, eetStdDev: { Sensor: 0 } })), nodes);
  const iot = applyDeviceMembership([{ id: 1, properties }], nodes, true);
  const result = new SimulationEngine({ nodes, edges, machines, iot, tasks, simulationSeed: "repro" }).advanceTo(30);
  assert.equal(result.complete, true);
  assert.equal(result.completed.length, 10);
  assert.equal(result.missed.length, 0);
  assert.ok(result.machines.every((machine) => machine.total_tasks > 0));
  assert.ok(result.completed.every((task) => task.load_balancer_id === "LB"));
});

test("devices outside a space keep their position and explicit membership stays intact", () => {
  const nodes = [
    { id: "space", type: "group", position: { x: 500, y: 200 }, style: { width: 400, height: 400 } },
    { id: "nd_1", type: "iotNode", position: { x: 10, y: 10 } },
    { id: "nd_2", type: "iotNode", parentId: "space", position: { x: 20, y: 60 } },
  ];
  assert.deepEqual(attachDevicesToSpaces(nodes), nodes);
});

test("an IoT inherits its workspace route to cloud resources", () => {
  const { nodes, edges } = routedWorkspace();

  assert.equal(isConnectedToMachine("nd_1", 10, edges, nodes), true);
  assert.equal(
    getSourceLoadBalancerId("nd_1", edges, nodes),
    "LBNode_0",
  );
  assert.equal(
    isConnectedThroughLoadBalancer(
      "nd_1",
      10,
      "LBNode_0",
      edges,
      nodes,
    ),
    true,
  );
});

test("the simulation processes a task through workspace gateways", () => {
  const { nodes, edges } = routedWorkspace();
  const engine = new SimulationEngine({
    policyAlias: "FCFS",
    machines: [
      {
        id: 10,
        name: "Cloud Machine",
        queue: [],
        eet: { "1::Sensor": 0.1, Sensor: 0.1 },
        eetStdDev: { "1::Sensor": 0, Sensor: 0 },
      },
    ],
    iot: [{ id: 1, properties: { task_type: "Sensor" } }],
    tasks: [
      {
        id: 1,
        source_id: 1,
        task_type: "Sensor",
        generation_time: 0,
        arrival_time: 0,
        deadline: 5,
      },
    ],
    edges,
    nodes,
  });

  const snapshot = engine.advanceTo(0.2);
  assert.equal(snapshot.complete, true);
  assert.equal(snapshot.completed.length, 1);
  assert.equal(snapshot.completed[0].load_balancer_id, "LBNode_0");
  assert.equal(snapshot.completed[0].assigned_machine, "Cloud Machine");
});

test("an IoT inherits network speed and upload power from its workspace edge", () => {
  const { nodes, edges } = routedWorkspace();

  assert.deepEqual(getSourceEdgeNetwork(1, edges, {}, nodes), {
    networkType: "Custom",
    dataRateKbps: 8,
    uploadPowerW: 2,
  });

  const workload = generateWorkload(
    [
      {
        srcID: 1,
        taskType: "Sensor",
        numTasks: 1,
        startTime: 0,
        endTime: 0,
        distribution: "uniform",
      },
    ],
    [
      {
        srcID: 1,
        name: "Sensor",
        meanSize: 8,
        dataSizeStdDev: 0,
        slack: 20,
      },
    ],
    0,
    edges,
    "workspace-network",
    nodes,
  );

  assert.equal(workload[0].travel_time, 8);
  assert.equal(workload[0].network_energy_j, 16);
});

test("a direct IoT connection takes precedence over its workspace connection", () => {
  const { nodes, edges } = routedWorkspace();
  const directEdge = {
    source: "nd_1",
    target: "10",
    data: {
      properties: {
        networkType: "Bluetooth",
        dataRateKbps: 400,
        uploadPowerW: 0.05,
      },
    },
  };

  assert.deepEqual(getSourceEdgeNetwork(1, [...edges, directEdge], {}, nodes), {
    networkType: "Bluetooth",
    dataRateKbps: 400,
    uploadPowerW: 0.05,
  });
});

test("an IoT cannot borrow a sibling IoT's private connection", () => {
  const nodes = [
    { id: "edge-space", type: "group" },
    { id: "nd_1", type: "iotNode", parentId: "edge-space" },
    { id: "nd_2", type: "iotNode", parentId: "edge-space" },
    { id: "10", type: "machineNode" },
  ];
  const edges = [{ source: "nd_2", target: "10" }];

  assert.equal(isConnectedToMachine("nd_1", 10, edges, nodes), false);
  assert.equal(isConnectedToMachine("nd_2", 10, edges, nodes), true);
});
