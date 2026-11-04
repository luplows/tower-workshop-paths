---
id: OQ-146
title: Free the header with a brand mark, and move section navigation to the bottom on small screens
tier: normal
kind: product
depends_on: [OQ-143]
model: sonnet
blocked: null
---

## Intent

As a player on my phone, I want the header to stop being crowded, and the
Input, Path and Labs tabs where my thumb is, so that the tool is easy to use
one-handed while I play.

## Acceptance criteria

- [ ] **AC-1** — The header's title, today the heading "Workshop Input" on
      every section, is replaced by a brand mark: `public/favicon.svg`
      followed by the app's name. The name is defined once, as a constant,
      so the owner's brand can replace it in one place. Until then it is
      "Tower Workshop Paths", the page's `<title>`.
      - The mark is still the page's `h1`, and the app's name is its accessible
        name at every width. `src/App.test.jsx` and
        `e2e/sticky-header.spec.js` look it up with
        `getByRole('heading', { name: 'Tower Workshop Paths', level: 1 })` in
        place of their three lookups of "Workshop Input".
      - At 1024 px wide and below, the mark shows the icon alone.
      - The icon's URL is built from `import.meta.env.BASE_URL`, and is not a
        hard-coded `/favicon.svg`, so that it loads under the base path the
        deployed build uses.
- [ ] **AC-2** — At 1024 px wide and below, the Input, Path and Labs tabs move
      out of the header into a bar at the bottom of the screen. The header
      keeps the brand mark and the ⋯ menu.
      - The bar's bottom edge is at the bottom of the screen on every section,
        whether or not the section is taller than the screen, and it stays
        there while the page scrolls.
      - The bar spans the page's column (`#root`) and no more. From 481 to
        1024 px, that is the same centred 480 px column as the rest of the page,
        not the full width of the screen.
      - It is still the one `tablist`, with the same tab names, so the
        existing tests' `getByRole('tab', …)` calls still find it.
      - Above 1024 px, the tabs stay in the header, as today.
- [ ] **AC-3** — At 1024 px and below, nothing on any section is hidden behind
      the bars. Scrolled to its end, the page shows the end of the section above
      them.
      - On Input, the Attack, Defense and Utility tabs (`BottomTabBar`) stay at
        the bottom, directly above the new bar, and both stay visible while the
        page scrolls.
- [ ] **AC-4** — The name of the open section (Input, Path or Labs) is shown
      at the top of its panel as a heading, so it is still clear where the
      player is once the title is gone.
- [ ] **AC-5** — Playwright:
      - At 390×844 (the mobile viewport `e2e/appearance.spec.js` uses):
        - the section tabs are in the bottom bar and not in the header;
        - switching section works from it;
        - on each of the three sections, the bar's bottom edge is at the
          viewport's bottom edge;
        - on Input, the last level input on a long tab can be scrolled into
          view and typed into, with both bars visible;
        - on Path and on Labs, with the page scrolled to its end, the bottom of
          the section's panel (`#section-panel-path`, `#section-panel-labs`) is
          at or above the bar's top edge.
      - At 768×1024, the section tabs are in the bottom bar, and the bar's left
        and right edges are within `#root`'s.
      - At 1280×720, the section tabs are in the header.
- [ ] **AC-6** — The header changes every captured screen. The pull request
      deletes every baseline in `e2e/__screenshots__/` and says why, as
      `CLAUDE.md`'s Testing section requires, and `update-screenshots.yml`
      regenerates them.

## Out of scope

- The brand itself, its name and icon, which the owner is working on. The
  favicon and the page title are placeholders.
- Desktop layout, apart from AC-1's brand mark and AC-4's heading.
- Path's Buy order / Respec views (OQ-143).

## Constraints

*(none)*

## Context

- The owner's feedback of 2026-10-26: "header is extremely full on phone
  screens. Branding may help this a bit". Agreed the same day:
  - Session A's proposal of a brand mark, a bottom navigation bar on phones
    ("I'd be ok trialing bottom nav"), and a section heading in the page;
  - the favicon as the placeholder icon.
- Not settled by the owner: whether Input's category tabs move up, or stack
  above the new bar. AC-3 keeps them at the bottom, since `BottomTabBar`
  mirrors the game's own tree tabs and is coloured by tree. If the trial
  shows that two bars are too many, moving them up is a follow-up story.
- Also Session A's choice, not settled by the owner: the 1024 px threshold, and
  the bar spanning the column. This story adds the tool's first layout
  breakpoint. 1024 px is the one width the CSS already names, and it takes in a
  phone on its side and a tablet, where a bottom bar is as useful. If the trial
  says otherwise, changing the threshold is a follow-up story.
- At 64c9bb9:
  - `src/App.jsx`'s header holds `<h1 className="app__title">Workshop
    Input</h1>`, `AppSectionTabs` and `HeaderMenu`, with `ModeTabBar` below
    it on Input;
  - `index.html`'s `<title>` is "Tower Workshop Paths", and its icon is
    `/favicon.svg`;
  - the only width media query in `src/`'s CSS is `@media (max-width: 1024px)`
    at `src/index.css` line 42, and it only sets `font-size: 16px`;
  - `#root` (`src/index.css` lines 114-116) is `width: 480px` and
    `max-width: 100%` at every width, so the page is a centred column of at
    most 480 px, on a desktop too;
  - `.bottom-tab-bar` (`WorkshopInputs.css` line 95) is `position: sticky`;
  - the three lookups of "Workshop Input" are at `src/App.test.jsx` line 24 and
    `e2e/sticky-header.spec.js` lines 10 and 26;
  - `vite.config.js` sets `base` to `/tower-workshop-paths/` for a build or a
    preview, while Playwright runs against `npm run dev`, whose base is `/`. A
    hard-coded `/favicon.svg` would pass every test and could fail on Pages.
- `e2e/appearance.spec.js` captures `upgrade-`, `path-` and `enhance-`
  screens at desktop and mobile widths, and `path-desktop-dark.png`. All of
  them show the header.
- Depends on OQ-143, which adds Path's view tabs under the header and also
  edits `App.jsx`.

## Open questions

*(none)*
