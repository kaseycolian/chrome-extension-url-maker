# Neon URL Maker — Chrome Extension Design

**Date:** 2026-06-23
**Status:** Approved

## Purpose

A Manifest V3 Chrome extension that builds a fully-formed URL from three
persisted fields (Base URL, Route, Token), displays the result, and optionally
navigates the current tab to it. Styled with a 90s neon skating-rink theme.

## UI Surface

Toolbar popup (click the extension icon). No background service worker — all
logic runs in the popup on user gesture.

## Files

```
manifest.json   MV3 config; permissions: ["storage", "tabs"]
popup.html      3 labeled fields + 2 buttons + result display area
popup.css       90s neon skating-rink theme (self-contained)
popup.js        load/save state, build URL, display, navigate
icons/          neon icons at 16/48/128 px
```

## Fields & Persistence

Three text inputs: **Base URL**, **Route**, **Token**.

- Values are saved to `chrome.storage.local` on every `input` event.
- On popup open, values are loaded from storage and restored into the fields.
- Persistence survives popup close and browser restart.

## URL Construction

Validation is **auto-fix silently** — inputs are normalized, no error shown.

1. **Base URL** — strip all trailing slashes, then append exactly one trailing slash.
   - `https://site.com`    → `https://site.com/`
   - `https://site.com///` → `https://site.com/`
   - `https://site.com/`   → `https://site.com/`
2. **Route** — strip all leading and trailing slashes.
   - `/api/users/` → `api/users`
   - `api/users`   → `api/users`
3. **Token** — prepend the literal string `&token=` to the token exactly as entered.
   - `abc123` → `&token=abc123`
4. **Full URL** = `normalizedBase + normalizedRoute + tokenPart`

### Worked example

- Base URL: `https://site.com`
- Route: `/api/users/`
- Token: `abc123`
- Result: `https://site.com/api/users&token=abc123`

Note: the token is joined with `&token=` exactly as specified (no leading `?`),
per the confirmed requirement.

### Edge handling

- Empty token → tokenPart is `&token=` (still appended, since prepend is literal).
- Empty route → omitted segment (normalizes to empty string).
- Empty base URL → normalizes to `/` (single trailing slash on empty string).
  These are acceptable; the tool trusts user input and only normalizes slashes.

## Buttons

Two buttons below the fields:

1. **Create** — builds the URL and displays it below the buttons as selectable text.
2. **Create and Go** — builds the URL, displays it, then navigates the **current
   active tab** to it via `chrome.tabs.update(activeTabId, { url })`.

## Theme

90s neon skating-rink:

- Dark near-black / deep-purple background with a subtle neon grid backdrop.
- Glowing neon accents: fuchsia, purple, blue, green.
- Retro display font (system font stack — no external assets).
- Glow text-shadows on headings/result; neon-outlined inputs and buttons.
- Fully self-contained: no external fonts, scripts, or images (CSP-safe).

## Permissions

- `storage` — persist the three field values.
- `tabs` — navigate the active tab for "Create and Go".

## Out of Scope

- Cross-device sync (`chrome.storage.sync`).
- Multiple saved URL profiles.
- URL/query-string validation beyond the slash normalization rules above.
