# Session A

Instructions for the session that writes and refines stories with the owner.
Session B, the release review, follows them too when it writes a story
(`docs/agent-workflow-design.md`, "Session B is Session A wearing a different
hat").

Instructions only. Where a rule is defined elsewhere, this file points there
rather than restating it. The role itself is described in
[`docs/agent-workflow-design.md`](agent-workflow-design.md), "The shape" and
"The story artifact".

## Before writing a story

- Read [`CLAUDE.md`](../CLAUDE.md). Its "Branches and pull requests" and
  "Claims about this repository" sections apply to every story pull request.
- Read [`stories/README.md`](../stories/README.md) for the schema, the status
  derivation and the readiness test, and start from
  [`stories/_TEMPLATE.md`](../stories/_TEMPLATE.md).
- Read `REVIEW.md`, "PRs that add or change a story" (items 20–25). That is
  what the story's pull request is reviewed against.
- Sizing is Session A's judgement, and so is saying when a story is too big
  (`docs/agent-workflow-design.md`, "Sizing is a judgment, and it is
  Session A's").

## Writing it

- Use the next unused OQ number, checked against `stories/` (`done/` and
  `retired/` included), `Open-Questions.md` and `Completed-Questions.md`
  (`REVIEW.md` item 5). Also
  check every branch on `origin` (`git ls-remote --heads origin`): a story
  still being written is on its branch and not yet on `main`.
- Work on a `write-story/OQ-<n>-<slug>` branch, never `handoff/…`, which is
  the name steward gives a coder's branch, nor `story/…`, which the old engine
  gave one.
- Work in a separate git worktree, not the repository's main checkout
  (`CLAUDE.md`, "Branches and pull requests").
- Record a decision the story makes in the same pull request, in the design
  of record for its kind (`CLAUDE.md`, "Stories"): a workflow decision in
  `docs/agent-workflow-design.md`, marked as that document's "Reading this
  document" note says; a product decision in `Project-Outline.md`, saying it
  is planned and naming the story.
- Before opening the pull request, run `node scripts/lint-stories.mjs`. The
  story should lint with no blocking violation, and have the status you
  intend, derived as `stories/README.md`, "Status and order", says: `ready`
  when its Open questions section is empty, `draft` otherwise. No script
  prints the status.

## Handing it over

Decided by the owner on 2026-09-28.

- **Open every pull request as a draft.**
- **Mark it ready only when the owner says so**, in the conversation with
  this session. Marking a pull request ready is the owner's go-ahead for it
  to be reviewed and landed. Steward reviews a ready pull request and lands it
  once it passes, and never reviews or lands a draft (`CLAUDE.md`, "Branches
  and pull requests").
- If its review blocks, fix the story on the same branch, and it is reviewed
  again once its head has moved.

## Recommending a handoff

- A story is coded only once the crew approves it as a steward handoff
  (`CLAUDE.md`, "Branches and pull requests"). Session A recommends which
  story to approve next, and says why.
- Recommend only a story that reads `ready` (`stories/README.md`, "Status and
  order"), whose `depends_on` stories are all in `stories/done/`, and that no
  `handoff/` branch on `origin` names (`git ls-remote --heads origin
  'handoff/*'`). Recommend in that section's order.
- Handoffs are coded in the order they were approved, so a story that touches
  the same files as one already approved is recommended only after that one
  lands, unless the owner decides otherwise.
- Coding a story needs the owner's word. Relay it to the crew naming exactly
  the stories it covers.
- Do not edit a story after its handoff is approved, until its pull request
  lands (`CLAUDE.md`). If it must change, tell the crew, who reapprove or
  withdraw the handoff.

## Stopped stories

- A story that comes back with `blocked:` set, from a coder or from review,
  is Session A's to resolve with the owner. Clearing `blocked:` is Session
  A's (`stories/_TEMPLATE.md`).
- A story the owner decides not to build is retired to `stories/retired/`, as
  `stories/README.md`, "Lifecycle", describes.
