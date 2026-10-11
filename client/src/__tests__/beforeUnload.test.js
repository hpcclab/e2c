import assert from "node:assert/strict";
import test from "node:test";
import { warnBeforeUnload } from "../utils/beforeUnload.js";

test("closing or reloading requests a browser confirmation", () => {
  let prevented = false;
  const event = {
    returnValue: false,
    preventDefault() {
      prevented = true;
    },
  };

  warnBeforeUnload(event);

  assert.equal(prevented, true);
  assert.equal(event.returnValue, true);
});
