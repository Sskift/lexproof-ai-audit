# BLI Legal Audit MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete LexProof AuditOS MVP for BLI Legal Tech Hackathon 2.

**Architecture:** A Vite React SPA uses a pure TypeScript audit engine for risk scoring, evidence hashing, counsel memo generation, and hackathon fit metadata. The UI renders local demo scenarios through tabbed workbench surfaces.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Lucide React.

---

### Task 1: Project Skeleton and Audit Engine Tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/lib/auditEngine.test.ts`

- [x] Write failing tests for risk classification, evidence hash stability, memo output, and submission fit.
- [x] Run `npm test` and verify failure caused by missing `src/lib/auditEngine.ts`.

### Task 2: Audit Engine

**Files:**
- Create: `src/lib/auditEngine.ts`

- [x] Implement `analyzeAuditProfile`, `createEvidenceHash`, `buildCounselMemo`, and `createSubmissionFit`.
- [x] Run `npm test` and fix false positives around "No custody" and public education material.
- [x] Verify all audit engine tests pass.

### Task 3: UI Test and Workbench

**Files:**
- Create: `src/App.test.tsx`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/data/sampleProfiles.ts`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [x] Write failing UI test for the workbench shell and evidence hash surface.
- [x] Implement the tabbed React app with Intake, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.
- [x] Run `npm test -- src/App.test.tsx` and verify the UI test passes.

### Task 4: Documentation and Submission Pack

**Files:**
- Create: `README.md`
- Create: `docs/research.md`
- Create: `docs/superpowers/specs/2026-06-29-bli-legal-audit-design.md`
- Create: `docs/superpowers/plans/2026-06-29-bli-legal-audit-mvp.md`

- [x] Document hackathon selection rationale, source links, MVP features, setup, and submission assets.
- [x] Document the local design and implementation plan.

### Task 5: Verification and Publish

**Files:**
- Modify as needed based on verification output.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Start the local dev server and visually inspect the app.
- [x] Initialize Git, commit the project, create a GitHub repository, and push.
