# Development: from the kickoff to the merge

The `builder` does the code; you brief it and check its evidence (`references/delegation.md`).

**One branch per story:** `feature/<id>-<slug>` (`references/git.md`).

**When `git.mode` is `manual`,** your human makes every commit, push and pull request; you only read git, and give them each command or text instead (`references/git.md`, "Manual mode"). Below, "create the branch", "commit", "push", "open the pull request" and "merge" mean: give your human the command or the text, wait until they say it is done, and check it with `git log` or `git status`. The review is of the commits they made: its `Commit:` is `git rev-parse HEAD` once the story's last commit is in, and its pack `stories.mjs --review <ID> <that commit> --base <the commit HEAD was at the kickoff>`, so write that commit in your ledger at the kickoff.

## Kickoff

1. **Read the story with your human first.** When a criterion is ambiguous, contradicts another, lacks a state or an error, or cannot be built with what exists, write it under **Open questions**, one line per criterion ID, and take it to your human before anything is built.
2. **Check it against what binds.** Read the parts of the project's norms (`.orchestrator.json` → `norms`) that cover what the story touches, and the accepted ADRs it names; when a norm says which document to read for which kind of task, follow it rather than reading everything.
   - **Stop and propose a decision before anything is built** when the story falls in what the norms say needs an ADR, or contradicts what binds. When the norms say nothing, stop at least for a new external service or provider, a change to how people sign in or what they may do, payments, new personal data or data sent to a third party, an incompatible change to stored data or to an API others use, and the infrastructure. Tell your human which one and why, and offer to draft the decision in the project's format (`adrDir`, default `docs/adr/NNNN-title.md`, status `proposed`) in its own pull request. Whoever the norms name accepts it, or your human; you never settle it. The story gets `blocked_by: [ADR-NNNN]` and waits.
3. **What it depends on.** List what the story needs that does not exist yet and it does not build itself: an API operation, a service, a design, data. Each one goes to your human: who provides it, and how the story is tested until then. Do not let the builder invent it.
4. **The plan, when the story is large.** When it touches several modules or apps, explain the plan to your human in a few lines and wait for their ok.
5. **Kickoff.** Create `feature/<id>-<slug>` from the integration branch on the remote. If the story touches a risk area its `tags` do not name (`riskTags` in `.orchestrator.json`), add that tag to the story. That is the only frontmatter edit at the kickoff, with one exception: a tag the machine asks for later. `stories.mjs --check` and `--pr` fail when the story's branch changes a path that `.orchestrator.json` → `riskPaths` gives a tag the story lacks, and a builder's `Risk:` line can name one; add it then. A tag is never removed to make the check pass. A story that creates a module in a risk area also adds its `riskPaths` entry (`references/risk-map.md`). The story file is yours, on this machine: nothing is committed at the kickoff. Write the kickoff in the ledger.

## Build: one criterion at a time

Your human gives the ok on the first criterion, where the pattern shows, and on the finished build. Between the two you carry on alone. For each criterion, in the story's order:

1. **Brief** the builder for that one criterion. Launch it for the first; resume it for the next ones.
2. **Check the evidence yourself:** the test's name starts with the criterion ID; RED failed on an assertion about the criterion, not on a compile error; GREEN and the fast checks pass, and no test of the criterion was skipped (a test that skips because a database or a service is missing is not green); every changed file belongs to this criterion, and is inside the builder's paths when its role has them (`roles.<role>.paths`); the `GRAPH:` line names the callers the code graph returned for each function the change touches, or why the graph could not answer (a report with neither goes back); each pin passed before the change and passes after, and when the change touches shared code (a handler, a validation, a query, a shared component or hook) and the report names no pin, its reason holds; the `Risk:` line names no risk tag the story lacks, or you add it; when it names code no `riskPaths` entry covers, offer your human to add it (`references/risk-map.md`); what the criterion regenerates (an API client, generated queries, translations) was regenerated with the project's commands, never edited by hand. A criterion reported as already met has no RED: check that its assertion observes the criterion, and commit the test alone. A failed check goes back to the same builder. After three builder runs without a commit (`verify.maxBuilderRuns` in `.orchestrator.json`), the guard asks your human before each further run. Give them one line per run, what it was for and what it returned, and leave the answer to them: never advise it.
3. **First criterion: your human's ok.** In at most 8 lines: the criterion, the test's name, what its assertion checks, the RED and GREEN lines, the files changed. No code. Ask: "Does this assertion check what the criterion says?" A refactor or a change goes back to the same builder (`Change: refactor <criterion ID>`), with what your human said, word for word, under `Request:`.
4. **Commit:** the files from the report by name, in the project's commit format with the criterion ID first in the description (`references/git.md`). When the project asks your human to confirm each commit, do not ask them in the conversation as well after the first.
5. **Stop and go to your human** at a BLOCKED or a concern, a further run the guard asks about, or an irreversible step (a migration on a shared database, deleting data, a live external service). They may also ask for the ok on every criterion.

## Close the build

When every criterion is green:

