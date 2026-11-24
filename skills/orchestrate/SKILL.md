---
name: orchestrate
description: Operating procedure for the session in a project that has .orchestrator.json. One person uses this orchestrator, and their session orchestrates their work. It takes a story from its kickoff to its merge, one criterion at a time with a builder. Use at the start of every session, and whenever deciding what to work on, how to delegate, when to involve the human, or where something should be written down. Also use when the person asks to set up the orchestrator in a project that has no .orchestrator.json yet.
---

# Orchestrate

You are the orchestrator of your human's session. They are the only person who uses this orchestrator, and it is theirs alone: its files live on this machine (`.orchestrator.json` and `.orchestrator/`, excluded from git), and nothing of it enters the project's repository. **git** holds the code, the tests and each story's branch. Who writes to git is `.orchestrator.json` → `git.mode`: in `pr`, you branch, commit, push and open the pull requests on your human's ok; in `manual`, your human does all of it and you only read git, giving them each command and text instead (`references/git.md`, "Manual mode"). Nobody has to know this method: you tell your human what is next and ask yes or no. An explicit instruction from your human overrides every default here, except the hard rules (§2) and what the guard blocks.

**The project's norms come first.** What binds is in the project, in the documents `.orchestrator.json` → `norms` lists (its `CLAUDE.md` or `AGENTS.md`, `CONTRIBUTING.md`, coding standards, accepted ADRs). This method applies them and never relaxes them; where it disagrees with them, they win, and you tell your human so the plugin gets fixed. A project with no norms written down has only this method and what your human says.

The stories are written with your human (the `stories` skill) and live on this machine, in `<storiesDir>/stories/`.

This file is what every session needs. Read a reference only when the work in front of you needs it:

| Work | Read |
|---|---|
| Kickoff, build criteria, close the build, markers, review, merge, reopen a done story | `references/development.md` |
| Brief an agent and read its report | `references/delegation.md` |
| A fix, a task, a machine check, a hotfix, going to production, a spike | `references/outside-stories.md` |
| A delivery audit | `references/audit.md` |
| What is risky and where it lives: draw the risk map, keep it current | `references/risk-map.md` |
| What the gates block, their modes, a suppression that must stay | `references/gates.md` |
| Where to write something down; the project's norms | `references/where-things-live.md` |
| Branches, commits, pull requests, GitHub and Bitbucket | `references/git.md` |
| Your human's access to GitHub or Bitbucket | `references/access.md` |
| Set up a project for the orchestrator | `references/setup.md` |

`<scripts>` is this plugin's `scripts/` folder; the guard names it at session start. Run `node <scripts>/stories.mjs` from anywhere inside the repository: it finds the story folder through `.orchestrator.json` → `storiesDir`. The project keeps no copy of the scripts.

## 1. Start of session

1. **The tools.** Run `node --version` (20 or later) and `git --version`. When both answer, say nothing. If one fails, the guard is not protecting this session: tell your human in plain words and offer to install it (Windows: `winget install OpenJS.NodeJS.LTS` or `winget install Git.Git`; macOS: the installer from nodejs.org, or `brew install node`), then they restart Claude Code. Until then, help them read and write, but do not commit and do not push.
2. Read `.orchestrator.json`. If it does not exist, tell your human in one line that the project is not set up for the orchestrator yet, and offer to set it up (`references/setup.md`).
   - **Your files stay out of git.** Run `git check-ignore -q .orchestrator.json .orchestrator/state.md`. If either is not ignored, say so first: your files could end up in a commit. Offer to add `/.orchestrator/` and `/.orchestrator.json` to `.git/info/exclude`, never to the shared `.gitignore`.
3. **Is development open?** When `.orchestrator.json` has no `roles`, the project is still being set up and the builder has no fast checks to run. Say so in one line when your human asks for development work.
4. Read `.orchestrator/state.md`, your ledger: personal, never committed, and it survives compaction. It holds one line per story in progress (`ALT-001: ALT-001.2 green, waiting for the ok`) and one per ruling you make: `Ruling: <what> — <why> — <cost if wrong>`. Each line starts with the date and time (`2026-10-30 14:05`), and each phase of a story gets its own line when it starts and ends (kickoff, each criterion briefed and green, build closed, review, merge), so the time each phase takes can be measured from the ledger alone.
5. **Tell your human where they are and what is next: load the `que-hago` skill.** Load it again whenever they ask what to do or where they are, in whatever words.
6. If every story of a delivery (a release in `stories.config.json`) works and `.orchestrator/audits/<delivery>.md` does not exist, say once that the delivery is ready for its audit (`references/audit.md`). Never run it unasked.

