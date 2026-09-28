import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateArrivalTime,
  calculateTravelTime,
  getConnectivityDataRateKbps,
  resolveDataRateKbps,
} from "../utils/networkDelay.js";

test("connection types use representative data rates in Kbps", () => {
  assert.equal(getConnectivityDataRateKbps("Bluetooth"), 800);
  assert.equal(getConnectivityDataRateKbps("LTE"), 8800);
  assert.equal(getConnectivityDataRateKbps("5G"), 22600);
  assert.equal(getConnectivityDataRateKbps("WiFi"), 54000);
  assert.equal(getConnectivityDataRateKbps("Ethernet"), 100000);
});

test("travel time grows with data size and slower connections", () => {
  assert.equal(calculateTravelTime(100, "Bluetooth"), 1);
  assert.equal(calculateTravelTime(200, "Bluetooth"), 2);
  assert.ok(
    calculateTravelTime(100, "Bluetooth") >
      calculateTravelTime(100, "WiFi"),
  );
});

test("machine arrival is generation time plus travel time", () => {
  assert.equal(calculateArrivalTime(2, 100, "Bluetooth"), 3);
  assert.equal(calculateArrivalTime(2, 0, "Bluetooth"), 2);
});

test("the configured data rate overrides any connectivity default", () => {
  assert.equal(getConnectivityDataRateKbps("Custom", 400), 400);
  assert.equal(getConnectivityDataRateKbps("WiFi", 400), 400);
  assert.equal(calculateTravelTime(100, "Custom", 400), 2);
  assert.equal(calculateArrivalTime(2, 100, "Custom", 400), 4);
  assert.equal(getConnectivityDataRateKbps("Custom", 0), 1000);
});

test("legacy custom KB/s values migrate to Kbps", () => {
  assert.equal(
    resolveDataRateKbps({ connectivity: "Custom", customThroughputKbps: 125 }),
    1000,
  );
});
