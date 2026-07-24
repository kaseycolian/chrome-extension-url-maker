import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBaseUrl,
  normalizeRoute,
  buildTokenPart,
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

test("buildTokenPart prepends literal &token=", () => {
  assert.equal(buildTokenPart("abc123"), "&token=abc123");
});

test("buildUrl composes the full URL per spec", () => {
  assert.equal(
    buildUrl("https://site.com", "/api/users/", "abc123"),
    "https://site.com/api/users&token=abc123"
  );
});

test("buildUrl handles empty route", () => {
  assert.equal(
    buildUrl("https://site.com/", "", "abc123"),
    "https://site.com/&token=abc123"
  );
});
