# Review Checklist

The criteria a pull request is reviewed against. Written to be enumerated and
auditable rather than a general instruction to "check the code is good" — when
a review misses something, it should be possible to tell whether the rule was
wrong or the reading was. See OQ-42 in `Completed-Questions.md` for why this
exists and how the gating around it is meant to work.

## Reading the PR body

Every PR uses [`.github/pull_request_template.md`](.github/pull_request_template.md),
which starts with a `Unit:` line giving the path of the story the PR implements,
or `none`, and has three required sections: **What changed**, **Verification**,
and **Docs check**.

1. **Check the content of each section, not that the heading exists.** A template
auto-populates, so an unfilled one is structurally identical to a filled one.
These do not satisfy the requirement:

- A section left as its HTML comment placeholder, or emptied to a blank.
- `Verification: N/A`, `tests pass`, `all green`, or any claim without the
  command and its actual result.
- `Docs check: none needed` with no statement of what was considered.

A section that restates the PR title in other words is also unfilled.

## Every PR, including docs-only

1. The work is on a feature branch with a pull request; nothing was pushed
   directly to `main`.
2. All three template sections are present and substantively filled, per above.
3. **Docs check** records a real outcome for `README.md`, `Open-Questions.md`
   and `Project-Outline.md` — what changed, or why nothing needed to.
4. If the PR resolves an entry from `Open-Questions.md`, that entry is moved
   to `Completed-Questions.md` in completion order, with its `**Resolved in:**
   [#N]` link. A PR implementing a story from `stories/` uses item 19 instead
   — the two queues have different completion moves, and a story is not also
   copied into the archive.
5. Any new open question or story uses the next unused OQ number — checked
   against `stories/` (`done/` and `retired/` included), `Open-Questions.md`
   and `Completed-Questions.md`, which share one number space. Numbers are
   never reused or renumbered.
6. Commit granularity: one commit is right for most changes; a PR that both
   regenerates data files and changes logic splits those into separate commits.
7. The diff matches the **What changed** description. No unrelated changes
   riding along.

## PRs that change app code

8. New logic is accompanied by tests — Vitest for unit and component behavior,
   Playwright for real user flows. The buy-order scoring algorithm especially.
9. No test was skipped, disabled, quarantined, weakened, or deleted in order to
   make something pass.
10. If screenshot baselines are added or modified, the change is stated and
    justified in the PR body. Regenerating a baseline is never an acceptable
    silent side-effect of getting CI green — it is the visual form of item 9.
11. No coverage-percentage tooling is added. Its absence is deliberate; see
    `CLAUDE.md`.

## Integrity

These exist because an unsupervised author optimizes for the success criterion,
and the cheapest path to "green" is not always the intended one.

12. The **Verification** section reports real results — actual numbers, taken
    the same way across a before/after comparison — rather than an assertion
    that checks passed.
13. A check that could not be run is stated as such, with the reason, rather
    than quietly omitted from the list.
14. No local workaround is left in the diff. A path, config, or flag patched
    in order to get a check running locally must be reverted before pushing.
15. Scope was not widened beyond the task the PR set out to do.

## Conformance to the story

These apply to a PR implementing a story from `stories/`. A PR that implements
no story — a bootstrap, or a workflow-only change — has no story to conform
to; say which of these you treated as not applicable rather than passing them
silently.

Items 7 and 15 check the PR against *its own account of itself*, and the same
worker wrote both sides. These four check it against **the story**, which is the
standard it was supposed to meet.

16. **Completeness** — every acceptance criterion in the story is delivered.
    Name any that are not. The PR ticks each AC it delivered in the story file
    (`stories/README.md`, "Acceptance criteria and tests"). An AC left unticked
    must be explained in the PR body, and an AC delivered but left unticked is
    a finding here.
17. **Fidelity** — each AC is genuinely satisfied, not merely named in a test.
    A test named `OQ-49/AC-3` that does not exercise AC-3 fails this item. So
    does a ticked AC: a tick is the author's claim, and one that is not
    genuinely delivered fails this item as surely as a misnamed test.
18. **Containment** — nothing in the diff falls under the story's
    **Out of scope**, and nothing implements a decision the story left open.
    CI enforces the `stories/` part of this mechanically
    (`scripts/story-containment.mjs`, OQ-82): the only changes a
    story's own pull request may make under `stories/` are that story's move
    into `stories/done/`, its acceptance-criterion lines ticking, and its
    `blocked:` edit. The reviewer's judgement is still needed for the rest —
    whether the diff outside `stories/` strays into the story's Out of scope,
    or implements a decision it left open.
19. The story file is moved to `stories/done/` in this PR.

## PRs that add or change a story

These apply to a PR that writes or edits files under `stories/` without
implementing one: Session A's work. A story that lands `ready` is work the
dispatch loop will carry out unattended, so it is reviewed as carefully as
code.

20. **Schema** — each added or changed story matches `stories/_TEMPLATE.md`:
    the frontmatter keys, the six sections, and AC ids of the form `AC-N`
    (or `AC-Nx`).
21. **Readiness** — a story whose Open questions section is empty passes the
    readiness test in `stories/README.md`: each AC can be checked by someone
    holding only the story and a diff. An AC that could not fail is a finding.
    A story that is not ready must say so, with its questions under Open
    questions, which keeps it `draft`.
22. **Claims** — every statement the story makes about the repository is true
    at the PR's head: files, functions, line numbers, counts, behaviour, and
    what another story says. Check each one (`CLAUDE.md`, "Claims about this
    repository").
23. **Stable ids** — a story that is already in flight (a `story/OQ-<n>-*`
    branch exists on `origin`; check with `git ls-remote`) does not have its
    AC ids renumbered. A new AC goes in with a letter suffix.
24. **Consistency** — the story does not contradict or duplicate another
    story's ACs. Where it takes over part of another story, that story is
    edited in the same PR, and every reference to the moved part is updated.
25. **Decisions recorded** — a design decision the story makes is written into
    `docs/agent-workflow-design.md` in this PR, marked as that document's
    "Reading this document" note says, and the story has an AC to resolve the
    marker. A decision that exists only in a story is a finding.
