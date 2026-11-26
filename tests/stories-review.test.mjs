// The review pack: what git says about the commit under review, written once for the two reviewers.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const STORIES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts", "stories.mjs");

const STORY = `---
id: PRU-9
title: Guardar una nota
activity: Tomar notas
persona: Responsable de la cuenta
release: Entrega 1
blocked_by: []
depends_on: []
tags: []
discarded: false
---

## Story
As the account owner,
I want to save a note,
so that I keep it.

## Acceptance criteria
- **PRU-9.1** When the person saves a note, the system keeps its text. [unbuilt]
- **PRU-9.2** When the text is empty, the system rejects it. [unbuilt]

## Out of scope

## Verification

## Open questions
`;

function project() {
  const dir = mkdtempSync(path.join(tmpdir(), "stories-review-"));
  const write = (rel, text) => { mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); writeFileSync(path.join(dir, rel), text); };
  const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir, encoding: "utf8" }).trim();
  write(".orchestrator.json", JSON.stringify({
    storiesDir: ".orchestrator/stories", git: { integrationBranch: "develop" },
    norms: ["CLAUDE.md", "docs/rules/"], riskTags: ["identity"], riskPaths: { identity: ["apps/api/internal/platform/authz/"] },
  }));
  write(".orchestrator/stories/activities.json", JSON.stringify([{ code: "NOT", name: "Tomar notas", folder: "notas" }]));
  write(".orchestrator/stories/stories.config.json", JSON.stringify({ releases: ["Entrega 1"], idPrefix: "PRU" }));
  write(".orchestrator/stories/stories/notas/PRU-9-guardar-una-nota.md", STORY);
  write("CLAUDE.md", "# Normas de develop\n");
  write("docs/rules/api.md", "# API\n");
  write("apps/api/main.go", "package main\n");
  write("apps/api/internal/platform/authz/authz.go", "package authz\n");
  git("init", "-q", "-b", "develop");
  write(".git/info/exclude", "/.orchestrator/\n/.orchestrator.json\n");
  git("add", ".");
  git("commit", "-q", "-m", "base");
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  git("switch", "-q", "-c", "feature/pru-9-guardar-una-nota");
  const env = { ...process.env };
  delete env.BITBUCKET_BRANCH;
  delete env.GITHUB_HEAD_REF;
  delete env.CI;
  return {
    dir,
    write,
    git,
    commit: (message, files) => { for (const [rel, text] of Object.entries(files)) write(rel, text); git("add", ...Object.keys(files)); git("commit", "-q", "-m", message); return git("rev-parse", "HEAD"); },
    run: (...args) => spawnSync("node", [STORIES, ...args], { cwd: dir, env, encoding: "utf8" }),
    read: (rel) => readFileSync(path.join(dir, rel), "utf8"),
  };
}

test("el paquete reúne lo que git dice del commit: diff, criterios, riesgo, supresiones y configuración de checks", () => {
  const p = project();
  const base = p.git("rev-parse", "develop");
  p.commit("feat(notes): PRU-9.1 keep the note's text", {
    "apps/api/notes.go": "package main\n\nfunc save() { x := 1 //nolint\n_ = x }\n",
    "apps/api/internal/platform/authz/authz.go": "package authz\n\nfunc can() bool { return true }\n",
  });
  const sha = p.commit("chore: loosen the pipeline", { ".github/workflows/ci.yml": "on: push\n", "CLAUDE.md": "# Normas reescritas por la rama\n" });
  const r = p.run("--review", "PRU-9", "HEAD");
  assert.equal(r.status, 0, r.stderr);
  const short = sha.slice(0, 7);
  assert.match(r.stdout, new RegExp(`Review pack: \\.orchestrator/work/PRU-9/review-${short}/pack\\.md`));
  const pack = p.read(`.orchestrator/work/PRU-9/review-${short}/pack.md`);
  assert.match(pack, new RegExp(`Commit: ${sha}`));
  assert.match(pack, new RegExp(`Base: ${base}`));
  assert.match(pack, /HEAD: at the commit/);
  assert.match(pack, /- \*\*PRU-9\.1\*\* When the person saves a note/);
  assert.match(pack, /Criteria no commit names: PRU-9\.2\./);
  assert.match(pack, /- M apps\/api\/internal\/platform\/authz\/authz\.go {2}\[identity\]/);
  assert.match(pack, /Risk tags these files carry and the story lacks: identity\./);
  assert.match(pack, /- apps\/api\/notes\.go:3 func save\(\) \{ x := 1 \/\/nolint/);
  assert.match(pack, /- A \.github\/workflows\/ci\.yml/);
  assert.match(pack, /No lock list/);
  // The norms are the integration branch's, never the branch's copy: a change does not rewrite what judges it.
  const norms = `.orchestrator/work/PRU-9/review-${short}/norms`;
  assert.equal(p.read(`${norms}/CLAUDE.md`), "# Normas de develop\n");
  assert.equal(p.read(`${norms}/docs/rules/api.md`), "# API\n");
  const diff = p.read(`.orchestrator/work/PRU-9/review-${short}/diff.patch`);
  assert.match(diff, /apps\/api\/notes\.go/);
  assert.match(diff, /ci\.yml/);
});

test("un test bloqueado que cambia después del bloqueo hace fallar el paquete antes de lanzar a nadie", () => {
  const p = project();
  const locked = p.commit("test(api): PRU-9.1 keep the note's text", { "apps/api/notes_test.go": "package main\n" });
  p.write(".orchestrator/locked/PRU-9.txt", `# commit ${locked}\napps/api/notes_test.go\n`);
  const clean = p.run("--review", "PRU-9", "HEAD");
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(p.read(`.orchestrator/work/PRU-9/review-${locked.slice(0, 7)}/pack.md`), /None changed after the lock\./);
  const sha = p.commit("fix(api): PRU-9.1 adjust", { "apps/api/notes_test.go": "package main\n// otra cosa\n" });
  const r = p.run("--review", "PRU-9", "HEAD");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /apps\/api\/notes_test\.go changed after its lock/);
  assert.match(p.read(`.orchestrator/work/PRU-9/review-${sha.slice(0, 7)}/pack.md`), /CHANGED AFTER THE LOCK: apps\/api\/notes_test\.go/);
});

