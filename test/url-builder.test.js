import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBaseUrl,
  normalizeRoute,
  buildQueryString,
  buildUrl,
} from "../url-builder.js";

test("normalizeBaseUrl adds a single trailing slash", () => {
  assert.equal(normalizeBaseUrl("https://site.com"), "https://site.com/");
});

test("normalizeBaseUrl collapses multiple trailing slashes to one", () => {
  assert.equal(normalizeBaseUrl("https://site.com///"), "https://site.com/");
});

test("normalizeBaseUrl leaves a single trailing slash intact", () => {
  assert.equal(normalizeBaseUrl("https://site.com/"), "https://site.com/");
});

test("normalizeRoute strips leading and trailing slashes", () => {
  assert.equal(normalizeRoute("/api/users/"), "api/users");
});

test("normalizeRoute leaves a clean route unchanged", () => {
  assert.equal(normalizeRoute("api/users"), "api/users");
});

test("buildQueryString joins enabled, non-blank-key params with &", () => {
  assert.equal(
    buildQueryString([
      { key: "token", value: "abc", enabled: true },
      { key: "env", value: "stg", enabled: true },
    ]),
    "token=abc&env=stg"
  );
});

test("buildQueryString skips disabled params", () => {
  assert.equal(
    buildQueryString([
      { key: "token", value: "abc", enabled: false },
      { key: "env", value: "stg", enabled: true },
    ]),
    "env=stg"
  );
});

test("buildQueryString skips params with a blank key", () => {
  assert.equal(
    buildQueryString([
      { key: "  ", value: "x", enabled: true },
      { key: "env", value: "stg", enabled: true },
    ]),
    "env=stg"
  );
});

test("buildQueryString keeps an enabled param with an empty value", () => {
  assert.equal(
    buildQueryString([{ key: "token", value: "", enabled: true }]),
    "token="
  );
});

test("buildQueryString returns empty string when nothing is enabled", () => {
  assert.equal(
    buildQueryString([{ key: "token", value: "abc", enabled: false }]),
    ""
  );
  assert.equal(buildQueryString([]), "");
});

test("buildUrl composes base + route with a leading ? for params", () => {
  assert.equal(
    buildUrl("https://site.com", "/api/users/", [
      { key: "token", value: "abc123", enabled: true },
    ]),
    "https://site.com/api/users?token=abc123"
  );
});

test("buildUrl omits the query entirely when no params are enabled", () => {
  assert.equal(
    buildUrl("https://site.com", "api/users", [
      { key: "token", value: "abc", enabled: false },
    ]),
    "https://site.com/api/users"
  );
});

test("buildUrl uses & when the route already contains a query", () => {
  assert.equal(
    buildUrl("https://site.com", "api/users?foo=bar", [
      { key: "token", value: "abc", enabled: true },
    ]),
    "https://site.com/api/users?foo=bar&token=abc"
  );
});

test("buildUrl handles empty route", () => {
  assert.equal(
    buildUrl("https://site.com/", "", [
      { key: "token", value: "abc123", enabled: true },
    ]),
    "https://site.com/?token=abc123"
  );
});

test("buildUrl joins multiple enabled params with &", () => {
  assert.equal(
    buildUrl("https://site.com", "api", [
      { key: "token", value: "abc", enabled: true },
      { key: "env", value: "stg", enabled: true },
    ]),
    "https://site.com/api?token=abc&env=stg"
  );
});
