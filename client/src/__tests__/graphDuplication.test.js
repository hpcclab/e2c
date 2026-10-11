import assert from "node:assert/strict";
import test from "node:test";
import { planGraphDuplication } from "../utils/graphDuplication.js";

test("duplicates a selected graph and preserves its internal connections", () => {
  const nodes = [
    { id: "iot-1", type: "iotNode", position: { x: 10, y: 20 } },
    { id: "machine-1", type: "machineNode", position: { x: 210, y: 20 } },
    { id: "outside", type: "machineNode", position: { x: 500, y: 20 } },
  ];
  const edges = [
    {
      id: "e-internal",
      source: "iot-1",
      target: "machine-1",
      data: { properties: { networkType: "WiFi", dataRateKbps: 54000 } },
    },
    { id: "e-external", source: "machine-1", target: "outside" },
  ];

  const plan = planGraphDuplication({
    nodes,
    edges,
    selectedNodeIds: ["iot-1", "machine-1"],
    createNodeId: (node) => `${node.id}-copy`,
  });

  assert.deepEqual(
    plan.duplicatedNodes.map(({ id, position }) => ({ id, position })),
    [
      { id: "iot-1-copy", position: { x: 60, y: 70 } },
      { id: "machine-1-copy", position: { x: 260, y: 70 } },
    ],
  );
  assert.equal(plan.duplicatedEdges.length, 1);
  assert.equal(plan.duplicatedEdges[0].source, "iot-1-copy");
  assert.equal(plan.duplicatedEdges[0].target, "machine-1-copy");
  assert.deepEqual(plan.duplicatedEdges[0].data, edges[0].data);
  assert.notEqual(plan.duplicatedEdges[0].data, edges[0].data);
});

test("selecting a container also duplicates its descendants without shifting them twice", () => {
  const nodes = [
    { id: "group-1", type: "group", position: { x: 100, y: 100 } },
    {
      id: "child-1",
      type: "machineNode",
      parentId: "group-1",
      position: { x: 20, y: 30 },
    },
  ];

  const plan = planGraphDuplication({
    nodes,
    edges: [],
    selectedNodeIds: ["group-1"],
    createNodeId: (node) => `${node.id}-copy`,
  });

  assert.equal(plan.duplicatedNodes.length, 2);
  assert.deepEqual(plan.duplicatedNodes[0].position, { x: 150, y: 150 });
  assert.equal(plan.duplicatedNodes[1].parentId, "group-1-copy");
  assert.deepEqual(plan.duplicatedNodes[1].position, { x: 20, y: 30 });
});
