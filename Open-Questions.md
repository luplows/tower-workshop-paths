# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
**Mostly resolved via OQ-39's Phase 1 migration:** Workshop upgrade costs now come directly from mytower.app (`src/data/workshopLevels.js`) rather than `tower-idle-toolkit` — the source itself changed, not just a cross-check layer bolted on top of it. This fixed a real, confirmed-wrong data point (Wall Health, OQ-38) and closed the old 4-upgrade cost-data gap entirely — every level 0..quantity-1 now has a real cost, nothing left to report as `unknownCost` for missing Workshop data. **Still genuinely open:** "Max level confirmed" — no upgrade's max level has been checked against the real, current-patch game directly. mytower.app's own max level matched this project's existing value for all 48 upgrades (a byte-identical structural snapshot), which is reassuring but not the same as independent in-game confirmation. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — now primarily useful for that remaining max-level task. Re-running `scripts/verify-workshop-costs.mjs` going forward checks for *drift* from mytower.app's own live data (e.g. after a future patch changes a cost before this project re-extracts it), not independent cross-validation — our data comes from the same place it's being checked against now.

**OQ-43. Detect game-patch data drift on a schedule**
As a player, I want the tool's costs to stay correct after the game patches, so that a stale cost table doesn't quietly make every recommendation wrong.
`npm run verify:workshop-costs` already exists as exactly this drift detector — it spot-checks the shipped `src/data/workshopLevels.js` costs against mytower.app's live tables (see OQ-1, and `Completed-Questions.md` OQ-39 for why that is now a drift check rather than independent cross-validation). It only runs when someone remembers to run it. This is the one failure mode the test suite structurally cannot catch: the tests assert the data is internally *consistent*, not that it still matches the game. Proposal: run it on a schedule that stays silent when clean and raises something actionable when costs move. Open questions: what cadence is right, given patches are irregular and the check hits a third-party site; whether to extend the same treatment to Enhancement data, which has no equivalent verify script today (only `extract:enhancement-data`); and whether drift should open an issue, open a PR with regenerated data, or just notify.

### Depends on the above being mature

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. OQ-2, OQ-4, OQ-5, OQ-6, and OQ-7 are all done now, so this is fully unblocked on the buy-order side.

### Anytime — no dependencies

**OQ-9. Verify the UI on a real mobile device**
As a player who checks this tool while actually playing on my phone, I want the phone-mimicking layout to work correctly on a real touch device, so that it's usable in the situation it's designed for.
Only checked in a desktop browser at a fixed width so far.