test("si HEAD no es el commit, el paquete lo dice y sale con 1: el grafo y el árbol describirían otro", () => {
  const p = project();
  const first = p.commit("feat(notes): PRU-9.1 keep the text", { "apps/api/notes.go": "package main\n" });
  p.commit("feat(notes): PRU-9.2 reject an empty text", { "apps/api/notes.go": "package main\n// vacío\n" });
  const r = p.run("--review", "PRU-9", first);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /HEAD is [0-9a-f]{7}, not [0-9a-f]{7}: check the commit out/);
  assert.match(p.read(`.orchestrator/work/PRU-9/review-${first.slice(0, 7)}/pack.md`), /not the commit\. Read files with `git show/);
});

test("una re-revisión solo trae el arreglo desde el commit revisado", () => {
  const p = project();
  const reviewed = p.commit("feat(notes): PRU-9.1 keep the text", { "apps/api/notes.go": "package main\n" });
  const fix = p.commit("fix(notes): PRU-9.1 trim the text", { "apps/api/trim.go": "package main\n" });
  const r = p.run("--review", "PRU-9", "HEAD", "--since", reviewed);
  assert.equal(r.status, 0, r.stderr);
  const dir = `.orchestrator/work/PRU-9/review-${fix.slice(0, 7)}`;
  const pack = p.read(`${dir}/pack.md`);
  assert.match(pack, new RegExp(`Re-review: the fix since ${reviewed}`));
  assert.doesNotMatch(pack, /Criteria no commit names/);
  const diff = p.read(`${dir}/diff.patch`);
  assert.match(diff, /trim\.go/);
  assert.doesNotMatch(diff, /notes\.go/);
});

test("una tarea no tiene historia ni lista de bloqueo; un nombre que no es un ID ni un slug no escribe nada", () => {
  const p = project();
  const sha = p.commit("fix(ci): pin the runner", { "apps/api/main.go": "package main\n// v2\n" });
  const r = p.run("--review", "pin-runner", "HEAD");
  assert.equal(r.status, 0, r.stderr);
  const pack = p.read(`.orchestrator/work/pin-runner/review-${sha.slice(0, 7)}/pack.md`);
  assert.match(pack, /No story pin-runner: a task\./);
  assert.match(pack, /A task has no lock list\./);
  const bad = p.run("--review", "../fuera", "HEAD");
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Usage: stories\.mjs --review/);
  assert.equal(existsSync(path.join(p.dir, ".orchestrator", "fuera")), false);
});

test("--base empieza el diff en el commit del kickoff (git.mode manual), no en la base del merge", () => {
  const p = project();
  const kickoff = p.commit("chore: trabajo de antes", { "apps/api/antes.go": "package main\n" });
  const sha = p.commit("feat(notes): PRU-9.1 keep the text", { "apps/api/notes.go": "package main\n" });
  const r = p.run("--review", "PRU-9", "HEAD", "--base", kickoff);
  assert.equal(r.status, 0, r.stderr);
  const dir = `.orchestrator/work/PRU-9/review-${sha.slice(0, 7)}`;
  assert.match(p.read(`${dir}/pack.md`), new RegExp(`Base: ${kickoff}, the commit the work starts from\\.`));
  const diff = p.read(`${dir}/diff.patch`);
  assert.match(diff, /notes\.go/);
  assert.doesNotMatch(diff, /antes\.go/);
  assert.equal(p.run("--review", "PRU-9", "HEAD", "--base", kickoff, "--since", kickoff).status, 2, "--base y --since no van juntos");
});
