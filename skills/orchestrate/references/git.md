# Git, GitHub and Bitbucket

The project's norms (`.orchestrator.json` → `norms`: its `CONTRIBUTING.md`, `CLAUDE.md` and the like) are the rule for branches, commits, pull requests and merges. This file says how the session works when they say nothing, and how it applies them when they do; where the two disagree, the project's norms win, and you tell your human so the plugin gets fixed.

`.orchestrator.json` → `git` holds what the session needs to know:

| Key | What it says | Default |
|---|---|---|
| `mode` | `pr`: you branch, commit, push, open and merge the pull requests on your human's ok; `manual`: your human makes every commit and handles the remote, and you only read git (below, "Manual mode") | `pr` |
| `host` | where the pull requests live: `github` or `bitbucket` | read from `git remote get-url origin` |
| `integrationBranch` | where the stories merge | the remote's default branch, else `main` |
| `productionBranch` | what is in production, when it is not the integration branch | none: the integration branch is production |
| `protectedBranches` | where nobody commits | `main`, `master` and the integration branch |
| `mergeStrategy` | how a story's pull request merges: `squash`, `merge` or `rebase` | `squash` |
| `releaseStrategy` | how the integration branch merges into the production branch | ask your human the first time |
| `requiredApprovals` | how many people other than your human must approve a pull request | `0` |
| `allowPush` | `false`: Claude Code asks your human to confirm each push and each merge | `true` |
| `blockBroadAdd` | `false` lets `git add .`, `-A` and `--all` through | `true` |

## Manual mode

With `git.mode: "manual"` your human makes the commits, and pushes and opens pull requests when and how they want. You only read git (`status`, `diff`, `log`, `show`, `fetch`); the guard blocks your `commit`, `push`, `merge`, `rebase`, `cherry-pick`, `pull`, `am` and `revert`, and opening, merging or closing a pull request. The rest of this file applies to what you give them instead:

