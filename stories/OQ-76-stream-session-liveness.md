---
id: OQ-76
title: Stream a session's output so the stall check can see it working
tier: fix
kind: workflow
depends_on: [OQ-65, OQ-107]
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need a spawned session to produce output while it works,
so that the stall check in `spawn.mjs` can tell a session that has hung from
one that is busy, rather than only from one that has run past the timeout.

## Acceptance criteria

- [ ] **AC-1** — `buildInvocation` in `scripts/dispatch/invocation.mjs` passes
      `--output-format stream-json --verbose` for both roles, in place of
      `--output-format json`. A test asserts the argument list. The runner
      established that print mode needs `--verbose` by running the CLI
      (Context). The invocation sketch in
      `docs/agent-workflow-design.md`, "Invocation shape", is updated to
      match.
- [ ] **AC-2** — `classifySession` in `scripts/dispatch/outcome.mjs` reads
      stream output: one JSON event per line, where the session's result is
      the last event whose `type` is `"result"`. That event is classified by
      exactly the rules that classify a `json` envelope today, and it is what
      is returned as the envelope and parsed for the coder's PR block. Output
      holding no `result` event is classified by the existing rules for
      absent output. It is never `completed`.
- [ ] **AC-3** — A line that is not valid JSON does not make an otherwise
      complete stream `malformed-output` unless it is the line the result
      would be read from. A test covers a stream with a truncated final line
      and one with a stray non-JSON line before the result.
- [ ] **AC-4** — At least one classification test reads
      `scripts/dispatch/fixtures/oq76-stream-session.jsonl`, a stream
      recorded from a real session (Context), unedited by the PR, and
      asserts it is `completed`, with the result event's `result` text
      returned. The existing `json`-envelope fixtures are kept or converted,
      and no existing classification test is deleted to make room.
- [ ] **AC-5** — `DEFAULT_STALL_MS` in `scripts/dispatch/spawn.mjs` is lowered
      to 12 minutes, defined from the shell-timeout maximum that OQ-107 pins in
      `scripts/dispatch/invocation.mjs` plus a margin, rather than as a
      separate literal, so the two cannot drift apart. A test asserts the
      derivation. `DEFAULT_TIMEOUT_MS` is raised from 30 to 60 minutes, and a
      test asserts it. (Until 2026-10-01 this AC
      also pinned `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS`. OQ-107
      took that over, at `600000` for both, after the OQ-106 spike showed a
      `120000` default loses commands between 2 and 10 minutes long.)
- [ ] **AC-6** — `spawnSession`'s return value keeps its shape. `output` is
      still the result object, not the stream, so OQ-69 and OQ-70 callers are
      unaffected. A test asserts this through the stand-in, which gains a
      mode that emits a short event stream ending in a `result` event.

## Out of scope

- `--include-partial-messages` and anything else that streams at token level.
  Per-message events are enough to show liveness.
- Logging, displaying or storing the event stream beyond what classification
  needs.
- How `spawn.mjs` kills a session (OQ-65).
- Interpreting a reviewer's verdict. As in OQ-75, the result is returned
  unaltered.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not invoke `claude`. A coder session cannot run `claude`
  either, so the recorded fixture was committed with this story (Context).

## Context

