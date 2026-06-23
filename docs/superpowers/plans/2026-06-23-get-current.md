# "Get Current" URL Dissection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a Get Current button that dissects the active tab's URL into Base URL + Route (dropping `authToken`), filling only those two fields.

**Architecture:** A new pure, unit-tested `url-dissect.js` does the parsing/splitting. `popup.js` adds the button handler (tab query → dissect → fill or notice). `popup.html`/`popup.css` add the small button and notice line.

**Tech Stack:** Manifest V3, vanilla JS ES modules, `node:test`.

## Global Constraints

- No new permissions (reuse existing `tabs`).
- Touch only Base URL and Route fields; never Token or Name fields.
- `authToken` stripped case-insensitively; all other query params + hash preserved.

---

### Task 1: url-dissect module (TDD)

**Files:**
- Create: `url-dissect.js`
- Test: `test/url-dissect.test.js`

**Interfaces — Produces:** `dissectUrl(rawUrl)` → `{ baseUrl, route }` or `null` on parse failure.

- [ ] **Step 1: Write failing test** (`test/url-dissect.test.js`)

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { dissectUrl } from "../url-dissect.js";

test("splits origin (with port) and keeps other params + hash", () => {
  assert.deepEqual(
    dissectUrl("https://site.com:8080/api/users?authToken=xyz&foo=bar#sec"),
    { baseUrl: "https://site.com:8080/", route: "api/users?foo=bar#sec" }
  );
});

test("drops the query entirely when only authToken is present", () => {
  assert.deepEqual(dissectUrl("https://site.com/api/users?authToken=xyz"), {
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

test("removes authToken case-insensitively, keeps others", () => {
  assert.deepEqual(dissectUrl("https://site.com/a/b?AuthToken=1&x=2"), {
    baseUrl: "https://site.com/",
    route: "a/b?x=2",
  });
});

test("returns null for invalid input", () => {
  assert.equal(dissectUrl("not a url"), null);
  assert.equal(dissectUrl(""), null);
});
```

- [ ] **Step 2: Run, expect FAIL** — `node --test`.

- [ ] **Step 3: Implement** (`url-dissect.js`)

```js
// Splits a full URL into { baseUrl, route }, dropping any authToken query param.
// Returns null when the input is not a parseable URL.

export function dissectUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const baseUrl = url.origin + "/";
  const path = url.pathname.replace(/^\//, "");

  const params = url.searchParams;
  for (const key of [...params.keys()]) {
    if (key.toLowerCase() === "authtoken") params.delete(key);
  }
  const query = params.toString();

  const route = path + (query ? "?" + query : "") + url.hash;
  return { baseUrl, route };
}
```

- [ ] **Step 4: Run, expect PASS** — `node --test` (all suites pass).

- [ ] **Step 5: Commit** — `feat: add url-dissect module`.

---

### Task 2: Button + notice markup and styles

**Files:**
- Modify: `popup.html`
- Modify: `popup.css`

**Interfaces — Produces IDs:** `get-current-btn`, `get-current-notice`.

- [ ] **Step 1: Add markup** under the title in `popup.html`:

```html
      <div class="get-current-row">
        <button id="get-current-btn" type="button" class="btn-secondary">Get Current</button>
        <span id="get-current-notice" class="notice" hidden></span>
      </div>
```

- [ ] **Step 2: Add styles** to `popup.css`:

```css
.get-current-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: -4px;
}

.btn-secondary {
  flex: none;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--purple);
  background: rgba(155, 77, 255, 0.12);
  border: 2px solid var(--purple);
  border-radius: 7px;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(155, 77, 255, 0.5);
  transition: filter 0.15s, transform 0.08s;
}

.btn-secondary:hover { filter: brightness(1.2); }
.btn-secondary:active { transform: translateY(1px) scale(0.97); }

.notice {
  font-size: 11px;
  color: var(--fuchsia);
  text-shadow: 0 0 6px rgba(255, 43, 214, 0.6);
}
```

- [ ] **Step 3: Manually open `popup.html`** — confirm the small Get Current button shows under the title; notice hidden.

- [ ] **Step 4: Commit** — `feat: add Get Current button and notice`.

---

### Task 3: Wire Get Current behavior

**Files:**
- Modify: `popup.js`

**Interfaces:** Consumes `dissectUrl` from `url-dissect.js`; element IDs `get-current-btn`, `get-current-notice`.

- [ ] **Step 1: Add import** at the top of `popup.js`:

```js
import { dissectUrl } from "./url-dissect.js";
```

- [ ] **Step 2: Add element lookups** to the `els` object:

```js
  getCurrentBtn: document.getElementById("get-current-btn"),
  getCurrentNotice: document.getElementById("get-current-notice"),
```

- [ ] **Step 3: Add the handler** near the other button wiring:

```js
els.getCurrentBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0] && tabs[0].url;
    const parts = url ? dissectUrl(url) : null;
    if (!parts) {
      els.getCurrentNotice.textContent = "Couldn't read this tab's URL.";
      els.getCurrentNotice.hidden = false;
      return;
    }
    els.baseUrl.value = parts.baseUrl;
    els.route.value = parts.route;
    chrome.storage.local.set({ "base-url": parts.baseUrl, route: parts.route });
    els.getCurrentNotice.hidden = true;
  });
});
```

- [ ] **Step 4: Load unpacked in Chrome**, reload. On a normal http(s) page, click Get Current → Base URL and Route fill correctly; Token and Name fields unchanged. On a `chrome://` page → notice appears, fields untouched.

- [ ] **Step 5: Commit** — `feat: wire Get Current tab dissection`.

---

### Task 4: Verify, README, push

- [ ] **Step 1:** `node --test` → all pass.
- [ ] **Step 2:** Add a "Get Current" note to `README.md`.
- [ ] **Step 3:** Commit (`docs: note Get Current in README`) and `git push origin main`.
