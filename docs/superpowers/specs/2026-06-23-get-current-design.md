# "Get Current" URL Dissection — Design

**Date:** 2026-06-23
**Status:** Approved
**Extends:** [2026-06-23-neon-url-maker-design.md](2026-06-23-neon-url-maker-design.md)

## Purpose

Add a **Get Current** button that reads the active tab's URL, splits it into a
Base URL and a Route (dropping any `token` query param), and fills those two
fields — leaving the Token and both Name fields untouched.

## UI Changes

- A small, secondary **Get Current** button directly under the title (purple
  accent, distinct from the cyan/green Create buttons).
- A normally-hidden inline **notice** line near the button for error messages.

## New Module: `url-dissect.js`

`dissectUrl(rawUrl)`:

- Parses `rawUrl` with `new URL(rawUrl)`. If it throws (invalid or empty input),
  returns `null`.
- **baseUrl** = `url.origin + "/"`.
- **route** = `url.pathname` with its single leading slash removed, followed by
  the remaining query string and the hash:
  - From `url.searchParams`, remove every key matching `token`
    case-insensitively (`token`, `Token`, `TOKEN`, …). Keep all
    other params in their original order.
  - If any params remain, append `?` + the rebuilt query string; otherwise append
    nothing.
  - Append `url.hash` verbatim (includes its leading `#`, or empty string).
- Returns `{ baseUrl, route }`.

### Worked examples

| Input | baseUrl | route |
|---|---|---|
| `https://site.com:8080/api/users?token=xyz&foo=bar#sec` | `https://site.com:8080/` | `api/users?foo=bar#sec` |
| `https://site.com/api/users?token=xyz` | `https://site.com/` | `api/users` |
| `https://site.com/` | `https://site.com/` | `` (empty) |
| `https://site.com/a/b?Token=1&x=2` | `https://site.com/` | `a/b?x=2` |
| `not a url` | — | returns `null` |

## Behavior (`popup.js`)

On **Get Current** click:

1. `chrome.tabs.query({ active: true, currentWindow: true })` to read the active
   tab's URL. Uses the existing `tabs` permission — no new permission.
2. Call `dissectUrl(tab.url)`.
3. If there is no tab/url, or `dissectUrl` returns `null` (e.g. a `chrome://`
   page or otherwise unparseable URL): show the inline notice
   "Couldn't read this tab's URL." and leave **all** fields untouched.
4. On success: set the Base URL and Route fields to the returned values and hide
   the notice. For each of Base URL and Route, look up the new value in its saved
   list: if a matching entry exists, fill that field's **Name** with the saved
   entry's name; if there is no match, clear the Name field. Persist the new
   values and names to `chrome.storage.local` (keys `base-url`, `route`,
   `base-url-name`, `route-name`). **The Token field is never modified.**

The notice is also hidden whenever a dissection succeeds.

## Testing

- `dissectUrl` unit tests (`node:test`): origin+port, token removal,
  mixed-case token, preserved other params, hash preserved, root path → empty
  route, token-only query → query dropped, and invalid input → `null`.
- Button wiring (tab query, fill, notice) verified manually in Chrome.

## Out of Scope

- Stripping params other than `token`.
- Modifying the Token field.
- Reading tabs other than the active one.
