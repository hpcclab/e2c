import assert from "node:assert/strict";
import test from "node:test";

import {
  getTaskColor,
  getNextTaskColor,
  sourceTaskColorKey,
  TASK_COLOR_NAMES,
} from "../utils/taskColors.js";

test("resolves the same background color used by task cards", () => {
  assert.equal(getTaskColor("Sky").bg, "#0369a1");
  assert.equal(getTaskColor("not-a-color").name, "Slate");
});

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
