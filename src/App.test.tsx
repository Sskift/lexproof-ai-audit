import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage?.removeItem?.("lexproof.currentProject.v1");
    window.localStorage?.removeItem?.("lexproof.modelSettings.v1");
    window.localStorage?.removeItem?.("lexproof.modelReviewRuns.v1");
  });

  it("renders the BLI-focused legal audit workbench with submission-critical surfaces", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /LexProof AuditOS/i })).toBeInTheDocument();
    expect(screen.getAllByText(/BLI Legal Tech Hackathon 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Risk Audit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI Review/i).length).toBeGreaterThan(0);
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
    expect(await screen.findByText(/RWA disclosure assumptions memo/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Launch memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Token terms, user eligibility, custody assumptions, and approval status" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Launch memo")).toBeInTheDocument();
    expect(screen.getByText(/Manifest bundle SHA-256/i)).toBeInTheDocument();
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

  it("runs AI Review with mock model settings and exposes missing evidence", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));

    expect(screen.getByText(/Redaction Gate/i)).toBeInTheDocument();
    expect(screen.getByText(/Review model payload/i)).toBeInTheDocument();
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
  });

  it("shows jurisdiction-specific audit preparation checklist items", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Jurisdiction Checklist/i }));

    expect(screen.getByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    expect(screen.getByText(/US offering and asset classification review/i)).toBeInTheDocument();
    expect(screen.getByText(/EU crypto-asset disclosure readiness review/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
  });

  it("shows a Manifest JSON download action in the Counsel Pack", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(await screen.findByRole("button", { name: /Download Manifest JSON/i })).toBeInTheDocument();
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
