# Neon URL Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 Chrome extension whose popup persists three fields (Base URL, Route, Token), builds a fully-formed URL with slash normalization, displays it, and optionally navigates the current tab — styled as a 90s neon skating rink.

**Architecture:** A toolbar popup with no background service worker. Pure URL-building logic lives in an ES module (`url-builder.js`) that is unit-tested with Node's built-in test runner. `popup.js` (also an ES module) imports that logic and wires it to `chrome.storage.local` persistence, the two buttons, and `chrome.tabs.update` navigation.

**Tech Stack:** Manifest V3, vanilla JavaScript (ES modules), HTML/CSS, Node `node:test` for unit tests, PowerShell `System.Drawing` for icon generation. No runtime dependencies.

## Global Constraints

- Manifest V3 only.
- Permissions limited to exactly: `["storage", "tabs"]`.
- Fully self-contained — no external fonts, scripts, images, or network requests (CSP-safe).
- Validation is **auto-fix silently**: normalize input, never show a validation error.
- Token is joined with the literal string `&token=` (no leading `?`).
- Full URL = `normalizedBase + normalizedRoute + tokenPart`.
- Persist field values to `chrome.storage.local`; restore on popup open.

---

### Task 1: Project scaffold (package.json + manifest)

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `manifest.json` referencing `popup.html` as the action default popup and `icons/` (created in Task 5); `package.json` with `"type": "module"` and a `test` script `node --test`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "neon-url-maker",
  "version": "1.0.0",
  "description": "Chrome extension that builds and navigates to a fully-formed URL from Base URL, Route, and Token.",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Create `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Neon URL Maker",
  "version": "1.0.0",
  "description": "Build and navigate to a fully-formed URL from Base URL, Route, and Token.",
  "permissions": ["storage", "tabs"],
  "action": {
    "default_title": "Neon URL Maker",
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 4: Verify package.json is valid**

Run: `node -e "require('./package.json'); console.log('ok')"`
Expected: prints `ok`

- [ ] **Step 5: Commit**

```bash
git add package.json manifest.json .gitignore
git commit -m "chore: scaffold neon-url-maker extension"
```

---

### Task 2: URL builder pure module (TDD)

**Files:**
- Create: `url-builder.js`
- Test: `test/url-builder.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (all ES-module named exports):
  - `normalizeBaseUrl(base: string): string` — strips all trailing slashes, appends exactly one.
  - `normalizeRoute(route: string): string` — strips all leading and trailing slashes.
  - `buildTokenPart(token: string): string` — returns `"&token=" + token`.
  - `buildUrl(base: string, route: string, token: string): string` — returns `normalizeBaseUrl(base) + normalizeRoute(route) + buildTokenPart(token)`.

- [ ] **Step 1: Write the failing test**

Create `test/url-builder.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — cannot find module `../url-builder.js`.

- [ ] **Step 3: Write minimal implementation**

Create `url-builder.js`:

```js
// Pure URL-building logic. No chrome/DOM dependencies so it is unit-testable.

export function normalizeBaseUrl(base) {
  return base.replace(/\/+$/, "") + "/";
}

