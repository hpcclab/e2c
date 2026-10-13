import test from "node:test";
import assert from "node:assert/strict";
import {
  nonNegativeNumberDraft,
  nonNegativeNumberValue,
} from "../utils/numericInput.js";

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
