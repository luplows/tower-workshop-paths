---
id: OQ-76
title: Stream a session's output so the stall check can see it working
tier: normal
kind: workflow
depends_on: [OQ-65]
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need a spawned session to produce output while it works,
so that the stall check in `spawn.mjs` can tell a session that has hung from
one that is busy, rather than only from one that has run past the timeout.

## Acceptance criteria

- [ ] **AC-1** — `buildInvocation` in `scripts/dispatch/invocation.mjs` passes
      `--output-format stream-json` for both roles, in place of
      `--output-format json`, together with any flag the installed CLI
      requires for `stream-json` in print mode. A test asserts the argument
      list. The PR body states how that requirement was established, by
      running the CLI and not from memory. The invocation sketch in
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
- [ ] **AC-4** — At least one fixture is a stream recorded from a real
      session, not written by hand. The PR says which session it came from.
      The existing `json`-envelope fixtures are kept or converted, and no
      existing classification test is deleted to make room.
- [ ] **AC-5** — The longest single Bash tool call a session can make, during
      which it emits no event, is pinned by the invocation rather than
      inherited: `buildInvocation` sets `BASH_MAX_TIMEOUT_MS` to 10 minutes
      (`600000`) in the environment of both roles, overriding whatever the
      dispatcher's environment holds, and a test asserts it for each role.
      `DEFAULT_STALL_MS` in `scripts/dispatch/spawn.mjs` is lowered to 12
      minutes, defined from that pinned value plus a margin rather than as a
      separate literal, so the two cannot drift apart. `DEFAULT_TIMEOUT_MS` is
      unchanged.
- [ ] **AC-6** — `spawnSession`'s return value keeps its shape. `output` is
      still the result object, not the stream, so OQ-69 and OQ-70 callers are
      unaffected. A test asserts this through the stand-in, which gains a
      mode that emits a short event stream ending in a `result` event.

## Out of scope

- `--include-partial-messages` and anything else that streams at token level.
  Per-message events are enough to show liveness.
- Logging, displaying or storing the event stream beyond what classification
  needs.
- Changing the timeout, or how `spawn.mjs` kills a session. That is OQ-65.
- Interpreting a reviewer's verdict. As in OQ-75, the result is returned
  unaltered.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not invoke `claude`. The recorded fixture is captured once,
  by hand, and committed.

## Context

Raised by #131's review (OQ-65, round 1, observation 1). `--output-format
json` writes nothing until the session ends. So the stall check in
`spawn.mjs`, which fires after `DEFAULT_STALL_MS` without output, cannot see a
healthy session working. Its interval was set to 20 minutes, above the
slowest measured spawn, and so it only ever fires in the window before the
30-minute timeout. The coder that built OQ-65 stated this reading in its PR
body. The reviewer and the runner agreed the fix belonged to the invocation
and the classifier rather than to OQ-65.

- `claude --help` (CLI as installed on 2026-09-24) lists `stream-json` as
  "realtime streaming" and says `--include-partial-messages` only works with
  it. It does not say whether print mode needs `--verbose` alongside
  `stream-json`. That is believed but not verified, which is why AC-1 asks for
  it to be established by running the CLI.
- The 10-minute bound in AC-5 is the Bash tool's default maximum per-call
  timeout. A session running one long command emits no event until the
  command returns, so a stall interval below that would kill a working
  session.
- **Why AC-5 pins it rather than assuming it.** #132's review found that the
  installed CLI (2.1.281) reads `BASH_MAX_TIMEOUT_MS` and
  `BASH_DEFAULT_TIMEOUT_MS` from its environment. The runner found this by
  searching the binary; `claude --help` does not document either. Both roles
  inherit the dispatcher's environment: the reviewer gets a copy of
  `baseEnv`, and the coder gets `coderEnv`, which strips only credentials. So
  a dispatcher environment that raised the variable would let one long Bash
  call outlast the stall interval, and a working session would be killed.
  Pinning the value in the invocation is what makes the derivation hold.
  `BASH_DEFAULT_TIMEOUT_MS` needs no pin, because a session can already ask
  for any timeout up to the maximum.
- `scripts/dispatch/outcome.mjs`: `parseEnvelope`, and `RAW_RECORD_FIELDS`,
  whose `stdout` field stays a string
- `scripts/dispatch/fixtures/`: the existing envelopes and the stand-in
  session

## Open questions

*(none)*
