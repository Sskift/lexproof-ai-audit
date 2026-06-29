# Architecture

LexProof AuditOS is a Vite React single-page application. The app is intentionally local-first: all demo data, scoring, hashing, and memo generation happen in the browser with pure TypeScript logic.

## Top-Level Shape

```text
lexproof-ai-audit/
  src/
    App.tsx                  # React workbench shell and tab views
    styles.css               # Responsive UI styling
    main.tsx                 # React entry point
    data/
      sampleProfiles.ts      # Seed legal/compliance audit scenarios
    lib/
      auditEngine.ts         # Pure audit engine and memo/hash helpers
      auditEngine.test.ts    # Domain tests
    App.test.tsx             # UI smoke test
  docs/
    research.md              # Hackathon and audit research notes
  README.md                  # Product and submission overview
  WORKFLOW.md                # Direct-to-main development process
  CONTRIBUTING.md            # Project guardrails
```

## Data Flow

```text
sampleProfiles
  -> selected profile in App state
  -> operator note appended as evidence
  -> analyzeAuditProfile()
  -> createEvidenceHash()
  -> buildCounselMemo()
  -> tabbed UI surfaces
```

The UI does not own legal scoring rules. It renders output from `auditEngine.ts`.

## Core Modules

### `src/lib/auditEngine.ts`

Owns the domain behavior:

- `analyzeAuditProfile(profile)` returns weighted flags, risk score, risk level, remediation items, and source references.
- `createEvidenceHash(items)` returns a deterministic SHA-256 hash for the current evidence bundle.
- `buildCounselMemo(profile, audit, hash)` returns copy-ready Markdown for counsel/compliance review.
- `createSubmissionFit()` describes how the MVP maps to BLI Legal Tech Hackathon 2.

Keep this file deterministic and side-effect-light. New scoring rules should be covered by tests before they are used by the UI.

### `src/data/sampleProfiles.ts`

Owns seeded demo scenarios. Each scenario should represent a realistic legal/compliance posture:

- high-risk tokenized yield/custody case
- DAO governance or contract workflow case
- lower-risk legal education/reference case

Do not put scoring logic in this file.

### `src/App.tsx`

Owns UI state and composition:

- selected scenario
- active tab
- operator note
- async evidence hash state

The component calls the audit engine and renders five surfaces: Intake, Risk Audit, Evidence Ledger, Counsel Pack, and Sources.

### `src/styles.css`

Owns global and component-level styling. The UI should remain dense, functional, and judge-demo friendly. Avoid decorative layouts that hide the product workflow.

## Testing Strategy

Domain tests live next to the audit engine and cover:

- critical risk classification
- low-risk no-custody classification
- stable evidence hashing
- hash changes when evidence changes
- counsel memo content
- hackathon submission fit

UI tests cover:

- the main workbench shell
- BLI hackathon targeting
- required tabs
- Evidence Ledger tab interaction
- evidence hash visibility

## Extension Points

Good next additions:

- export Counsel Pack as Markdown
- import custom JSON profiles
- add richer jurisdiction checklists
- add source citation controls per flag
- add optional on-chain anchoring only after privacy and wallet boundaries are documented

Avoid adding real legal conclusions, real wallet signing, or third-party data upload until the non-advice and data-handling boundaries are explicit.
