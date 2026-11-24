---
name: que-hago
description: Tells your human where they are in the orchestrator's flow and what to do next, from their git state, the stories, their pull requests and the session's ledger, and offers the next step as a yes or no question. Use at the start of every session in a project that has .orchestrator.json, and whenever they ask what to do or where they are, in any words - "¿qué hago?", "¿qué me toca?", "¿qué me toca ahora?", "¿por dónde voy?", "¿en qué punto estoy?", "¿qué tengo pendiente?", "¿y ahora qué?", "¿qué sigue?", "what's next", "what should I do".
---

# Qué hago

Find out where your human is, say it in plain words, and offer the next step as a question they answer with yes or no. Gathering changes nothing: act only after they answer, following the `orchestrate` skill.

## 1. Gather

Read all of this before you say anything. Run the independent reads in parallel.

1. **Git.**
   - Run `git fetch --prune` and `git status`, and note the current branch.
   - Note commits not pushed and changes not committed.
   - Note local branches whose remote is gone.
   - Note the stories' branches (`feature/<id>-…`, `fix/<id>-…`) here and on the remote, and for each whether `.orchestrator/locked/<ID>.txt` exists. Leave the bots' and the experiments' branches out (`deps/`, `renovate/`, `dependabot/`, `spike/`).
2. **Stories.** Run `node <scripts>/stories.mjs --json` once (the guard names `<scripts>`). If `node` is missing, say so first and offer to install it (`orchestrate` skill, §1, step 1). For each story in progress: the criteria by marker, and what it waits for (an open question, a proposed ADR). The stories not started: no branch, not done and not discarded.
3. **Pull requests.** Only when `git.mode` is `pr` (in `manual` your human handles them; skip this unless they ask). On the project's host (`orchestrate` skill, `references/git.md`; GitHub with `gh pr list --author @me --json number,title,headRefName,reviewDecision,statusCheckRollup`, Bitbucket with `BITBUCKET_USER` and `BITBUCKET_TOKEN`): their open pull requests, and for each: its approvals against `git.requiredApprovals`, changes requested, open tasks on Bitbucket, last checks green or red. Without access, skip this, say so once and offer to set it up (`orchestrate` skill, `references/access.md`).
4. **The ledger.** `.orchestrator/state.md`: the stories in progress, and what this session left half done last time.

## 2. Decide what is next

Take the first rule that applies. The rest become the other lines of your answer.

1. **Work left half done in this session.** Changes not committed, a criterion waiting for the ok, a finished build waiting for the ok, a commit not pushed. Finish it first; in `manual` mode, a commit or a push still to do is your human's: give them the command again.
2. **Pull requests:**
   - merge one that has its approvals, is green and has no open task (`references/development.md`, "Merge");
   - fix one with changes requested, an open task or a red build.
3. **The stories in progress,** by where they are:

| Where the story is | What is next |
|---|---|
| No branch yet | The kickoff (`references/development.md`), or the ADR it waits for |
| Its branch, without its lock list | The next criterion, or the ok on the finished build (`references/development.md`) |
| Its branch, with its lock list | The markers, the review, or the final pull request (`references/development.md`) |

4. **Nothing in progress.** Offer the first story not started, in the order of the releases. Before development opens (`.orchestrator.json` has no `roles`), there is nothing to build yet: say so in one line.
5. **A delivery ready for its audit**, once (`orchestrate` skill, §1).

## 3. Tell them

In their language, at most 10 lines, with no git words beyond the story IDs:

```
1. <bad news first: the story, what happened, the question>
2. …
Te recomiendo: <the next step>, porque <one line>. ¿Seguimos?
```

- Each line names its story (`ALT-001`) and says what happened.
- A question ends with its answer options: sí or no.
- If a local branch's remote is gone, add one line offering to delete it.

Then wait for the answer. On yes, do it, following the `orchestrate` skill.

## 4. When they ask for something specific

When your human asks for a step instead ("programa ALT-001", "abre el PR", "fusiónalo"), check first that it fits where the story is (`orchestrate` skill, §2). If it does not, say where the story is and what is missing, and offer the step that comes first, as a yes or no question.
