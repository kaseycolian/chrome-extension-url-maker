import { test } from "node:test";
import assert from "node:assert/strict";
import { dissectUrl } from "../url-dissect.js";

test("splits origin (with port), path+hash into route, and query into params", () => {
  assert.deepEqual(
    dissectUrl("https://site.com:8080/api/users?token=xyz&foo=bar#sec"),
    {
      baseUrl: "https://site.com:8080/",
      route: "api/users#sec",
      params: [
        { key: "token", value: "xyz", enabled: true },
        { key: "foo", value: "bar", enabled: true },
      ],
    }
  );
});

test("route holds only the path when a single param is present", () => {
  assert.deepEqual(dissectUrl("https://site.com/api/users?token=xyz"), {
    baseUrl: "https://site.com/",
    route: "api/users",
    params: [{ key: "token", value: "xyz", enabled: true }],
  });
});

test("root URL yields empty route and no params", () => {
  assert.deepEqual(dissectUrl("https://site.com/"), {
    baseUrl: "https://site.com/",
    route: "",
    params: [],
  });
});

test("preserves original param key casing", () => {
  assert.deepEqual(dissectUrl("https://site.com/a/b?Token=1&x=2"), {
    baseUrl: "https://site.com/",
    route: "a/b",
    params: [
      { key: "Token", value: "1", enabled: true },
      { key: "x", value: "2", enabled: true },
    ],
  });
});

test("returns null for invalid input", () => {
  assert.equal(dissectUrl("not a url"), null);
  assert.equal(dissectUrl(""), null);
});
