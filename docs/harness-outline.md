# Steward: harness outline

**Status:** draft, being refined with the owner from 2026-10-07, in pull request #199.

The harness is named **steward** (decided 2026-10-07 by the owner; R10 in the design document).

This is the harness's product outline: who it is for, what it is for, and what matters most. It is
to the harness what `Project-Outline.md` is to tower-workshop-paths. It lives here until the
workflow moves to a repository of its own (OQ-115), and becomes that repository's outline on the
day of the move. How the harness works, and the decisions about the move, are in
`docs/agent-workflow-design.md`, which moves with it.

Everything below is the owner's, stated on 2026-10-07, unless it says otherwise.

## What it is

- **A harness that takes units of work through a code, review and merge loop.** It picks up work
  marked ready, codes it, reviews it, and merges it into the mainline branch.
- **It surfaces problems**, probably as GitHub issues, as OQ-112 does for a stuck story.
- **It keeps working while other ready work remains**, up to a point where too much has stopped
  without merging. Today two separate limits come closest: two or more open `loop-stuck` issues
  stop the queue (`STUCK_ISSUE_LIMIT`, `scripts/dispatch/loop.mjs`), and five or more open
  `review-blocked` pull requests narrow what the sweep lands (the circuit breaker in
  `.github/workflows/land-approved.yml`). Neither counts a unit stopped for another reason, such as
  red CI at its own bound, which leaves `blocked:` on a draft pull request with no label and no
  issue. Whether "too much stopped" should be one measure is open.

## Who it is for

**The owner, across the owner's own projects.** The repository is public (R8 in the design
document), so some setup help is worth exposing, but other users are not the main concern.

## Why

**To keep the owner on decisions and ideas, not on code and on reviewing individual tests.** Even
a review-and-land pipeline alone, without the coder, would be worth having.

The cost today runs the other way: the owner's time is going into edge cases in setting up the
harness, so the main project is barely moving. That is why the move to a repository of its own is
wanted sooner rather than later.

## Never

Three things the harness must never do. Each says how it is held today; this restates the code for
readability and must not drift from the files named.

