# Set up a project

A project is set up for the orchestrator when it has `.orchestrator.json` at its root, and open for development when that file has `roles`. Everything you create here is yours, on this machine: nothing enters the repository. Do it with your human, one step at a time, and show them each file before you write it.

## 1. Keep your files out of git

Add these two lines to `.git/info/exclude` (never to the shared `.gitignore`), then check them with `git check-ignore -q .orchestrator.json .orchestrator/state.md`:

```
/.orchestrator/
/.orchestrator.json
```

## 2. Read the project

Read, in parallel, before you propose anything:

- **Its norms:** `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, coding standards, a `docs/` folder of rules, the ADR folder and its format. They become `norms` and `adrDir`.
- **Its checks:** the scripts of `package.json`, `Makefile`, `composer.json`, `pyproject.toml`, `go.mod`; the CI configuration (`.github/workflows/`, `bitbucket-pipelines.yml`, `.gitlab-ci.yml`); the git hooks (`lefthook.yml`, `.husky/`, `.pre-commit-config.yaml`) and what they check, the commit format among them. The fast ones (lint, typecheck, unit tests of what changed) become the builder's `onStop`; all of them, `verify.all`.
- **Its tests:** which runners, and how each writes a report the validator reads: `jest-json` (Vitest's and Jest's `--reporter=json`), `junit` (PHPUnit, pytest, Playwright, gotestsum…) or `go-json` (`go test -json`).
- **Its git:** `git remote get-url origin` (GitHub or Bitbucket), the remote's default branch, other long-lived branches (`develop`, `main`), the language and format of its recent commits, a pull request template.

## 3. Ask your human

Ask before you write anything, with the question tool when the session has one, so each answer is one click. Put the option that fits what you read first, marked as recommended, and say in one line what each option means for them. Ask each question once; skip one only when the project's norms already answer it, and say so.

**First, always: how they work with git.**

| Option | What the orchestrator does | `.orchestrator.json` |
|---|---|---|
| **It makes the commits and the pull requests** | creates the story's branch, commits each criterion once it is green, pushes, opens the pull request and merges it on their ok | `git.mode: "pr"` |
| **I make the commits myself** | never commits, pushes or opens a pull request: after each criterion it gives them the files and the message, and waits for their commit before the next one; at the close, it gives them the title and the body of the pull request, if they open one | `git.mode: "manual"` |

**Then, only with `pr`,** in one round:

- **Where the pull requests live,** GitHub or Bitbucket, when the remote does not say it (`git.host`).
- **Whether someone else approves them:** nobody (`git.requiredApprovals: 0`), one person (`1`), or what the norms say.
- **Whether you ask before each push and each merge:** yes (`git.allowPush: false`, recommended) or no.
- **How they merge,** when the norms do not say it: squash (recommended), merge commit or rebase (`git.mergeStrategy`).

**And in both modes,** when you could not tell from the project: the language the repository is written in (`language`), and whether the fast checks you found are the right ones for the builder (`roles.builder.onStop`).

Anything else you cannot find out, ask in the same round, never one question at a time.

## 4. `.orchestrator.json`

Write it from their answers and what you read, show it to them with a line on each key you set, and wait for their ok; leave out what takes its default.

```json
{
  "storiesDir": ".orchestrator/stories",
  "language": "es",
  "norms": ["CLAUDE.md", "CONTRIBUTING.md"],
  "adrDir": "docs/adr",
  "contextDocs": ["CLAUDE.md", "README.md", "CONTRIBUTING.md"],
  "git": {
    "mode": "pr",
    "host": "github",
    "integrationBranch": "main",
    "mergeStrategy": "squash",
    "requiredApprovals": 0,
    "allowPush": false
  },
  "verify": {
    "all": ["npm run lint", "npm run typecheck", "npm test", "npm run build"]
  },
  "roles": {
    "builder": { "onStop": ["npm run lint", "npm run typecheck"] }
  }
}
```

| Key | What it is | Where it is explained |
|---|---|---|
| `storiesDir` | the stories' folder, inside `.orchestrator/` | the `stories` skill |
| `language` | what the repository is written in: commits, pull requests, READMEs | `SKILL.md`, §1 |
| `norms` | the documents that bind; no role agent edits them | `references/where-things-live.md` |
| `adrDir` | the project's ADRs, which a story can wait for | the `stories` skill, "Decisions" |
| `contextDocs` | the texts whose paths and `pnpm` scripts `--check` keeps from going stale | `references/where-things-live.md` |
| `git` | the mode (`pr` or `manual`), host, branches, strategy, approvals, push | `references/git.md` |
| `verify.all` | the full checks, run once at the close of each build | `references/development.md` |
| `verify.maxBuilderRuns`, `maxSameFailure`, `maxFailedChecks`, `checkTimeout` | when a builder that does not converge stops: 3 runs without a commit, the same failure 3 times, 10 failed checks in a run, 300 seconds per check at its stop; `0` switches the first three off | `references/delegation.md` |
| `roles` | the builder's fast checks (`onStop`) and, when needed, the paths it may write (`paths`); other roles of the project | `references/roles.md` |
| `riskTags`, `riskPaths` | the risk map | `references/risk-map.md` |
| `gates` | the gates' modes, `observe` by default | `references/gates.md` |
| `contract`, `ui`, `runnerLimit`, `audit.sample` | an API spec and its regeneration; the UI check; what no machine can verify; the audit's sample | `agents/builder.md`, `references/audit.md` |

Leave `roles` out until the fast checks run green on the integration branch: without it, development is not open, and nobody builds against checks that already fail.

## 5. The stories' folder

In `<storiesDir>`:

- `activities.json`: the steps of the user's journey, each with a `name`, a `code` and its folder; ask your human for them, or propose them from the product's README and let them choose.
- `stories.config.json`: the `personas`, the `releases` (the first measures progress), `idPrefix` when the project uses a single prefix, `labels` when the stories are not in English, and `tests`, one source per runner:

  ```json
  "tests": [
    { "command": "npx vitest run --reporter=json --outputFile={report}", "format": "jest-json" },
    { "command": "go test -json ./... > {report}", "format": "go-json" },
    { "command": "vendor/bin/phpunit --log-junit {report}", "format": "junit" }
  ]
  ```

  `{report}` is where the runner writes; `cwd` runs it in a subfolder.
- `stories/`, empty, and `templates/story.md`, from the `stories` skill's template, with the project's language in its headings.

Run `node <scripts>/stories.mjs` once: it must write `map.md` with no errors.

## 6. The risk map, and the first story

Draw the risk map with your human (`references/risk-map.md`). Then, in `pr` mode, check your human's access to the host (`references/access.md`), and write the first story with them (the `stories` skill). Its kickoff is the pilot of the whole setup.
