---
id: OQ-107
title: Give dispatched sessions a 10-minute shell timeout, and tell them never to end a turn while a command runs
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a coder or reviewer session to run any command of up to
10 minutes in the foreground, and to know that a headless session loses
anything still running in the background when it ends its turn, so that no
story loses its work the way OQ-86's first dispatch did. Background commands
stay available, so no story needs to be run differently from the rest.

## Acceptance criteria

- [ ] **AC-1** — `buildInvocation` in `scripts/dispatch/invocation.mjs` sets
      `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` to `'600000'` in the
      returned `env` of both roles. The values are set after `baseEnv` is
      copied, so they override whatever `baseEnv` holds. Both values come
      from one exported constant, not two literals. Tests, for each role,
      cover:
      - a `baseEnv` without either variable;
      - a `baseEnv` carrying different values for both.

      In both cases the returned `env` holds `'600000'` for both variables.
- [ ] **AC-2** — `buildInvocation` removes `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`
      from the returned `env` of both roles when `baseEnv` carries it, so
      every dispatched session has background commands available. A test
      covers each role.
- [ ] **AC-3** — A passage is added to `.claude/prompts/coder.md` and to
      `.claude/prompts/reviewer.md`. A spawned session cannot edit those files
      (`docs/agent-workflow-design.md`, "A spawned session cannot edit
      `.claude/prompts/`"), so the coder delivers this as the diff under
      `### Proposed prompt edit` in its PR body, as `coder.md` describes. The
      runner applies it, and ticks this AC. The passage says, in its own words:
      - the session ends as soon as it stops calling tools, and any command
        still running in the background is stopped then, with no
        notification ever arriving;
      - so never end a turn to wait for a command;
      - a command may run in the foreground for up to 10 minutes;
      - a command started in the background is waited for by checking its
        output file with `node -e` waits that each return within 10 minutes,
        until it has finished;
      - a command that times out has been stopped, and is narrowed or split
        rather than started again unchanged.
- [ ] **AC-4** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-107 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`, which the OQ-106 spike recommended.
  The owner decided on 2026-10-01 to keep background commands available, so
  that no story needs special handling once the loop runs unattended.
- Resuming a session that ended with uncommitted work. That is OQ-108.
- `DEFAULT_STALL_MS`, `--output-format` and streaming output. Those are
  OQ-76's.
- Raising `BASH_MAX_TIMEOUT_MS` above `600000`.

## Constraints

*(none)*

## Context

- `docs/agent-workflow-design.md`, "A long shell command in a headless
  session" (OQ-106): T1 and T7 show a command past 120 s moved to the
  background and killed when the session ends. T2 shows
  `BASH_DEFAULT_TIMEOUT_MS=600000` letting a 150-second command finish in
  the foreground. T6 shows `600000` capping even an explicit larger `timeout`.
  The Recommendation's item 6 gives the values this story pins.
- `scripts/dispatch/invocation.mjs`, `buildInvocation`: the coder's `env` is
  `coderEnv(baseEnv, emptyGhConfigDir)`, and the reviewer's is
  `{ ...(baseEnv ?? {}) }`.
- OQ-76's AC-5 planned these pins at `120000` and `600000`. It is edited in the
  pull request that adds this story, so it keeps only the `DEFAULT_STALL_MS`
  derivation, from the maximum this story pins.
- `coder.md`, "Proposed prompt edit", and `findPromptChange` in
  `scripts/dispatch/coder.mjs`: how a prompt edit is relayed.

## Open questions

*(none)*
