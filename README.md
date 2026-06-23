# Neon URL Maker

A Chrome extension that builds a fully-formed URL from three persisted fields
— **Base URL**, **Route**, and **Token** — displays it, and optionally
navigates the current tab to it. Styled like a 90s neon skating rink.

## Install (load unpacked)

1. Clone or download this repo, then open `chrome://extensions` in Chrome and
   enable **Developer mode** (top-right toggle).
2. Click **Load unpacked** and select the project folder (the one containing
   `manifest.json`).
3. Click the **Neon URL Maker** icon in the toolbar. Enter your values and use
   **Create** to see the URL, or **Create & Go** to build it and navigate the
   current tab. Field values persist across sessions.

## How the URL is built

The final URL is `normalizedBase + normalizedRoute + tokenPart`:

1. **Base URL** — all trailing slashes are collapsed to exactly one.
   `https://site.com` → `https://site.com/`
2. **Route** — leading and trailing slashes are stripped.
   `/api/users/` → `api/users`
3. **Token** — the literal string `&token=` is prepended.
   `abc123` → `&token=abc123`

**Example:** Base `https://site.com`, Route `/api/users/`, Token `abc123` →
`https://site.com/api/users&token=abc123`

## Get Current

The **Get Current** button (under the title) reads the active tab's URL and
splits it for you:

- The origin (scheme + host + port) goes into **Base URL** with a trailing slash.
- The path, remaining query params, and hash go into **Route** — with any
  `authToken` query param removed (case-insensitive).
- The **Token** and **Name** fields are left untouched.

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
