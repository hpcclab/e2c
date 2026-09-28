import assert from "node:assert/strict";
import test from "node:test";
import { calculateSuggestedSlack } from "../utils/slackSuggestion.js";
import { sourceEetKey } from "../utils/executionTime.js";

const source = {
  id: 7,
  name: "Camera",
  properties: {
    task_type: "Camera task",
    meanSize: 100,
    dataSizeStdDev: 20,
    connectivity: "WiFi",
  },
};

function machine(id, mean, stdDev) {
  return {
    id,
    eet: { [sourceEetKey(source.id)]: mean },
    eetStdDev: { [sourceEetKey(source.id)]: stdDev },
  };
}

test("suggested slack combines conservative transfer and execution times", () => {
  const result = calculateSuggestedSlack({
    source,
    machines: [machine(1, 1, 0.25)],
    edges: [{ source: "nd_7", target: "1" }],
  });

  assert.equal(result.slack, 1.44);
  assert.equal(result.connectedMachineCount, 1);
  assert.ok(result.transferTime > 0);
  assert.ok(result.executionTime > 1);
});

test("suggested slack uses the slowest connected machine", () => {
  const result = calculateSuggestedSlack({
    source,
    machines: [machine(1, 1, 0), machine(2, 2, 0.5)],
    edges: [
      { source: "nd_7", target: "1" },
      { source: "nd_7", target: "2" },
    ],
  });

  assert.equal(result.executionTime, 2.8225);
  assert.equal(result.connectedMachineCount, 2);
});

test("suggested slack requires a connected machine", () => {
  assert.equal(
    calculateSuggestedSlack({ source, machines: [machine(1, 1, 0)] }),
    null,
  );
});

test("load-balancer paths count as connected", () => {
  const result = calculateSuggestedSlack({
    source,
    machines: [machine(1, 1, 0)],
    nodes: [{ id: "lb-1", type: "LBNode" }],
    edges: [
      { source: "nd_7", target: "lb-1" },
      { source: "lb-1", target: "1" },
    ],
  });

  assert.equal(result.connectedMachineCount, 1);
});
