---
id: OQ-115
title: Install steward's review gate here through init, pinned at 935fb5b
tier: next
kind: workflow
depends_on: [OQ-132]
model: sonnet
blocked: "Owner-only: the installation is run by the owner with Session A, by hand, for steward's ST-48 validation. Never dispatched (decided 2026-10-08 by the owner, and revised 2026-11-04)."
---

## Intent

As the owner, I want this repository's review gate and landing to run on steward,
installed the way any other project installs it, so that the workflow's code lives
in one place and this repository stays about the product. It is also the second
project in steward's ST-48 validation.

## Acceptance criteria

- [x] **AC-1** — The pull request's body gives the command that opened it, from
      `main` with OQ-132 landed, on steward at
      935fb5b81398420acd5e7476d2b94bec94bbad02 (`npx --yes
      --package=github:luplows/steward#<that commit> steward <command>`), and its
      output: `steward init --yes --ref <that commit> --land no --unit-links file
      --rules-file REVIEW.md`.
- [x] **AC-2** — It adds `steward.config.json`, `review-gate.yml`,
      `land-approved.yml` and `inspection.yml`, and leaves `REVIEW.md` and
      `.github/pull_request_template.md`. Every steward command in those workflows is
      pinned to that commit's full SHA. `steward.config.json` has `land: false` and
      `unitLinks: ["file"]`. No steward script or prompt is copied.
- [x] **AC-3** — `package.json`, `package-lock.json`, `ci.yml` and the story files
      are unchanged by `init`. The only other changes in the pull request are this
      story's move and ticks, and taking `OQ-115` out of every **Planned (…)**
      marker that names it in `docs/agent-workflow-design.md`.
- [x] **AC-4** — It is titled "Install steward at 935fb5b", and its body has
      `Unit: stories/OQ-115-workflow-own-repository.md` and the three filled sections.
      Steward's version, 0.0.0 at this commit, is not in the title or the commit
      message.

## Out of scope

- **Removing the old engine** (OQ-132, before this), the rule files (OQ-133) and the
  documents (OQ-134).
- **Moving to steward's stories, schema, queue or `stories/stories.json`.** This
  repository keeps its file stories and `OQ` prefix.
- **A later pin.** Moving to a tag once steward has one is separate work.
- **Fixing any steward defect found.** Each is recorded and raised with the crew.

## Constraints

- These steps surround the pull request, so no diff can show them, and steward's
  ST-48 evidence records them, not an AC here:
  - Before it merges, only `review/agent` is removed from `main`'s required checks,
    and `test` and `enforce_admins` stay.
  - The owner agrees the merge. It is merged by hand with `gh pr merge --squash
    --subject "Install steward at 935fb5b"`, with `test` green, and no verdict or
    marker is written for it. The gate cannot review it, since it runs from `main`,
    where it is not yet installed. This is the one exception to `CLAUDE.md`'s rule
    on merging.
  - After it merges, `steward protect` exits 0, and `main` requires both `test` and
    `review/agent`, with `enforce_admins` on. Unattended landing stays off, and no
    coder is enabled.

## Context

- Rewritten 2026-11-04 with the owner, for steward's ST-48. It replaces the earlier
  cut-over, which swapped the workflow files in place, pinned steward in
  `package.json` by tag, and left the old engine in place. `init` writes no file
  `main` already has, and does not touch `package.json`.
- The plan is in `docs/agent-workflow-design.md`, "Portability", "Decided so far",
  "This repository adopts steward through `init`".
- `steward protect` keeps existing protection and adds `review/agent`, so `test`
  stays required.
- `ci.yml` and `deploy-pages.yml` trigger on the workflow named `Land approved PRs`
  (OQ-124), and steward's thin `land-approved.yml` has that name. So a landing here
  should run CI on `main`, which a landing on pinpoint did not (its evidence, D3).

## Open questions

*(none)*
