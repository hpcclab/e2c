import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDataInput } from "../utils/dataInput.js";

test("missing and legacy default data inputs normalize to binary", () => {
  assert.equal(normalizeDataInput(undefined), "binary");
  assert.equal(normalizeDataInput(""), "binary");
  assert.equal(normalizeDataInput("default"), "binary");
});

test("explicit data input types are preserved", () => {
  assert.equal(normalizeDataInput("image"), "image");
  assert.equal(normalizeDataInput("audio"), "audio");
});