**OQ-24. Import current levels from the game's `playerInfo.dat` file**
As a player, I want to import my Workshop and Enhancement current levels straight from the game's own save data, so that I don't have to manually type in every level to get started.
The game keeps a `playerInfo.dat` file (not normally player-facing) that should already contain current Workshop and Enhancement levels. Open questions: what format the file is actually in (plain JSON, a custom binary format, encrypted/obfuscated — unknown until inspected) and whether it's even parseable client-side; how the user gets the file into the browser (a file picker is the obvious client-only option, consistent with `Project-Outline.md`'s no-backend scope); and whether an import fully replaces entered levels (interacting with OQ-22's Clear) or merges with them.

**OQ-25. Share entered levels with a friend via a link**
As a player, I want to share my current Workshop/Enhancement levels with a friend (e.g. to compare progress or get buy-order advice), so that I don't have to describe my levels to them by hand.
Client-only, per `Project-Outline.md`'s no-backend scope: likely encode `workshopLevels`/`enhancementLevels` into the URL itself (query string or fragment, probably compressed given ~48 Workshop + 18 Enhancement values) rather than a server-hosted share. Open questions: does opening a shared link overwrite the recipient's own entered levels (interacting with OQ-22's Clear/confirmation pattern) or show a separate read-only view; and how large the resulting link gets and whether that's practical to share (e.g. via text message). Now that the priority-weighted Path (OQ-2) exists, there's more worth sharing than raw levels alone — still worth doing regardless of timing.

### Project health and workflow

Not player-facing features, but they decide how safely and cheaply everything above can be built. OQ-40 is the more urgent of the two: it closes a gap that removing the pre-merge visual-inspection gate deliberately opened.

**OQ-40. Guard the UI's appearance against regressions**
As a player, I want the layout to keep working as features are added, so that a change to one screen doesn't silently break how another one looks.
Removing the pre-merge visual-inspection gate (`Completed-Questions.md`) traded a human spot-check for automated coverage — but the automated side only covers *behavior*. The Playwright suite asserts what the app does; nothing asserts what it looks like. `playwright.config.js` has no screenshot assertions, so a CSS or layout break passes CI silently, and `CLAUDE.md` says as much in its Testing section. Proposal: `toHaveScreenshot()` baselines committed to the repo, covering the Upgrade, Path and Enhance screens plus at least one mobile viewport. Open questions: how many viewports justify their baseline-churn cost; what pixel tolerance avoids false failures from antialiasing differences between a local run and the CI runner; and whether baselines should be generated in CI (one consistent renderer) rather than on whichever machine happened to add the test. Pinning a mobile viewport partly de-risks OQ-9, though it is not a substitute for a real device.

**OQ-42. Add automated, merge-gating review to pull requests**
As someone working on this project, I want every PR to get an adversarial read of its diff before it merges, so that a green CI check isn't the only thing between a change and `main` — and so that an agent handed a task can be confirmed to have followed the whole defined process, every time.
`.github/workflows/` holds only `ci.yml` and `deploy-pages.yml` — there is no review automation. Since the visual-inspection gate was removed, CI is the sole quality signal on every PR, and CI only knows what the tests already assert; it cannot flag a plausible-looking bug that no test covers, nor a skipped step in the project's own workflow.

**Decided:**
- **A GitHub Action, not a pre-push step.** The requirement is that review be unskippable. A pre-push step only runs when someone remembers, and agent sessions only run it if their prompt happens to say so.
- **It gates the merge**, as a required status check.
- **It reviews process compliance, not just code** — the `CLAUDE.md` rules about doc updates, OQ numbering, `Completed-Questions.md` conventions and commit granularity. Process review may be worth more here than bug-hunting: the miss that made #77 necessary was a process miss, not a code one.
- **Docs-only PRs are reviewed too**, but through one path-filtered workflow rather than a second mechanism: code *and* process criteria when the diff touches app code, process criteria alone when it doesn't.
- **Actions minutes are not a constraint** — this is a public repo, so standard runners are free and unlimited. The budget worth watching is Claude usage per review, given the high volume of small PRs here.
- **Independence comes from context isolation, not model diversity.** A reviewer that shares the author's *context* knows what the change intended and so can't see that the diff doesn't do it; a reviewer that merely shares the author's model can still re-derive from the artifact. An Action supplies that isolation structurally — fresh runner, no authoring session, just the diff and the repo. The real decorrelating mitigation for shared priors is giving the reviewer explicit written criteria, which is what the process checklist above is. Running review on a different model from the usual author is a cheap optional hedge, not a substitute.

**Still open — what clears a finding.** A merge-gating review risks re-creating the bottleneck that retiring the visual-inspection gate deliberately removed: if a worker opens a PR at 3am, a finding is raised, and only a human can dismiss it, the human gate is back — now on *every* PR rather than only UI ones, which is strictly worse than before. The design property to preserve is that **the loop stays closeable by the agent that opened the PR**. Candidate shapes: severity tiers, where only blocking-severity findings fail the check and nits comment without failing; self-clearing on re-push once no unaddressed blocking finding remains; human override reserved for genuine disputes. The opposite failure needs guarding too — a gating check authored by the same system that wrote the code can quietly rubber-stamp, so it is worth auditing after some weeks whether the check has ever actually blocked anything. A check that never fails is theater.
