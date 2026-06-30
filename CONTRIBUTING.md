# Contributing Guardrails

This is a hackathon MVP, so the codebase should stay easy to inspect, demo, and submit. Prefer clear product behavior over broad infrastructure.

## Product Guardrails

- Always preserve the non-advice boundary. The app creates audit preparation materials, not legal advice.
- Show source lineage for legal/compliance claims.
- Do not claim a real on-chain proof unless a real transaction or verifiable artifact exists.
- Do not store private keys, API keys, personal data, or real KYC data in the repo.
- Keep demo data realistic but synthetic.

## Engineering Guardrails

- Start feature, backend, UI, test, and documentation work from [docs/project-governance.md](docs/project-governance.md) so scope, ownership, verification, and handoff stay aligned.
- Put domain rules in `src/lib/auditEngine.ts`.
- Put seeded demo profiles in `src/data/sampleProfiles.ts`.
- Keep React components focused on presentation and interaction state.
- Add or update tests for scoring, hashing, memo generation, or user-visible workflow changes.
- Use TypeScript types rather than ad hoc object shapes.
- Keep generated assets out of Git.
- For new feature placement, follow [docs/architecture-guardrails.md](docs/architecture-guardrails.md).
- For backlog direction and non-goals, follow [docs/work-universe.md](docs/work-universe.md).
- For test selection, screenshots, and repository cleanliness, follow [docs/engineering-workflow.md](docs/engineering-workflow.md).

## Direct-to-Main Policy

Direct commits to `main` are allowed when all of the following are true:

- the change is scoped and understandable
- `npm run verify` passes
- no unrelated files are staged
- generated files are ignored
- the pushed state is demo-ready
- the work maps to one authority path in [docs/project-governance.md](docs/project-governance.md)

Use a branch for risky or multi-session work. See [WORKFLOW.md](WORKFLOW.md).

## Definition of Done

A change is done when:

- tests pass
- production build passes
- README or docs are updated when behavior changes
- the app still communicates the BLI hackathon fit clearly
- `git status -sb` is clean after commit and push

## Review Checklist

Before pushing:

- Does this improve the BLI Legal Tech Hackathon submission?
- Can a judge understand the feature in under one minute?
- Is the output clearly marked as audit prep rather than legal advice?
- Are evidence hashes deterministic?
- Are source links and assumptions visible?
- Did `npm run verify` pass?