- **The branch:** at the kickoff, say which branch the story would take (`feature/<id>-<slug>`) and ask whether they create it; work on the branch they are on.
- **Each commit:** when a criterion is accepted, give them the command, ready to paste, with the files of the builder's report by name and the message in the project's format: `git add <file> <file> && git commit -m "feat(notes): ALT-001.1 …"`. Wait until they say it is done, and check it with `git log -1 --stat` (the files and the message) before you brief the next criterion: the next builder's diff must start from a clean tree, and the builder runs count from the last commit. If they would rather commit later, tell them once that the next criterion's evidence will mix with this one's, and go on only on their yes.
- **Push and pull request:** at the close, when they use pull requests, give them the title, the body (`stories.mjs --pr <ID>`) and the strategy of the "Merge" table, as text they paste. Never ask for their credentials: you need none.
- **What reads the remote** (the pull request's approvals and checks) is skipped unless they ask you to look.

## Branches

| Branch | From → into | What it carries |
|---|---|---|
| `feature/<id>-<slug>` | integration → integration | a story: its code and tests, one commit per criterion. Also a done story reopened because its behaviour changes |
| `fix/<id>-<slug>` | integration → integration | a done story reopened because a bug breaks one of its criteria |
| `feature/<slug>` | integration → integration | work outside the stories: tooling, a machine check (`feature/check-<slug>`), documentation |
| `fix/<slug>` | integration → integration | a non-urgent fix of something that is not a story's behaviour: the build, the configuration, a script |
| `hotfix/<slug>` | production → production, then into integration | an urgent fix in production (`references/outside-stories.md`), when the project has a production branch |

Names are in English and kebab-case unless the project's norms say otherwise. A story's branch starts with its ID in lowercase, then a short slug of what it does: `feature/alt-001-email-signup`. `stories.mjs` and the guard read the story from that ID, so a story's branch always has the `feature/`, `fix/` or `hotfix/` prefix, even when the project names its other branches differently. Branches of bots and experiments (`deps/…`, `renovate/…`, `dependabot/…`, `spike/…`) are not yours: leave them alone.

Create every branch from the remote, so it starts from what is really there: `git fetch`, then `git switch -c <branch> origin/<integration branch>` (`origin/<production branch>` for a hotfix). Your local protected branches only move forward to their remote, with `git pull --ff-only` (or `git merge --ff-only origin/<branch>`); the guard blocks any other merge, pull or rebase on them. When the integration branch moves while a story is open, bring it into the story's branch with `git merge origin/<integration branch>`, unless the project's norms ask for a rebase.

## What never enters the repository

Your orchestrator files are yours alone: `.orchestrator.json` and `.orchestrator/` (the stories, the lock lists, the ledger, the briefs and reports, the audits) are excluded on this machine with `.git/info/exclude`, never through the shared `.gitignore`, and never committed. So the story's branch carries only code: no kickoff, lock, marker or unlock commits. Nothing in a commit, a pull request or a file of the repository mentions the plugin or its files; a story is named by its ID.

## Commits

- **Format:** the project's (its norms, or the commit hook that checks it: `commitlint`, `lefthook`, `husky`). When it has none, Conventional Commits: `type(scope): description`, in the imperative, with the types `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, and the module, app or package as the scope. A commit hook that rejects a message is fixed, never skipped.
- **Language:** the project's (`.orchestrator.json` → `language`; without it, the language of its recent commits and its README).
- **A criterion:** the criterion's ID opens the description. `feat(accounts): ALT-001.1 reject an email already registered`; `test(web): ALT-001.2 …` when the behaviour already existed and only the test is new. A module or app README brought up to date at the close: `docs(<scope>): ALT-001 …`. A task: what changes, with no ID.
- **One commit per criterion.** Your human's ok comes on the first one and on the finished build; their asking you to build the story is the request to commit its criteria. When the project's settings make Claude Code ask them to confirm each `git commit` or `git push`, that prompt is their consent: run the command and let them approve it; do not ask again in the conversation.
- Never commit on a protected branch. The guard blocks it.
- A builder works in your checkout: only one writer runs at a time.
- Stage files by name. The guard blocks `git add .`, `-A` and `--all` unless `git.blockBroadAdd` is `false`. Check `git status` before staging: unrelated changes stay out of the commit.
- Never `--no-verify`, `reset --hard`, `clean -f` or force push. The guard blocks them.

## Push and remote

- Push only when your human asks. When they say "commit and push", do both: a commit alone is half the request.
- Role agents never push; the guard blocks it. With `git.allowPush: false` the guard makes Claude Code ask your human to confirm each push and each merge; that prompt is their consent, so run the command and let them approve it. Do not hand the command back.
- Check `git remote -v` and your human's access (`references/access.md`) before the first push in a project. Non-interactive sessions cannot answer credential prompts.

## Pull requests

- Every change enters through a pull request, one purpose each, into the integration branch; a `hotfix/` goes into the production branch.
- **Title:** the commit format. A story: `feat(<scope>): <ID> <what the person can now do, in the imperative>`. A squash commit takes it.
- **Body:** for a story, the criteria with their result (`node <scripts>/stories.mjs --pr <ID>`; it names no story file, since the story lives only on your machine), the ⚠️ manual steps, and what the review found and how it was settled. Then the project's own template or checklist, when it has one (`.github/pull_request_template.md`, or the checklist its norms give), each box ticked only when it holds. A box about CI is ticked when the checks are green, not before.
- **A vulnerability is never detailed in a pull request, a comment or an issue** until it is fixed. Tell your human in the session; they decide who hears of it, and where.
- **Reviewers:** when `git.requiredApprovals` is above 0, the people the project's norms name, or whom your human tells you. Every pull request also gets the reviewer agent's review before it opens (`references/development.md`, "Review").
- **Text you send travels as UTF-8.** Build bodies and messages with `node` (`JSON.stringify`) or write them to a file under `.orchestrator/work/`, and pass the file (`--body-file`, `curl --data-binary @<file>`). Text written inside the shell command loses its accents on Windows, and a squash commit keeps it broken for good.

**On GitHub,** with `gh`: `gh pr create --base <integration branch> --head <branch> --title "<title>" --body-file <file>`. Read its state with `gh pr view <n> --json reviews,reviewDecision,statusCheckRollup,mergeStateStatus,baseRefName`.

**On Bitbucket,** through the REST API, which has no official CLI: `POST https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests` with `BITBUCKET_USER` and `BITBUCKET_TOKEN` from your human's environment (`references/access.md`). Read its state with `GET …/pullrequests/<id>` and `GET …/pullrequests/<id>/statuses`. Never write the token into a file.

Without access, your human opens the pull request in the web UI, and you give them the title, the body, and later the strategy and the message of the table below.

## Merge

A pull request merges only on your human's ok, and only when all of this holds; read it first:

- at least `git.requiredApprovals` people other than its author approved it (GitHub: `reviews` with `state: APPROVED`; Bitbucket: participants with `approved: true`);
- nobody asked for changes (GitHub: `reviewDecision` is not `CHANGES_REQUESTED`; Bitbucket: no participant with `state: changes_requested`), and on Bitbucket no task is open (`task_count` is 0);
- the last checks are green (GitHub: every `statusCheckRollup` entry is `SUCCESS`, `NEUTRAL` or `SKIPPED`; Bitbucket: every status is `SUCCESSFUL`). A repository with no checks has none to wait for: `verify.all` ran in your session (`references/development.md`, "Close the build");
- into the production branch, the source branch is not behind.

If one fails, do not merge; tell your human what it is waiting for. A merge is a merge whichever way it is run (`gh pr merge`, `PUT /repos/<owner>/<repo>/pulls/<n>/merge`, `POST …/pullrequests/<id>/merge`): the guard blocks it for role agents, and asks your human when `git.allowPush` is `false`.

| Pull request | Strategy | Delete the source branch | Message |
|---|---|---|---|
| story, fix or task → integration | `git.mergeStrategy` | yes | with squash, the title |
| integration → production | `git.releaseStrategy`, or what the project's norms say; when neither says, ask your human once and write their answer there | **no** | the host's |
| `hotfix/` → production | `git.mergeStrategy` | yes | with squash, the title |
| production → integration, after a hotfix | merge commit | **no** | the host's |

- **GitHub:** `gh pr merge <n> --squash --subject "<title>" --delete-branch` (`--merge` or `--rebase` per the strategy).
- **Bitbucket:** `POST …/pullrequests/<id>/merge` with `merge_strategy` (`squash`, `merge_commit` or `fast_forward`), `close_source_branch`, and with squash, `message` set to the title: Bitbucket's own proposal («Merged in feature/… (pull request #N)») is never kept.

With squash, a story's trail (one commit per criterion) stays in its pull request, and the integration branch gets one commit. After the merge, write the commit the story landed as in your ledger and as the `# commit` line of the story's lock list (`references/development.md`, "Merge").

## Repository settings

They are the project's, on its host; you never change them. Nothing of this plugin runs in the pipeline: `stories.mjs` runs only in your session.

## Story IDs

A story ID is a prefix and a number (`ALT-001`): the prefix names an area of the product, and the stories of one area share it. Your human gives it, or you propose one when you write the story with them (the `stories` skill), and it never changes after the kickoff.