1. **Verify everything once.** Run `verify.all` yourself: the project's full checks that the story affects. The builders ran only the fast checks. A failure goes back to the builder.
2. **The README.** When the project keeps a README per module or app, or its norms ask for one, bring it up to date in this branch so it tells how it works after the change, in a commit of its own (`docs(<scope>): <ID> …`).
3. **Show the result:** one line per criterion (its test and what it checks), the files changed. Your human's ok closes the build; a change reopens the criteria it names.
4. **Lock.** List the story's acceptance-test files, with the helpers they import and the runners' config, in `.orchestrator/locked/<ID>.txt`, under a first line `# commit <the full sha of HEAD>`. From here no builder can change those tests. The list is yours, on this machine: nothing is committed.

**Locks never expire.** When other work must change a locked file (another story, a runner upgrade, a hotfix), remove it from its list with your human's ok, and lock it again when the change is done, with the new `# commit`.

**Reopen the build** when a change comes back to it: a review finding, or a criterion that changed. Remove from the lock list the tests of the criteria that change before you brief the builder: the guard reads the locks from the list. Then build those criteria again, verify, and lock again with the new `# commit`.

## Markers

When the build is closed:

1. Run `node <scripts>/stories.mjs --tests`. A criterion whose tests all pass becomes `[test]`. Anything only a person can check (an email that arrives, a live service, how a screen looks) is checked now by your human and becomes `[manual YYYY-MM-DD, <name>]`. No criterion stays `[unbuilt]`. Builders never edit stories.
2. Push, on your human's ok, and go on to the review.

## Review

Every pull request gets a review before it opens, by two fresh `reviewer`s at the same time, one per lens: `tests` (whether the tests observe each criterion and pin what must not change, and whether the change does what the story says and nothing more) and `code` (what the change reaches outside its diff, correctness and security, the norms and the project's checklist). Each judges half of the review and reads less, and they run together.

1. **One commit.** Push, then take `git rev-parse origin/<the story's branch>`: the reviewers judge that commit, never the branch. A review of a moving branch can approve code that is not what merges. Your checkout stays at that commit until both reviewers return (`git rev-parse HEAD` must print it): the code graph indexes the working tree.
2. **The graph,** when the project has one: bring it up to date at that commit yourself (`build_or_update_graph_tool`), so no reviewer has to before it starts.
3. **The pack.** Run `node <scripts>/stories.mjs --review <ID> <commit>`. It writes `.orchestrator/work/<ID>/review-<commit>/pack.md` with what git says about the commit: the diff, the commits and the criteria they name, the files and their risk tags, the locked tests, what the diff switches off, and the norms as the integration branch has them. It prints the pack's path. When it exits with 1, settle what it says before anyone reviews: HEAD at another commit is checked out again; a locked test that changed after its lock reopens the build, since no review can approve it.
4. **Two briefs, one message.** Write one brief per lens (`references/delegation.md`), with the same `Commit:` and `Pack:`, its `Lens:`, the story's risk tags (each reviewer judges the code under them first) and its report path (`review-tests.md`, `review-code.md`). Launch `reviewer-<ID>-tests` and `reviewer-<ID>-code` in the same message: two Agent calls in one turn run at the same time, and both only read.
5. **The verdict.** The review approves when both lenses approve. Write the reviewed commit and both verdicts in your ledger. When the project's norms ask for a review of their own as well (a skill, a command), run it too.

Critical and Important findings, from either lens, reopen the build to fix them once. The re-review checks only that fix, the same way: push, bring the graph to the new commit, run `stories.mjs --review <ID> <new commit> --since <reviewed commit>`, and launch both lenses again in one message, each brief naming its lens's earlier report. Its commit becomes the reviewed one. There is no second round: whatever is still open after it, your human decides. Minor findings go to the ledger, never to a round. A security finding is told to your human in the session and never written into the pull request until it is fixed.

## Merge

Run `node <scripts>/stories.mjs --check` and open the pull request only when `node <scripts>/stories.mjs --pr <ID>` shows every criterion as a passing `[test]` or a `[manual]`. Branch → integration branch; title, body and reviewers as `references/git.md` says. When it is ready to merge, and before you merge, run `git diff --name-only <reviewed commit> origin/<the story's branch>`: it must list nothing. Any file is code nobody reviewed: re-review it first, as "Review" says, with `--since <reviewed commit>` and your checkout pulled to `origin/<the story's branch>`. Then merge it on your human's ok, with the strategy, the message and the branch deletion of `references/git.md`, "Merge".

After the merge, `git fetch`, and find the commit the story landed as (with squash, `git log -1 --format=%H origin/<integration branch>`, checking its title): write it in your ledger, and as the `# commit` line of `.orchestrator/locked/<ID>.txt`, since a squash leaves the branch's commits off the remote. Then go back to the integration branch and delete the local branch.

## Reopen a done story

When the behaviour of a done story must change, or a bug breaks one of its criteria, reopen the same story; never write a new one on top. An urgent bug in production is a hotfix first (`references/outside-stories.md`).

1. Create `feature/<id>-<slug>` (a change) or `fix/<id>-<slug>` (a bug) from the integration branch on the remote. A change sets each changed criterion back to `[unbuilt]`; a bug marks the criterion it breaks `[failing: <what fails>]`, or adds a criterion when none covers it.
2. Reopen the build. For a bug, find the root cause first; the builder writes a test under the criterion's ID that reproduces the bug and fails (`stories` skill, "Fixing a bug").
3. Then markers, review and merge, as always.
