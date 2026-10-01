---
id: OQ-110
title: Claim a story on origin before dispatching it, skip leftover branches, and open an issue for a stuck story
tier: next
kind: workflow
depends_on: [OQ-109]
model: sonnet
blocked: null
---

## Intent

As the owner, running the loop on more than one machine, I want a story to be
claimed on `origin` before any money is spent on it. Then every machine
skips it from that moment, and a run that dies leaves a trace both machines
can see. I also want a story the loop cannot progress to be skipped rather
than block the queue, and to be raised with me as a GitHub issue rather than
fail quietly on one machine until I notice.

## Acceptance criteria

- [ ] **AC-1** — **Claiming.** Straight after creating the story's branch,
      and before the dependency install and the coder session,
      `dispatchCoder` in `scripts/dispatch/coder.mjs`:
      - makes one empty commit on it (`git commit --allow-empty`), the
        **claim commit**, with the message
        `Claim <OQ-n> on <hostname> at <ISO time>`;
      - pushes the branch to `origin` with a push that fails when the branch
        already exists there, for example
        `git push --force-with-lease=refs/heads/<branch>:` with an empty
        expected value.

      A refused claim returns `branch-exists`, with nothing installed or
      spawned. From then on the claim commit, not `origin/main`, is the base
      the dispatch measures "committed beyond" from (`pushBranch`'s
      `baseSha`), so the claim commit alone never counts as the coder's
      work. Tests, against a fixture bare repository, cover:
      - a claim that succeeds, with the claim commit on `origin` before the
        install is called;
      - a second claim of the same branch, refused even when both claims
        were made from the same `origin/main`;
      - a session that commits nothing after the claim, which still ends
        `nothing-committed`.
- [ ] **AC-2** — **A claim outlives a stop.** When a dispatch ends before a
      pull request is opened (any status other than `opened`), the branch
      stays on `origin`. `cleanUp` never deletes a remote branch. Its rule
      for the local branch is unchanged. A test covers `nothing-committed`
      after a successful claim.
- [ ] **AC-3** — **Skipping a local-only branch.** `pickStory` in
      `scripts/dispatch/loop.mjs` also skips a ready story whose
      `story/OQ-<n>-*` branch exists only locally. Before skipping, it pushes
      that branch to `origin` as it is, with the same must-not-exist push as
      AC-1, so that every machine sees the story as taken. If that push
      fails, the story is still skipped, and the failure is part of the
      report. The report entry says whether the branch was found on `origin`
      or only locally. Tests use the real `pickStory` against fixture
      repositories, and cover a local-only branch, which is pushed and
      skipped, and a branch on `origin`, which is skipped as today.
- [ ] **AC-4** — **A stuck story becomes an issue.** The loop makes sure
      there is one open GitHub issue titled exactly
      `Loop: <OQ-n> is stuck`, with the label `loop-stuck`, in these cases:
      - `pickStory` skips a story whose branch is on `origin` and has no
        open pull request, unless the branch holds a claim commit (AC-1)
        younger than `STUCK_AFTER_MS`, a new exported constant of 2 hours. A
        younger claim is most likely a dispatch still running, on this
        machine or another, so it is skipped without an issue. A branch with
        no claim commit has no age, and counts as stuck;
      - `pickStory` pushes a local-only branch (AC-3), whatever its age;
      - a story's run stops before a pull request exists, the stops OQ-86's
        AC-3 lists.

      The body names the story, the branch, the machine (`os.hostname()`),
      the time, and the reason: no pull request, local-only, or the stop's
      status and reason. If an open issue with that exact title already
      exists, the loop creates no second one, and does not comment on it.
      Tests, with an injected `fetch` as `github.test.mjs`'s `fakeFetch`
      does, cover:
      - a new issue;
      - an existing one, left alone;
      - a skipped story with an open pull request, which gets no issue;
      - a claim younger than `STUCK_AFTER_MS`, which gets no issue.
- [ ] **AC-5** — **The queue keeps moving.** A story skipped under AC-3 or
      AC-4 does not stop the loop: it goes on to the next ready story. A
      story's run that stops before a pull request exists still ends the
      current run, as OQ-86's AC-3 says. Its claim then makes the next run
      skip it, so the run after that goes on to the next ready story. Tests
      cover a local-only branch followed by a story that is dispatched, and a
      pre-PR stop whose story the next `runLoop` call skips.
- [ ] **AC-6** — **`github.mjs` admits only what this needs.** Its allowlist
      gains:
      - listing open pull requests for one head branch;
      - listing open issues with the `loop-stuck` label;
      - creating an issue with a title, a body and labels.

      Each has a `build*` function and an allowlist entry, with tests in
      `github.test.mjs`, in the same form as the existing ones. Nothing else
      is added. The PR body states, from running against GitHub or from its
      documentation with a link, whether creating an issue with a label that
      does not yet exist creates the label.
- [ ] **AC-7** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-110 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Closing issues.** Resolving a stuck story is the owner's: delete the
  branch, open a pull request from it and resume it (`story.mjs OQ-n --pr`),
  or set `blocked:`. Closing the issue is part of that.
- **Stops recorded on a pull request** (OQ-48's AC-8): the draft pull
  request is already visible on GitHub.
- **Leftover `tw-coder-*` worktrees.** OQ-101's AC-3 reports them.
- Deleting any branch, local or remote.
- Retries (`retryStory`): the branch is already on `origin` by then.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not reach GitHub. Git behaviour is tested against fixture
  repositories.

## Context

- Decided by the owner on 2026-10-01, in the dispatcher session. The owner
  runs the loop on two machines, usually not at once. A local branch is
  invisible to the other machine, so the other machine would dispatch the
  story again, and the leftover branch would never be looked at. The owner
  wants a stuck story skipped rather than blocking the queue, and raised as a
  GitHub issue rather than only in a local run log.
- `scripts/dispatch/coder.mjs`: `dispatchCoder` checks for the branch locally
  and on `origin`, then runs `git worktree add -b` from `origin/main`, the
  install and the session. `pushArgs` and `pushBranch` push the finished
  branch. `cleanUp` deletes the local branch only "when doing so loses
  nothing".
- `scripts/dispatch/loop.mjs`: `pickStory` skips on `remoteTip`
  (`git ls-remote --heads origin`) only. `runLoop` stops on any story result
  other than `merged` or a fully recorded stop.
- `scripts/dispatch/github.mjs`: `ALLOWED` and `assertAllowedRequest`.
- A plain `git push` of a branch that already exists on `origin` at the same
  commit succeeds as a no-op, so it cannot serve as a claim. Hence AC-1's
  must-not-exist push.
- PR #185's review noted that AC-4's local-branch test in `loop.test.mjs`
  stubs `pickStory`. AC-3's tests use the real one.

## Open questions

*(none)*
