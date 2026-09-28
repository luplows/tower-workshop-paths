---
id: OQ-92
title: Give the reviewer a helper for the jobs its refused shell commands were doing
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a review to verify what it set out to verify, so that a
verdict is not weaker because the permission layer refused a harmless shell
form. Every recent review records at least one refused command, and three say
the refusal cut short what they checked. The refusals are about shell syntax
(`|`, `for`, `$?`, `&&`), not capability, so the reviewer keeps its freedom to
test as it sees fit. The jobs that recur get a committed helper, and
everything else has a stated fallback.

## Acceptance criteria

- [ ] **AC-1** — A new module, `scripts/dispatch/review-tools.mjs`, is
      runnable as `node scripts/dispatch/review-tools.mjs <subcommand> …`
      and has three subcommands. Each takes the command to run after `--`.
      - `repeat <n> -- <command…>` runs the command `n` times, from 1 to 10.
        It prints each run's exit code and a line "`<passed>/<n>` exited 0",
        plus the last 20 lines of output of any run that exited non-zero.
      - `exit -- <command…>` runs the command once, and prints its output
        and then its exit code.
      - `sorted [--unique] -- <command…>` runs the command once, and prints
        its output lines sorted, deduplicated with `--unique`, then its exit
        code.

      The helper exits 0 whenever it ran the command, whatever the command's
      own exit code, so that the permission layer and the reviewer read the
      result from its output.
- [ ] **AC-2** — **The helper can do nothing the reviewer's allowlist cannot.**
      It runs a command only if the command matches a `Bash(<prefix>:*)`
      entry of `reviewerAllowedTools()` (imported from `invocation.mjs`, not
      copied), and is not `node` itself. Otherwise it refuses before starting
      anything. It starts the command with `execFile` and no shell, so `|`,
      `;`, `&&` and `>` in its arguments are passed literally. It writes no
      file. Tests assert that each of these is refused without starting a
      process: `git push`, `gh`, `sed -i`, `sort -o`, `node -e`, and a command
      whose first word is not on the allowlist. Another test asserts that an
      argument `;` reaches the child as a literal argument.
- [ ] **AC-3** — **`npm` and `npx` start on Windows too.** On Windows they
      are a shell script and a `.cmd`, which `execFile` cannot start without a
      shell (**Context**). So the helper, not the caller, starts an allowed
      `npm` or `npx` command on Windows as `process.execPath` running npm's
      own CLI script, `npm-cli.js` or `npx-cli.js`, from
      `<directory of process.execPath>\node_modules\npm\bin\`. If that script
      is missing, the helper refuses with a message naming the path. On every
      other platform it starts `npm` or `npx` by name, as it starts `git`:
      there they are scripts that `execFile` can start without a shell. The
      caller still cannot name `node`, and no shell is used. Tests assert,
      with the platform and paths injected, the program and arguments started
      for `npx vitest run x` on `win32` (`process.execPath` and the
      `npx-cli.js` path, then `vitest run x`) and on `linux` (`npx`, then
      `vitest run x`), and the refusal when the Windows script is missing.
      The PR body reports one real
      `repeat 2 -- npx vitest run scripts/dispatch/queue.test.mjs` on the
      machine that runs reviews.
- [ ] **AC-4** — Tests cover each subcommand's output with an injected process
      starter: `repeat` with a mix of exit codes, `exit` with a non-zero
      code, `sorted` with and without `--unique`, and `repeat` refusing `0`
      and `11`.
- [ ] **AC-5** — The PR body proposes, under `### Proposed prompt edit` as
      `coder.md` requires, an addition to `.claude/prompts/reviewer.md` that
      says:
      - use `review-tools.mjs` for a repeated run, an exit code or sorted
        output;
      - for anything else, run one allowed command per call, use the Read,
        Grep and Glob tools, or use `node -e` when composition is genuinely
        needed;
      - when a check could not be run, say so in the verdict, naming the
        check.
- [ ] **AC-6** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-92 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Changing any allowlist.** `reviewerAllowedTools()`, `coderAllowedTools()`
  and `READ_ONLY_SHELL_UTILS` are unchanged, and the helper runs under the
  existing `Bash(node:*)`.
- **Narrowing the reviewer's `node` access to the helper.** That is possible
  later, and belongs with OQ-62.
- **The coder's use of the helper.** Nothing stops it, but nothing here tells
  it to.

## Constraints

- Node, ESM, no new runtime dependencies.
- No utility is added to `READ_ONLY_SHELL_UTILS`. `coder-env.mjs` names the
  ones excluded because they can write: `sed`, `sort` (`-o`), `uniq`, `find`,
  `awk`, `tee`, `xargs`, `dd` and any interpreter. The helper's own sorting is
  done in JavaScript.

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
  run only". `repeat` is for this.
- #154: `npx oxlint` with its exit code, the retry CLI with bad arguments, and
  a `sed` read of `main` were refused. The CLI's refusal of bad arguments was
  "checked by reading the code, not by running it". `exit` is for this.

The reviewer's tools are `reviewerAllowedTools()` in
`scripts/dispatch/invocation.mjs`: `Read`, `Glob`, `Grep`, `TodoWrite`, its
git lists, `Bash(npm:*)`, `Bash(npx:*)`, `Bash(node:*)`, and
`READ_ONLY_SHELL_UTILS` (`ls`, `cat`, `head`, `tail`, `wc`, `grep`, `diff`,
`cut`, `pwd`) from `scripts/dispatch/coder-env.mjs`.

**Starting `npm` and `npx` without a shell on Windows**, where reviews are
hand-run (Node v24.19.0), per the runner's notes on #156's review, rechecked
2026-09-28:
- `execFile('npx', …)` and `execFile('npm', …)` fail with `spawn … ENOENT`,
  and `execFile('npx.cmd', …)` throws `spawn EINVAL`;
- `execFile(process.execPath, [<node dir>/node_modules/npm/bin/npx-cli.js,
  '--version'])` works, and printed `11.17.0`;
- `install.mjs` records the same limit: "On Windows `npm` is `npm.cmd`, which
  Node will not spawn without a shell".

**Decided 2026-09-28 by the owner:** a helper script plus a line in the
reviewer's prompt, over a prompt-only change (which relies on the reviewer
remembering) and over widening the allowlist. Widening depends on how Claude
Code's permission layer matches compound commands, which is unchecked, and
risks admitting a write mode. The owner wants the reviewer free to test as it
sees fit, and `node -e` stays that escape hatch.

Raised by the owner's other session on 2026-09-28: every review in that
session had a verdict weakened by a refused pipeline or loop.

## Open questions

*(none)*