export function normalizeRoute(route) {
  return route.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function buildTokenPart(token) {
  return "&token=" + token;
}

export function buildUrl(base, route, token) {
  return normalizeBaseUrl(base) + normalizeRoute(route) + buildTokenPart(token);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS — 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add url-builder.js test/url-builder.test.js
git commit -m "feat: add URL builder with slash normalization"
```

---

### Task 3: Popup markup and neon theme

**Files:**
- Create: `popup.html`
- Create: `popup.css`

**Interfaces:**
- Consumes: nothing (styling/markup only). Element IDs below are the contract Task 4 consumes.
- Produces: a popup with input IDs `base-url`, `route`, `token`; buttons `create-btn` and `create-go-btn`; result container `result` with inner code element `result-url`. Loads `popup.js` as `<script type="module">`.

- [ ] **Step 1: Create `popup.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <div class="grid-bg"></div>
    <main class="card">
      <h1 class="title">URL&nbsp;MAKER</h1>

      <label class="field">
        <span class="field-label">Base URL</span>
        <input id="base-url" type="text" placeholder="https://site.com" autocomplete="off" spellcheck="false" />
      </label>

      <label class="field">
        <span class="field-label">Route</span>
        <input id="route" type="text" placeholder="api/users" autocomplete="off" spellcheck="false" />
      </label>

      <label class="field">
        <span class="field-label">Token</span>
        <input id="token" type="text" placeholder="abc123" autocomplete="off" spellcheck="false" />
      </label>

      <div class="buttons">
        <button id="create-btn" type="button" class="btn btn-create">Create</button>
        <button id="create-go-btn" type="button" class="btn btn-go">Create &amp; Go</button>
      </div>

      <div id="result" class="result" hidden>
        <span class="result-label">Your URL</span>
        <code id="result-url" class="result-url"></code>
      </div>
    </main>
    <script type="module" src="popup.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `popup.css`**

```css
:root {
  --bg: #0a0118;
  --fuchsia: #ff2bd6;
  --purple: #9b4dff;
  --blue: #18e0ff;
  --green: #39ff14;
  --ink: #f3e9ff;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  width: 340px;
  font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
  color: var(--ink);
  background: var(--bg);
}

body { position: relative; overflow: hidden; }

/* Retro neon grid backdrop */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(transparent 95%, rgba(24, 224, 255, 0.35) 95%),
    linear-gradient(90deg, transparent 95%, rgba(255, 43, 214, 0.3) 95%);
  background-size: 24px 24px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.card {
  position: relative;
  z-index: 1;
  padding: 18px 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.title {
  margin: 0 0 4px;
  text-align: center;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--fuchsia);
  text-shadow:
    0 0 6px var(--fuchsia),
    0 0 14px var(--fuchsia),
    0 0 26px var(--purple);
}

.field { display: flex; flex-direction: column; gap: 5px; }

.field-label {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--green);
  text-shadow: 0 0 6px rgba(57, 255, 20, 0.7);
}

input {
  width: 100%;
  padding: 9px 11px;
  font-size: 14px;
  color: var(--ink);
  background: rgba(155, 77, 255, 0.08);
  border: 2px solid var(--purple);
  border-radius: 8px;
  outline: none;
  box-shadow: 0 0 8px rgba(155, 77, 255, 0.5) inset;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input::placeholder { color: rgba(243, 233, 255, 0.4); }

input:focus {
  border-color: var(--blue);
  box-shadow:
    0 0 8px rgba(24, 224, 255, 0.4) inset,
    0 0 10px rgba(24, 224, 255, 0.6);
}

.buttons { display: flex; gap: 10px; margin-top: 2px; }

.btn {
  flex: 1;
  padding: 10px 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.15s, filter 0.15s;
}

.btn-create {
  background: var(--blue);
  box-shadow: 0 0 10px var(--blue), 0 0 20px rgba(24, 224, 255, 0.5);
}

.btn-go {
  background: var(--green);
  box-shadow: 0 0 10px var(--green), 0 0 20px rgba(57, 255, 20, 0.5);
}

.btn:hover { filter: brightness(1.15); }
.btn:active { transform: translateY(1px) scale(0.98); }

.result {
  margin-top: 4px;
  padding: 10px 12px;
  border: 2px dashed var(--fuchsia);
  border-radius: 8px;
  background: rgba(255, 43, 214, 0.07);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fuchsia);
  text-shadow: 0 0 6px rgba(255, 43, 214, 0.7);
}

.result-url {
  font-family: "Consolas", "Courier New", monospace;
  font-size: 12px;
  color: var(--blue);
  word-break: break-all;
  user-select: all;
  text-shadow: 0 0 6px rgba(24, 224, 255, 0.6);
}
```

- [ ] **Step 3: Manually verify markup renders**

Open `popup.html` directly in a browser (double-click). Confirm the three labeled fields, two neon buttons, and a dark gridded neon background appear. The result box is hidden (`hidden` attribute) until a button is wired in Task 4.

- [ ] **Step 4: Commit**

```bash
git add popup.html popup.css
git commit -m "feat: add popup markup and 90s neon theme"
```

---

### Task 4: Popup behavior (persistence, build, navigate)

**Files:**
- Create: `popup.js`

**Interfaces:**
- Consumes: `buildUrl` from `url-builder.js`; element IDs from Task 3 (`base-url`, `route`, `token`, `create-btn`, `create-go-btn`, `result`, `result-url`).
- Produces: a self-initializing module (no exports) that restores saved values, saves on input, and wires both buttons.

- [ ] **Step 1: Create `popup.js`**

```js
import { buildUrl } from "./url-builder.js";

const FIELDS = ["base-url", "route", "token"];

const els = {
  baseUrl: document.getElementById("base-url"),
  route: document.getElementById("route"),
  token: document.getElementById("token"),
  createBtn: document.getElementById("create-btn"),
  createGoBtn: document.getElementById("create-go-btn"),
  result: document.getElementById("result"),
  resultUrl: document.getElementById("result-url"),
};

// Restore saved values on open.
chrome.storage.local.get(FIELDS, (saved) => {
  els.baseUrl.value = saved["base-url"] || "";
  els.route.value = saved["route"] || "";
  els.token.value = saved["token"] || "";
});

// Persist each field on input.
els.baseUrl.addEventListener("input", () =>
  chrome.storage.local.set({ "base-url": els.baseUrl.value })
);
els.route.addEventListener("input", () =>
  chrome.storage.local.set({ route: els.route.value })
);
els.token.addEventListener("input", () =>
  chrome.storage.local.set({ token: els.token.value })
);

function createUrl() {
  const url = buildUrl(els.baseUrl.value, els.route.value, els.token.value);
  els.resultUrl.textContent = url;
  els.result.hidden = false;
  return url;
}

els.createBtn.addEventListener("click", () => {
  createUrl();
});

els.createGoBtn.addEventListener("click", () => {
  const url = createUrl();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url });
    }
  });
});
```

- [ ] **Step 2: Load the unpacked extension in Chrome**

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select the project folder.
Expected: "Neon URL Maker" appears with no errors. (Icons may be missing until Task 5 — that is fine for this step.)

- [ ] **Step 3: Verify persistence and Create**

Click the toolbar icon. Enter Base URL `https://site.com`, Route `/api/users/`, Token `abc123`. Close and reopen the popup.
Expected: all three values are restored. Click **Create**.
Expected: result box shows `https://site.com/api/users&token=abc123`.

- [ ] **Step 4: Verify Create & Go**

With the same values, click **Create & Go**.
Expected: result box updates AND the current tab navigates to `https://site.com/api/users&token=abc123`.

- [ ] **Step 5: Commit**

```bash
git add popup.js
git commit -m "feat: wire popup persistence, build, and navigation"
```

---

### Task 5: Neon icons

**Files:**
- Create: `scripts/generate-icons.ps1`
- Create: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (generated)

**Interfaces:**
- Consumes: nothing.
- Produces: three PNG icons at the sizes referenced in `manifest.json` (Task 1).

- [ ] **Step 1: Create `scripts/generate-icons.ps1`**

```powershell
# Generates neon skating-rink icons using System.Drawing.
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # Dark background
  $bg = [System.Drawing.Color]::FromArgb(255, 10, 1, 24)
  $g.Clear($bg)

  # Neon "U" glyph in fuchsia
  $fuchsia = [System.Drawing.Color]::FromArgb(255, 255, 43, 214)
  $penW = [Math]::Max(2, [int]($size / 10))
  $pen = New-Object System.Drawing.Pen($fuchsia, $penW)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $m = [int]($size * 0.28)
  $top = [int]($size * 0.24)
  $bot = [int]($size * 0.66)
  $g.DrawLine($pen, $m, $top, $m, $bot)
  $g.DrawLine($pen, $size - $m, $top, $size - $m, $bot)
  $g.DrawArc($pen, $m, [int]($size * 0.42), $size - 2 * $m, [int]($size * 0.44), 0, 180)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Icon 16  (Join-Path $outDir "icon16.png")
New-Icon 48  (Join-Path $outDir "icon48.png")
New-Icon 128 (Join-Path $outDir "icon128.png")
Write-Host "Icons generated."
```

- [ ] **Step 2: Run the script**

Run: `pwsh -File scripts/generate-icons.ps1`
Expected: prints `Icons generated.` and creates `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`.

- [ ] **Step 3: Verify icons exist**

Run: `ls icons`
Expected: three PNG files listed.

- [ ] **Step 4: Reload the extension and confirm icon**

In `chrome://extensions`, click the reload icon on the extension card.
Expected: the neon "U" icon shows in the toolbar with no manifest icon errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-icons.ps1 icons/
git commit -m "feat: add generated neon extension icons"
```

---

### Task 6: Final end-to-end verification

**Files:**
- Modify: none (verification only).

**Interfaces:**
- Consumes: the complete extension from Tasks 1–5.
- Produces: confirmation that the extension works end-to-end.

- [ ] **Step 1: Run the unit test suite**

Run: `node --test`
Expected: all URL-builder tests PASS.

- [ ] **Step 2: Full manual smoke test**

Reload the extension. Open the popup and confirm, in order:
1. Previously entered values are restored.
2. Editing a field and reopening the popup keeps the edit.
3. **Create** with Base `https://example.com//`, Route `//foo/bar//`, Token `xyz` shows `https://example.com/foo/bar&token=xyz`.
4. **Create & Go** navigates the current tab to that URL.
Expected: all four behaviors hold.

- [ ] **Step 3: Confirm no console errors**

Right-click the popup → Inspect. Reload the popup.
Expected: no errors in the popup console.
