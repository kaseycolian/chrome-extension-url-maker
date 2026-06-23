# Saved Base URLs & Routes — Design

**Date:** 2026-06-23
**Status:** Approved
**Extends:** [2026-06-23-neon-url-maker-design.md](2026-06-23-neon-url-maker-design.md)

## Purpose

Let users remember previously used **Base URLs** and **Routes**, optionally
label each with a name, pull up a saved list per field, pick an entry to fill
the field, and delete entries individually.

## UI Changes

- Add a **Name (optional)** input beneath both the Base URL field and the Route
  field. Each field + its name input is visually grouped in a subtle bordered box.
- Add a **history button (▾)** inside the right edge of the Base URL and Route
  inputs. Clicking it toggles a dropdown panel anchored to that field.
- Token field is unchanged (no name, no history).

### Dropdown panel

- Anchored below its field, blue neon border to read as a popover.
- One row per saved entry:
  - **Primary text** = the entry's name if present, otherwise the raw value
    (URL or route).
  - **Secondary text** (dimmed monospace) = the raw value, shown only when a
    name is present.
  - **× button** (fuchsia) deletes just that entry.
- Clicking a row's text fills the field with the entry's raw value AND restores
  the entry's name into that field's name input.
- Empty list shows a muted "No saved entries yet."
- Only one dropdown open at a time. Clicking outside, picking a row, or toggling
  the same button closes it. Deleting a row leaves the field's current text
  untouched and keeps the dropdown open.

## Data Model

`chrome.storage.local` gains two arrays (most-recent-first):

```
baseUrlHistory: { url: string,   name: string }[]
routeHistory:   { route: string, name: string }[]
```

Live field values continue to persist under existing keys, plus two new keys for
the name inputs:

```
base-url, route, token        (existing live values)
base-url-name, route-name     (new live values for the name inputs)
```

## Behavior

### Saving (on Create and Create & Go)

When the user clicks **Create** or **Create & Go**, before/alongside building the
URL:

- If the Base URL field is non-empty, add `{ url, name }` to `baseUrlHistory`
  using the current Base URL value and Base URL name value.
- If the Route field is non-empty, add `{ route, name }` to `routeHistory`
  using the current Route value and Route name value.
- Blank values (after the existing build still proceeds) are not saved.

The URL-building behavior from the base extension is unchanged. Names are
metadata only — they never affect the built URL.

### Dedup & ordering

- **Base URL:** unique by exact `url` string. Re-saving an existing url updates
  its `name` and moves it to the front (most-recent-first).
- **Route:** unique by exact `route` string. Re-saving an existing route updates
  its `name` and moves it to the front.
- Names are not part of the uniqueness key.

### Picking an entry

Clicking a row fills the field's raw value (`url` or `route`) and sets the
field's name input to the entry's `name` (empty string if none).

### Deleting an entry

Clicking × removes that entry from the array by its key (`url` / `route`) and
re-renders the open dropdown.

## Code Structure

- **`history-list.js`** (new, pure, unit-tested) — list operations over an
  array of `{ key, name }`-shaped entries:
  - `addEntry(list, entry, keyField)` → new array, deduped by `keyField`,
    most-recent-first, name updated on re-save.
  - `removeEntry(list, keyValue, keyField)` → new array without the matching entry.
  - `getLabel(entry, keyField)` → name if non-empty, else the key value.
  These are generic so both Base URL (`keyField = "url"`) and Route
  (`keyField = "route"`) reuse them.
- **`popup.js`** — owns DOM: builds dropdown markup, wires history buttons,
  outside-click close, row pick, row delete, and save-on-create. Persists and
  restores the two new name inputs and the two history arrays via
  `chrome.storage.local`.
- **`popup.html` / `popup.css`** — add grouped name fields and dropdown markup,
  styled with the existing neon palette (no new colors). History button is the
  ▾ glyph.

## Out of Scope

- Reordering entries manually, pinning/favorites, or a cap on list size.
- Editing a saved entry's name in place (re-save with a new name updates it).
- Cross-device sync.
