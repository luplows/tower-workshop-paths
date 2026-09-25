---
id: OQ-87
title: Convert a pull request to draft through github.mjs, and allow no other GraphQL
tier: next
kind: workflow
depends_on: [OQ-68]
model: sonnet
blocked: null
---

## Intent

As the dispatch loop, I need to turn a stopped story's pull request into a
draft, so that nothing lands a story that was stopped: the landing sweep,
`land.mjs` and OQ-83 all skip drafts. GitHub offers that only through GraphQL,
and `github.mjs` sends REST requests only, so it needs one narrowly allowed
GraphQL call and no other.

## Acceptance criteria

- [ ] **AC-1** — `scripts/dispatch/github.mjs` exports a function that converts
      one pull request, by number, to a draft. It reads the pull request with
      the `GET …/pulls/<n>` request the module already sends, and takes its
      node id and draft state from that response. If the pull request is
      already a draft it sends nothing more and says so in its result.
      Otherwise it sends GraphQL's `convertPullRequestToDraft` mutation for
      that node id, and returns the draft state the mutation reports. Tests
      cover a ready pull request, one already a draft, and a GraphQL error
      response.
- [ ] **AC-2** — **Exactly one GraphQL request is allowed.** `github.mjs`'s
      allowlist, checked before any network call as for every other request,
      admits `POST https://api.github.com/graphql` only when the body's `query`
      is the module's one mutation text, byte for byte, and its `variables`
      hold only the pull request's node id as a string. A test asserts that
      each of these is refused before the network:
      - `markPullRequestReadyForReview` and `mergePullRequest`;
      - any GraphQL query;
      - the allowed mutation with an extra variable or an extra body key;
      - the allowed mutation sent to any other URL.
- [ ] **AC-3** — Nothing else in `github.mjs` changes. Its other allowlist
      entries, the OQ-68/AC-3 test and the tests for the workflow-dispatch
      prohibition are unchanged, and pass. The new tests are additions.
- [ ] **AC-4** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-87 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Deciding when to convert.** OQ-48 does, when it stops a story.
- **Marking a pull request ready.** That is the owner's act when resuming a
  stopped story, done by hand. No module sends `markPullRequestReadyForReview`.
- **Any other GraphQL operation.**

## Constraints

- Node, ESM, no new runtime dependencies. The request goes through the same
  `send`, token and allowlist as the module's REST requests.

## Context

Decided 2026-09-25 by the owner, in the third review of #151, which split
OQ-48. When the loop stops a story whose pull request is open, the pull
request becomes a draft. That keeps the rule the coder already relies on: a
`blocked:` story is always a draft, "and draft is what keeps the sweep off
it" (OQ-70's AC-8; `coder.md`, "When you cannot proceed: write and exit").
`land-approved.yml` selects candidates with `select(.draft | not)`, and
`land.mjs` returns `draft` for a draft.

The owner chose this over closing the pull request, which REST can do, and
over leaving it ready. Closing went back on the owner's earlier choice to
leave the pull request open. Leaving it ready relied on nothing later
reviewing its head. A draft also keeps the circuit breaker counting:
`land-approved.yml` and the `SessionStart` hook both count `review-blocked`
over `pulls?state=open`, drafts included, so a closed pull request would have
dropped out of the count.

GitHub's REST endpoint "Update a pull request" (`PATCH …/pulls/<n>`) takes
`title`, `body`, `state`, `base` and `maintainer_can_modify`, and has no
`draft` parameter. Converting to draft is the GraphQL mutation
`convertPullRequestToDraft`, whose input is `pullRequestId` (checked against
docs.github.com on 2026-09-25).

This is split from OQ-48 because it is the first GraphQL request on
`github.mjs`'s allowlist, and a change to that allowlist deserves a review of
its own. It depends on nothing unbuilt, so it can be built alongside OQ-85.

## Open questions

*(none)*
