---
id: OQ-146
title: Free the phone header with a brand mark, and move section navigation to the bottom on phones
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
      - At 1024 px wide and below (`index.css`'s breakpoint), the mark is the
        icon alone, with the name as its accessible label.
- [ ] **AC-2** — At 1024 px wide and below, the Input, Path and Labs tabs move
      out of the header into a bar fixed to the bottom of the screen. The
      header keeps the brand mark and the ⋯ menu.
      - It is still the one `tablist`, with the same tab names, so the
        existing tests' `getByRole('tab', …)` calls still find it.
      - Above 1024 px, the tabs stay in the header, as today.
- [ ] **AC-3** — On Input at 1024 px and below, the Attack, Defense and Utility
      tabs (`BottomTabBar`) stay at the bottom, directly above the new bar,
      and both stay visible while the page scrolls. Nothing on the page is
      hidden behind them: the page's own bottom padding makes room for both.
- [ ] **AC-4** — The name of the open section (Input, Path or Labs) is shown
      at the top of its panel as a heading, so it is still clear where the
      player is once the title is gone.
- [ ] **AC-5** — Playwright, at 390×844 (the mobile viewport
      `e2e/appearance.spec.js` uses):
      - the section tabs are in the bottom bar and not in the header;
      - switching section works from it;
      - on Input, the last level input on a long tab can be scrolled into
        view and typed into, with both bars visible;
      - at 1280×720 the tabs are in the header.
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
- At db03ae3:
  - `src/App.jsx`'s header holds `<h1 className="app__title">Workshop
    Input</h1>`, `AppSectionTabs` and `HeaderMenu`, with `ModeTabBar` below
    it on Input;
  - `index.html`'s `<title>` is "Tower Workshop Paths", and its icon is
    `/favicon.svg`;
  - `src/index.css` switches layout at `@media (max-width: 1024px)`;
  - `.bottom-tab-bar` (`WorkshopInputs.css` line 95) is `position: sticky`.
- `e2e/appearance.spec.js` captures `upgrade-`, `path-` and `enhance-`
  screens at desktop and mobile widths, and `path-desktop-dark.png`. All of
  them show the header.
- Depends on OQ-143, which adds Path's view tabs under the header and also
  edits `App.jsx`.

## Open questions

*(none)*
