import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextTaskColor,
  sourceTaskColorKey,
  TASK_COLOR_NAMES,
} from "../utils/taskColors.js";

test("a copied IoT receives the next unused task color", () => {
  const sources = [
    { properties: { taskColor: "Sky" } },
    { properties: { taskColor: "Teal" } },
  ];

  assert.equal(getNextTaskColor("Sky", sources), "Emerald");
});

test("a copied IoT still differs from its source when every color is used", () => {
  const sources = TASK_COLOR_NAMES.map((taskColor) => ({
    properties: { taskColor },
  }));

  assert.equal(getNextTaskColor("Fuchsia", sources), "Slate");
});

test("source color keys keep identical task types independent", () => {
  assert.notEqual(sourceTaskColorKey(101), sourceTaskColorKey(102));
});
