# Where each thing lives

1. **Every fact has one home.** Everything else links to it and never copies it.
2. **What a machine can check is not written as prose.** It becomes a check, and its message cites the norm it enforces.
3. **The project's documents bind; this plugin adds nothing to them.** What binds is in the project, not here (below, "The project's norms"). The plugin's method is yours alone and never enters the repository.
4. **Shared files change through a pull request.** Generated files are never edited by hand. Your files never travel.
5. **A conversation is not documentation.** What two people agree, in a pull request comment or anywhere else, goes into the story, an ADR or the document it belongs to.

| What | Where |
|---|---|
| What binds: decisions, architecture, stack, security, how to work | the project's norms, `.orchestrator.json` → `norms`, and its accepted ADRs (`adrDir`, default `docs/adr/`) |
| How the code is written | the project's norms; what a machine checks, in the linters' configuration and CI |
| How each module or app works today | its README, when the project keeps one, updated in the same pull request as the code |
| The context of every session | the project's `CLAUDE.md` or `AGENTS.md` |
| The code graph | its configuration in the repository, when the project has one; the graph on each machine, never committed |
| What a story asks for | `<storiesDir>/stories/`, on your machine |
| What a screen looks like (the design) | where the project keeps it (Figma, a design repo), linked from the story or the README; never copied here |
| Where each story stands | its branch, its lock list and `<storiesDir>/map.md`, generated |
| Plugs, locked tests, the risk map and its reasons, audits, the suppressions your human approved | `.orchestrator.json`, `.orchestrator/locked/`, `.orchestrator/risk-map.md`, `.orchestrator/audits/`, `.orchestrator/suppressions.json` (`references/gates.md`) |
| Your ledger, briefs and reports | `.orchestrator/state.md`, `.orchestrator/work/` |

Everything under `.orchestrator/` and `.orchestrator.json` is yours, on this machine, excluded with `.git/info/exclude`: nobody else sees it, and nothing in the repository names it. `<storiesDir>` is `.orchestrator.json` → `storiesDir`, inside `.orchestrator/`.

## The project's norms

`.orchestrator.json` → `norms` lists the documents that bind: files, folders ending in `/`, or globs (`["CLAUDE.md", "CONTRIBUTING.md", "docs/standards/"]`). Without it, the guard protects the usual ones (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`) and the ADR folder. No role agent edits them (`references/gates.md`).

There are no rule IDs of the plugin's own: an agent cites a norm by document and section (`CONTRIBUTING.md` «Tests»), by the ID the document gives it, or by ADR (`ADR-0012`). The patterns a brief cites under "Read first" are the project's template or example module, when it has one, and the code the work touches.

## Where do I write this?

Ask in this order and stop at the first match:

1. Behaviour a person notices? → a criterion of its story.
2. A choice of architecture, or anything the norms say needs an ADR? → an ADR, proposed to your human; whoever the norms name accepts it, or your human.
3. How the code must be written? → a machine check; else a line in the norm it belongs to; else the project's template. Always proposed to your human first, then a pull request.
4. How a module or app works, or how to run it? → its README; the whole project, `README.md` and `CONTRIBUTING.md`.
5. None of these → it is not written down.

The builders never edit those documents. You do, through a pull request, on your human's ok. A behaviour is never a norm: it is a criterion.

## The context is the code

You learn the project from what is built and from its documents: the README, the code the work touches, the norms, the stories and the ADRs. Read only what the work needs; when a norm says which document to read for which task, follow it rather than reading everything.

When a description of how the code works (a README, a convention, a command) disagrees with the code, follow the code, list the inconsistencies, and offer your human a `feature/` or `fix/` pull request that fixes the text. What binds is the exception: code that breaks a norm, an accepted ADR or a story's criterion is a broken norm or a failing criterion, never something to copy.

Part of that rot a machine catches, once the session names the texts. `.orchestrator.json` → `contextDocs` lists them (`["CLAUDE.md", "README.md", "CONTRIBUTING.md", "apps/*/README.md"]`); without it nothing is checked, and `stories.mjs --check` says so on every run. With it, `--check` fails when one of those texts names a path or a `pnpm` script that no longer exists, in backticks or in a shell code block. It checks a `pnpm` script only where nothing else can be meant (`pnpm run <x>`, or a name with a colon such as `pnpm test:e2e`), since a bare `pnpm <x>` may run a dependency's binary. A stale text is offered to your human as a pull request; `stories.mjs` runs only in your session, never in the pipeline. A contradiction of meaning (a text that says one thing while the code does another) no check sees: that is the rule above and the delivery audit.

Who depends on a piece of code is the code graph's question, not grep's, when the project has one. The builders cite its callers in their report, and the review's `code` lens starts from what it says a commit reaches outside its diff.
