import assert from "node:assert/strict";
import test from "node:test";
import { planMachineMove } from "../utils/moveMachine.js";

test("moving into a space reserves room below existing children and expands the space", () => {
  const nodes = [
    { id: "space", type: "group", position: { x: 500, y: 300 }, style: { width: 280, height: 250 } },
    { id: "existing", parentId: "space", position: { x: 24, y: 60 }, measured: { width: 200, height: 100 } },
    { id: "machine", type: "machineNode", position: { x: 0, y: 0 }, measured: { width: 300, height: 100 } },
  ];
  assert.deepEqual(planMachineMove(nodes, "machine", "space"), {
    parentId: "space", extent: "parent", position: { x: 24, y: 184 },
    workspaceSize: { width: 348, height: 308 },
  });
});

test("moving out removes containment and places the machine outside its space", () => {
  const nodes = [
    { id: "outer", type: "group", position: { x: 100, y: 200 } },
    { id: "space", type: "group", parentId: "outer", position: { x: 50, y: 30 }, style: { width: 400 } },
    { id: "machine", type: "machineNode", parentId: "space", position: { x: 24, y: 60 } },
  ];
  assert.deepEqual(planMachineMove(nodes, "machine"), {
    parentId: undefined, extent: undefined, position: { x: 582, y: 290 },
  });
});

test("machine moves reject invalid destinations", () => {
  const nodes = [{ id: "machine", type: "machineNode", position: { x: 0, y: 0 } }];
  assert.equal(planMachineMove(nodes, "machine", "missing"), null);
  assert.equal(planMachineMove(nodes, "machine", "machine"), null);
});
