# hyliacom-orchestrator

Plugin de Claude Code para desarrollar cualquier proyecto historia a historia, con una sola persona al mando. Sale de `easyone-orchestrator`, la adaptación de Hyliacom para EASY One, que a su vez parte del [Orchestrator](https://github.com/sydneydesign/Orchestrator) de Sydney y Claude. Esta versión no lleva nada de EASY One: lo que obliga en cada proyecto lo dicen sus propias normas.

- **Lo usa una sola persona y es solo suyo.** Tu sesión de Claude orquesta tu trabajo. Sus ficheros viven en tu equipo, excluidos de git, y nada del método entra en el repositorio del proyecto. Al empezar, y cada vez que le preguntas «¿qué me toca?», como te salga, te dice en qué punto estás y qué sigue, y te pregunta sí o no.
- **Mandan las normas del proyecto.** Los documentos que pongas en `norms` (`CLAUDE.md`, `CONTRIBUTING.md`, sus estándares de código…) y sus ADR aceptados obligan siempre. El plugin los aplica y no relaja ninguno: si choca con ellos, ganan ellos. Donde el proyecto no dice nada, el plugin trae valores por defecto razonables (Conventional Commits, `feature/<id>-<slug>`, Squash).
- **Las historias se escriben contigo** (skill `stories`), con sus criterios de aceptación, y viven en tu equipo.
- **Un criterio cada vez.** El agente `builder` escribe el test, lo ve fallar, lo hace pasar y se para; la sesión comprueba las pruebas y hace el commit. Tú das el ok en el primer criterio y en la construcción terminada.
- **Cada PR lleva revisión** del agente `reviewer` antes de abrirse, más las aprobaciones de otras personas que pida el proyecto (`git.requiredApprovals`, 0 por defecto). Se fusiona con la estrategia que digas (Squash por defecto) y siempre con tu ok.
- **GitHub y Bitbucket.** Cada proyecto dice cuál usa (`git.host`): en GitHub con `gh`; en Bitbucket, por su API.
- **Una guardia** (un hook) impide lo peligroso: ningún agente hace commit, push ni merge; cada uno escribe solo donde le toca; nadie toca los tests bloqueados, las historias ni las normas del proyecto; y nada se salta los hooks de git ni fuerza un push.
- **Un builder que da vueltas se para pronto.** La guardia lee la salida de cada test y cada check que lanza, también cuando la recorta con `| tail` o `| grep`. El mismo fallo tres veces en una ejecución, o diez checks fallidos, y el builder deja de probar y te dice qué intentó. Tras tres ejecuciones sin commit, te pregunta antes de lanzar otra.
- **Lo que juzga un cambio queda fuera de su alcance.** Ningún agente toca `.orchestrator.json` ni las normas, ni, en la rama de una historia, la configuración de los checks; y una rama no apaga un check en su código (`eslint-disable`, `//nolint`, un test saltado) sin tu ok. Cada compuerta empieza en modo `observe`: apunta lo que bloquearía y no bloquea nada hasta que la pases a `enforce`.
- **Al cerrar cada entrega, una auditoría por muestreo**, si la pides, contra las normas del proyecto. Lo que puede repetirse se propone como comprobación de la máquina o como línea de una norma, siempre por PR.

## Instalar el plugin

**Solo para ti y solo en el proyecto donde lo uses.** Abre una terminal en la carpeta del proyecto y ejecuta:

```
claude plugin marketplace add SergioHyliacom/hyliacom-orchestrator
claude plugin install hyliacom-orchestrator@hyliacom-orchestrator --scope local
```

`--scope local` lo apunta en `.claude/settings.local.json`, que no se sube: nadie más lo ve ni lo carga. Cada clon lo instala por su cuenta.

Para probarlo desde esta carpeta, sin instalarlo: `claude --plugin-dir <ruta de esta carpeta>`.

Claude Code carga los plugins al arrancar. Después de instalar, abre una sesión nueva: hay que reiniciar el CLI, no basta con `/clear`.

**No lo actives en un proyecto donde ya esté `easyone-orchestrator`:** los dos leen `.orchestrator.json` y su guardia actuaría dos veces.

## Preparar un proyecto

En un proyecto sin `.orchestrator.json` el plugin no hace nada: la guardia está inactiva y la sesión no carga el método. Para empezar, pídeselo a Claude («prepara el orquestador en este proyecto», o `/hyliacom-orchestrator:orchestrate`) y lo hace contigo, paso a paso (skill `orchestrate`, `references/setup.md`):

1. Excluye sus ficheros en `.git/info/exclude`, nunca en el `.gitignore` compartido:

   ```
   /.orchestrator/
   /.orchestrator.json
   ```

2. Lee el proyecto: sus normas, sus comprobaciones (scripts, CI, hooks de git), sus tests y su git (GitHub o Bitbucket, rama por defecto, idioma y formato de los commits).
3. Te propone `.orchestrator.json`. Lo principal:

   | Clave | Qué es |
   |---|---|
   | `storiesDir` | La carpeta de las historias, dentro de `.orchestrator/` |
   | `language` | El idioma de lo que se escribe en el repositorio: commits, PR, README |
   | `norms` | Los documentos que obligan; ningún agente los toca. Sin ella: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` y `CODING_STANDARDS.md` |
   | `adrDir` | Los ADR del proyecto (`docs/adr` por defecto). Una historia puede esperar a uno con `blocked_by: [ADR-0023]` |
   | `git` | `host` (`github` o `bitbucket`), `integrationBranch` (por defecto la rama por defecto del remoto), `productionBranch`, `mergeStrategy` (`squash`), `releaseStrategy`, `requiredApprovals` (0), `allowPush` (`false` para que cada push y cada fusión te pregunten) |
   | `verify` | `all`, las comprobaciones completas al cerrar cada construcción, y los límites del builder: `maxBuilderRuns` (3), `maxSameFailure` (3), `maxFailedChecks` (10), `checkTimeout` (300 s) |
   | `roles` | Las comprobaciones rápidas del builder (`roles.builder.onStop`) y, si hace falta, sus rutas (`paths`). El desarrollo se abre cuando existe |
   | `contextDocs` | Los textos que `stories.mjs --check` vigila para que no nombren rutas ni scripts que ya no existen |
   | `riskTags`, `riskPaths` | El mapa de riesgo (`references/risk-map.md`) |
   | `gates` | Las compuertas, en `observe` por defecto (`references/gates.md`) |

4. Crea la carpeta de historias, con `activities.json` y `stories.config.json`. Este último lleva las personas, las entregas y una fuente de tests por cada runner: `jest-json` (Vitest, Jest), `junit` (PHPUnit, pytest, Playwright…) o `go-json` (`go test -json`).
5. Dibuja contigo el mapa de riesgo, comprueba tu acceso a GitHub o Bitbucket y escribe la primera historia, que sirve de piloto.

## GitHub y Bitbucket

- **GitHub:** necesita `gh` con sesión iniciada (`gh auth login`). Los PR se abren con `gh pr create` y se fusionan con `gh pr merge`.
- **Bitbucket:** no tiene CLI oficial. Necesita un token de API con permisos de PR en tu entorno: `BITBUCKET_USER`, que es el email de tu cuenta Atlassian, y `BITBUCKET_TOKEN`.

El token nunca se escribe en el chat ni en un fichero. Sin acceso sigues trabajando igual: los PR se abren y fusionan desde la web, y Claude te da el título, el cuerpo y la estrategia.

## Contenido

| Ruta | Qué es |
|---|---|
| `agents/builder.md` | El único agente que escribe código: un criterio o una tarea por encargo, en todas las capas que toque |
| `agents/reviewer.md` | La revisión de cada PR: tests, criterios, código y el checklist del proyecto si tiene |
| `agents/auditor.md` | Auditoría por muestreo al cerrar cada entrega, contra las normas del proyecto |
| `agents/researcher.md` | Investigación de solo lectura |
| `skills/orchestrate/` | El día a día de la sesión. Un núcleo corto (`SKILL.md`) y referencias que se leen solo cuando el trabajo las necesita (`references/`): preparar un proyecto, desarrollo, encargos a los agentes, trabajo fuera de las historias, auditoría, mapa de riesgo, compuertas, dónde vive cada cosa, git, y acceso a GitHub y Bitbucket |
| `skills/que-hago/` | En qué punto estás y qué sigue: rama, historias, PR y bitácora. Claude la carga al empezar y cuando preguntas qué te toca |
| `skills/stories/` | Cómo es una historia, sus criterios y sus marcas |
| `scripts/stories.mjs` | El validador de historias y el generador del mapa. El proyecto no guarda copia: la sesión ejecuta el del plugin, y nunca va al pipeline |
| `hooks/guard.mjs` | La guardia |
| `hooks/test-output.mjs` | La lectura de la salida de los tests y los checks (Go, Vitest, Playwright, `node --test`, tsc, Biome): si fallaron y qué falló |
| `tests/` | Los tests de la guardia y de los scripts: `node --test "tests/*.test.mjs"` |

## Requisitos

- Claude Code con soporte de plugins.
- Node.js 20 o posterior en el `PATH`. Lo usan la guardia y el validador. Sin Node la guardia no arranca y no puede avisar, así que lo comprueba Claude al empezar cada sesión y ofrece instalarlo. Mientras falte, no hace commits ni push.
- Git, y `gh` si el proyecto está en GitHub.

## Versiones y actualizaciones

El número de `version` en `.claude-plugin/plugin.json` decide qué recibes: Claude Code te deja en la versión que instalaste hasta que ese número cambia. Un cambio subido sin cambiar la versión no te llega.

- **El número del medio** (`0.1.0` → `0.2.0`) cuando cambia cómo se trabaja.
- **El último** (`0.1.0` → `0.1.1`) cuando solo se arregla algo.

Se actualiza con `claude plugin update hyliacom-orchestrator@hyliacom-orchestrator` y reiniciando Claude Code.

## Relación con easyone-orchestrator

Este repositorio empezó como copia de [`SergioHyliacom/Orquestador`](https://github.com/SergioHyliacom/Orquestador) en su 0.22.0, con todo su historial. Allí sigue `easyone-orchestrator`, que es el que usa EASY One, sin cambios. Lo que se mejore en uno (la guardia, el validador) se puede portar al otro a mano; las partes de EASY One (gg-ez, el repo de diseño de Sydney, sus normas) solo están allí.

Las skills y los agentes van en inglés, como en el original: los lee el modelo. Lo que el plugin escribe en cada proyecto va en el idioma de ese proyecto (`language`).

## Estado

- **Probado:** la guardia (escenarios simulados de cada rol, el cortocircuito del builder, las compuertas, las normas configurables, los merges de GitHub y de Bitbucket), la lectura de la salida de los tests y el validador (resultados de Go, Vitest y JUnit, y ADR en sus formatos habituales), con `node --test "tests/*.test.mjs"`. `claude plugin validate` pasa.
- **Sin probar todavía:** las skills en un proyecto real que no sea EASY One, y el flujo de PR de GitHub de principio a fin. El primer proyecto sirve de piloto.

## Autores

Hyliacom con Claude (Claude Code, Opus 5.5), a partir del Orchestrator de Sydney y Claude. Licencia MIT; ver `LICENSE`.
