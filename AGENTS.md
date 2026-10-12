# Portfolio service agent guide

This guide is sufficient for Portfolio-owned work. This repository owns runtime,
UI, Portfolio-owned data, tests, its image, and GitHub Actions workflows.

## Use owning sources

Use the current user instruction first, then live state and refreshed plans,
runtime/tests/workflows, Terraform source, and finally wiki prose.

- Runtime, UI, and routes: `src/`
- Portfolio-owned persistence: owning code and migrations, never Admin career migrations
- Commands: `package.json`
- Verification/release: `.github/workflows/ci.yml` and `promote.yml`
- Source navigation: `wiki/Home.md` and `wiki/Sources.md`

Canonical career data is read-only. Portfolio must not update or delete it; full
career CRUD and transfer ownership belong to Admin. Portfolio may append its
explicitly owned GitHub timeline data. Preserve production availability and all
Portfolio production data.

## Use parent context only when needed

When embedded in the workspace, read `../../AGENTS.md`, `../../wiki/Home.md`,
`../../CI_CD.md`, `../../infra/terraform/services/portfolio/`, and
`../../infra/terraform/` before changing infrastructure, identity, providers,
data/storage, analytics, or secret consumers. Edit parent files only when scoped
and coordinated. Use source-map remote links otherwise.

GitHub Actions owns build, test, scan, and release. Parent Terraform owns durable
infrastructure. Do not introduce Cloud Build or use Terraform as a release runner.
Keep staging structurally equivalent to production with isolated state/data.

Owner-controlled main pushes and promotion use the separate Mac registration
restricted to Portfolio's exact main workflows; every pull-request verification
stays isolated on GitHub-hosted x64
runners and receives no private runner storage or publication authority. The publisher receives
the exact scanned Docker image ID from verification, checks its OCI revision and
runtime release SHA, and publishes only that image. Do not reintroduce hosted
image-tar artifacts or QEMU; Apple Rosetta is the reviewed amd64 build handler.
Missing or changed local images fail closed. A multi-runner handoff requires a
separately reviewed private transport.
Publication independently reads the exact registry manifest and configuration,
binding the reviewed Docker29 scanned-image descriptor to its immutable digest,
OCI source and runtime SHA without downloading a second complete image. A missing
descriptor or a different engine image-ID model fails closed.

## Apply platform guardrails

Do not add brokered application messaging, split command/read models, event
sourcing, application Pub/Sub, Cloudflare Workers, global platform
skills/profiles/prompts, wrapper CLIs, or parallel catalogs. Never expose
secrets, visitor identifiers, session data, or private activity.

Report metered-change estimates. Email and wait only above `$3/month`, when
replacing a technology selected in the active goal, or when introducing an
undisclosed technology. Destructive, public, sensitive-data, and data-loss gates
remain separate.

For subagents, send objective/done condition, sources, exclusive scope, caveats,
dependencies, unknowns, mutation limits, checks, and return fields up front.
Do not create a custom A2A protocol.

## Verify and reconcile context

Run applicable package, backend/client, image, browser, activity-provider,
authorization, and canonical-host checks. Before completion, reconcile this file
and `wiki/Sources.md`, delete task-created contradictions, validate links, and add
no inventories or history. End the handoff with a `Context reconciliation:`
line; the project-local Codex `Stop` hook prompts one reconciliation pass if it
is missing.
