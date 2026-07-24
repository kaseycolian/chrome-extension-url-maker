# Neon URL Maker

A Chrome extension that builds a fully-formed URL from persisted fields
— **Base URL**, **Route**, and any number of **Query Parameters** — displays
it, and optionally navigates the current tab to it. Styled like a 90s neon
skating rink.

## Install (load unpacked)

1. Clone or download this repo, then open `chrome://extensions` in Chrome and
   enable **Developer mode** (top-right toggle).
2. Click **Load unpacked** and select the project folder (the one containing
   `manifest.json`).
3. Click the **Neon URL Maker** icon in the toolbar. Enter your values and use
   **Create** to see the URL, or **Create & Go** to build it and navigate the
   current tab. Field values persist across sessions.

## How the URL is built

The final URL is `normalizedBase + normalizedRoute + queryString`:

1. **Base URL** — all trailing slashes are collapsed to exactly one.
   `https://site.com` → `https://site.com/`
2. **Route** — leading and trailing slashes are stripped.
   `/api/users/` → `api/users`
3. **Query Parameters** — every enabled row with a non-blank key is joined as
   `key=value` pairs and appended with a leading `?` (or `&` if the route
   already has a query).

**Example:** Base `https://site.com`, Route `/api/users/`, one enabled param
`token=abc123` → `https://site.com/api/users?token=abc123`

## Query Parameters

The **Query Parameters** section is a list of rows you fully control:

- Each row has an **enable** checkbox, a **key**, a masked **value** (with a
  **👁** reveal toggle), and a **×** to delete it.
- **+ Add parameter** appends a new empty row; add as many as you need.
- A **disabled** row keeps its key and value but is left out of the built URL.
- On first install one **`token`** row is provided; it behaves like any other
  and can be modified, disabled, or deleted.
- **Save Params** snapshots the whole set (optionally under a **Set name**) into
  the **▾** dropdown. Saving is manual — nothing is captured automatically.
  Pick a snapshot to restore the whole set, or **×** to delete it.

## Get Current

The **Get Current** button (under the title) reads the active tab's URL and
splits it for you:

- The origin (scheme + host + port) goes into **Base URL** with a trailing slash.
- The path and hash go into **Route**.
- Each query param is merged into the **Query Parameters** list — a matching key
  is updated and enabled, and any new key is added as an enabled row. Existing
  rows that aren't in the URL are left untouched.

If the tab's URL can't be read (e.g. a `chrome://` page), a brief notice appears
and no fields are changed.

## Saved lists

The **Base URL** and **Route** fields remember what you use. Each has an
optional **Name** field and a **▾** button:

- Clicking **Create** or **Create & Go** saves the current Base URL and Route
  (with their names, if any).
- The **▾** button opens a list of saved entries. Each row shows its name (or
  the raw value if unnamed); click a row to fill the field, or **×** to delete
  just that entry.
- Re-saving an existing value updates its name and moves it to the top.

## Development

No runtime dependencies. The URL-building logic is unit-tested with Node's
built-in test runner:

```bash
npm test
```

Icons are regenerated from `scripts/generate-icons.ps1` (PowerShell + System.Drawing).
