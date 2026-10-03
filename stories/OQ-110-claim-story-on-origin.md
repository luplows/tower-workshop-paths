---
id: OQ-110
title: Claim a story on origin before dispatching it, so a stopped dispatch is never picked again
tier: next
kind: workflow
depends_on: [OQ-109]
model: sonnet
blocked: null
---

## Intent

As the owner, running the loop on more than one machine, I want a story to be
claimed on `origin` before any money is spent on it. Then every machine
skips it from that moment, and a dispatch that stops or dies before its pull
request leaves a branch both machines can see, rather than nothing at all.

## Acceptance criteria

- [ ] **AC-1** — **Claiming.** Straight after creating the story's branch,
      and before the dependency install and the coder session,
      `dispatchCoder` in `scripts/dispatch/coder.mjs`:
      - makes one empty commit on it (`git commit --allow-empty`), the
        **claim commit**, with the message
        `Claim <OQ-n> on <hostname> at <ISO time>`, where the hostname is
        `os.hostname()`;
      - pushes the branch to `origin` with a push that fails when the branch
        already exists there:
        `git push --force-with-lease=refs/heads/<branch>: origin <branch>`,
        whose empty expected value means "must not already exist" (git's
        `git-push` documentation, `--force-with-lease`).

      Tests, against a fixture bare repository, cover a claim that succeeds,
      with the claim commit on `origin` before the install is called, and a
      second claim of the same branch, made from the same `origin/main`,
      which is refused.
- [ ] **AC-2** — **A failed claim spends nothing.** When the claim push
      fails, nothing is installed or spawned, and the local branch and the
      worktree are removed. The dispatch returns `branch-exists` when the
      branch is then on `origin`, and otherwise a new status,
      `claim-failed`, carrying git's error. Tests cover both.
- [ ] **AC-3** — **The claim is not the coder's work.** From the claim on,
      the claim commit, not `origin/main`, is the base the dispatch measures
      "committed beyond" from: `pushBranch`'s `baseSha`, and `cleanUp`'s.
      `cleanUp`'s rule is unchanged: it deletes the local branch only when
      its tip is that base or what `origin` holds. A session that commits
      nothing after the claim ends `nothing-committed`, as today. A test
      covers it.
- [ ] **AC-4** — **A claim outlives a stop.** When a dispatch whose claim
      succeeded ends before a pull request is opened (any status other than
      `opened`), the branch stays on `origin`. `cleanUp` never deletes a remote branch. A test
      covers `nothing-committed` after a successful claim, with the claim
      still on `origin` afterwards.
- [ ] **AC-5** — **The next run skips it.** A story's run that stops before a
      pull request exists still ends the current run, as OQ-86's AC-3 says.
      The next `runLoop` call skips that story through `pickStory`'s
      existing check for a branch on `origin`, and goes on to the next ready
      story. A test, using the real `pickStory` against a fixture
      repository holding a claimed branch on `origin`, covers that skip
      followed by the next story's dispatch.
- [ ] **AC-6** — **The push rule admits exactly two forms.** OQ-84's AC-1
      says the dispatcher's push is never forced, and its test asserts that
      `coder.mjs` contains a single push and never the text
      `force-with-lease`. The claim needs a second push, spelled with
      `--force-with-lease`, although it can only create a branch. That test
      is replaced by one asserting:
      - the finished-branch push is still exactly
        `git push origin <branch>`, and refuses every input the current test
        lists;
      - the claim push is exactly the form in AC-1, built by its own
        function, which refuses the same inputs;
      - `coder.mjs` builds no other push. No `+` refspec, `--force` or `-f`
        can be constructed.

      Any other existing `coder.test.mjs` test may change only where it has
      to allow for the claim. Examples:
      - a hook that rejects every push now also rejects the claim, so it is
        changed to reject only the later push;
      - an assertion that `origin` holds no branch after a stop becomes one
        that `origin` holds only the claim commit (AC-4);
      - an assertion about the branch's base allows for the claim commit
        on top of `origin/main`.

      No assertion is dropped. The PR body lists each changed test and what
      about the claim it allows for.
- [ ] **AC-7** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-110 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Skipping a branch that exists only locally**, and pushing it. That is
  OQ-111.
- **Raising a stuck story as a GitHub issue.** That is OQ-112. Until it
  lands, a stop before a pull request is reported only by the loop's own
  result, as today.
- **Letting the loop go on after a stop before a pull request**, within the
  same run. OQ-86's AC-3 still ends the run.
- Retries (`retryStory`): the branch is already on `origin` by then.
- Deleting any branch on `origin`.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not reach GitHub. Git behaviour is tested against fixture
  repositories.

## Context

- Decided by the owner on 2026-10-01, in the dispatcher session. The owner
  runs the loop on two machines, usually not at once. A local branch is
  invisible to the other machine, so the other machine would dispatch the
  story again.
- Split on 2026-10-03 from the first OQ-110, which also covered OQ-111 and
  OQ-112. Its dispatch on 2026-10-02 was stopped by the stall check after 20
  minutes (`DEFAULT_STALL_MS` in `scripts/dispatch/spawn.mjs`; OQ-76). The
  claim and OQ-112's GitHub operations had been written but not committed.
  In that run, adding the claim failed 11 distinct existing
  `coder.test.mjs` tests across its test runs. They included OQ-84/AC-1's
  push-rule test and OQ-70/AC-2's "the branch is made from origin/main as
  it is", and most of the rest were OQ-84/AC-3 and AC-5 stops that assert
  what is on `origin`. Hence AC-6. The run
  left nothing on `origin`, which is the case this story closes.
- `scripts/dispatch/coder.mjs`: `dispatchCoder` checks for the branch locally
  and on `origin`, then runs `git worktree add -b` from `origin/main`, the
  install and the session. `pushArgs` and `pushBranch` push the finished
  branch. `cleanUp` deletes the local branch only "when doing so loses
  nothing".
- `scripts/dispatch/loop.mjs`: `pickStory` skips on `remoteTip`
  (`git ls-remote --heads origin`).
- A plain `git push` cannot serve as the claim. It succeeds as a no-op when
  the branch already exists at the same commit, and fast-forwards a branch
  whose tip is an ancestor of the claim, such as one left at a commit of
  `main`.
- `scripts/dispatch/coder.test.mjs`, "OQ-84/AC-1: the push is exactly
  `git push origin <branch>`, and no forced form can be constructed": the
  test AC-6 replaces.

## Open questions

*(none)*
