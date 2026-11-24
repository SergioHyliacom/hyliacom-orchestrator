# Work outside a story

## Fix or task

- A `fix/<slug>` repairs something that is not a story's behaviour: the build, the configuration, a script.
- A `feature/<slug>` is any other work outside the stories: tooling, a machine check, documentation. A dependency added or updated by hand is a pull request of its own, on your human's ok; leave the bots' branches (`deps/`, `renovate/`, `dependabot/`) alone.
- A bug in behaviour is never a fix of this kind: it reopens its story (`references/development.md`).

1. Create the branch, in English kebab-case unless the norms say otherwise, from the integration branch on the remote.
2. Brief the builder with `Change: task <slug>: <what changes>`, your human's request word for word under `Request:`, and under "Done when" the commands that prove it. Show your human the evidence and commit on their ok, in the commit format (`references/git.md`). Text only you write (a README line, a line of a norm) needs no builder. Before development opens there are no builders.
3. The review (`references/development.md`), then a pull request to the integration branch, with the reviewers and the template of `references/git.md`. When it has its approvals and is green, merge it on your human's ok.

## Check

A check adds or tightens a machine check (a lint rule, an architecture test, a CI step) that enforces a norm the project already has: a line of one of its norms, or an accepted ADR. It comes from a failure (the close, `SKILL.md` §4) or an audit (`references/audit.md`). Like any change, it is proposed to your human and goes through a pull request: nothing merges on its own.

1. On your human's ok, create `feature/check-<slug>` from the integration branch on the remote. The builder builds it as a task; a one-line lint setting you do yourself. When the project documents what CI checks, the same pull request says it there.
2. **It proves itself:** before the commit, show that the check fails on the code that motivated it and passes once that code is fixed, and that `verify.all` is green. A check that stays green on the bad code catches nothing: drop it.
3. Push and open the pull request with the failing and passing lines in its body. It merges like any other, on your human's ok.

## Hotfix

An urgent bug in production, when the project has a production branch apart from the integration branch (`git.productionBranch`). Without one, it is a `fix/` on the integration branch, merged first.

1. `git switch -c hotfix/<slug> origin/<production branch>`.
2. When it breaks a criterion: unlock only that criterion's test files (`references/development.md`, "Close the build"), have the builder write a test that reproduces the bug and fails, then the fix, and lock again. Never mark the criterion `[failing]` for a hotfix: the hotfix restores the behaviour, so the story stays done. A hotfix that breaks no criterion is a plain task.
3. Open a pull request to the production branch, merged as `references/git.md` says.
4. Right away, open the pull request production → integration branch, with a merge commit and without deleting the production branch. If it conflicts, create `hotfix/<slug>-sync` from the integration branch, merge `origin/<production branch>` into it, resolve the conflicts, and open that pull request instead, also with a merge commit.

## Going to production

When the project has a production branch, your human decides when, usually at the close of a delivery. The pull request integration branch → production branch opens once the integration branch's last build is green and every hotfix has come back to it, and merges with `git.releaseStrategy` (`references/git.md`), without deleting the integration branch. It may be tagged (`v0.1.0`). It is deployed as the project's norms say.

## A spike

A technical test lives on `spike/<slug>`: its commits go straight to the branch, it is never merged, its results go in its README, and what is decided goes to an ADR through a `feature/` pull request. It is not a story: the session helps as with any work your human asks for.
