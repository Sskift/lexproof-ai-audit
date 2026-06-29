# LexProof AuditOS Demo Script

This script is for a short BLI Legal Tech Hackathon 2 walkthrough. Keep the narration clear that LexProof creates audit preparation materials, not legal advice.

## 1. Product Position

LexProof AuditOS helps Web3 teams turn scattered launch facts, evidence notes, model-assisted issue spotting, and deterministic hashes into a counsel-ready review packet.

The product is not an AI judge, a law firm, a KYC provider, or a real chain-writing service.

## 2. Walkthrough

1. Start on **Project Workspace** and load `YieldPassport`.
2. Open **Audit Wizard** and show the handoff boundary: project facts, AI/data/chain boundaries, and review gate.
3. Open **AI Review** and show **Model Settings**:
   - mock provider for demo
   - OpenAI-compatible provider for user-supplied endpoint/model/API key
   - API key is local browser state and not persisted
4. Show the **Redaction Gate**:
   - evidence summaries are previewed before model calls
   - KYC/personal-data references are marked for review
   - private-key-like material blocks model calls
5. Run the mock AI Review and show extracted facts, missing evidence, draft counsel questions, and remediation suggestions.
6. Open **Jurisdiction Checklist** and show US/EU checklist cards as preparation prompts, not legal conclusions.
7. Open **Risk Audit** and show deterministic flags, score, and remediation queue.
8. Open **Evidence Ledger**, add one synthetic evidence item, and show the manifest bundle SHA-256 update.
9. Open **Counsel Pack**, download Markdown, download Manifest JSON, and create the **Simulated Anchor Receipt**.

## 3. Closing Message

LexProof's trust layer is not the model. The trust layer is the structured workspace, deterministic audit engine, source references, editable evidence ledger, manifest hash, redaction gate, and human counsel handoff.

Every output remains audit preparation material. Not legal advice.