1. **Never merge without a verdict.** Only the sweep merges, and it re-checks that `review/agent`
   is `success` on the head itself before merging (`.github/workflows/land-approved.yml`, "Belt
   and braces"), rather than trusting branch protection.
2. **Never push directly to main.** Every push the dispatcher makes is built by `pushArgs` or
   `claimPushArgs` in `scripts/dispatch/coder.mjs`, and both refuse `main`
   (`assertPlainBranch`). A coder session may not run `git push` (its allowlist grants none and
   denies it), but it can still reach the owner's SSH key. OQ-73 is scoped to the GitHub token and names SSH
   keys out of scope, but its chosen mechanism, a container for coder sessions (decided 2026-10-08,
   built after the move), would close this too. This matters more
   on the second project: its account is on GitHub Free, so nothing on GitHub stops a push to
   `main` there (R6 in the design document).
3. **Always bound the sessions it spawns.** Each session has a spend ceiling (`--max-budget-usd`,
   `ROLE_DEFAULTS` in `scripts/dispatch/invocation.mjs`), a timeout and a stall interval
   (`DEFAULT_TIMEOUT_MS` and `DEFAULT_STALL_MS`, `scripts/dispatch/spawn.mjs`). The spend ceiling
   is a Claude Code flag, so any other company's tool must supply its own bound before it runs a
   role (M1 and M3 in the design document).

## The view

**For deciding what is next, and seeing what is in flight.** For now, one project at a time: the
current one. It may become a product of its own one day, but not now.

It meets two of the design's principles: status is derived, not stored, and tier is priority and
nothing else (R7 in the design document). A view that reads derived status and writes only what
the owner decides (readiness, priority) keeps both.

## Not now

- A view across all projects, or the view as a separate product.
- Publishing to npm (R2 in the design document).
- Setup help beyond what the owner needs, though it is welcome.

## What matters most

In order (confirmed 2026-10-08 by the owner):

1. **The review-and-land pipeline**: every change reviewed against what it was for, and landed
   only on a verdict.
2. **Keeping going**: working through ready work unattended, and surfacing problems where the
   owner will see them.
3. **The view** for deciding what is next and seeing what is in flight.

## Defining steward

Started 2026-10-09 by the owner with Session A, after the move was paused to define steward first
(design doc, "Portability", "Decided so far"). The sections above say who steward is for and why;
this one works out what it does, and where it ends and a project begins. It follows "What matters
most", so it starts with review and land. Each statement is the owner's, dated, unless it says
otherwise; what is still open says so.

### Review

- **When a pull request appears, a reviewer is spawned to check that it implements what it is
  supposed to** (owner, 2026-10-09). Left deliberately broad at first, since the specifics bear on
  other decisions.
- **The minimum steward needs from a project is the unit of work a pull request implements**
  (owner, 2026-10-09). Steward is not particular about the unit's form: the reviewer reads it as
  written, and steward does not parse it, lint it, or require acceptance criteria of it.
- **A pull request points at its unit with a link** (owner, 2026-10-09). Steward reads two kinds: a
  file in the repository, from the checkout, and a GitHub issue (owner, 2026-10-09). Other kinds,
  such as a Jira item, are a future improvement. The base install requires the link for code changes
  only, and stops hard when it is missing or cannot be read (owner, 2026-10-09). The stop is a
  section of the example rules file, not a check steward makes before the review: the reviewer
  decides what is a code change, as it decides which sections apply, and a project can change the
  condition (owner, 2026-10-09). The cost is a review session for a pull request without a link. Two
  other ways of finding the unit were considered: the project's settings name one of a few lookups
  steward provides, or the project supplies its own lookup. For reference (Session A, from `main` at
  `b2a02bf`): in tower-workshop-paths the diff is the pointer. `review.mjs`'s `resolveStory` takes
  the unit to be the story file the diff moves into `stories/done/`, refuses a pull request whose
  `story/` branch names a story its diff does not move, and refuses one that moves two.
- **A pull request that implements no unit is still reviewed, against the project's own rules**
  (owner, 2026-10-09, raised for a write-story pull request; tower-workshop-paths could not work
  otherwise). In tower-workshop-paths today such a pull request is reviewed against `REVIEW.md`'s
  general items only, and against items 20 to 25 when it changes `stories/` (`reviewer.md`, "The
  story this PR is meant to implement").
- **One reviewer prompt, steward's; the rules are the project's, in sections that each say when
  they apply; and the reviewer names the sections it applied** (owner, 2026-10-09, asked whether
  instructions should differ for a code change and a docs change). The prompt holds what is the
  same in every project, how to review; a project's rules say what good means there. Steward does
  not sort pull requests into kinds itself: the reviewer decides which sections apply, and naming
  them in its verdict shows when one was skipped.
- **Steward gives an adopting project an example rules file**, with a basic set of sections and
  conditions that the project modifies and adds to (owner, 2026-10-09).
- **The example is a copy: once adopted, the project owns its rules file** (owner, 2026-10-09).
  Steward keeps update notes on what changes in the example between versions. A tool that compares
  a project's rules file with the example in the version it pins is a possibility, not decided
  (owner, 2026-10-09). Considered and not chosen: steward's default sections shipped in the package,
  which a project's file extends or switches off.
- **What the example rules file contains is left for later** (owner, 2026-10-09).

### Land

- **Steward enforces nothing about CI** (owner, 2026-10-09). The lander relies on the project's
  own settings for when a pull request may merge, and nothing in steward uses CI to decide when to
  go on: tower-workshop-paths' `story.mjs` waits for the `ci.yml` run before it reviews
  (`waitForCi`), and that wait goes.
- **A project says in its steward settings which checks must pass before the lander merges**, and
  installing steward writes the default, **every check on the head green** (the owner leans this
  way, 2026-10-09). This was asked for a repository with no branch protection, where GitHub
  enforces nothing and anyone with write access can merge or push to `main` (design doc, R6). For
  reference (Session A, from `main` at `b2a02bf`): the lander merges only when GitHub reports
  `mergeable_state` `clean` (`land.mjs` line 191, `land-approved.yml` line 145), so today a failing
  check that is not required stops it too. Two other ways were considered: merge whenever GitHub
  allows, which on an unprotected repository means on the verdict alone; and keep requiring
  `clean` as steward's own rule.
- **What installing steward sets up** (owner, 2026-10-09, asked what can record and enforce a
  verdict, and what to do if the answer is nothing):
  - It always writes the gate's workflow files (the one that turns the reviewer's verdict into the
    `review/agent` status, and the sweep), the labels the sweep reads, the project's steward
    settings with the default merge rule, and the example rules file.
  - Where GitHub offers branch protection, it offers to set it, and asks first: it changes the
    repository's settings.
  - It offers a watchdog, never forces it, as it offers branch protection: a check that opens an
    issue for any merge to `main` without a passing verdict (design doc, "Watchdog", which
    describes it and is not built).
  - Where GitHub offers no branch protection, as on a private repository on GitHub Free, it says
    plainly that nothing on GitHub enforces the gate. Steward's own sweep still checks the verdict
    on the head before each merge it makes (`land-approved.yml`, "Belt and braces").
  - Open: whether GitHub's rulesets are available where branch protection is not. Only the branch
    protection limit is recorded (design doc, R6).

### Loops

- **A review loop and a coding loop, separately** (the owner's idea, 2026-10-09, not yet
  decided): the coder picks up work, and the reviewer picks up any open pull request. How a coder
  picks up the reviewer's feedback is to be discussed. For reference (Session A, from `main` at
  `b2a02bf`): today one run of `story.mjs` takes a story through coder, CI, review and retry, and
  `writer-prs.mjs` already reviews and lands the open pull requests the loop did not open.
