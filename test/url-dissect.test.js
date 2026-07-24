import { test } from "node:test";
import assert from "node:assert/strict";
import { dissectUrl } from "../url-dissect.js";

test("splits origin (with port) and keeps other params + hash", () => {
  assert.deepEqual(
    dissectUrl("https://site.com:8080/api/users?token=xyz&foo=bar#sec"),
    { baseUrl: "https://site.com:8080/", route: "api/users?foo=bar#sec" }
  );
});

test("drops the query entirely when only token is present", () => {
  assert.deepEqual(dissectUrl("https://site.com/api/users?token=xyz"), {
    baseUrl: "https://site.com/",
    route: "api/users",
  });
});

test("root URL yields empty route", () => {
  assert.deepEqual(dissectUrl("https://site.com/"), {
    baseUrl: "https://site.com/",
    route: "",
  });
});

test("removes token case-insensitively, keeps others", () => {
  assert.deepEqual(dissectUrl("https://site.com/a/b?Token=1&x=2"), {
    baseUrl: "https://site.com/",
    route: "a/b?x=2",
  });
});

test("returns null for invalid input", () => {
  assert.equal(dissectUrl("not a url"), null);
  assert.equal(dissectUrl(""), null);
});