Raised by #131's review (OQ-65, round 1, observation 1). `--output-format
json` writes nothing until the session ends. So the stall check in
`spawn.mjs`, which fires after `DEFAULT_STALL_MS` without output, cannot see a
healthy session working. Its interval was set to 20 minutes, above the
slowest measured spawn, and so it only ever fires in the window before the
30-minute timeout. The coder that built OQ-65 stated this reading in its PR
body. The reviewer and the runner agreed the fix belonged to the invocation
and the classifier rather than to OQ-65.

- **Why the `fix` tier** (the owner, 2026-10-03). On 2026-10-02 the stall
  check killed a working coder: the first OQ-110's dispatch. Its transcript
  shows edits and test runs throughout, the last a `coder.test.mjs` run that
  finished at 18:52:23Z, 20 minutes after the session's first event at
  18:32:40Z. The dispatch ended `session-failed`, outcome `stalled`, and
  its uncommitted work was discarded. So the 20-minute interval does not
  only fire near the timeout: it ends any session that runs past 20
  minutes, healthy or not. OQ-110 was then split into OQ-110 to OQ-112.

- **Why the timeout goes to 60 minutes** (the owner, 2026-10-03). With the
  stall check able to see a session working, it catches a hung session at
  12 minutes. A coder's spending is capped by `--max-budget-usd`
  (`ROLE_DEFAULTS` in `scripts/dispatch/invocation.mjs`). The timeout is
  left to stop a session that is busy without finishing, and 30 minutes is
  shorter than a real story needs: the first OQ-110 was about half done at
  20.

- **The recorded fixture and `--verbose`** (the runner, 2026-10-03, CLI
  2.1.281). `claude -p --output-format stream-json` without `--verbose`
  exits 1 with `Error: When using --print, --output-format=stream-json
  requires --verbose`. The fixture
  `scripts/dispatch/fixtures/oq76-stream-session.jsonl` was then recorded
  with `claude -p --output-format stream-json --verbose --model haiku
  --max-budget-usd 0.25 --allowedTools "Bash(echo:*)" --strict-mcp-config`,
  asking it to run `echo fixture-ok` and reply `done`. It holds 10 events:
  `system` `init`, a `rate_limit_event`, two `system` `thinking_tokens`, an
  assistant `thinking` then `tool_use`, the user's `tool_result`, an
  assistant `thinking` then `text`, and `result` `success`. The repository
  is public, so before it was committed the Windows user name in local
  paths was replaced with `user`, and a synced plugin's id with
  `synced-plugin-id`. Nothing else was changed.

- `claude --help` (CLI as installed on 2026-09-24) lists `stream-json` as
  "realtime streaming" and says `--include-partial-messages` only works with
  it. It does not say whether print mode needs `--verbose` alongside
  `stream-json`. The runner established that it does, by running CLI
  2.1.281 (above).
- The 10-minute bound in AC-5 is the Bash tool's default maximum per-call
  timeout. A session running one long command emits no event until the
  command returns, so a stall interval below that would kill a working
  session.
- **Why the bound is pinned rather than assumed.** The pins are OQ-107's now.
  #132's review found that the installed CLI (2.1.281) reads `BASH_MAX_TIMEOUT_MS` and
  `BASH_DEFAULT_TIMEOUT_MS` from its environment. The runner found this by
  searching the binary; `claude --help` does not document either. Both roles
  inherit the dispatcher's environment: the reviewer gets a copy of
  `baseEnv`, and the coder gets `coderEnv`, which strips only credentials. So
  a dispatcher environment that raised either variable would let one long Bash
  call outlast the stall interval, and a working session would be killed.
  Pinning the values in the invocation is what makes the derivation hold.
- **Why both variables, not only the maximum.** In CLI 2.1.281 the per-call
  maximum is `Math.max(BASH_MAX_TIMEOUT_MS ?? 600000,
  BASH_DEFAULT_TIMEOUT_MS ?? 120000)`. That was read from the code in the
  installed binary during #132's second review, and re-derived the same way
  before this line was written. So an inherited `BASH_DEFAULT_TIMEOUT_MS`
  above `600000` raises the maximum even with `BASH_MAX_TIMEOUT_MS` pinned. An
  earlier revision of this story said the default "needs no pin". That was
  reasoned, not checked, and wrong. The code is minified and version-specific,
  which is a further reason to pin both. With both set to `600000` (OQ-107),
  2.1.281's maximum is `600000`, and no inherited value reaches a later
  version whatever rule it uses. Whether a later version's rule still gives
  `600000` is for whoever upgrades the CLI to check.
- `scripts/dispatch/outcome.mjs`: `parseEnvelope`, and `RAW_RECORD_FIELDS`,
  whose `stdout` field stays a string
- `scripts/dispatch/fixtures/`: the existing envelopes and the stand-in
  session

## Open questions

*(none)*
