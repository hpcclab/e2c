import assert from "node:assert/strict";
import test from "node:test";
import {
  createLoadBalancerIdentity,
  createUniqueLoadBalancerName,
  createUniqueNodeId,
  getLoadBalancerDisplayName,
  getSourceLoadBalancerId,
} from "../utils/loadBalancers.js";
import { SimulationEngine } from "../utils/simulationEngine.js";

test("new load balancers receive unique IDs even after loading existing nodes", () => {
  const nodes = [
    { id: "LBNode_0", type: "LBNode" },
    { id: "LBNode_2", type: "LBNode" },
  ];

  assert.equal(createUniqueNodeId("LBNode", nodes), "LBNode_1");
});

test("new load balancers receive distinct visible names", () => {
  const nodes = [
    { id: "LBNode_0", type: "LBNode", data: { name: "Load Balancer 1" } },
    { id: "LBNode_1", type: "LBNode", data: { name: "Load Balancer 2" } },
  ];

  assert.equal(createUniqueLoadBalancerName(nodes), "Load Balancer 3");
  assert.equal(getLoadBalancerDisplayName("LBNode_0"), "Load Balancer 1");
});

test("new load balancers receive machine-style numeric identities", () => {
  const timestamp = 1_730_776_284_827;

  assert.deepEqual(createLoadBalancerIdentity([], timestamp), {
    id: "LBNode_1730776284827",
    name: "Load Balancer 4827",
  });
});

test("load balancer numeric identities avoid existing IDs and names", () => {
  const nodes = [
    {
      id: "LBNode_1730776284827",
      type: "LBNode",
      data: { name: "Load Balancer 4827" },
    },
  ];

  assert.deepEqual(createLoadBalancerIdentity(nodes, 1_730_776_284_827), {
    id: "LBNode_1730776284828",
    name: "Load Balancer 4828",
  });
});

test("a task route identifies its own load balancer", () => {
  const nodes = [
    { id: "LBNode_0", type: "LBNode" },
    { id: "LBNode_1", type: "LBNode" },
  ];
  const edges = [
    { source: "nd_1", target: "LBNode_0" },
    { source: "nd_2", target: "LBNode_1" },
  ];

  assert.equal(getSourceLoadBalancerId("nd_1", edges, nodes), "LBNode_0");
  assert.equal(getSourceLoadBalancerId("nd_2", edges, nodes), "LBNode_1");
});

test("simulation snapshots retain each task's load balancer route", () => {
  const engine = new SimulationEngine({
    policyAlias: "MM",
    schedulingMode: "batch",
    batchIntervalSeconds: 5,
    machines: [
      {
        id: 10,
        name: "Machine A",
        queue: [],
        eet: { "1::A": 1, A: 1 },
        eetStdDev: { "1::A": 0, A: 0 },
      },
      {
        id: 20,
        name: "Machine B",
        queue: [],
        eet: { "2::B": 1, B: 1 },
        eetStdDev: { "2::B": 0, B: 0 },
      },
    ],
    iot: [
      { id: 1, properties: { task_type: "A" } },
      { id: 2, properties: { task_type: "B" } },
    ],
    tasks: [
      {
        id: 1,
        source_id: 1,
        task_type: "A",
        generation_time: 0,
        arrival_time: 0,
        deadline: 20,
      },
      {
        id: 2,
        source_id: 2,
        task_type: "B",
        generation_time: 0,
        arrival_time: 0,
        deadline: 20,
      },
    ],
    nodes: [
      { id: "LBNode_0", type: "LBNode" },
      { id: "LBNode_1", type: "LBNode" },
    ],
    edges: [
      { source: "nd_1", target: "LBNode_0" },
      { source: "LBNode_0", target: "10" },
      { source: "nd_2", target: "LBNode_1" },
      { source: "LBNode_1", target: "20" },
    ],
  });

  const routes = engine
    .getSnapshot()
    .unassigned.map((task) => task.load_balancer_id)
    .sort();
  assert.deepEqual(routes, ["LBNode_0", "LBNode_1"]);
});

test("multiple load balancers use independent scheduling modes", () => {
  const engine = new SimulationEngine({
    policyAlias: "FCFS",
    schedulingMode: "immediate",
    machines: [
      {
        id: 10,
        name: "Immediate Machine",
        queue: [],
        eet: { "1::A": 0.1, A: 0.1 },
        eetStdDev: { "1::A": 0, A: 0 },
      },
      {
        id: 20,
        name: "Batch Machine",
        queue: [],
        eet: { "2::B": 0.1, B: 0.1 },
        eetStdDev: { "2::B": 0, B: 0 },
      },
    ],
    iot: [
      { id: 1, properties: { task_type: "A" } },
      { id: 2, properties: { task_type: "B" } },
    ],
    tasks: [
      {
        id: 1,
        source_id: 1,
        task_type: "A",
        generation_time: 0,
        arrival_time: 0,
        deadline: 20,
      },
      {
        id: 2,
        source_id: 2,
        task_type: "B",
        generation_time: 0,
        arrival_time: 0,
        deadline: 20,
      },
    ],
    nodes: [
      {
        id: "LBNode_0",
        type: "LBNode",
        data: { schedulingMode: "immediate", policyAlias: "FCFS" },
      },
      {
        id: "LBNode_1",
        type: "LBNode",
        data: {
          schedulingMode: "batch",
          policyAlias: "MM",
          batchIntervalSeconds: 2,
        },
      },
    ],
    edges: [
      { source: "nd_1", target: "LBNode_0" },
      { source: "LBNode_0", target: "10" },
      { source: "nd_2", target: "LBNode_1" },
      { source: "LBNode_1", target: "20" },
    ],
  });

  const beforeBatch = engine.advanceTo(1);
  assert.equal(beforeBatch.completed.some((task) => task.id === 1), true);
  assert.equal(
    beforeBatch.unassigned.find((task) => task.id === 2)?.status,
    "WAITING_FOR_BATCH",
  );

  const afterBatch = engine.advanceTo(2.2);
  assert.equal(afterBatch.completed.some((task) => task.id === 2), true);
});
