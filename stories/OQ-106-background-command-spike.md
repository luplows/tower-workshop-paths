---
id: OQ-106
title: "Spike: find out what stops a headless session ending while its shell command runs in the background"
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want to know, from trials rather than reading, how Claude Code
treats a long shell command in a session started the way the dispatcher starts
a coder, and which environment variables change that, so that a later story can
stop a coder losing its work the way OQ-86's first dispatch did on 2026-10-01.
**This is a spike. Its output is written findings, not code.**

What happened: the coder's `npx vitest run` took longer than the 120-second
default shell timeout. Claude Code moved it to the background and said the
session would be notified when it finished. The coder ended its turn to wait.
A `-p` session ends when the model stops calling tools, so no notification
arrived. The run returned `nothing-committed`, and `coder.mjs`'s clean-up
removed the uncommitted work.

## Acceptance criteria

- [ ] **AC-1** — **Only findings are committed.** The pull request's diff
      changes `docs/agent-workflow-design.md`, plus this story's move to
      `stories/done/` and its ticks, and nothing else. Any script used to run
      the trials lives outside the repository's tree and is not committed. Its
      full text is given in the pull request body.
- [ ] **AC-2** — A new subsection under "Platform constraints" in
      `docs/agent-workflow-design.md`, titled "A long shell command in a
      headless session", records the trials. For each trial it gives:
      - the Claude Code version (`claude --version`);
      - the environment variables set beyond what `buildInvocation` produces;
      - the command the trial session was told to run, and how long it takes;
      - what the shell tool returned to the session, quoted verbatim;
      - whether the session ended before the command finished;
      - the trial session's `total_cost_usd`.
- [ ] **AC-3** — The trials answer each of these, and the subsection states
      each answer next to the trial that shows it:
      - **Q1, baseline:** with nothing added, is a command that runs past
        120 seconds moved to the background, and does the session then end
        before the command finishes?
      - **Q2:** with `BASH_DEFAULT_TIMEOUT_MS=600000`, does the same command
        finish in the foreground, with its output returned to the session?
      - **Q3:** with `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`, what happens to
        a command that runs past the shell timeout: moved to the background,
        stopped with an error the session sees, or something else? Can the
        session still start a command with `run_in_background`?
      - **Q4:** with `BASH_MAX_TIMEOUT_MS` raised, does a `timeout` the session
        passes explicitly above 600000 take effect? This trial's command runs
        longer than 600 seconds, so the outcomes differ: it finishes in the
        foreground only if the raised maximum took effect.
      - **Q5:** does a session started with the reviewer's invocation
        (`role: 'reviewer'`) behave as Q1 does?

      If a question cannot be answered, the subsection says so and why. That
      AC is then ticked only if the reason is stated.
- [ ] **AC-4** — The subsection ends with a **Recommendation**: which
      variables, at which values, `coderEnv` (and the reviewer's environment,
      if Q5 shows it is exposed) should set, and whether `coder.md` also needs
      a line about background commands. Each point names the trial it rests
      on. It is a recommendation only. Acting on it is a later story, written
      by Session A.
- [ ] **AC-5** — The Recommendation addresses OQ-76's AC-5, which plans to
      pin `BASH_DEFAULT_TIMEOUT_MS=120000` and `BASH_MAX_TIMEOUT_MS=600000` for
      both roles in `buildInvocation`, and to derive `DEFAULT_STALL_MS` from
      that maximum. For each of the three, it says whether the trials support
      keeping the planned value or changing it, and to what, naming the trial.
      If it recommends a longer shell timeout, it says what the stall interval
      would need to become, since a session emits no event while one command
      runs (OQ-76's Context).

## Out of scope

- **Any change to code, prompts, tests, settings or workflows**: `coder-env.mjs`,
  `invocation.mjs`, `spawn.mjs`, `coder.md`, `reviewer.md`, `.claude/` and
  `.github/`. The fix is a later story.
- Making OQ-86's loop tests faster. That stays OQ-86's job when it is next
  dispatched.
- Keeping a stopped coder's uncommitted work instead of removing it.
- Any **Planned** marker. The spike records facts and makes no design
  decision.
- Editing OQ-76. Where AC-5's answer differs from OQ-76's plan, changing that
  story is Session A's.

## Constraints

- **Trial sessions are started by `spawnSession` in
  `scripts/dispatch/spawn.mjs`**, with `role: 'coder'` (or `'reviewer'` for
  Q5), so their arguments and environment are what `buildInvocation` builds.
  Variables under test are added to `baseEnv`, which both roles' environments
  copy. If `buildInvocation` overrides one of them (as OQ-76's AC-5 would, once
  built), the subsection says so, and states the value the session actually
  ran with. The prompt is a short instruction to run one command, not
  `coder.md`. The model may be overridden to `haiku` to keep trials cheap.
  Each choice is stated in the subsection.
- At most 10 trial sessions in all, each with `maxBudgetUsd` no higher than 1.
- The slow command is a `node -e` timer that prints a line and exits after a
  fixed time, not a test suite: about 150 seconds for Q1 to Q3 and Q5, and
  longer than 600 seconds for Q4. `Bash(node:*)` is on both roles' allowlists.
  `spawnSession`'s defaults (`DEFAULT_STALL_MS` 20 minutes and
  `DEFAULT_TIMEOUT_MS` 30 minutes, in `spawn.mjs`) leave room for the Q4
  trial.
- Each trial runs in a scratch directory outside this repository's tree.

## Context

- `scripts/dispatch/spawn.mjs`: `spawnSession` runs one session through
  `buildInvocation` and classifies how it ended.
- `scripts/dispatch/invocation.mjs`: `buildInvocation` and `ROLE_DEFAULTS`
  (coder `maxBudgetUsd: 6`, reviewer `maxBudgetUsd: 3`, with overrides).
- `scripts/dispatch/coder-env.mjs`: `coderEnv` copies `baseEnv`, strips GitHub
  credentials, and sets `GH_CONFIG_DIR` to an empty directory.
  `coderAllowedTools` grants `Bash(node:*)`. The reviewer's environment in
  `buildInvocation` is a plain copy of `baseEnv`.
- The names `BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS` and
  `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` appear in Claude Code 2.1.281's list of
  environment variables. What each does here is what this spike establishes.
- OQ-76 (ready, not built): its AC-5 plans the timeout pins that AC-5 here
  addresses. Its Context records that 2.1.281 computes the maximum as
  `Math.max(BASH_MAX_TIMEOUT_MS ?? 600000, BASH_DEFAULT_TIMEOUT_MS ?? 120000)`,
  read from the CLI's code. Q2 and Q4 test that rule in practice.
- `docs/agent-workflow-design.md`, "Invocation shape": the reviewer's shell
  check of 2026-09-28 is the house style for recording a platform finding.
- OQ-86's first dispatch (2026-10-01): a shell result of "Command did not
  complete within its 120s timeout and was moved to the background", then
  `nothing-committed`.

## Open questions

*(none)*
