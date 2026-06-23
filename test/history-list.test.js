import { test } from "node:test";
import assert from "node:assert/strict";
import { addEntry, removeEntry, getLabel } from "../history-list.js";

test("addEntry puts new entry first", () => {
  const list = [{ url: "a", name: "" }];
  assert.deepEqual(addEntry(list, { url: "b", name: "" }, "url"), [
    { url: "b", name: "" },
    { url: "a", name: "" },
  ]);
});

test("addEntry dedups by key, moves to front, updates name", () => {
  const list = [{ url: "a", name: "old" }, { url: "b", name: "" }];
  assert.deepEqual(addEntry(list, { url: "a", name: "new" }, "url"), [
    { url: "a", name: "new" },
    { url: "b", name: "" },
  ]);
});

test("addEntry does not mutate the input list", () => {
  const list = [{ url: "a", name: "" }];
  addEntry(list, { url: "b", name: "" }, "url");
  assert.equal(list.length, 1);
});

test("removeEntry removes by key value", () => {
  const list = [{ route: "x", name: "" }, { route: "y", name: "" }];
  assert.deepEqual(removeEntry(list, "x", "route"), [{ route: "y", name: "" }]);
});

test("getLabel returns name when present", () => {
  assert.equal(getLabel({ url: "https://a", name: "Prod" }, "url"), "Prod");
});

test("getLabel falls back to key value when name blank", () => {
  assert.equal(getLabel({ url: "https://a", name: "  " }, "url"), "https://a");
});
