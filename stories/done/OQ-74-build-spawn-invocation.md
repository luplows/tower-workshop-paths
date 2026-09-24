---
id: OQ-74
title: Build a coder or reviewer invocation without running anything
tier: next
kind: workflow
depends_on: [OQ-51, OQ-67]
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need everything that goes into starting an agent session
(its arguments, its environment, its allowlist and its prompt) built by tested
pure functions, so that what a coder or reviewer is allowed to do and told to
do is decided in one reviewable place rather than retyped per spawn.

## Acceptance criteria

- [ ] **AC-1** — `scripts/dispatch/invocation.mjs` builds the `claude -p`
      argument list from a role (`coder` or `reviewer`) and the story's fields,
      as a pure exported function tested without running `claude`. The list
      carries `--permission-prompts none`, `--max-budget-usd`,
      `--output-format json`, `--model` and `--effort`, plus the role's
      `--allowedTools` and `--disallowedTools`.
- [ ] **AC-2** — A coder invocation takes its environment from `coderEnv` and
      its allowlist from `coderAllowedTools(branch)` in
      `scripts/dispatch/coder-env.mjs`, rather than restating either. A test
      asserts that no credential variable survives into the constructed
      environment. That module has no importer anywhere in the repository
      today; this story is what makes OQ-63's guarantee load-bearing instead of
      a library nothing calls.
- [ ] **AC-3** — The reviewer's allowlist is built by an exported function, in
      the same way `coderAllowedTools` builds the coder's, rather than being
      retyped per spawn. It includes `READ_ONLY_SHELL_UTILS` from
      `coder-env.mjs` (OQ-67), imported rather than restated, and grants no
      `git push` and no `gh`. Each role's list is **complete on its own**: a
      test asserts that the constructed arguments carry every tool the role
      uses, because `permissions.allow` in `.claude/settings.json` is silently
      ignored when the workspace is not trusted (see **Context**, point 5).
      `docs/agent-workflow-design.md`'s reviewer invocation sketch and
      `reviewer.md`'s prose description of the list are updated to match.
      `reviewer.md` is under `.claude/prompts/`, so that half is emitted as a
      diff in the PR body.
- [ ] **AC-4** — Every untrusted value is passed through `wrapInjectedBlock`
      before `render`: `{{STORY}}` for both roles, `{{PR_BODY}}` for the
      reviewer, and any findings block a retry carries. A test asserts the
      assembled prompt contains exactly one begin and one end marker per
      injected block, and no heading at or above the prompt's own top level.
      **`render.mjs` deliberately does not enforce this**: it substitutes
      whatever string it is given and has no notion of which placeholders are
      untrusted, so OQ-51's guarantee currently lives in caller discipline and
      this story is the caller. Three independent reviewers raised it across
      #117's four rounds. Twice it was recorded as an observation and closed by
      assertion. The third time, it was demonstrated against
      `render.test.mjs`, which renders a bare unbounded `{{PR_BODY}}` without
      complaint. A **name-keyed default** (`wrapInjectedBlock` applied
      automatically to a named set, with an explicit opt-out) was raised in
      that third round and still satisfies the requirement that a future
      `{{FINDINGS}}` be covered without editing `render.mjs`. Choose that or
      something better, but do not close this by assertion a fourth time.
- [ ] **AC-5** — A retry's prompt is assembled from the story, the findings,
      and what already exists: the round number and rounds remaining, that the
      branch and pull request exist, that the story file's move is already
      done, and that the emitted PR body will *replace* the existing one rather
      than be appended to it. Where that contract lives, whether in `coder.md`
      or in what this module appends, is this story's choice. A retry must stop
      depending on a person writing it (see **Context**, points 1 and 4).
- [ ] **AC-6** — The rendered prompt is returned as its own value and appears
      in no argument. A test asserts that no element of the constructed
      argument list contains the prompt text. Delivering it on stdin is
      OQ-65's; keeping it out of the arguments is this story's (see
      **Context**, point 6).
- [ ] **AC-7** — Nothing in `invocation.mjs` starts a process, reads a
      session's output, or performs a GitHub operation, and a test asserts the
      module surface.

