---
id: OQ-65
title: Spawn a coder or reviewer session and classify how it ended
tier: next
kind: workflow
depends_on: [OQ-51]
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need one tested way to run a coder or reviewer session and
find out what happened to it, so that invoking an agent is a function call with
a known set of outcomes rather than a shell line retyped per spawn.

## Acceptance criteria

- [ ] **AC-1** — `spawn.mjs` builds the `claude -p` invocation from a role and
      the story's fields, and the argv construction is a pure exported function
      tested without running `claude`. It carries `--permission-prompts none`,
      `--max-budget-usd`, `--output-format json`, `--model` and `--effort`, plus
      the role's `--allowedTools` and `--disallowedTools`.
- [ ] **AC-2** — A coder spawn takes its environment from `coderEnv` and its
      allowlist from `coderAllowedTools(branch)` in
      `scripts/dispatch/coder-env.mjs`, rather than restating either. A test
      asserts no credential variable survives into the constructed environment.
      That module currently has no importer anywhere in the repository; this
      story is what makes OQ-63's guarantee load-bearing instead of a library
      nothing calls.
- [ ] **AC-3** — The outcome is classified, and the classification is the
      module's contract: `completed`, `budget-exhausted`, `timed-out`, `died`
      (non-zero exit, abnormal `stop_reason`, or `is_error`), or
      `malformed-output` (exit looked clean but the JSON is absent or
      unparseable). Nothing is ever reported as `completed` by default.
- [ ] **AC-4** — **A non-`completed` outcome asserts only that the session did
      not report completion — never that the work did not happen.** In the first
      hand-run of this loop a coder hit a session limit and returned
      `is_error: true` with `stop_reason: "stop_sequence"`, having already
      committed, pushed and opened its pull request. A dispatcher that reads
      that as "nothing happened" would respawn over completed work. The
      classification and the repository's actual state are separate questions,
      and `spawn.mjs` answers only the first.
- [ ] **AC-5** — A spawn exceeding its timeout is terminated and classified
      `timed-out`, and a test asserts the child process is actually gone rather
      than merely awaited — a timeout that leaves the process running is a leak,
      not a timeout.
- [ ] **AC-6** — The spawn is watched while it runs, not only read at exit: a
      session producing no output for a configured interval is detectable. The
      migration plan requires this in as many words — *"every spawn needs a
      liveness check, not just a result read"* — because the failure it exists
      for is a session that neither finishes nor dies.
- [ ] **AC-7** — For a coder spawn, the `## PR title` / `## PR body` /
      `draft`-or-`ready` block that `coder.md` requires as the last thing in its
      report is parsed out and returned. Absent or malformed, that is a
      classified result and not a guess — `spawn.mjs` never invents a PR body.
- [ ] **AC-8** — `spawn.mjs` performs no GitHub operation of any kind. It does
      not create a pull request, post a status, or apply a label, and a test
      asserts its module surface. Those belong to `github.mjs`, and keeping them
      out is what lets a spawn be tested without a repository in any particular
      state.

## Out of scope

- **Rendering the prompt.** `render.mjs` is OQ-51's deliverable; `spawn.mjs`
  calls it. That boundary was settled deliberately rather than left for whoever
  picked this up first — see OQ-51's **Context**.
- **Anything touching GitHub** — status posting, PR creation, labels. That is
  `github.mjs`, step 2 of the migration plan's Phase 1 ordering.
- **The loop.** Retrying, counting `block` verdicts, the two-round bound,
  setting `blocked:` and the `review-blocked` label all belong to
  `dispatch.mjs`. This story spawns one session and returns.
- **Choosing which story to run.** `queue.mjs` does that and is already merged.
- **Interpreting a reviewer's verdict.** `spawn.mjs` returns the parsed JSON;
  deciding what a verdict means is the loop's job.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests must not invoke `claude`. Argv construction, environment building,
  result parsing and classification are pure functions behind a thin caller, as
  `queue.mjs` and `coder-env.mjs` already do.

## Context

Written after running the full loop by hand for OQ-63 — coder, reviewer, a
blocking verdict, a fix round, a passing verdict, and the landing sweep. Four
things that run surfaced, each of which this module has to answer:

1. **A spawn can report failure and still have succeeded.** The session-limit
   case in AC-4 is not hypothetical; it is what happened, and the PR was already
   open when the error came back.
2. **Retries have no contract.** The migration plan says a blocked coder is
   *"respawned with story + findings"*, but `coder.md` has no `{{FINDINGS}}`
   placeholder and nothing tells a retry that its branch and PR already exist.
   Both were hand-written prose in the hand-run. Whether that contract lives in
   `coder.md` or in what `spawn.mjs` appends is this story's to decide, but a
   retry must stop depending on a human composing it.
3. **Injected text can contain placeholder-shaped text.** The reviewer's
   `{{PR_BODY}}` for OQ-63 contained the coder's proposed diff *of `coder.md`*,
   which legitimately includes `{{BRANCH}}`. A renderer that scans its own
   output for leftovers reads those as unsubstituted and refuses to render a
   valid prompt. That is `render.mjs`'s problem (OQ-51) but it was found here.
4. **A coder cannot edit `.claude/prompts/`.** Every `Edit`/`Write` there is
   refused as a sensitive file. It is a good guard, and it means a coder can
   never deliver a story that changes the prompts.

- `docs/migration-plan.md`, "Order within Phase 1" step 3 — the scope this story
  implements, and the liveness requirement in AC-6
- `docs/agent-workflow-design.md`, "Invocation shape" — the flags, and why
  `--permission-prompts none` and `--max-budget-usd` are load-bearing
- `scripts/dispatch/coder-env.mjs` — `coderEnv` and `coderAllowedTools`, which
  AC-2 wires up
- `scripts/dispatch/queue.mjs` and its tests — the house style this should match
- `.claude/prompts/coder.md`, "The coder holds no GitHub API credential" — the
  `## PR title` / `## PR body` contract AC-7 parses

## Open questions

*(none)*
