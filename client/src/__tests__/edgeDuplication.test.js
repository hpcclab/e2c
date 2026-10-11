import assert from "node:assert/strict";
import test from "node:test";

import { duplicateEdgeProperties } from "../utils/edgeDuplication.js";

test("duplicating an edge copies network type and speed to the target", () => {
  const source = {
    id: "edge-a",
    source: "nd_1",
    target: "2",
    data: {
      properties: { networkType: "Bluetooth", dataRateKbps: 725 },
    },
  };
  const target = {
    id: "edge-b",
    source: "nd_3",
    target: "4",
    data: {
      properties: { networkType: "Ethernet", dataRateKbps: 100000 },
    },
  };

  const copied = duplicateEdgeProperties(source, target);

  assert.equal(copied.id, "edge-b");
  assert.equal(copied.source, "nd_3");
  assert.equal(copied.target, "4");
  assert.deepEqual(copied.data.properties, {
    networkType: "Bluetooth",
    dataRateKbps: 725,
  });
  assert.notEqual(copied.data.properties, source.data.properties);
});

test("legacy edge settings are resolved before being copied", () => {
  const source = { id: "edge-a", source: "nd_1", target: "2" };
  const target = { id: "edge-b", source: "nd_3", target: "4" };
  const sources = [
    {
      id: 1,
      properties: { connectivity: "WiFi", dataRateKbps: 12345 },
    },
  ];

  const copied = duplicateEdgeProperties(source, target, sources);

  assert.equal(copied.data.properties.networkType, "WiFi");
  assert.equal(copied.data.properties.dataRateKbps, 12345);
});
