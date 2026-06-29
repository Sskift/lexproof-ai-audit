import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage?.removeItem?.("lexproof.currentProject.v1");
    window.localStorage?.removeItem?.("lexproof.modelSettings.v1");
    window.localStorage?.removeItem?.("lexproof.modelReviewRuns.v1");
    window.localStorage?.removeItem?.("lexproof.modelIntakeProfile.v1");
    window.localStorage?.removeItem?.("lexproof.modelIntakeEvents.v1");
    window.localStorage?.removeItem?.("lexproof.counselQuestions.v1");
    window.localStorage?.removeItem?.("lexproof.counselReviews.v1");
    window.localStorage?.removeItem?.("lexproof.evidenceAuditTrail.v1");
  });

  it("renders the BLI-focused legal audit workbench with submission-critical surfaces", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /LexProof AuditOS/i })).toBeInTheDocument();
    expect(screen.getAllByText(/BLI Legal Tech Hackathon 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Risk Audit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI Review/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Model Intake/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Jurisdiction Checklist/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Evidence Ledger/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Counsel Pack/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    expect(await screen.findByText(/Evidence bundle SHA-256/i)).toBeInTheDocument();
  });

  it("creates a custom project, updates the risk audit, and displays editable evidence in the ledger", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Audit Desk Zero" } });
    fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Delaware C-corp issuer" } });
    fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States" } });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized yield note" } });
    fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Retail users" } });
    fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
    fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "No raw KYC; policy metadata only" } });
    fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "AI flags missing approvals" } });
    fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "Simulated evidence anchor" } });
    fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Planned public launch" } });
    fireEvent.click(screen.getByRole("button", { name: /Save workspace/i }));

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));
    expect(await screen.findByText(/Yield-bearing or investment-like asset/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Why this flag triggered/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Asset model: Tokenized yield note/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    expect(screen.getByText(/Evidence Templates/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Apply tokenized yield \/ RWA template/i }));
    expect((await screen.findAllByText(/RWA disclosure assumptions memo/i)).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Launch memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Token terms, user eligibility, custody assumptions, and approval status" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Launch memo")).toBeInTheDocument();
    expect(screen.getByText(/Manifest bundle SHA-256/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Evidence Audit Trail/i })).toBeInTheDocument();
    expect(screen.getByText(/created Launch memo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Evidence Trail JSON/i })).toBeInTheDocument();
  });

  it("keeps long evidence records editable with visible mobile-friendly field labels", async () => {
    render(<App />);

    const longSource =
      "Synthetic review source: https://example.com/policies/tokenized-private-credit-launch-review-with-very-long-slug-and-version-history";
    const longContent =
      "Synthetic artifact summary with token terms, investor eligibility assumptions, wallet control escalation steps, disclosure review owner, marketing approval notes, and a very long reference id LP-2026-LEGAL-COMPLIANCE-READINESS-0000000000001.";

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Long launch review evidence" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Policy memorandum with long metadata" } });
    fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: longSource } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), { target: { value: longContent } });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Long launch review evidence")).toBeInTheDocument();
    expect(screen.getByText("Evidence 01 source")).toBeInTheDocument();
    expect(screen.getByText("Evidence 01 content")).toBeInTheDocument();
    expect(screen.getByDisplayValue(longSource)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Owner for evidence 1/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Status for evidence 1/i), { target: { value: "verified" } });

    expect(screen.getByLabelText(/Owner for evidence 1/i)).toHaveValue("Compliance");
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("verified");
  });

  it("adds a local file as hashed evidence metadata without showing raw file content", async () => {
    render(<App />);

    const file = new File(["Confidential launch memo body"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: Date.UTC(2026, 5, 29, 8, 0, 0)
    });

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Local evidence file/i), { target: { files: [file] } });

    expect(await screen.findByText("launch-approval.pdf")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Local file metadata")).toBeInTheDocument();
    expect(screen.getByDisplayValue("local file: launch-approval.pdf")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/File SHA-256:/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/Confidential launch memo body/i)).not.toBeInTheDocument();
  });

  it("shows per-risk evidence workflow coverage and updates it from ledger evidence", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Coverage Desk" } });
    fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
    fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States" } });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
    fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Accredited investors" } });
    fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
    fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "Policy metadata only" } });
    fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "No model decisions" } });
    fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "No chain writes" } });
    fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Private beta" } });

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(await screen.findAllByText(/Evidence workflow/i)).not.toHaveLength(0);
    expect(screen.getByText("Signer control policy")).toBeInTheDocument();
    expect(screen.getAllByText(/0\/2 covered/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Signer control note" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: "Synthetic signer control policy" } });
    fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "received" } });
    fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Multisig signer approval matrix for wallet control and withdrawal authority." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(await screen.findByText(/1\/2 covered/i)).toBeInTheDocument();
    expect(screen.getByText(/covered by Signer control note/i)).toBeInTheDocument();
  });

  it("requests missing risk evidence into the Evidence Ledger as an in-progress item", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Missing Evidence Desk" } });
    fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
    fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States" } });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
    fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Accredited investors" } });
    fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
    fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "Policy metadata only" } });
    fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "No model decisions" } });
    fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "No chain writes" } });
    fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Private beta" } });

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Request evidence: Signer control policy/i }));

    expect((await screen.findAllByText(/in progress from Signer control policy/i)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    expect(await screen.findByText("Signer control policy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Evidence request")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("requested");
    expect(screen.getByDisplayValue("risk evidence requirement: signer-control")).toBeInTheDocument();
  });

  it("runs AI Review with mock model settings and exposes missing evidence", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));

    expect(await screen.findByRole("heading", { name: /Redaction Gate/i })).toBeInTheDocument();
    expect(screen.getByText(/Review model payload/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Model Access Workflow/i })).toBeInTheDocument();
    expect(screen.getByText(/Demo mock reviewer/i)).toBeInTheDocument();
    expect(screen.getByText(/Run AI Review to create draft audit-prep output/i)).toBeInTheDocument();
    expect(screen.getByText(/Model Connection Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock local reviewer ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs review/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Run AI Review/i }));

    expect(await screen.findByText(/AI-assisted draft/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing Evidence Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Signer control policy/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Review Run Ledger/i)).toBeInTheDocument();
    expect(await screen.findByText(/Payload SHA-256/i)).toBeInTheDocument();
    expect(screen.getByText(/Response SHA-256/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Mock local reviewer/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Model Intake/i }));

    expect(await screen.findByText(/AI Review run/i)).toBeInTheDocument();
    expect(screen.getByText(/evidence summaries/i)).toBeInTheDocument();
    expect(screen.getByText(/payload SHA-256/i)).toBeInTheDocument();
    expect(screen.getByText(/response SHA-256/i)).toBeInTheDocument();
    expect(screen.getByText(/Event SHA-256/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Review status for AI event 1/i), { target: { value: "reviewed" } });
    fireEvent.change(screen.getByLabelText(/Reviewer for AI event 1/i), { target: { value: "Outside counsel" } });

    expect(await screen.findByText(/ready/i)).toBeInTheDocument();
    expect(screen.getByText(/1 events · 0 unresolved/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Outside counsel")).toBeInTheDocument();
  });

  it("registers a model connection profile and AI event intake record with a hash", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Model Intake/i }));

    expect(screen.getByRole("heading", { name: /Model Intake/i })).toBeInTheDocument();
    expect(screen.getByText(/AI events are audit-prep records/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Provider name/i), { target: { value: "OpenAI-compatible gateway" } });
    fireEvent.change(screen.getByLabelText(/Intake model name/i), { target: { value: "gpt-audit-review" } });
    fireEvent.change(screen.getByLabelText(/Model use case/i), {
      target: { value: "Evidence extraction and draft counsel questions" }
    });
    fireEvent.change(screen.getByLabelText(/Human review owner/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Allowed data classes/i), {
      target: { value: "evidence summaries, policy metadata" }
    });

    fireEvent.change(screen.getByLabelText(/AI event type/i), { target: { value: "Evidence review" } });
    fireEvent.change(screen.getByLabelText(/Event input summary/i), {
      target: { value: "Review token terms and custody policy summary" }
    });
    fireEvent.change(screen.getByLabelText(/Event output summary/i), {
      target: { value: "Drafted missing evidence question for wallet authority" }
    });
    fireEvent.change(screen.getByLabelText(/Model action/i), { target: { value: "Generated draft audit-prep questions" } });
    fireEvent.change(screen.getByLabelText(/Event human reviewer/i), { target: { value: "Compliance" } });
    fireEvent.click(screen.getByRole("button", { name: /Add AI event/i }));

    expect(await screen.findByText(/Evidence review/i)).toBeInTheDocument();
    expect(screen.getAllByText(/needs-review/i).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Resolve AI event review items before external reliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Event SHA-256/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Download Model Intake JSON/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(await screen.findByText(/## Model Intake Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider: OpenAI-compatible gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Event SHA-256/i)).toBeInTheDocument();
  });

  it("adds AI draft counsel questions to an editable Counsel Pack queue", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run AI Review/i }));

    expect(await screen.findByText(/Which artifacts can be shared with counsel/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(screen.getByRole("heading", { name: /Counsel Questions/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Which artifacts can be shared with counsel/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Question 01 text/i), {
      target: { value: "Edited counsel question about AI evidence sharing?" }
    });
    fireEvent.change(screen.getByLabelText(/Question 01 status/i), { target: { value: "answered" } });

    expect(screen.getByDisplayValue("Edited counsel question about AI evidence sharing?")).toBeInTheDocument();
    expect(await screen.findByText(/P1 answered \[ai-review\] Edited counsel question about AI evidence sharing\?/i)).toBeInTheDocument();
  });

  it("updates counsel review status for a risk item in the Counsel Pack", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(screen.getByRole("heading", { name: /Counsel Review Status/i })).toBeInTheDocument();
    expect(screen.getByText(/Yield-bearing or investment-like asset/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Status for review 1/i), { target: { value: "reviewed" } });
    fireEvent.change(screen.getByLabelText(/Reviewer for review 1/i), { target: { value: "Outside counsel" } });
    fireEvent.change(screen.getByLabelText(/Review note 1/i), {
      target: { value: "Reviewed offering and disclosure assumptions with counsel." }
    });

    expect(screen.getByLabelText(/Status for review 1/i)).toHaveValue("reviewed");
    expect(screen.getByDisplayValue("Outside counsel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Reviewed offering and disclosure assumptions with counsel.")).toBeInTheDocument();
    expect(await screen.findByText(/P0 reviewed \[asset-yield\] Yield-bearing or investment-like asset/i)).toBeInTheDocument();
  });

  it("shows jurisdiction-specific audit preparation checklist items", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Jurisdiction Checklist/i }));

    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    expect(await screen.findByText(/US offering and asset classification review/i)).toBeInTheDocument();
    expect(screen.getByText(/EU crypto-asset disclosure readiness review/i)).toBeInTheDocument();
    expect(screen.getByText(/Jurisdiction Packs/i)).toBeInTheDocument();
    expect(screen.getByText(/Policy controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Local counsel routing/i)).toBeInTheDocument();
    expect(screen.getByText(/Offering and disclosure control/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
  });

  it("routes Singapore, Switzerland, and UAE jurisdiction packs from custom project jurisdictions", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Global model audit desk" } });
    fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
    fireEvent.change(screen.getByLabelText(/Jurisdictions/i), {
      target: { value: "Singapore, Switzerland, United Arab Emirates" }
    });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
    fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Retail users" } });
    fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
    fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "KYC policy metadata only" } });
    fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "AI drafts missing-evidence questions" } });
    fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "Simulated evidence anchor" } });
    fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Planned public launch" } });
    fireEvent.click(screen.getByRole("button", { name: /Jurisdiction Checklist/i }));

    expect(await screen.findByText(/Singapore fintech \/ digital asset counsel/i)).toBeInTheDocument();
    expect(screen.getByText(/Swiss DLT \/ financial services counsel/i)).toBeInTheDocument();
    expect(screen.getByText(/UAE virtual-assets \/ financial regulatory counsel/i)).toBeInTheDocument();
    expect(screen.getByText(/Product scope and launch-intake control/i)).toBeInTheDocument();
    expect(screen.getByText(/Token classification and prospectus-intake control/i)).toBeInTheDocument();
    expect(screen.getByText(/Virtual asset activity scope control/i)).toBeInTheDocument();
  });

  it("shows a Manifest JSON download action in the Counsel Pack", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(await screen.findByRole("button", { name: /Download Manifest JSON/i })).toBeInTheDocument();
  });

  it("exposes a Counsel Pack print action for browser Save as PDF", async () => {
    const originalOpen = window.open;
    const print = vi.fn();
    window.open = vi.fn(() => {
      return {
        document: {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn()
        },
        focus: vi.fn(),
        print
      } as unknown as Window;
    });

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
      fireEvent.click(await screen.findByRole("button", { name: /Print \/ Save PDF/i }));

      expect(window.open).toHaveBeenCalledTimes(1);
      expect(print).toHaveBeenCalledTimes(1);
    } finally {
      window.open = originalOpen;
    }
  });

  it("creates a simulated anchor receipt from the Counsel Pack without real chain write claims", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Create Simulated Anchor Receipt/i }));

    expect(await screen.findByText(/Simulated Anchor Receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/not a real on-chain write/i)).toBeInTheDocument();
    expect(screen.getByText(/not-submitted/i)).toBeInTheDocument();
  });
});
