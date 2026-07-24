# Saved Base URLs & Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add per-field saved lists (with optional names, pick, and individual delete) to the Base URL and Route fields.

**Architecture:** A new pure, unit-tested `history-list.js` handles list operations (add/dedup/reorder, remove, label). `popup.js` owns all DOM: name-field persistence, dropdown rendering, pick/delete, and save-on-create. `popup.html`/`popup.css` add grouped name fields and dropdown markup in the existing neon theme.

**Tech Stack:** Manifest V3, vanilla JS ES modules, `node:test`.

## Global Constraints

- No new storage keys beyond: `base-url-name`, `route-name`, `baseUrlHistory`, `routeHistory`.
- History arrays are most-recent-first; dedup by `url` / `route` (name excluded from key).
- Names are metadata only — never affect the built URL.
- Reuse existing neon palette; no new colors.

---

### Task 1: history-list module (TDD)

**Files:**
- Create: `history-list.js`
- Test: `test/history-list.test.js`

**Interfaces — Produces (named exports):**
- `addEntry(list, entry, keyField)` → new array; entry placed first, any existing entry with same `entry[keyField]` removed (name thereby updated).
- `removeEntry(list, keyValue, keyField)` → new array without the entry whose `keyField` equals `keyValue`.
- `getLabel(entry, keyField)` → `entry.name` if non-empty (trimmed), else `entry[keyField]`.

- [ ] **Step 1: Write failing test** (`test/history-list.test.js`)

```js
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
```

- [ ] **Step 2: Run, expect FAIL** — `node --test` (module not found).

- [ ] **Step 3: Implement** (`history-list.js`)

```js
// Pure list operations for saved Base URL / Route entries.
// Entries are objects keyed by `keyField` ("url" or "route") plus a `name`.

export function addEntry(list, entry, keyField) {
  const key = entry[keyField];
  const filtered = list.filter((e) => e[keyField] !== key);
  return [{ ...entry }, ...filtered];
}

export function removeEntry(list, keyValue, keyField) {
  return list.filter((e) => e[keyField] !== keyValue);
}

export function getLabel(entry, keyField) {
  return entry.name && entry.name.trim() !== "" ? entry.name : entry[keyField];
}
```

- [ ] **Step 4: Run, expect PASS** — `node --test` (all history-list + url-builder tests pass).

- [ ] **Step 5: Commit** — `feat: add history-list module for saved entries`.

---

### Task 2: Markup — grouped name fields + dropdowns

**Files:**
- Modify: `popup.html`

**Interfaces — Produces element IDs consumed by Task 4:**
`base-url`, `base-url-name`, `base-url-hist`, `base-url-dropdown`,
`route`, `route-name`, `route-hist`, `route-dropdown`,
`token`, `create-btn`, `create-go-btn`, `result`, `result-url`.

- [ ] **Step 1: Replace the Base URL and Route field blocks** in `popup.html` with grouped versions (full file shown in execution). Each group wraps the primary input (with a `▾` history button and a dropdown container) and a Name input. Token, buttons, and result stay as they are.

- [ ] **Step 2: Manually open `popup.html`** — confirm both groups render with name fields and ▾ buttons; dropdowns hidden.

- [ ] **Step 3: Commit** — `feat: add grouped name fields and dropdown markup`.

---

### Task 3: Styles — groups, name inputs, dropdown

**Files:**
- Modify: `popup.css`

- [ ] **Step 1: Add styles** for `.group`, `.field-label.sub`, `.input-wrap`, `.hist-btn`, `.dropdown`, `.row`, `.row-text`, `.row-primary`, `.row-secondary`, `.del`, `.dropdown-empty`, and right-padding on inputs that have a history button — using existing palette vars.

- [ ] **Step 2: Manually verify** the closed state matches the approved mockup.

- [ ] **Step 3: Commit** — `style: add neon styles for groups and dropdowns`.

---

### Task 4: Behavior — persistence, history, pick, delete, save-on-create

**Files:**
- Modify: `popup.js`

**Interfaces:**
- Consumes: `buildUrl` from `url-builder.js`; `addEntry`, `removeEntry`, `getLabel` from `history-list.js`; element IDs from Task 2.

- [ ] **Step 1: Rewrite `popup.js`** (full file shown in execution) to:
  - Load live values (`base-url`, `base-url-name`, `route`, `route-name`, `token`) and history arrays (`baseUrlHistory`, `routeHistory`) on open.
  - Persist each live input on `input`.
  - Render a dropdown from a list (name primary, raw value dimmed when named, × delete).
  - Toggle one dropdown at a time; close on outside click or pick.
  - Pick → fill field value + set its name input + persist.
  - Delete → `removeEntry`, persist, re-render open dropdown.
  - On Create / Create & Go → `addEntry` for non-empty Base URL and Route, persist, build + display URL; Create & Go also navigates the active tab.

- [ ] **Step 2: Load unpacked in Chrome**, reload extension. Confirm no console errors.

- [ ] **Step 3: Verify save + pick** — enter Base `https://site.com`, name `Prod`, Route `/api/users/`, name `Users`, Token `abc123`; click Create → result `https://site.com/api/users&token=abc123`. Open Base ▾ → "Prod" row with dimmed `https://site.com`. Pick it → fields + name repopulate.

- [ ] **Step 4: Verify delete + dedup** — re-Create with same Base but name `Prod2` → list still one row, now "Prod2", at top. Click × → row removed, field text unchanged.

- [ ] **Step 5: Commit** — `feat: wire saved lists, names, pick, delete, save-on-create`.

---

### Task 5: Verify, README, push

- [ ] **Step 1:** `node --test` → all pass.
- [ ] **Step 2:** Update `README.md` with a short "Saved lists" note.
- [ ] **Step 3:** Commit (`docs: note saved lists in README`) and `git push origin main`.
