import test from "node:test";
import assert from "node:assert/strict";

import {
  getWorkspaceKind,
  getWorkspaceName,
  isWorkspaceNode,
} from "../utils/workspaceNodes.js";

test("Edge Space and Cloud Space are both recognized as workspace containers", () => {
  assert.equal(isWorkspaceNode({ type: "edgeSpace" }), true);
  assert.equal(isWorkspaceNode({ type: "cloudSpace" }), true);
  assert.equal(isWorkspaceNode({ type: "group" }), true);
  assert.equal(isWorkspaceNode({ type: "machineNode" }), false);
});

test("workspace metadata preserves whether a container is edge or cloud", () => {
  assert.equal(getWorkspaceKind("edgeSpace"), "edge");
  assert.equal(getWorkspaceKind("cloudSpace"), "cloud");
  assert.equal(getWorkspaceName("edgeSpace"), "Edge");
  assert.equal(getWorkspaceName("cloudSpace"), "Cloud");
});
