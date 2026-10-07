---
id: OQ-116
title: Put OQ-83's open-pull-request listing through github.mjs's shared request tests, and fail when a builder is left out
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want every GitHub request the loop can make to go through the
same safety tests, so that a later change cannot make one of them carry a
credential, reach a status or workflow endpoint, or fall outside the allowlist
without a test failing. OQ-83 (#201) added `buildListOpenPullRequests` to
`scripts/dispatch/github.mjs` without adding it to the tests every other REST
request goes through. Its review found it safe by hand. Nothing would catch a
regression.

## Acceptance criteria

- [ ] **AC-1** — `allBuiltRequests()` in `scripts/dispatch/github.test.mjs`
      includes `buildListOpenPullRequests`, so that the three tests that run
      over it cover it: "OQ-68/AC-2: builders are pure and carry no token",
      "OQ-68/AC-3: no request this module can build targets a commit status,
      check or workflow", and "OQ-68/AC-3: send itself refuses a status or
      workflow-dispatch request before any network call", whose last part
      sends every built request through the allowlist. That last test's count
      of sent requests is not a hand-written number; it is
      `allBuiltRequests().length`.
- [ ] **AC-2** — A new test fails when any function `github.mjs` exports
      whose name starts with `build` is not represented in
      `allBuiltRequests()`. `allBuiltRequests()` may become a structure keyed
      by builder name to make this possible. The one exclusion is
      `buildConvertPullRequestToDraft`, the GraphQL request, which OQ-87/AC-2's
      own tests cover; the exclusion is written in the test, with that reason.
      The test is shown to fail by removing one builder from the list, and the
      PR body says which builder and what the failure said.
- [ ] **AC-3** — A test of the request's shape, as OQ-112/AC-1's tests have for
      the three requests OQ-112 added:
      - `buildListOpenPullRequests(REPO, { base: 'main', page: 2 })` returns
        exactly `{ method: 'GET', url:
        'https://api.github.com/repos/<REPO>/pulls?base=main&state=open&per_page=100&page=2' }`;
      - its defaults are `base: 'main'` and `page: 1`;
      - a non-string `base` makes `buildListOpenPullRequests` throw
        (`requireString`);
      - an empty `base` builds a URL with `base=&`, which `send` refuses
        through the allowlist (its pattern needs at least one character).
        The fake `fetch` records no call in either case.
- [ ] **AC-4** — Tests of the response side, with a fake `fetch`:
      - `parseOpenPullRequests` reduces each pull request to `number`,
        `headRef`, `headSha`, `draft` and `authorAssociation`; `draft` is
        `true` only when the response's `draft` is `true`; a missing `head` or
        `author_association` gives `null`;
      - `listOpenPullRequests` reads a page of 100, then the next, and stops
        after the first page shorter than 100, returning every pull request
        from all pages in order.

## Out of scope

- Any change to `github.mjs` itself. If a test here finds a defect, the PR
  says so and the story is blocked rather than fixed in passing.
- `writer-prs.mjs` and its tests, which use a stand-in for
  `listOpenPullRequests`.
- The GraphQL request's tests (OQ-87).

## Constraints

*(none)*

## Context

- `scripts/dispatch/github.mjs` at `21fdb52`: `buildListOpenPullRequests`
  (line 144), `parseOpenPullRequests`, `listOpenPullRequests`, and the
  `ALLOWED` entry for `^/pulls\?base=…&state=open&per_page=100&page=…$`.
  The module's header explains the build/parse/send split.
- `scripts/dispatch/github.test.mjs` at `21fdb52`: `allBuiltRequests()`
  (line 48) lists 9 requests, not including `buildListOpenPullRequests`. It is
  used by the tests at lines 138, 196 and 203, and line 219 expects exactly 9
  sent requests. "OQ-112/AC-1: three more operations" (line 409) is the house
  style for AC-3 and AC-4.
- #201, OQ-83: the review's observation that raised this.
- OQ-68: the module's safety tests. OQ-87: the GraphQL request and its tests.

## Open questions

*(none)*
