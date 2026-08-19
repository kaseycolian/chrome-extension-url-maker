# Theme Service

This app's theming comes from the shared **theme-service** — currently on version `1.1.0`.
The files in this folder are vendored copies of the source of truth; do not hand-edit generated
token files, and do not hardcode colors — consume the theme tokens (`var(--…)`).

## For agents working in this repo
This repo **already uses the theme-service** (see History below). Use the **theme-service skill**
(or its `AGENTS.md`) for any theme work here — don't improvise, and don't re-apply from scratch.
- Update to latest:  "Update this repo to the latest theme-service version."
- Add/change themes:  see the theme-service repo's `CREATING-THEMES.md`.
Rules: keep WCAG AA 2.2 · default theme is Rink Classic · the selector uses the **external**
`theme-init.js` / `theme-select.js` (never inline scripts — MV3/strict CSP blocks them).

## Applied configuration (current decisions on record)
- Component styling: `colors-only`
- Fonts: `kept app fonts` (they were already identical to `--font-ui`, which `popup.css` now
  declares and uses)
- Selector: `theme-service selector` — placement: `bottom "appearance" row of the popup, below
  "+ Add parameter"`, rendered with the accessible `dropdown.js` listbox (color swatches +
  family groups), alongside a `Reduce motion` checkbox
- Existing themes: `none`

## Repo-specific notes (read before changing anything here)

**`components.css` is deliberately NOT vendored.** It redefines `.btn`, `.field-label`,
`.result` and `.notice`, which `popup.css` already owns; loading it would fight the app's own
styles. Because `dropdown.css` depends on four structural tokens declared only in that file,
`popup.css`'s `:root` block declares `--font-ui`, `--font-mono`, `--radius-sm` and `--dur`
verbatim from it (plus `--press-y` / `--press-s`). **If you ever vendor `components.css`, delete
that block** so the definitions don't diverge.

**The app renamed two of its own classes to clear the `.dropdown` namespace.** `dropdown.css`
styles a bare `.dropdown` and a `.dropdown-empty`, and `dropdown.js` wraps its `<select>` in a
`.dropdown` element. The app's saved-entry panels are therefore `.saved-panel` / `.saved-empty`
(`popup.html`, `popup.css`, and the outside-click test in `popup.js`). Don't rename them back.

**Accent-on-accent-tint is the contrast trap in this UI.** The popup's chips put accent-colored
text/glyphs on a background tinted with that same accent. A 1:1 port of the original percentages
failed AA in 36 pairs across the themes. The verified recipe now used throughout:
- tint toward `--bg-panel` / `--bg-elevated` (near-white in light themes), **never** toward `--bg`
- **8%** tint at rest — except `.add-param-btn`, which needs **6%** (green on 8% green measures
  4.48:1 in `acid-arcade-light`)
- `:hover` fills solid `var(--accent-x)` with `color: var(--on-x)` rather than deepening the tint

Two related rules that are easy to undo by accident:
- The **already-solid** buttons (`.btn-create` / `.btn-go`) hover by mixing the fill toward
  `var(--text)`, not with `filter: brightness()`. `--text` is always the opposite polarity from
  `--on-*`, so the mix can only raise contrast; brightness lifts a light-theme fill toward white
  underneath white label text (measured 4.25:1 on `acid-arcade-light`).
- Softened **control borders** need 3:1 against their surface: `.name-input` uses a 70% purple mix
  (60% measures 2.95:1 on two light themes) and the "off" param rows use `--border-strong`.

Re-check with `tools/contrast-checker/` in the theme-service repo before changing any percentage.
The current set measures **500/500 pairs passing across all 10 palettes** (50 recipes).

## History
<!-- Append one entry per apply/update. Most recent last. Never edit past entries. -->
- `2026-08-11` — Applied theme-service `v1.1.0`. Colors-only token migration of `popup.css`
  (all ~45 hardcoded literals removed); vendored `theme.css`, `effects.css`, `dropdown.css`,
  `dropdown.js`, `theme-init.js`, `theme-select.js`, `themes.index.json`. Added the bottom
  appearance row with the swatch dropdown + reduce-motion toggle; renamed `.dropdown`/
  `.dropdown-empty` to `.saved-panel`/`.saved-empty` to clear the component's namespace; swapped
  the hand-rolled grid backdrop for `.fx-grid`; added the missing `:focus-visible` ring; gated the
  app's own transitions and press nudges through `--motion`. Default left as Rink Classic (dark,
  auto-light by OS) per the request — no `data-theme` is set until the user picks one.
