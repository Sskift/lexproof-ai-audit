# LexProof Implementation Handover

Last updated: 2026-07-10

This document hands over the current implementation state for the ongoing work in `docs/plan.md`. The plan is not complete. The active direction remains W1 / P1: deepen one source-backed jurisdiction control path at a time while preserving metadata-only evidence, source lineage, local-counsel routing, privacy boundaries, and the `Not legal advice` boundary.

## Repository State

- Working branch: `lexproof-ai-audit-ph-24faa`.
- Upstream baseline: `origin/main` at `753d6c6` when this handover was written.
- The branch was 99 commits ahead of `origin/main` after the Swiss implementation commit and is expected to be 100 commits ahead after this handover commit.
- No push was performed as part of this handover.
- Latest implementation commit: `108e4cf Require source-backed Swiss FINMA evidence`.
- The worktree was clean immediately after `108e4cf`; this document is the only intended change in the following documentation commit.

Run these commands before continuing because the upstream and worktree may have changed:

```bash
git status -sb
git log --oneline --decorate -5
```

## Verified Baseline

The Swiss FINMA slice completed the normal verification ladder:

```bash
npm test -- src/lib/jurisdictionPacks.test.ts
npm test -- src/lib/evidenceTemplates.test.ts
npm run demo:smoke -- --skip-api
npm run verify
```

Results at `108e4cf`:

- Jurisdiction pack tests: 55 passed.
- Evidence template tests: 6 passed.
- Demo smoke: passed and reported 154 registered screenshots.
- Full gate: 131 test files and 1033 tests passed.
- TypeScript, server build, Prisma client generation, and Vite production build passed.

The full suite may emit existing React `act(...)` warnings and the existing Vite large-chunk warning. Treat the command exit code and final test/build summaries as authoritative; do not ignore new failures.

## Work Completed In This Run

The current W1 sequence hardened source matching so a verified memo containing plausible compliance language cannot make a control evidence-ready unless it also carries the reviewed regulatory source identifier. Each slice added or retained a negative source-free evidence case, kept evidence metadata-only, updated README behavior, ran targeted tests and the full gate, and was committed separately.

The source-backed series currently spans these reviewed paths:

- United States: SEC/CFTC classification, Regulation D eligibility, FTC advertising, OFAC sanctions, FinCEN transfer controls, GENIUS stablecoin, and NYDFS custody.
- European Union and United Kingdom: MiCA custody, DORA, TFR, DLT Pilot, MiCA stablecoin, UK stablecoin, and UK cryptoasset AML.
- Asia-Pacific: Singapore DPT, Hong Kong VATP/stablecoin/tokenised products, Japan custody, Canada custody, Australia digital assets, Korea VASP, India VDA, Thailand custody, Indonesia OJK, Malaysia digital assets, and Philippines VASP.
- Africa and Europe: South Africa CASP, Germany MiCAR, and Switzerland FINMA.

Use this command for the exact commit list:

```bash
git log --oneline --grep='Require source-backed'
```

The final Swiss slice changed:

- `src/lib/jurisdictionPacks.ts`: token classification, stablecoin issuer/guarantee, and stablecoin AML/sanctions controls now use `source-and-keyword` matching.
- `src/lib/jurisdictionPacks.test.ts`: a verified source-free FINMA memo proves semantic text alone does not unlock controls; source-backed records only unlock the controls whose semantic evidence they actually support.
- `README.md`: documents the source-plus-semantic readiness rule and the prohibited raw-data classes.

## Recommended Next Slice

Continue with UAE VARA operating and marketing controls in `src/lib/jurisdictionPacks.ts` and the dedicated tests near the UAE cases in `src/lib/jurisdictionPacks.test.ts`.

Current review points:

1. `uae-virtual-asset-scope-control` does not yet declare `sourceMatchMode: "source-and-keyword"`.
2. `uae-marketing-custody-access-control` does not yet declare `sourceMatchMode: "source-and-keyword"`.
3. The aggregate `uae-vara-2024-marketing-regulations-control` also lacks the mode, while its approval/audience and KOL/recordkeeping child controls already require source-plus-keyword evidence.
4. The operating scenario must remain isolated from marketing-only evidence unless marketing trigger facts are present.

Add a verified source-free UAE memo containing broad activity-scope, licensing, custody, AML/CFT, marketing approval, KOL, incentive, and recordkeeping language. It must leave the relevant controls at `needs-evidence`. Then prove that reviewed records carrying the correct VARA source identifiers unlock only the semantically matching controls.

Be careful with shared evidence templates such as `Custody and signer control runbook` and `Wallet sanctions screening and escalation controls`. Do not let the source identifier itself act as the only semantic match. Keep the existing operating-versus-marketing separation assertions.

Expected files for the slice:

```text
README.md
src/lib/jurisdictionPacks.ts
src/lib/jurisdictionPacks.test.ts
```

## Slice Contract

For each continuation slice:

- Workstream and priority: W1 / P1.
- User journey: project facts -> jurisdiction pack -> source-backed evidence readiness -> local-counsel handoff.
- Output boundary: audit-preparation routing only; never produce a legal conclusion or launch approval.
- Privacy boundary: no raw KYC, customer records, credentials, wallet secrets, private cryptographic material, personal data, or raw evidence bytes.
- Matching boundary: verified status is necessary but not sufficient; require both the reviewed source identifier and relevant semantic evidence.
- Scope: one reviewed jurisdiction/source/control/template path per commit.

Use this verification order:

```bash
npm test -- src/lib/jurisdictionPacks.test.ts
git diff --check
npm test -- src/lib/evidenceTemplates.test.ts
npm run demo:smoke -- --skip-api
npm run verify
git status --short
git diff --stat
```

Inspect the complete diff, stage only the scoped files, and commit only after all gates pass. A completed slice leaves the worktree clean. Do not mark `docs/plan.md` complete while other planned workstreams and source-backed paths remain open.

## Authority Files

- `docs/plan.md`: backlog direction, workstreams, priorities, and done rule.
- `docs/engineering-workflow.md`: targeted verification, full gate, staging, and cleanliness rules.
- `docs/project-governance.md`: authority order, intake contract, product boundaries, and handoff rules.
- `docs/architecture-guardrails.md` and `ARCHITECTURE.md`: module placement and dependency boundaries.
- `README.md`: current user-visible behavior and demo instructions.
