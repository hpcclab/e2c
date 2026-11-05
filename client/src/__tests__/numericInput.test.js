import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  numberInputDisplay,
  nonNegativeNumberDraft,
  nonNegativeNumberValue,
} from "../utils/numericInput.js";

test("number field display strips leading zeroes without losing decimals or zero", () => {
  assert.equal(numberInputDisplay("0100"), "100");
  assert.equal(numberInputDisplay("000.025"), "0.025");
  assert.equal(numberInputDisplay(0), "0");
  assert.equal(numberInputDisplay("-0.5"), "-0.5");
});

test("number field display preserves empty and unset optional settings", () => {
  for (const value of ["", undefined, null, NaN, "invalid"]) {
    assert.equal(numberInputDisplay(value), "");
  }
});

test("all numeric settings use the shared draft-preserving input", () => {
  for (const directory of ["../components/", "../workload/tabs/"]) {
    const dir = new URL(directory, import.meta.url);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".jsx") || file === "NumberInput.jsx") continue;
      const source = readFileSync(new URL(file, dir), "utf8");
      assert.doesNotMatch(source, /<input\s[^>]*?type="number"/, file);
    }
  }
});

test("nonnegative numeric inputs can be cleared while editing", () => {
  assert.equal(nonNegativeNumberDraft(""), "");
});

test("nonnegative numeric inputs normalize leading zeroes and negatives", () => {
  assert.equal(nonNegativeNumberDraft("0100"), 100);
  assert.equal(nonNegativeNumberDraft("-3"), 0);
});

test("saved nonnegative numeric inputs normalize blanks and invalid values", () => {
  assert.equal(nonNegativeNumberValue(""), 0);
  assert.equal(nonNegativeNumberValue("invalid", 1), 1);
});
