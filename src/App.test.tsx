import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    window.localStorage?.removeItem?.("lexproof.humanReviewDecisions.v1");
    window.localStorage?.removeItem?.("lexproof.counselPackVersions.v1");
    window.localStorage?.removeItem?.("lexproof.counselPackServerExports.v1");
  });

  it("renders the BLI-focused legal audit workbench with submission-critical surfaces", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /LexProof AuditOS/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Regulatory Command Center/i })).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Source Review Ledger/i })).toBeInTheDocument();
    expect(
      screen.getAllByText(/Not legal advice. Source review metadata is audit preparation lineage only./i).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Reviewed sources/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Regulation \(EU\) 2023\/1114, Title II/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Evidence gap queue/i)).toBeInTheDocument();
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

  it("loads a judge-ready demo scenario from the seeded scenario library", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Demo Scenario Library/i })).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Demo scenarios are synthetic audit preparation paths only./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /High-risk RWA launch/i })).toBeInTheDocument();
    expect(screen.getAllByText(/GRC Ticket Export/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Start High-risk RWA launch/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("YieldPassport");
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));
    expect(await screen.findByText(/Yield-bearing or investment-like asset/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /GRC Ticket Export/i })).toBeInTheDocument();
  });

  it("shows the Security Review Checklist and updates model and evidence gates from workflow state", async () => {
    render(<App />);

    const securityHeading = await screen.findByRole("heading", { name: /Security Review Checklist/i });
    const securityPanel = securityHeading.closest("section");

    expect(securityPanel).not.toBeNull();
    const security = within(securityPanel as HTMLElement);
    expect(security.getByText(/Not legal advice. Security review checklist output is audit preparation metadata only./i)).toBeInTheDocument();
    expect(security.getByText(/Model provider blocked/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await security.findByText(/Model provider ready/i)).toBeInTheDocument();
    expect(security.getByText(/Mock local reviewer/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe security packet" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await security.findByText(/Evidence storage blocked/i)).toBeInTheDocument();
    expect(security.getAllByText(/Remove blocked materials before Evidence Vault sync or export handoff./i).length).toBeGreaterThan(0);
    expect(security.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(security.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  });

  it("shows Integration Readiness Registry adapter states and blocked recovery without leaking unsafe evidence", async () => {
    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registryPanel = registryHeading.closest("section");

    expect(registryPanel).not.toBeNull();
    const registry = within(registryPanel as HTMLElement);
    expect(registry.getByText(/Not legal advice. Integration readiness output is audit preparation metadata only./i)).toBeInTheDocument();
    expect(registry.getByText(/Server model provider blocked/i)).toBeInTheDocument();
    expect(registry.getByText(/Object storage vault needs policy/i)).toBeInTheDocument();
    expect(registry.getByText(/GRC ticket export ready/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await registry.findByText(/Server model provider disabled/i)).toBeInTheDocument();
    expect(registry.getByText(/Local mock route is ready; the real server provider remains disabled by default./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe adapter packet" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await registry.findByText(/Object storage vault blocked/i)).toBeInTheDocument();
    expect(registry.getByText(/Document parser \/ OCR blocked/i)).toBeInTheDocument();
    expect(registry.getAllByText(/Remove blocked materials before enabling this adapter./i).length).toBeGreaterThan(0);
    expect(registry.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(registry.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
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

  it("blocks Counsel Pack export actions when evidence contains secret or raw KYC materials", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe export packet" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Unsafe export packet")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(await screen.findByRole("heading", { name: /Export Safety Gate/i })).toBeInTheDocument();
    expect(screen.getByText(/Blocked for export/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Remove or replace blocked materials/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Not legal advice. Data boundary output is audit preparation material only./i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Download Markdown/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Print \/ Save PDF/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Save Pack Version/i })).toBeDisabled();
    expect(screen.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  });

  it("blocks Evidence Vault sync when retention policy detects private keys or raw KYC materials", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe retention packet" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    const retentionHeading = await screen.findByRole("heading", { name: /Evidence Retention Readiness/i });
    const retentionPanel = retentionHeading.closest("section");

    expect(retentionPanel).not.toBeNull();
    expect(screen.getByText(/Blocked retention/i)).toBeInTheDocument();
    expect(screen.getByText(/Vault sync blocked until retention blockers are remediated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sync Evidence Vault/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download Retention Policy JSON/i })).toBeInTheDocument();
    const retention = within(retentionPanel as HTMLElement);
    expect(retention.getByText(/\[redacted-private-key\]/i)).toBeInTheDocument();
    expect(retention.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(retention.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  });

  it("syncs Evidence Ledger metadata to the backend Evidence Vault and displays the vault manifest hash", async () => {
    const uploadedForms: FormData[] = [];
    const vaultRecord = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-ui",
      workspaceId: "workspace-ui",
      filename: "vault-approval-memo.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "b".repeat(64),
      storageMode: "server-vault",
      status: "submitted",
      owner: "Compliance",
      sourceNote: "Metadata-only sync",
      version: 1,
      linkedRiskFlagIds: ["governance-approval"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z"
    };
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return appJsonResponse(vaultRecord, 201);
      }

      if (path.endsWith("/evidence/evidence-vault-ui") && init?.method === "PATCH") {
        return appJsonResponse({ ...vaultRecord, status: "verified", version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return appJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "workspace-ui",
            generatedAt: "2026-06-30T00:00:00.000Z",
            itemCount: 1,
            items: [],
            bundleHash: "a".repeat(64),
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Vault approval memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: "risk evidence requirement: governance-approval" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "verified" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Raw board approval facts stay local and are represented by hash only." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      expect(await screen.findByText("Vault approval memo")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Evidence Vault Sync/i })).toBeInTheDocument();
      expect(screen.getByText(/Not legal advice; vault records are audit preparation workflow metadata/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Sync Evidence Vault/i }));

      expect(await screen.findByText(/Evidence Vault synced 1 records/i)).toBeInTheDocument();
      expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
      expect(screen.getByText(/vault-approval-memo.metadata.json/i)).toBeInTheDocument();
      expect(screen.getByText(/verified · Compliance · v2/i)).toBeInTheDocument();

      const uploadedFile = uploadedForms[0].get("file") as Blob;
      const uploadedPayload = await readAppBlobText(uploadedFile);
      expect(uploadedPayload).toContain("localContentHash");
      expect(uploadedPayload).toContain("governance-approval");
      expect(uploadedPayload).not.toContain("Raw board approval facts stay local");
      expect(uploadedForms[0].get("containsRawKycOrPersonalData")).toBe("false");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("explains the Evidence Vault empty state before metadata sync", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    expect(await screen.findByRole("heading", { name: /Evidence Vault Sync/i })).toBeInTheDocument();
    expect(screen.getByText(/Add or apply at least one evidence item before syncing Evidence Vault/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sync Evidence Vault/i })).toBeDisabled();
    expect(screen.getByText(/Not legal advice; vault records are audit preparation workflow metadata/i)).toBeInTheDocument();
  });

  it("recovers a rejected Evidence Vault record by creating a metadata-only replacement", async () => {
    const rejectedRecord = {
      recordVersion: "lexproof-evidence-vault-record-v1",
      id: "evidence-vault-rejected-ui",
      workspaceId: "workspace-ui",
      filename: "rejected-approval-memo.metadata.json",
      mimeType: "application/json",
      byteSize: 512,
      fileHash: "c".repeat(64),
      storageMode: "server-vault",
      status: "rejected",
      owner: "Compliance",
      sourceNote: "Reviewer rejected this memo because approval scope was incomplete.",
      version: 2,
      linkedRiskFlagIds: ["governance-approval"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T01:00:00.000Z"
    };
    const supersededRecord = {
      ...rejectedRecord,
      status: "superseded",
      version: 3,
      supersededByEvidenceId: "evidence-vault-replacement-ui",
      replacementReason: "Reviewer requested corrected approval scope."
    };
    const replacementRecord = {
      ...rejectedRecord,
      id: "evidence-vault-replacement-ui",
      filename: "rejected-approval-memo-v2.metadata.json",
      fileHash: "d".repeat(64),
      status: "received",
      version: 3,
      parentEvidenceId: "evidence-vault-rejected-ui",
      supersededByEvidenceId: undefined,
      replacementReason: "Reviewer requested corrected approval scope."
    };
    const uploadedForms: FormData[] = [];
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);

      if (path.endsWith("/evidence") && init?.method === "GET") {
        return appJsonResponse([rejectedRecord], 200);
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return appJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "workspace-ui",
            generatedAt: "2026-06-30T00:00:00.000Z",
            itemCount: 1,
            items: [{ evidenceId: "evidence-vault-rejected-ui", status: "rejected" }],
            bundleHash: "e".repeat(64),
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
      }

      if (path.endsWith("/evidence/evidence-vault-rejected-ui/replacement") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return appJsonResponse(
          {
            superseded: supersededRecord,
            replacement: replacementRecord,
            notLegalAdviceBoundary: "Not legal advice. Evidence replacement records are audit preparation metadata only."
          },
          201
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Rejected approval memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: "risk evidence requirement: governance-approval" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "received" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Corrected approval memo summary that must stay local." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /Refresh Vault Manifest/i }));

      expect((await screen.findAllByText(/rejected-approval-memo.metadata.json/i)).length).toBeGreaterThan(0);
      expect(screen.getByText(/rejected · Compliance · v2/i)).toBeInTheDocument();
      expect(screen.getByText(/Reviewer rejected this memo because approval scope was incomplete/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Replacement reason for rejected-approval-memo.metadata.json/i), {
        target: { value: "Reviewer requested corrected approval scope." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Replace rejected evidence/i }));

      expect(await screen.findByText(/Replacement evidence created for rejected-approval-memo.metadata.json/i)).toBeInTheDocument();
      expect(screen.getByText(/superseded · Compliance · v3/i)).toBeInTheDocument();
      expect(screen.getByText(/received · Compliance · v3/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);

      const uploadedFile = uploadedForms[0].get("file") as Blob;
      const uploadedPayload = await readAppBlobText(uploadedFile);
      expect(uploadedPayload).toContain("localContentHash");
      expect(uploadedPayload).not.toContain("Corrected approval memo summary that must stay local.");
      expect(uploadedForms[0].get("replacementReason")).toBe("Reviewer requested corrected approval scope.");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("runs the full Secure Review Workspace journey across evidence vault, model gateway, and human review", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/api/workspaces") && init?.method === "POST") {
        return appJsonResponse(
          {
            recordVersion: "lexproof-workspace-record-v1",
            id: "project-ui",
            name: "Full Journey Desk",
            organizationName: "Startup issuer",
            ownerId: "Compliance",
            status: "active",
            createdAt: "2026-06-30T00:00:00.000Z",
            updatedAt: "2026-06-30T00:00:00.000Z",
            notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
          },
          201
        );
      }

      if (path.endsWith("/evidence") && init?.method === "POST") {
        return appJsonResponse(
          {
            recordVersion: "lexproof-evidence-vault-record-v1",
            id: "evidence-vault-full",
            workspaceId: "project-ui",
            filename: "journey-approval-memo.metadata.json",
            mimeType: "application/json",
            byteSize: 512,
            fileHash: "b".repeat(64),
            storageMode: "server-vault",
            status: "submitted",
            owner: "Compliance",
            sourceNote: "Metadata-only sync",
            version: 1,
            linkedRiskFlagIds: ["governance-approval"],
            containsRawKycOrPersonalData: false,
            createdAt: "2026-06-30T00:00:00.000Z",
            updatedAt: "2026-06-30T00:00:00.000Z"
          },
          201
        );
      }

      if (path.endsWith("/evidence/evidence-vault-full") && init?.method === "PATCH") {
        return appJsonResponse({ id: "evidence-vault-full", status: "verified", version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return appJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "project-ui",
            generatedAt: "2026-06-30T00:00:00.000Z",
            itemCount: 1,
            items: [],
            bundleHash: "a".repeat(64),
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
      }

      if (path.endsWith("/model-runs") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        expect(body.provider).toBe("mock");
        expect(body.includesCredentialMaterial).toBe(false);
        expect(body.includesRawKycOrPersonalData).toBe(false);
        expect(JSON.stringify(body)).toContain("Model Connect validates audit-prep routing only");
        return appJsonResponse(
          {
            recordVersion: "lexproof-model-gateway-run-v1",
            id: "model-gateway-run-full",
            workspaceId: "project-ui",
            provider: "mock",
            providerLabel: "Mock local reviewer gateway",
            model: "lexproof-mock",
            purpose: "Create server-side model gateway receipt for audit preparation and human review.",
            status: "completed",
            redactionStatus: "clean",
            payloadHash: "c".repeat(64),
            responseHash: "d".repeat(64),
            sourceEvidenceHash: "e".repeat(64),
            providerMetadata: {
              adapterMode: "local-mock",
              credentialPolicy: "no credentials accepted",
              secretPolicy: "No model provider secrets are accepted or persisted by the server gateway.",
              allowedDataClasses: ["audit-prep metadata", "evidence hashes", "risk flag summaries"]
            },
            humanReviewStatus: "needs-review",
            attempt: 1,
            maxAttempts: 1,
            retryState: "not-needed",
            remediationSteps: [],
            createdAt: "2026-06-30T00:00:00.000Z",
            completedAt: "2026-06-30T00:00:00.000Z",
            notLegalAdviceBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
          },
          201
        );
      }

      if (path.endsWith("/reviews") && init?.method === "POST") {
        return appJsonResponse(
          {
            recordVersion: "lexproof-human-review-record-v1",
            id: "human-review-full",
            workspaceId: "project-ui",
            targetType: "model-run",
            targetId: "model-gateway-run-full",
            reviewerId: "Compliance",
            status: "requested",
            comment: "Review Model Gateway run before counsel pack reliance.",
            createdAt: "2026-06-30T00:00:00.000Z",
            updatedAt: "2026-06-30T00:00:00.000Z",
            notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
          },
          201
        );
      }

      if (path.endsWith("/audit-log") && init?.method === "GET") {
        return appJsonResponse(
          [
            createAppAuditLogRecord({
              id: "audit-log-workspace",
              action: "workspace.created",
              targetType: "workspace",
              targetId: "project-ui",
              createdAt: "2026-06-30T00:00:01.000Z"
            }),
            createAppAuditLogRecord({
              id: "audit-log-evidence",
              action: "evidence.created",
              targetType: "evidence",
              targetId: "evidence-vault-full",
              createdAt: "2026-06-30T00:00:02.000Z"
            }),
            createAppAuditLogRecord({
              id: "audit-log-model",
              action: "model.run.created",
              targetType: "model-run",
              targetId: "model-gateway-run-full",
              createdAt: "2026-06-30T00:00:03.000Z"
            }),
            createAppAuditLogRecord({
              id: "audit-log-review",
              action: "human-review.created",
              targetType: "human-review",
              targetId: "human-review-full",
              createdAt: "2026-06-30T00:00:04.000Z"
            })
          ],
          200
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Full Journey Desk" } });
      fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
      fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States" } });
      fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
      fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Accredited investors" } });
      fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
      fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "Policy metadata only" } });
      fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "AI drafts audit-prep questions" } });
      fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "Simulated evidence anchor" } });
      fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Private beta" } });

      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Journey approval memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: "risk evidence requirement: governance-approval" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "verified" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Approval summary represented by metadata hash for backend review." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
      fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));
      expect(await screen.findByText(/Model Connect receipt/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Secure Review API base URL/i), { target: { value: "https://api.lexproof.test" } });
      fireEvent.click(screen.getByRole("button", { name: /Run Secure Review Journey/i }));

      expect(await screen.findByText(/Secure review journey complete/i)).toBeInTheDocument();
      expect(screen.getByText(/Vault manifest aaaaaaaaaaaa/i)).toBeInTheDocument();
      expect(screen.getByText(/Model Gateway response dddddddddddd/i)).toBeInTheDocument();
      expect(screen.getByText(/Human review request human-review-full/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit log events 4/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Audit Log Export/i })).toBeInTheDocument();
      expect(screen.getByText(/Last audit action human-review.created/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit actors Compliance/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download Audit Log JSON/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Model Gateway Evaluation/i })).toBeInTheDocument();
      expect(screen.getByText(/Payload hash cccccccccccc/i)).toBeInTheDocument();
      expect(screen.getByText(/Source evidence eeeeeeeeeeee/i)).toBeInTheDocument();
      expect(screen.getByText(/Human review needs-review/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download Model Evaluation JSON/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("shows Model Gateway failure receipts with remediation steps in the secure journey error state", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/api/workspaces") && init?.method === "POST") {
        return appJsonResponse(
          {
            recordVersion: "lexproof-workspace-record-v1",
            id: "project-ui",
            name: "Gateway Failure Desk",
            organizationName: "Startup issuer",
            ownerId: "Compliance",
            status: "active",
            createdAt: "2026-06-30T00:00:00.000Z",
            updatedAt: "2026-06-30T00:00:00.000Z",
            notLegalAdviceBoundary: "Not legal advice. Workspaces organize audit preparation materials only."
          },
          201
        );
      }

      if (path.endsWith("/evidence") && init?.method === "POST") {
        return appJsonResponse(
          {
            recordVersion: "lexproof-evidence-vault-record-v1",
            id: "evidence-vault-failure",
            workspaceId: "project-ui",
            filename: "gateway-failure-memo.metadata.json",
            mimeType: "application/json",
            byteSize: 512,
            fileHash: "b".repeat(64),
            storageMode: "server-vault",
            status: "received",
            owner: "Compliance",
            sourceNote: "Metadata-only sync",
            version: 1,
            linkedRiskFlagIds: ["governance-approval"],
            containsRawKycOrPersonalData: false,
            createdAt: "2026-06-30T00:00:00.000Z",
            updatedAt: "2026-06-30T00:00:00.000Z"
          },
          201
        );
      }

      if (path.endsWith("/evidence/evidence-vault-failure") && init?.method === "PATCH") {
        return appJsonResponse({ id: "evidence-vault-failure", status: "received", version: 2 }, 200);
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return appJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "project-ui",
            generatedAt: "2026-06-30T00:00:00.000Z",
            itemCount: 1,
            items: [],
            bundleHash: "a".repeat(64),
            notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
          },
          200
        );
      }

      if (path.endsWith("/model-runs") && init?.method === "POST") {
        return appJsonResponse(
          {
            error: "Model Gateway boundary failed.",
            errors: ["Model Gateway request must pass the Redaction Gate before provider calls."],
            runId: "model-gateway-run-blocked-ui",
            retryState: "blocked-until-remediated",
            remediationSteps: ["Pass the Redaction Gate before creating a server Model Gateway run."],
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
          },
          400
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Gateway Failure Desk" } });
      fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
      fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States" } });
      fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
      fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Accredited investors" } });
      fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
      fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "Policy metadata only" } });
      fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "AI drafts audit-prep questions" } });
      fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "Simulated evidence anchor" } });
      fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Private beta" } });

      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Gateway failure memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "received" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), { target: { value: "Evidence summary for model gateway failure receipt." } });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
      fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));
      expect(await screen.findByText(/Model Connect receipt/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Secure Review API base URL/i), { target: { value: "https://api.lexproof.test" } });
      fireEvent.click(screen.getByRole("button", { name: /Run Secure Review Journey/i }));

      expect(await screen.findByText(/Secure Review Journey cannot run until Model Gateway remediation is complete/i)).toBeInTheDocument();
      expect(screen.getByText(/model-gateway-run-blocked-ui/i)).toBeInTheDocument();
      expect(screen.getByText(/Pass the Redaction Gate before creating a server Model Gateway run/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("shows Secure Review Journey blockers for empty evidence and missing Model Connect", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run Secure Review Journey/i }));

    expect(await screen.findByText(/Add at least one evidence item before running the secure review journey/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Journey blocker memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), { target: { value: "Evidence summary exists now." } });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    fireEvent.click(screen.getByRole("button", { name: /Run Secure Review Journey/i }));

    expect(await screen.findByText(/Validate Model Connect before running the secure review journey/i)).toBeInTheDocument();
  });

  it("shows a recoverable Secure Review Journey error when Model Connect validation is blocked", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Blocked connection memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), { target: { value: "Evidence summary exists now." } });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    fireEvent.change(screen.getByLabelText(/^Provider$/i), { target: { value: "openai-compatible" } });
    fireEvent.change(screen.getByLabelText(/Model name/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await screen.findByText(/Model Connect is blocked until configuration and redaction checks pass/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Run Secure Review Journey/i }));

    expect(await screen.findByText(/Secure Review Journey cannot run until Model Connect is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete Base URL, model name, and API key, or switch to the mock local reviewer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fix Model Connect/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
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

  it("downloads a metadata-only GRC ticket export from the remediation queue", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:grc-ticket-export");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);
      await waitFor(() => expect(screen.queryByText(/calculating/i)).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

      expect(await screen.findByRole("heading", { name: /GRC Ticket Export/i })).toBeInTheDocument();
      expect(screen.getByText(/metadata-only remediation tickets/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Download GRC Tickets JSON/i }));

      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("GRC ticket export did not create a blob.");
      }
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);
      expect(parsed).toEqual(
        expect.objectContaining({
          bundleVersion: "lexproof-grc-ticket-export-v1",
          exportAllowed: true,
          adapterStatus: "ready",
          notLegalAdviceBoundary: "Not legal advice. GRC ticket exports are audit preparation workflow metadata only."
        })
      );
      expect(parsed.tickets.length).toBeGreaterThan(0);
      expect(payload).not.toContain("Yield terms, target users, redemption policy");
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:grc-ticket-export");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
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

  it("shows concrete empty evidence intake guidance and applies the recommended template", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Empty Evidence RWA Desk" } });
    fireEvent.change(screen.getByLabelText(/Entity type/i), { target: { value: "Startup issuer" } });
    fireEvent.change(screen.getByLabelText(/Jurisdictions/i), { target: { value: "United States, European Union" } });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "Tokenized private credit note with yield" } });
    fireEvent.change(screen.getByLabelText(/User exposure/i), { target: { value: "Retail investors" } });
    fireEvent.change(screen.getByLabelText(/Custody model/i), { target: { value: "Platform controls omnibus wallet" } });
    fireEvent.change(screen.getByLabelText(/Data sensitivity/i), { target: { value: "Policy metadata only" } });
    fireEvent.change(screen.getByLabelText(/AI usage/i), { target: { value: "AI drafts suitability memo" } });
    fireEvent.change(screen.getByLabelText(/Blockchain use/i), { target: { value: "Evidence anchor only" } });
    fireEvent.change(screen.getByLabelText(/Operating stage/i), { target: { value: "Pilot with planned public launch" } });

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    expect(await screen.findByRole("heading", { name: /Evidence Intake Guidance/i })).toBeInTheDocument();
    expect(screen.getByText(/Start with tokenized yield \/ RWA evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Evidence intake guidance is audit preparation workflow metadata only./i)).toBeInTheDocument();
    expect(screen.getByText(/Asset classification memo/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Apply recommended tokenized yield \/ RWA template/i }));

    expect(await screen.findByDisplayValue("RWA disclosure assumptions memo")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("requested");
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
    expect(screen.getAllByText(/Needs review/i).length).toBeGreaterThan(0);

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

    expect(await screen.findByText(/1 events · 0 unresolved/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Outside counsel")).toBeInTheDocument();
  });

  it("routes AI review output through the Human Review workflow before Model Intake reliance", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run AI Review/i }));

    expect(await screen.findByText(/Payload SHA-256/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));

    expect(await screen.findByRole("heading", { name: /^Human Review$/i })).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Human review decisions track audit preparation workflow status only./i)).toBeInTheDocument();
    expect(screen.getByText(/AI Review run/i)).toBeInTheDocument();
    expect(screen.getByText(/draft counsel questions/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Status for AI Review run/i), { target: { value: "reviewed" } });
    fireEvent.change(screen.getByLabelText(/Reviewer for AI Review run/i), { target: { value: "Outside counsel" } });
    fireEvent.change(screen.getByLabelText(/Decision note for AI Review run/i), {
      target: { value: "Reviewed AI output for audit-prep handoff." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save decision for AI Review run/i }));

    expect(await screen.findByText(/Human review decision saved for AI Review run/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed items/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Model Intake/i }));

    expect(await screen.findByText(/1 events · 0 unresolved/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Review status for AI event 1/i)).toHaveValue("reviewed");
    expect(screen.getByDisplayValue("Outside counsel")).toBeInTheDocument();
  });

  it("handles returned and rejected Human Review decisions as audit-prep workflow states", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Returned review memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "received" } });
    fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Evidence summary for counsel workflow testing." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));

    expect(await screen.findByText("Returned review memo")).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Human review decisions track audit preparation workflow status only./i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Status for Returned review memo/i), { target: { value: "needs-more-evidence" } });
    fireEvent.change(screen.getByLabelText(/Decision note for Returned review memo/i), {
      target: { value: "Return for missing supporting memo." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save decision for Returned review memo/i }));

    expect(await screen.findByText(/Human review decision saved for Returned review memo/i)).toBeInTheDocument();
    expect(screen.getByText(/Returned for more evidence. Linked evidence is moved back to requested status/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("requested");

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));
    fireEvent.change(screen.getByLabelText(/Status for Returned review memo/i), { target: { value: "rejected" } });
    fireEvent.change(screen.getByLabelText(/Decision note for Returned review memo/i), {
      target: { value: "Rejected as stale audit-prep evidence." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save decision for Returned review memo/i }));

    expect(await screen.findByText(/Rejected from review. Linked evidence is moved to draft for rework/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("draft");
  });

  it("shows and downloads a Human Review timeline with saved status history", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:human-review-timeline");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Review timeline desk" } });
      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Timeline memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), { target: { value: "Evidence summary for review timeline." } });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));
      fireEvent.change(screen.getAllByLabelText(/^Status for /i)[0], { target: { value: "in-review" } });
      fireEvent.change(screen.getAllByLabelText(/^Decision note for /i)[0], { target: { value: "Started source review." } });
      fireEvent.click(screen.getAllByRole("button", { name: /Save decision for /i })[0]);
      fireEvent.change(screen.getAllByLabelText(/^Status for /i)[0], { target: { value: "reviewed" } });
      fireEvent.change(screen.getAllByLabelText(/^Decision note for /i)[0], { target: { value: "Reviewed for audit-prep handoff." } });
      fireEvent.click(screen.getAllByRole("button", { name: /Save decision for /i })[0]);

      expect(await screen.findByRole("heading", { name: /Human Review Timeline/i })).toBeInTheDocument();
      expect(screen.getByText(/2 saved decisions/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Reviewed for audit-prep handoff/i).length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole("button", { name: /Download Review Timeline JSON/i }));

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:human-review-timeline");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("runs the Secure Review Workspace model-connect flow with a user OpenAI-compatible model", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractedFacts: ["Session model reviewed evidence summaries"],
                missingEvidence: ["Human approval memo"],
                draftQuestions: ["Which counsel reviewer approved the model output?"],
                suggestedRemediation: ["Attach human review notes before external reliance."]
              })
            }
          }
        ]
      })
    }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      expect(screen.getByRole("heading", { name: /Secure Review Workspace/i })).toBeInTheDocument();
      expect(screen.getByText(/Not legal advice. Secure review workspace records are audit preparation materials only./i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
      fireEvent.change(screen.getByLabelText(/^Provider$/i), { target: { value: "openai-compatible" } });
      fireEvent.change(screen.getByLabelText(/Model name/i), { target: { value: "gpt-audit-review" } });
      fireEvent.change(screen.getByLabelText(/^Base URL$/i), { target: { value: "https://models.example.test/v1" } });
      fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: "sk-session-only" } });

      fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

      expect(await screen.findByText(/Model Connect receipt/i)).toBeInTheDocument();
      expect(screen.getByText(/OpenAI-compatible model configured for this session/i)).toBeInTheDocument();
      expect(screen.getByText(/Not legal advice. Model Connect validates audit-prep routing only./i)).toBeInTheDocument();
      expect(screen.queryByText(/sk-session-only/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Run AI Review/i }));

      expect(await screen.findByText(/Session model reviewed evidence summaries/i)).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        "https://models.example.test/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ Authorization: "Bearer sk-session-only" })
        })
      );

      fireEvent.click(screen.getByRole("button", { name: /Model Intake/i }));

      expect(await screen.findByText(/AI Review run/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("OpenAI-compatible session model")).toBeInTheDocument();
      expect(screen.getByDisplayValue("gpt-audit-review")).toBeInTheDocument();
      expect(screen.getByText(/Event SHA-256/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
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

  it("switches Counsel Pack export templates and updates the Markdown agenda", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    expect(screen.getByLabelText(/Export template/i)).toHaveValue("rwa-tokenized-asset");
    expect(screen.getByText(/Recommended for current project/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tokenized Asset \/ RWA Review/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText(/## Source Review Ledger/i)).toBeInTheDocument());
    expect(
      screen.getAllByText(/Not legal advice. Source review metadata is audit preparation lineage only./i).length
    ).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/Export template/i), { target: { value: "ai-governance" } });

    expect(screen.getByLabelText(/Export template/i)).toHaveValue("ai-governance");
    expect((await screen.findAllByText(/AI Governance Review/i)).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText(/Template Review Agenda/i)).toBeInTheDocument());
    expect(
      screen.getAllByText(/Confirm model purpose, allowed data classes, redaction status, and human review owner./i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Not legal advice. Export templates are audit preparation routing aids only./i).length).toBeGreaterThan(0);
  });

  it("saves Counsel Pack versions and shows a diff between exports", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:counsel-pack-version");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
      const saveButton = await screen.findByRole("button", { name: /Save Pack Version/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      fireEvent.click(saveButton);

      expect(await screen.findByRole("heading", { name: /Counsel Pack Versions/i })).toBeInTheDocument();
      expect(await screen.findByText(/Version 1/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Not legal advice. Counsel Pack version records are audit preparation export metadata only./i)
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Status for review 1/i), { target: { value: "reviewed" } });
      fireEvent.change(screen.getByLabelText(/Reviewer for review 1/i), { target: { value: "Outside counsel" } });
      fireEvent.click(saveButton);

      expect(await screen.findByText(/Version 2/i)).toBeInTheDocument();
      expect(screen.getByText(/1 review status changed/i)).toBeInTheDocument();
      expect(screen.getByText(/Markdown changed/i)).toBeInTheDocument();

      fireEvent.click(screen.getAllByRole("button", { name: /Download Version JSON/i })[0]);

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-pack-version");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("creates server-side Counsel Pack export records from version metadata", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      expect(path).toMatch(/https:\/\/api\.lexproof\.test\/api\/workspaces\/.+\/exports\/counsel-pack$/);
      const workspaceId = decodeURIComponent(path.match(/\/api\/workspaces\/([^/]+)\/exports\/counsel-pack$/)?.[1] ?? "");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual(
        expect.objectContaining({
          title: expect.stringMatching(/Counsel Pack v1/i),
          format: "markdown",
          manifestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          includesRawKycOrPersonalData: false,
          includesCredentialMaterial: false
        })
      );
      expect(JSON.stringify(body)).not.toContain("# Counsel Pack");
      expect(JSON.stringify(body).toLowerCase()).not.toContain("api_key");
      return appJsonResponse(
        {
          recordVersion: "lexproof-counsel-pack-export-record-v1",
          id: "counsel-pack-export-ui",
          workspaceId,
          exportType: "counsel-pack",
          format: "markdown",
          version: 1,
          projectName: body.projectName,
          title: body.title,
          artifactName: body.artifactName,
          manifestHash: body.manifestHash,
          artifactHash: body.artifactHash,
          artifactSize: body.artifactSize,
          riskLevel: body.riskLevel,
          reviewSummary: body.reviewSummary,
          sourceCount: body.sourceCount,
          createdBy: body.createdBy,
          status: "ready",
          createdAt: "2026-06-30T08:30:00.000Z",
          notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
        },
        201
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
      const saveButton = await screen.findByRole("button", { name: /Save Pack Version/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      fireEvent.click(saveButton);
      expect(await screen.findByText(/Version 1/i)).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Server export API base URL/i), {
        target: { value: "https://api.lexproof.test" }
      });
      fireEvent.click(screen.getByRole("button", { name: /Create Server Export Record/i }));

      expect(await screen.findByText(/Server Export Records/i)).toBeInTheDocument();
      expect(await screen.findByText(/counsel-pack-export-ui/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Not legal advice. Counsel Pack export records are audit preparation metadata only./i)
      ).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
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

function appJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

function createAppAuditLogRecord(overrides: Record<string, string>) {
  return {
    recordVersion: "lexproof-audit-log-record-v1",
    id: "audit-log-ui",
    workspaceId: "project-ui",
    actorId: "Compliance",
    action: "workspace.created",
    targetType: "workspace",
    targetId: "project-ui",
    beforeHash: "",
    afterHash: "f".repeat(64),
    summary: "Created secure review workspace.",
    createdAt: "2026-06-30T00:00:00.000Z",
    notLegalAdviceBoundary: "Not legal advice. Audit log records are review workspace metadata.",
    ...overrides
  };
}

function readAppBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read blob.")));
    reader.readAsText(blob);
  });
}
