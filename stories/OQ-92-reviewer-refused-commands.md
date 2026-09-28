---
id: OQ-92
title: Stop refused read-only commands from reducing what a review verifies
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a review to verify what it set out to verify, so that a
verdict is not weaker because the reviewer's permission layer refused a
harmless command. Every recent review records at least one refused read-only
command, and three say the refusal cut short what they checked.

## Acceptance criteria

- [ ] **AC-1** — *To be settled with the open question below.* Whichever
      approach is chosen, the reviewer can get what the refused commands in
      **Context** were after (sorted output, a repeated test run, a command's
      exit code) without a refusal, and nothing it is newly allowed can write
      in any mode (OQ-67's AC-5 rule for `READ_ONLY_SHELL_UTILS`). When the
      approach is settled, it is recorded in `docs/agent-workflow-design.md`
      with a `Planned (OQ-92)` marker, and this story gains an AC to resolve
      it.

## Out of scope

- The coder's allowlist, except where it shares `READ_ONLY_SHELL_UTILS` with
  the reviewer.
- Removing the reviewer's write capability. That is OQ-62.

## Constraints

- No utility is added to `READ_ONLY_SHELL_UTILS` that can write in any mode.
  `coder-env.mjs` names the ones excluded for that reason: `sed`, `sort`
  (`-o`), `uniq`, `find`, `awk`, `tee`, `xargs`, `dd` and any interpreter.

## Context

Refusals recorded by the reviews themselves, 2026-09-24 to 2026-09-28:

- #149: a compound command using `$?` was denied; the lint result came
  another way.
- #150: `git -C … check-ignore`, `git -C … diff --stat` and a compound grep
  were denied.
- #151 (four rounds): `git -C`, a `sed`/`sort` pipeline, `git branch -r`, a
  `sort` pipeline and a `for` loop were refused. One round left the CI figures
  in OQ-48's Context unverified.
- #153: "the GitHub tests three times in a loop, then `npx eslint`" was
  refused, "so the reviewer checked the new tests for stability on a single
  run only".
- #154: `npx oxlint` with its exit code, the retry CLI with bad arguments, and
  a `sed` read of `main` were refused. The CLI's refusal of bad arguments was
  "checked by reading the code, not by running it".

The reviewer's tools are `reviewerAllowedTools()` in
`scripts/dispatch/invocation.mjs`: `Read`, `Glob`, `Grep`, `TodoWrite`, its
git lists, `Bash(npm:*)`, `Bash(npx:*)`, `Bash(node:*)`, and
`READ_ONLY_SHELL_UTILS` (`ls`, `cat`, `head`, `tail`, `wc`, `grep`, `diff`,
`cut`, `pwd`) from `scripts/dispatch/coder-env.mjs`.

Raised by the owner's other session on 2026-09-28: every review in that
session had a verdict weakened by a refused pipeline or loop.

## Open questions

- **Which approach?** Candidates, not exclusive:
  1. **Prompt:** `reviewer.md` tells the reviewer to run one allowed command
     per call and use the Read, Grep and Glob tools rather than pipelines,
     and to use `node -e` for anything else. `Bash(node:*)` already allows
     that, so this needs no allowlist change.
  2. **Allowlist:** allow specific shell forms, such as `for` loops over
     allowed commands. This depends on how Claude Code's permission layer
     matches compound commands, which has not been checked.
  3. **A helper script:** a committed read-only script the reviewer runs for
     the repeated jobs: tests N times, a command with its exit code, sorted
     output.

  `sort` is excluded from the read-only list for `-o`, so option 2 cannot
  simply add it. Option 1 is cheapest. `Bash(node:*)` already lets the
  reviewer do anything a pipeline could, which bears on OQ-62.