## Out of scope

- **Starting, supervising or stopping the process.** That is OQ-65.
- **Classifying how a session ended, or parsing its report.** That is OQ-75.
- **Rendering.** `render.mjs` is OQ-51's deliverable. This module calls it.
- **Anything touching GitHub.** That is `github.mjs` (OQ-68).
- **The loop:** deciding to retry, counting rounds, the two-round bound. That
  is OQ-48. AC-5 assembles a retry's prompt when told to; it does not decide
  that one happens.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests must not invoke `claude`.

## Context

Split out of OQ-65 on 2026-09-23. OQ-65 had grown to eleven acceptance
criteria covering three mechanisms: building an invocation, supervising a
process, and reading its result. This story is the first. The points below
moved here from OQ-65's Context and are renumbered.

1. **Retries have no contract** (from the OQ-63 hand-run). The migration plan
   says a blocked coder is *"respawned with story + findings"*, but `coder.md`
   has no `{{FINDINGS}}` placeholder, and nothing tells a retry that its
   branch and PR already exist. Both were written by hand in the hand-run.
2. **Injected text can contain placeholder-shaped text.** The reviewer's
   `{{PR_BODY}}` for OQ-63 contained the coder's proposed diff *of
   `coder.md`*, which legitimately includes `{{BRANCH}}`. OQ-51 settled that
   with `checkPlaceholderContract`, which runs against the template before
   injection.
3. **A findings block is the third injected block, and the most dangerous one
   to bound** (from the OQ-51 hand-run, #117). Findings text discusses the
   bounding mechanism, so it quotes marker syntax and heading syntax as its
   subject matter. On three separate renders during #117, the findings forged
   the very construct they described, producing spurious begin/end markers
   and live headings inside the block meant to contain them. The injected
   story did it too, through its own frontmatter delimiter. **The documents
   most likely to contain injection-shaped text are the ones discussing
   injection**, which is exactly the corpus this dispatcher points at. That
   is why AC-4 exists.
4. **A retry needs to be told what round it is and what already exists.** All
   three of #117's retries were hand-written prose telling the coder that its
   branch and PR already existed, that item 19's move was done, that the PR
   body would *replace* rather than append, and how many rounds remained. None
   of that is in `coder.md`, and all of it was load-bearing: a retry not told
   the PR exists may try to open a second one.
5. **`settings.json` allowances disappear without warning** (from the
   #122/#123 reviews, 2026-09-23). The reviewer spawn logged that 14
   `permissions.allow` entries from `.claude/settings.json` were ignored
   because the workspace was untrusted in the owner's local config. `claude
   --help` says the trust dialog is skipped under `-p`, and that settings files
   failing validation are "silently ignored in this mode". Those spawns were
   unaffected only because they passed their own `--allowedTools`. The same
   two reviews showed the reviewer's list itself was short: `npm test | tail`
   was denied on #122, and pipelines through `sed`, `sort`, `tail` and `head`
   on #123. That is the reviewer-side twin of OQ-67. `sed` and `sort` stay
   denied even after AC-3, because they can write, and OQ-67's property test
   is what keeps them out.
6. **The prompt is too large for a command line.** See OQ-65's Context. This
   story's part is only that the prompt never becomes an argument.
7. **A coder cannot edit `.claude/prompts/`.** Every `Edit`/`Write` there is
   refused as a sensitive file. That is why AC-3's `reviewer.md` half is
   emitted as a diff, and why AC-5, if it puts the retry contract in
   `coder.md`, has to do the same.

- `scripts/dispatch/coder-env.mjs`: `coderEnv`, `coderAllowedTools` and
  `READ_ONLY_SHELL_UTILS`, which AC-2 and AC-3 import
- `scripts/dispatch/render.mjs`: `render`, `wrapInjectedBlock`
- `docs/agent-workflow-design.md`, "Invocation shape": the flags, and why
  `--permission-prompts none` and `--max-budget-usd` are load-bearing
- `scripts/dispatch/queue.mjs` and its tests: the house style to match

## Open questions

*(none)*
