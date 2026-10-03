---
id: OQ-112
title: Open a GitHub issue for a story the loop cannot progress
tier: next
kind: workflow
depends_on: [OQ-110, OQ-111]
model: sonnet
blocked: null
---

## Intent

As the owner, running the loop on more than one machine, I want a story the
loop cannot progress to be raised with me as a GitHub issue, one per story,
so I hear about it from any machine rather than finding it in one machine's
run output when I happen to look.

## Acceptance criteria

- [ ] **AC-1** — **`github.mjs` admits only what this needs.** Its allowlist
      gains:
      - listing open pull requests for one head branch;
      - listing open issues with the `loop-stuck` label;
      - creating an issue with a title, a body and labels.

      Each has a `build*` function and an allowlist entry, with tests in
      `github.test.mjs`, in the same form as the existing ones. Nothing else
      is added. The PR body states, from running against GitHub or from its
      documentation with a link, whether creating an issue with a label that
      does not yet exist creates the label.
- [ ] **AC-2** — **A claim's age.** A branch's claim commit is the commit
      OQ-110's AC-1 makes: on the branch, not on `origin/main`, with a
      subject beginning `Claim <OQ-n> on `. Its age is measured from its
      committer date. A branch with no claim commit has no age. A new
      exported constant, `STUCK_AFTER_MS`, is 2 hours. Tests, against
      fixture repositories, cover a claimed branch, an unclaimed one, and a
      claim older and younger than `STUCK_AFTER_MS`.
- [ ] **AC-3** — **When a story is stuck.** The loop makes sure there is one
      open issue for a story in exactly these cases:
      - `pickStory` skips a story whose branch is on `origin` and has no
        open pull request, unless its claim is younger than
        `STUCK_AFTER_MS`. A younger claim is most likely a dispatch still
        running, on this machine or another, so it is skipped without an
        issue. A branch with no claim counts as stuck;
      - `pickStory` pushes a local-only branch (OQ-111), whatever its age;
      - a story's run stops before a pull request exists: `story.mjs`'s
        result is a dispatch that returned anything but `opened`,
        `branch-exists` or `not-ready`. `branch-exists` means another run
        holds the claim, and `not-ready` that the story is no longer ready on
        `origin/main`. Neither is stuck.

      A skipped story with an open pull request gets no issue, draft or
      not: the pull request already shows it (OQ-48's AC-8).
- [ ] **AC-4** — **The issue.** Its title is exactly `Loop: <OQ-n> is stuck`,
      and it has the label `loop-stuck`. Its body names the story, the
      branch, the machine (`os.hostname()`), the time, and the reason: no
      pull request, local-only, or the stop's status and reason. If an open
      issue with that exact title already exists, the loop creates no
      second one, and does not comment on it.
- [ ] **AC-5** — **An issue never changes what the loop does.** A story
      skipped under AC-3 is still skipped, and the loop goes on to the next
      ready story. A stop still ends the run, as OQ-86's AC-3 says. If
      listing or creating fails, the error is part of that story's report
      entry, and the loop does exactly what it would have done otherwise.

      Tests, with an injected `fetch` as `github.test.mjs`'s `fakeFetch`
      does, cover:
      - a new issue, for each case in AC-3;
      - an existing open issue, left alone;
      - a skipped story with an open pull request, which gets no issue;
      - a claim younger than `STUCK_AFTER_MS`, which gets no issue;
      - a stop with `branch-exists`, which gets no issue;
      - a failed issue creation, after which the loop goes on to the next
        story.
- [ ] **AC-6** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-112 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Closing issues.** Resolving a stuck story is the owner's: delete the
  branch, open a pull request from it and resume it (`story.mjs OQ-n --pr`),
  or set `blocked:`. Closing the issue is part of that.
- **Hand-runs.** `story.mjs` run by hand opens no issue. Only the loop does.
- **Stops recorded on a pull request** (OQ-48's AC-8): the draft pull
  request is already visible on GitHub.
- **Leftover `tw-coder-*` worktrees.** OQ-101's AC-3 reports them, with the
  same title form and no-duplicate rule as AC-4.
- Deleting any branch, local or remote.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not reach GitHub. Git behaviour is tested against fixture
  repositories.

## Context

- Decided by the owner on 2026-10-01, in the dispatcher session, as part of
  the first OQ-110, and split out of it on 2026-10-03. The owner wants a
  stuck story skipped rather than blocking the queue, and raised as a GitHub
  issue rather than only in a local run log.
- The first OQ-110's dispatch on 2026-10-02 had written AC-1's three
  operations, with `github.test.mjs` green, before the stall check stopped
  it. Nothing was committed.
- `scripts/dispatch/github.mjs`: `ALLOWED` and `assertAllowedRequest`.
- `scripts/dispatch/loop.mjs`: `pickStory`, and `runLoop`, which stops on
  any story result other than `merged` or a fully recorded stop.
- With OQ-110 built, a story whose dispatch stops before its pull request
  gets an issue from that stop (AC-3's third case). Later runs skip it
  through its claim, and AC-3's first case finds the same issue already
  open once the claim is older than `STUCK_AFTER_MS`.
- The repository is public, so an issue's body, like a claim commit's
  message (OQ-110), shows the machine's hostname.

## Open questions

- **A breaker for repeated stops.** Once OQ-110 is built and OQ-101 runs
  the loop every 15 minutes, a fault that stops every dispatch before its
  pull request lets each run claim and stop one more story. Examples are a
  failing install, or the stall check killing working sessions, as on
  2026-10-02. Each story gets an issue, but the queue is used up one story
  per run. Should the loop start no coder session while any `loop-stuck`
  issue for a stop (AC-3's third case) is open, while reviews and landing
  go on, as OQ-102 plans for its usage threshold? Or is an issue per story enough?