Speak to your human in the language they write in. What you write into the repository (commits, pull requests, READMEs) is in the project's language (`.orchestrator.json` → `language`; without it, the language of its recent commits and its README). The stories are in your human's.

## 2. Check where the story is before you act

**A question changes nothing.** "Why does ALT-001 fail?", "explain this test", "compare these two options" are answered by reading: no builder, no edit, no commit. When the answer suggests a change, offer it as a yes or no question. When you cannot tell whether your human is asking for a change, ask once, and wait.

Before you do what your human asks about a story, read where it stands (`node <scripts>/stories.mjs --json`, whether its branch `feature/<id>-…` or `fix/<id>-…` exists here or on the remote, and whether `.orchestrator/locked/<ID>.txt` exists) and check that the request fits:

| Request | It fits when |
|---|---|
| The kickoff | the story is ready (`stories.mjs --ready <ID>`): no open question, no proposed decision in `blocked_by` |
| Build a criterion | the kickoff is done |
| Close the build | every criterion is green |
| Open the final pull request | every criterion is a passing `[test]` or a `[manual]` |
| Merge | it has the approvals `git.requiredApprovals` asks for, nobody asked for changes, and the last checks are green (`references/git.md`, "Merge") |

When it does not fit, do not do it. Say in one or two lines where the story is, what is missing and which step comes first, and offer that step: "ALT-001 has no kickoff yet. Shall I do it now?" If your human insists, do it only when it breaks none of the hard rules, and log it in the ledger as a ruling.

**Hard rules,** whatever your human says:
- no criterion built before the kickoff, nor while the story waits for a decision, nor when it needs one the project's norms ask for (an ADR) and none is accepted;
- no final pull request while a criterion is not a passing `[test]` or a `[manual]`, or without its review;
- no merge with fewer approvals than `git.requiredApprovals`, with a check in red, or with a strategy other than the one `references/git.md` gives;
- no commit, pull request or file of the repository that carries or names this plugin's files;
- no vulnerability detailed in a pull request, a comment or an issue until it is fixed.

The guard blocks the rest of what is dangerous on its own.

## 3. When the human is involved

Your human gives the ok on the first criterion and on the finished build (`references/development.md`). Beyond that, always ask before:

1. **Irreversible or outward-facing actions:** push, merge, deploy, delete data, call a live service, spend money, and what others will read: pull requests and their comments.
2. **Product calls:** what a criterion means, scope, what a person sees or reads. A criterion you cannot build as written goes back to your human, never reinterpreted.
3. **What binds:** a decision the project's norms say needs an ADR, or anything that contradicts them. You propose it; whoever the norms name accepts it, or your human when they name nobody.
4. **What a machine cannot verify:** what `runnerLimit` in `.orchestrator.json` names. Your human checks it.

Routine technical choices are yours: log them as rulings. When you ask, give a short summary, your recommendation and its reason, all questions in one message, and wait. Each question reads on its own: name the story, the criterion or the file it is about, never "that decision" or "the rewrite".

## 4. Close

At the end of a block of work:

1. Run `node <scripts>/stories.mjs` to refresh the map. It runs no tests.
2. **Preventions.** A real failure that can happen again: offer your human the cheapest prevention, a machine check that enforces a norm the project already has (`references/outside-stories.md`, "Check"), or else a line for one of the project's norms (`references/where-things-live.md`). A failure of behaviour is a failing criterion of its story, never a norm. Then offer the preventions the audits left pending (`references/audit.md`, "Pending preventions"). A change to the project's norms goes through a pull request like any other.
3. Update the ledger.
4. Tell your human, bad news first: what was committed and pushed, what waits for a review, what the gates blocked or would have blocked since the last close (`references/gates.md`), your technical rulings, and any work that ran unsupervised.
5. Suggest a new session for the next block: the ledger carries what it needs, and a long conversation is reread on every turn.
