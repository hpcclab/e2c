import assert from "node:assert/strict";
import test from "node:test";

import {
  createEdgeNetworkProperties,
  formatDataRate,
  getEdgeNetworkVisual,
  getSourceEdgeNetwork,
  resolveEdgeNetwork,
} from "../utils/edgeNetwork.js";

test("new edge settings can inherit a legacy IoT connection", () => {
  assert.deepEqual(
    createEdgeNetworkProperties({
      connectivity: "Bluetooth",
      dataRateKbps: 500,
    }),
    { networkType: "Bluetooth", dataRateKbps: 500 },
  );
});

test("explicit edge settings override the source fallback", () => {
  const network = resolveEdgeNetwork(
    {
      data: {
        properties: { networkType: "LTE", dataRateKbps: 4200 },
      },
    },
    { connectivity: "WiFi", dataRateKbps: 54000 },
  );

  assert.deepEqual(network, { networkType: "LTE", dataRateKbps: 4200 });
});

test("an edge type without a saved speed receives that type's default", () => {
  const network = resolveEdgeNetwork(
    { data: { properties: { networkType: "Bluetooth" } } },
    { connectivity: "WiFi", dataRateKbps: 54000 },
  );

  assert.deepEqual(network, { networkType: "Bluetooth", dataRateKbps: 800 });
});

test("a source with several routes uses the slowest outgoing edge", () => {
  const network = getSourceEdgeNetwork(7, [
    {
      source: "nd_7",
      target: "1",
      data: { properties: { networkType: "WiFi", dataRateKbps: 54000 } },
    },
    {
      source: "nd_7",
      target: "2",
      data: { properties: { networkType: "Bluetooth", dataRateKbps: 800 } },
    },
  ]);

  assert.deepEqual(network, { networkType: "Bluetooth", dataRateKbps: 800 });
});

test("network visuals and speed labels communicate the link type", () => {
  assert.equal(getEdgeNetworkVisual("Ethernet").dash, undefined);
  assert.equal(getEdgeNetworkVisual("Bluetooth").dash, "2 6");
  assert.equal(formatDataRate(54000), "54 Mbps");
  assert.equal(formatDataRate(800), "800 Kbps");
});
