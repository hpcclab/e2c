import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateArrivalTime,
  calculateTravelTime,
  getConnectivityThroughput,
} from "../utils/networkDelay.js";

test("connection types use documented representative throughput values", () => {
  assert.equal(getConnectivityThroughput("Bluetooth"), 100);
  assert.equal(getConnectivityThroughput("LTE"), 1100);
  assert.equal(getConnectivityThroughput("5G"), 2825);
  assert.equal(getConnectivityThroughput("WiFi"), 6750);
  assert.equal(getConnectivityThroughput("Ethernet"), 12500);
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

test("custom connectivity uses the supplied positive transfer rate", () => {
  assert.equal(getConnectivityThroughput("Custom", 50), 50);
  assert.equal(calculateTravelTime(100, "Custom", 50), 2);
  assert.equal(calculateArrivalTime(2, 100, "Custom", 50), 4);
  assert.equal(getConnectivityThroughput("Custom", 0), 125);
});
