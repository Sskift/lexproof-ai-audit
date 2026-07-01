# Development Workflow

This repo uses a **direct-to-main workflow** because it is a compact hackathon MVP with one primary maintainer and a short feedback loop. The rule is not "push anything to main"; the rule is "keep main always runnable, verified, and easy to audit."

Use [docs/constraints-index.md](docs/constraints-index.md) as the quick start for the repository constraint files. Use [docs/project-governance.md](docs/project-governance.md) before implementation to select the workstream, owner layer, verification path, and commit scope. That file is the operating contract that connects the product backlog, architecture boundaries, test discipline, and clean handoff rules.

## Main Branch Rules

- Work directly on `main` for normal MVP changes.
- Keep commits small and purposeful.
- Run verification before every push.
- Push only when `main` is in a working state.
- Never force-push `main` unless explicitly recovering from a bad repository operation.
- Do not commit generated folders such as `node_modules`, `dist`, coverage output, or TypeScript build info.

## Standard Change Loop

```bash
git status -sb
npm install
npm run verify
git add <changed-files>
git commit -m "docs: define project workflow"
git push origin main
```

Use `git status -sb` before editing and before committing. If unrelated local changes appear, leave them alone unless they are part of the current task.

## Verification Gate

Before pushing `main`, run:

```bash
npm run verify
```

Use [docs/engineering-workflow.md](docs/engineering-workflow.md) to choose targeted tests before the full gate, decide when screenshots are required, and keep commits scoped.

That command runs:

```bash
npm test
npm run build
```

For UI-facing changes, also run the app locally and click through the affected tabs:

```bash
npm run dev
```

Minimum manual smoke check:

- Page loads at `http://127.0.0.1:5173/`.
- `Risk Audit`, `Evidence Ledger`, `Counsel Pack`, and `Sources` tabs render.
- Evidence Ledger shows `Evidence bundle SHA-256`.
- Browser console has no runtime errors.

## When to Use a Branch

Use a temporary branch only when the change is risky or likely to take multiple sessions:

- replacing the audit scoring model
- introducing backend services
- adding real wallet or chain writes
- changing package manager or build tooling
- large UI rewrites

Branch naming:

```bash
git switch -c spike/<short-topic>
```

Merge back to `main` only after `npm run verify` passes.

## Commit Style

Use terse conventional-style messages:

- `feat: add evidence export`
- `fix: avoid no-custody false positive`
- `docs: define project workflow`
- `test: cover counsel memo source pack`
- `chore: update dependencies`

## Release and Submission Flow

For a DoraHacks update:

1. Run `npm run verify`.
2. Confirm README, research docs, and demo flow match the current app.
3. Push `main`.
4. Use the GitHub repo URL in the DoraHacks BUIDL submission.
5. Record a short demo video from the latest pushed state.

## Recovery Rules

- If a push breaks the app, fix forward on `main` with a small commit.
- If credentials, private keys, or personal data are committed, stop normal work and rotate/remove the secret before continuing.
- If the local tree is confusing, inspect with `git status -sb`, `git log --oneline --decorate -5`, and `git diff`; do not run destructive reset commands without a clear reason.
