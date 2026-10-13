import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSuggestedSlack,
  shouldApplySlackSuggestion,
} from "../utils/slackSuggestion.js";
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

test("suggested slack uses the network configured on the source edge", () => {
  const result = calculateSuggestedSlack({
    source,
    machines: [machine(1, 1, 0.25)],
    edges: [{
      source: "nd_7",
      target: "1",
      data: {
        properties: { networkType: "Bluetooth", dataRateKbps: 800 },
      },
    }],
  });

  assert.equal(result.slack, 2.75);
  assert.ok(result.transferTime > 1);
});

test("suggested slack includes queueing for a ten-task burst", () => {
  const burstSource = {
    ...source,
    properties: {
      ...source.properties,
      meanSize: 0,
      dataSizeStdDev: 0,
      numTasks: 10,
      startTime: 0,
      endTime: 0,
      distribution: "uniform",
      arrivalSeed: "burst",
    },
  };
  const result = calculateSuggestedSlack({
    source: burstSource,
    sources: [burstSource],
    machines: [machine(1, 1, 0)],
    edges: [{ source: "nd_7", target: "1" }],
    policyAlias: "FCFS",
  });

  assert.equal(result.queueAware, true);
  assert.equal(result.predictedTasks, 10);
  assert.ok(result.slack >= 10);
});

test("suggested slack accounts for another IoT sharing the machine", () => {
  const configuredSource = {
    ...source,
    properties: {
      ...source.properties,
      meanSize: 0,
      dataSizeStdDev: 0,
      numTasks: 2,
      startTime: 0,
      endTime: 0,
      distribution: "uniform",
      arrivalSeed: "shared-queue",
    },
  };
  const competitor = {
    id: 8,
    name: "Competitor",
    properties: {
      ...configuredSource.properties,
      task_type: "Competitor task",
    },
  };
  const sharedMachine = {
    id: 1,
    eet: {
      [sourceEetKey(configuredSource.id)]: 1,
      [sourceEetKey(competitor.id)]: 1,
    },
    eetStdDev: {
      [sourceEetKey(configuredSource.id)]: 0,
      [sourceEetKey(competitor.id)]: 0,
    },
  };
  const withoutCompetitor = calculateSuggestedSlack({
    source: configuredSource,
    sources: [configuredSource],
    machines: [sharedMachine],
    edges: [{ source: "nd_7", target: "1" }],
  });
  const withCompetitor = calculateSuggestedSlack({
    source: configuredSource,
    sources: [configuredSource, competitor],
    machines: [sharedMachine],
    edges: [
      { source: "nd_7", target: "1" },
      { source: "nd_8", target: "1" },
    ],
  });

  assert.ok(withCompetitor.slack > withoutCompetitor.slack);
});

test("locking Slack prevents automatic suggestions from replacing it", () => {
  assert.equal(
    shouldApplySlackSuggestion({
      locked: true,
      lastAppliedSuggestion: 1,
      suggestedSlack: 2,
    }),
    false,
  );
  assert.equal(
    shouldApplySlackSuggestion({
      locked: false,
      lastAppliedSuggestion: 1,
      suggestedSlack: 2,
    }),
    true,
  );
});
