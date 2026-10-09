---
id: OQ-129
title: Fail a test when the story prefix or this repository's name comes back into the dispatch modules
tier: next
kind: workflow
depends_on: [OQ-125, OQ-126, OQ-127, OQ-128]
model: sonnet
blocked: null
---

## Intent

As the owner, I want a test to fail if a later edit writes `OQ-` or
`luplows/tower-workshop-paths` back into the modules that OQ-125 to OQ-128 made take
them from the project's settings, so that the engine stays usable by another
project without anyone having to notice the regression by reading.

## Acceptance criteria

- [ ] **AC-1** — A test reads each of `scripts/dispatch/queue.mjs`,
      `scripts/lint-stories.mjs`, `scripts/dispatch/coder.mjs`,
      `scripts/dispatch/story.mjs` and `scripts/dispatch/review.mjs`, and fails
      if `OQ-` appears in it outside a comment: in a regular expression
      literal, a string literal or a template literal.
- [ ] **AC-2** — The same test reads each of `scripts/dispatch/coder.mjs`,
      `land.mjs`, `loop.mjs`, `review.mjs` and `story.mjs`, and fails if
      `luplows/tower-workshop-paths` appears in it outside a comment, in the
      same three kinds of literal.
- [ ] **AC-3** — The test shows it can fail: given a module text with `OQ-` in
      each of the three kinds of literal, and given one with
      `luplows/tower-workshop-paths` in a string literal, it reports each;
      given text with them only in `//` and `/* … */` comments, it reports
      nothing.
- [ ] **AC-4** — On this repository, at this story's head, the test passes.

## Out of scope

- **Any change to the modules themselves.** If the test finds a literal that
  OQ-125 to OQ-128 left, the coder sets `blocked:` naming it rather than
  changing the module here.
- **Other modules**, test files, the prompts, `.github/` and documents.
- **The claim commit's identity**, `user.email=dispatch@tower-workshop-paths.invalid`
  in `coder.mjs` (line 380 on `main` at `0a9254b`). It names this project but is
  not the repository, so AC-2 matches `luplows/tower-workshop-paths` rather
  than `tower-workshop-paths`. Making it neutral is a separate story if it
  matters.
- **A JavaScript parser.** No new dependency (Constraints).

## Constraints

- No new dependency. Telling a comment from a literal is done by a small
  scanner in the test, not by a parser package.

## Context

- Split from OQ-122 on 2026-10-08, at the owner's decision: the old AC-5,
  widened to `luplows/tower-workshop-paths` for OQ-125's modules.
- The sites the test guards are listed in OQ-125's to OQ-128's Context
  sections, on `main` at `0a9254b`.
- Comments in these modules do spell `OQ-`, for example
  `scripts/lint-stories.mjs` lines 4, 8, 353 and 355, and are left alone
  (OQ-127's Out of scope).

## Open questions

*(none)*
