import assert from "node:assert/strict";
import test from "node:test";

import {
  batteryPercentage,
  exhaustBattery,
  isBatteryDepleted,
} from "../utils/energy.js";

test("battery percentage reflects the current charge for machines and IoTs", () => {
  const machine = {
    energySource: "Battery",
    batteryCapacityJ: 40,
    batteryRemainingJ: 10,
  };
  const iot = {
    properties: {
      energySource: "Battery",
      batteryCapacityJ: 20,
      batteryRemainingJ: 15,
    },
  };

  assert.equal(batteryPercentage(machine), 25);
  assert.equal(batteryPercentage(iot), 75);
  assert.equal(batteryPercentage({ energySource: "Grid-Powered" }), null);
});

test("exhausting a partial battery records its remaining energy and marks it dead", () => {
  const machine = {
    energySource: "Battery",
    batteryCapacityJ: 100,
    batteryRemainingJ: 10,
    energyConsumedJ: 20,
  };

  assert.equal(exhaustBattery(machine), 10);
  assert.equal(machine.batteryRemainingJ, 0);
  assert.equal(machine.energyConsumedJ, 30);
  assert.equal(batteryPercentage(machine), 0);
  assert.equal(isBatteryDepleted(machine), true);
});
