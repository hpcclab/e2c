import test from "node:test";
import assert from "node:assert/strict";
import { adoptUserNodes, nodeHasDimensions } from "@xyflow/system";
import { syncDeviceNodes } from "../utils/syncDeviceNodes.js";
import { SimulationEngine } from "../utils/simulationEngine.js";
import { applyDeviceMembership } from "../utils/workspaceMembership.js";

test("batch snapshots preserve measured, visible nodes in the IoT-to-space topology", () => {
  const initial = [
    { id: "space", type: "group", position: { x: 500, y: 0 }, measured: { width: 700, height: 600 }, data: {} },
    { id: "nd_1", type: "iotNode", position: { x: 0, y: 100 }, measured: { width: 120, height: 100 }, selected: true, data: {} },
    { id: "LB", type: "LBNode", parentId: "space", position: { x: 20, y: 200 }, measured: { width: 200, height: 100 }, data: { schedulingMode: "batch", policyAlias: "MM", batchIntervalSeconds: 2 } },
    ...[10, 11, 12].map((id, index) => ({ id: String(id), type: "machineNode", parentId: "space", position: { x: 300, y: 20 + index * 180 }, measured: { width: 250, height: 100 }, data: {} })),
  ];
  const edges = [{ source: "nd_1", target: "space" }, ...[10, 11, 12].map((id) => ({ source: "LB", target: String(id) }))];
  const machines = applyDeviceMembership([10, 11, 12].map((id) => ({ id, eet: { Sensor: 1 }, eetStdDev: { Sensor: 0 } })), initial);
  const iot = applyDeviceMembership([{ id: 1, properties: { task_type: "Sensor" } }], initial, true);
  const tasks = Array.from({ length: 10 }, (_, id) => ({ id, source_id: 1, task_type: "Sensor", data_size: 6, generation_time: id / 10, arrival_time: id / 10, deadline: 30 }));
  const engine = new SimulationEngine({ nodes: initial, edges, machines, iot, tasks, simulationSeed: "visibility" });
  let nodes = initial;
  const lookup = new Map();
  const parents = new Map();
  for (let time = 0; time <= 12; time += 0.1) {
    const snapshot = engine.advanceTo(time);
    if (time < 2) assert.equal(snapshot.completed.length, 0);
    nodes = syncDeviceNodes(syncDeviceNodes(nodes, structuredClone(snapshot.machines)), structuredClone(snapshot.iot), true);
    adoptUserNodes(nodes, lookup, parents);
    assert.deepEqual(nodes.map((node) => node.id), initial.map((node) => node.id));
    for (const node of nodes) {
      const before = initial.find((item) => item.id === node.id);
      assert.deepEqual(node.position, before.position);
      assert.deepEqual(node.measured, before.measured);
      assert.equal(node.parentId, before.parentId);
      assert.equal(nodeHasDimensions(lookup.get(node.id)), true, `${node.id} must remain visible at ${time}`);
    }
    assert.equal(nodes[1].selected, true);
    assert.equal(nodes[0], initial[0]);
    assert.equal(nodes[2], initial[2]);
  }
  assert.equal(engine.advanceTo(30).completed.length, 10);
});

test("device synchronization still supports adding, removing and moving nodes", () => {
  const group = { id: "space", type: "group", position: { x: 0, y: 0 } };
  const added = syncDeviceNodes([group], [{ id: 10, position: { x: 10, y: 20 }, parentId: "space" }]);
  assert.equal(added[1].parentId, "space");
  const moved = syncDeviceNodes(added, [{ id: 10, position: { x: 800, y: 200 } }]);
  assert.equal(moved[1].parentId, undefined);
  assert.deepEqual(moved[1].position, { x: 800, y: 200 });
  assert.deepEqual(syncDeviceNodes(moved, []), [group]);
});
