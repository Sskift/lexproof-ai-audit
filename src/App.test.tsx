import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { evidenceTemplates } from "./data/evidenceTemplates";

const LONG_APP_FLOW_TIMEOUT_MS = 60000;
const REGULATORY_CONTROL_ID_PATTERN = /regulatory control: ([a-z0-9-]+)/g;

const getEvidenceTemplate = (templateId: string) => {
  const template = evidenceTemplates.find((candidate) => candidate.id === templateId);
  if (!template) {
    throw new Error(`Missing evidence template: ${templateId}`);
  }
  return template;
};

const getTemplateControlIds = (templateId: string) => {
  const template = getEvidenceTemplate(templateId);
  return Array.from(
    new Set(
      template.items.flatMap((item) =>
        Array.from((item.source ?? "").matchAll(REGULATORY_CONTROL_ID_PATTERN), (match) => match[1])
      )
    )
  ).sort();
};

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.spyOn(globalThis.crypto.subtle, "digest").mockImplementation(async (_algorithm, data) => createFastDigest(data));
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
    const cockpit = within(screen.getByRole("region", { name: /Workspace Cockpit Brief/i }));
    expect(cockpit.getByRole("heading", { name: /Audit-prep cockpit/i })).toBeInTheDocument();
    expect(
      cockpit.getByText(/Not legal advice. Workspace cockpit status is audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
    expect(cockpit.getByRole("button", { name: /Download Cockpit Handoff JSON/i })).toBeEnabled();
    expect(cockpit.getAllByText(/Journey/i).length).toBeGreaterThan(0);
    expect(cockpit.getByText(/Human review/i)).toBeInTheDocument();
    const journey = within(screen.getByRole("region", { name: /Workspace Journey/i }));
    expect(journey.getByRole("heading", { name: /Workspace Journey/i })).toBeInTheDocument();
    expect(
      journey.getByText(/Not legal advice. Workspace journey status is audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
    expect(journey.getByText(/Project facts/i)).toBeInTheDocument();
    expect(journey.getByText(/Vault \/ manifest/i)).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Workspace Action Queue/i })).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Workspace actions are audit preparation workflow prompts only./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open source gap triage/i })).toBeInTheDocument();
    const sourceGapTriage = await screen.findByRole("region", { name: /Source Evidence Gap Triage/i }, { timeout: 10000 });
    expect(
      within(sourceGapTriage).getByText(/Not legal advice. Source evidence gap triage is audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
    expect(within(sourceGapTriage).getByRole("button", { name: /Download Source Gap Triage JSON/i })).toBeEnabled();
    expect(within(sourceGapTriage).getByRole("button", { name: /Open Evidence/i })).toBeEnabled();
    expect(within(sourceGapTriage).getAllByText(/Evidence draft/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /Source Review Ledger/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /Download Source Review Packet JSON/i })).toBeEnabled());
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

    fireEvent.click(screen.getByRole("button", { name: /^Evidence Ledger$/i }));

    expect(await screen.findByText(/Evidence bundle SHA-256/i)).toBeInTheDocument();
  }, 20000);

  it("blocks an unsafe saved workspace snapshot and shows recovery guidance", async () => {
    const { restore, storage } = installAppLocalStorage({
      "lexproof.currentProject.v1": JSON.stringify({
        id: "project-unsafe",
        projectName: "Wallet owner jane.reviewer@example.com",
        entityType: "Startup issuer",
        jurisdictions: ["United States"],
        assetModel: "Tokenized evidence review",
        userType: "Compliance team",
        custodyModel: "Non-custodial workflow",
        dataSensitivity: "Policy metadata only",
        aiUsage: "Use api_key=sk-live-abcdef1234567890abcdef1234567890 for model review.",
        blockchainUse: "Simulated anchor only",
        operatingStage: "Private pilot",
        evidenceItems: []
      })
    });

    try {
      render(<App />);

      const recovery = await screen.findByRole("status", { name: /Workspace persistence recovery/i });
      expect(within(recovery).getByText(/Unsafe saved workspace was blocked/i)).toBeInTheDocument();
      expect(within(recovery).getByText(/Not legal advice. Workspace persistence recovery/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Project name/i)).not.toHaveValue("Wallet owner jane.reviewer@example.com");

      await waitFor(() => {
        const stored = storage.getItem("lexproof.currentProject.v1") ?? "";
        expect(stored).not.toContain("sk-live");
        expect(stored).not.toContain("jane.reviewer@example.com");
      });
    } finally {
      restore();
    }
  }, 20000);

  it("blocks workspace autosave when project metadata includes unsafe material", async () => {
    const { restore, storage } = installAppLocalStorage();

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Unsafe Project Desk" } });
      fireEvent.change(screen.getByLabelText(/AI usage/i), {
        target: { value: "Route api_key=sk-live-abcdef1234567890abcdef1234567890 into model review." }
      });

      const recovery = await screen.findByRole("status", { name: /Workspace persistence recovery/i });
      expect(within(recovery).getByText(/Workspace autosave blocked/i)).toBeInTheDocument();
      expect(within(recovery).getByText(/Remove credentials, private keys, raw KYC/i)).toBeInTheDocument();
      expect(within(recovery).getByText(/Not legal advice. Workspace persistence recovery/i)).toBeInTheDocument();

      await waitFor(() => {
        const stored = storage.getItem("lexproof.currentProject.v1") ?? "";
        expect(stored).not.toContain("sk-live");
        expect(stored).not.toContain("Unsafe Project Desk");
      });
    } finally {
      restore();
    }
  });

  it("downloads a metadata-only Workspace Cockpit Handoff JSON from the command center", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const revokeObjectUrl = vi.fn();
    const capturedBlobs: Blob[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return "blob:workspace-cockpit-handoff";
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const cockpit = within(screen.getByRole("region", { name: /Workspace Cockpit Brief/i }));
      fireEvent.click(cockpit.getByRole("button", { name: /Download Cockpit Handoff JSON/i }));

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      const payload = await readAppBlobText(capturedBlobs[0]);
      const handoff = JSON.parse(payload);

      expect(handoff.handoffVersion).toBe("lexproof-workspace-cockpit-handoff-v1");
      expect(handoff.handoffHash).toMatch(/^[a-f0-9]{64}$/);
      expect(handoff.notLegalAdviceBoundary).toBe(
        "Not legal advice. Workspace cockpit handoffs are audit preparation workflow metadata only."
      );
      expect(handoff.journeySteps.length).toBeGreaterThan(0);
      expect(handoff.openActions.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
      await waitFor(() => expect(cockpit.getByText(/Cockpit handoff hash/i)).toBeInTheDocument());
    } finally {
      click.mockRestore();
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
    }
  });

  it("downloads a metadata-only Workspace Action Queue JSON from the command center", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const revokeObjectUrl = vi.fn();
    const capturedBlobs: Blob[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return "blob:workspace-action-queue";
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const actionQueue = within(screen.getByRole("region", { name: /Workspace Action Queue/i }));
      fireEvent.click(actionQueue.getByRole("button", { name: /Download Action Queue JSON/i }));

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      const payload = await readAppBlobText(capturedBlobs[0]);
      const queueExport = JSON.parse(payload);

      expect(queueExport.exportVersion).toBe("lexproof-workspace-action-queue-export-v1");
      expect(queueExport.queueHash).toMatch(/^[a-f0-9]{64}$/);
      expect(queueExport.queueVersion).toBe("lexproof-workspace-action-queue-v1");
      expect(queueExport.itemCount).toBe(queueExport.items.length);
      expect(queueExport.queueSummary.totalCount).toBe(queueExport.items.length);
      expect(queueExport.notLegalAdviceBoundary).toBe(
        "Not legal advice. Workspace action queue exports are audit preparation workflow metadata only."
      );
      expect(queueExport.items.length).toBeGreaterThan(0);
      expect(queueExport.items.every((item: { notLegalAdviceBoundary: string }) => item.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(
        true
      );
      expect(payload).not.toMatch(/sk-live|private key|raw KYC|\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
      await waitFor(() => expect(actionQueue.getByText(/Action queue hash/i)).toBeInTheDocument());
    } finally {
      click.mockRestore();
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
    }
  });

  it("routes the source gap action queue item to the command-center triage panel", async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(<App />);

    try {
      const sourceGapTriage = await screen.findByRole("region", { name: /Source Evidence Gap Triage/i }, { timeout: 10000 });
      const actionQueue = within(screen.getByRole("region", { name: /Workspace Action Queue/i }));

      fireEvent.click(actionQueue.getByRole("button", { name: /Open source gap triage/i }));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(sourceGapTriage).toHaveClass("action-focus");
      expect(within(sourceGapTriage).getAllByRole("button", { name: /Request Evidence/i }).length).toBeGreaterThan(0);
      expect(screen.queryByRole("heading", { name: /^Evidence Ledger$/i })).not.toBeInTheDocument();
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("routes source approval action queue items to the source update approval queue", async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      render(<App />);
      fireEvent.change(screen.getByLabelText(/Source review as-of date/i), {
        target: { value: "2026-10-01" }
      });

      const approvalQueue = screen.getByRole("region", { name: /Source Update Approval Queue/i });
      const actionQueue = within(screen.getByRole("region", { name: /Workspace Action Queue/i }));

      expect(await actionQueue.findByText(/Review source update approvals/i)).toBeInTheDocument();
      expect(actionQueue.getByText(/Matching behavior remains unchanged/i)).toBeInTheDocument();
      fireEvent.click(actionQueue.getByRole("button", { name: /Open source approval queue/i }));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
      expect(approvalQueue).toHaveClass("action-focus");
      expect(within(approvalQueue).getAllByText(/Source updates cannot change matching behavior/i).length).toBeGreaterThan(0);
      expect(within(approvalQueue).getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
      expect(screen.queryByRole("heading", { name: /^Human Review$/i })).not.toBeInTheDocument();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("routes final handoff recovery from the command center to Sources", async () => {
    render(<App />);

    const actionQueue = within(screen.getByRole("region", { name: /Workspace Action Queue/i }));

    expect(await actionQueue.findByText(/Recover final handoff packet/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(actionQueue.getByText(/Playbook/i)).toBeInTheDocument();
    expect(actionQueue.getByText(/Not legal advice/i)).toBeInTheDocument();

    fireEvent.click(actionQueue.getByRole("button", { name: /Open handoff recovery/i }));

    const playbookPanel = await screen.findByRole("region", { name: /Handoff Recovery Playbook/i }, { timeout: 10000 });
    expect(
      within(playbookPanel).getByText(/Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
    expect(within(playbookPanel).getByText(/Playbook hash/i)).toBeInTheDocument();
    expect(within(playbookPanel).getByRole("button", { name: /Download Recovery Playbook JSON/i })).toBeEnabled();
  }, 20000);

  it("requests a source evidence gap into the Evidence Ledger from the command center", async () => {
    render(<App />);

    const sourceGapTriage = await screen.findByRole("region", { name: /Source Evidence Gap Triage/i }, { timeout: 10000 });
    const regDGapItem = Array.from(sourceGapTriage.querySelectorAll<HTMLElement>(".source-gap-triage-item")).find((item) =>
      item.textContent?.includes("US accredited-investor verification and solicitation-controls evidence")
    );

    expect(regDGapItem).toBeInstanceOf(HTMLElement);
    act(() => {
      fireEvent.click(within(regDGapItem as HTMLElement).getByRole("button", { name: /Request Evidence/i }));
    });

    expect(await screen.findByRole("heading", { name: /Evidence Ledger/i }, { timeout: 10000 })).toBeInTheDocument();
    const evidenceLabelInputs = screen.getAllByLabelText(/Label for evidence/i) as HTMLInputElement[];
    const labelInput = evidenceLabelInputs.find(
      (input) => input.value === "US accredited-investor verification and solicitation-controls evidence"
    );
    expect(labelInput).toBeInstanceOf(HTMLInputElement);
    expect(labelInput).toHaveAccessibleName(/Label for evidence/i);
    const evidenceIndex = labelInput?.getAttribute("aria-label")?.match(/evidence (\d+)/i)?.[1];
    expect(evidenceIndex).toBeTruthy();
    expect(labelInput).toHaveValue(
      "US accredited-investor verification and solicitation-controls evidence"
    );
    expect((screen.getByLabelText(new RegExp(`Source for evidence ${evidenceIndex}`, "i")) as HTMLInputElement).value).toContain(
      "source gap: us-sec-reg-d-accredited-investor-verification-us-accredited-investor-verification-solicitation-controls"
    );
    expect((screen.getByLabelText(new RegExp(`Source for evidence ${evidenceIndex}`, "i")) as HTMLInputElement).value).toContain(
      "regulatory control: control-us-sec-reg-d-accredited-investor-verification"
    );
    expect((screen.getByLabelText(new RegExp(`Content for evidence ${evidenceIndex}`, "i")) as HTMLTextAreaElement).value).toContain(
      "Exclude [redacted-raw-kyc], credentials, private keys"
    );
    expect(screen.getByLabelText(new RegExp(`Status for evidence ${evidenceIndex}`, "i"))).toHaveValue("requested");
    expect(screen.getByText(/source-gap-requested US accredited-investor verification/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
  }, 20000);

  it("shows and downloads the Regulatory Control Matrix from the command center", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:regulatory-control-matrix");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const matrix = await screen.findByRole("region", { name: /Regulatory Control Matrix/i });
      expect(within(matrix).getByText(/Not legal advice. Regulatory control matrices are audit preparation workflow metadata only./i)).toBeInTheDocument();
      expect(within(matrix).getAllByText(/needs evidence/i).length).toBeGreaterThan(0);
      expect(within(matrix).getAllByText(/EU DLT market infrastructure \/ financial instruments counsel/i).length).toBeGreaterThan(0);
      expect(within(matrix).getByRole("button", { name: /Download Control Matrix JSON/i })).toBeEnabled();

      fireEvent.click(within(matrix).getByRole("button", { name: /Download Control Matrix JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:regulatory-control-matrix");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Regulatory Control Matrix JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          matrixVersion: "lexproof-regulatory-control-matrix-v1",
          status: "needs-evidence",
          notLegalAdviceBoundary: "Not legal advice. Regulatory control matrices are audit preparation workflow metadata only."
        })
      );
      expect(parsed.controls.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("shows and downloads a jurisdiction evidence map without legal conclusions", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:jurisdiction-evidence-map");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const map = await screen.findByRole("region", { name: /Jurisdiction Evidence Map/i });
      expect(within(map).getByText(/Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only./i)).toBeInTheDocument();
      expect(within(map).getAllByText(/European Union/i).length).toBeGreaterThan(0);
      expect(within(map).getByRole("button", { name: /Download Jurisdiction Evidence Map JSON/i })).toBeEnabled();

      fireEvent.click(within(map).getByRole("button", { name: /Download Jurisdiction Evidence Map JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:jurisdiction-evidence-map");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Jurisdiction Evidence Map JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          mapVersion: "lexproof-jurisdiction-evidence-map-v1",
          status: "needs-evidence",
          notLegalAdviceBoundary: "Not legal advice. Jurisdiction evidence maps are audit preparation workflow metadata only."
        })
      );
      expect(parsed.mapHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.jurisdictions.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("shows and downloads a jurisdiction readiness digest from the command center", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:jurisdiction-readiness-digest");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const digest = await screen.findByRole("region", { name: /Jurisdiction Readiness Digest/i }, { timeout: 10000 });
      expect(
        within(digest).getByText(/Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
      expect(within(digest).getByText(/Handoff blocked/i)).toBeInTheDocument();
      expect(within(digest).getAllByText(/United States|European Union/i).length).toBeGreaterThan(0);
      expect(within(digest).getByRole("button", { name: /Download Jurisdiction Digest JSON/i })).toBeEnabled();

      fireEvent.click(within(digest).getByRole("button", { name: /Download Jurisdiction Digest JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:jurisdiction-readiness-digest");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Jurisdiction Readiness Digest JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          digestVersion: "lexproof-jurisdiction-readiness-digest-v1",
          status: "needs-evidence",
          handoffAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Jurisdiction readiness digests are audit preparation workflow metadata only."
        })
      );
      expect(parsed.digestHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.summary.openEvidenceRequestCount).toBeGreaterThan(0);
      expect(parsed.jurisdictions.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("shows and downloads regulatory source coverage without legal conclusions", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:regulatory-source-coverage");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const coverage = await screen.findByRole("region", { name: /Regulatory Source Coverage/i });
      expect(
        within(coverage).getByText(/Not legal advice. Regulatory source coverage is audit preparation metadata only./i)
      ).toBeInTheDocument();
      expect(within(coverage).getByText(/Report hash/i)).toBeInTheDocument();
      expect(within(coverage).getAllByText(/needs evidence/i).length).toBeGreaterThan(0);
      expect(within(coverage).getByRole("button", { name: /Download Source Coverage JSON/i })).toBeEnabled();

      fireEvent.click(within(coverage).getByRole("button", { name: /Download Source Coverage JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:regulatory-source-coverage");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Regulatory Source Coverage JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          reportVersion: "lexproof-regulatory-source-coverage-v1",
          status: "needs-evidence",
          notLegalAdviceBoundary: "Not legal advice. Regulatory source coverage is audit preparation metadata only."
        })
      );
      expect(parsed.reportHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.jurisdictions.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("shows and downloads a source freshness board without legal conclusions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:source-freshness-board");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);
      vi.useRealTimers();

      const board = await screen.findByRole("region", { name: /Source Freshness Board/i });
      expect(
        within(board).getByText(/Not legal advice. Source freshness boards are audit preparation scheduling metadata only./i)
      ).toBeInTheDocument();
      expect(within(board).getAllByText(/Overdue/i).length).toBeGreaterThan(0);
      expect(within(board).getByRole("button", { name: /Download Source Freshness Board JSON/i })).toBeEnabled();

      fireEvent.click(within(board).getByRole("button", { name: /Download Source Freshness Board JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:source-freshness-board");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Source Freshness Board JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          boardVersion: "lexproof-source-freshness-board-v1",
          status: "attention-needed",
          notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
        })
      );
      expect(parsed.boardHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.overdueCount).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.useRealTimers();
    }
  });

  it("filters the Regulatory Control Matrix to a specific jurisdiction and source control", async () => {
    render(<App />);

    const matrix = await screen.findByRole("region", { name: /Regulatory Control Matrix/i });

    fireEvent.change(within(matrix).getByLabelText(/Control matrix jurisdiction/i), {
      target: { value: "United States" }
    });
    fireEvent.change(within(matrix).getByLabelText(/Control matrix topic/i), {
      target: { value: "aml-cft" }
    });
    fireEvent.change(within(matrix).getByLabelText(/Search controls/i), {
      target: { value: "OFAC blocked property" }
    });

    expect(within(matrix).getByText(/Showing 1 of/i)).toBeInTheDocument();
    const filteredControls = within(matrix).getByRole("list", { name: /Filtered regulatory controls/i });
    expect(within(filteredControls).getAllByText(/US sanctions \/ virtual-currency compliance counsel/i).length).toBeGreaterThan(0);
    expect(
      within(filteredControls).getByText(/OFAC Sanctions Compliance Guidance for the Virtual Currency Industry, October 2021/i)
    ).toBeInTheDocument();
    expect(within(filteredControls).queryByText(/EU crypto-asset custody \/ CASP counsel/i)).not.toBeInTheDocument();
    expect(
      within(matrix).getByText(/Not legal advice. Regulatory control matrices are audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
  });

  it("shows local counsel routing in the command center and Counsel Pack handoff", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:local-counsel-routing");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      const routing = await screen.findByRole("region", { name: /Local Counsel Routing Plan/i });
      expect(
        within(routing).getByText(/Not legal advice. Local counsel routing plans are audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
      expect(within(routing).getAllByText(/Prepare missing evidence for local counsel review/i).length).toBeGreaterThan(0);
      expect(within(routing).getByRole("button", { name: /Download Local Counsel Routing JSON/i })).toBeEnabled();

      fireEvent.click(within(routing).getByRole("button", { name: /Download Local Counsel Routing JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:local-counsel-routing");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Local Counsel Routing Plan JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          planVersion: "lexproof-local-counsel-routing-v1",
          notLegalAdviceBoundary: "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only."
        })
      );
      expect(parsed.routes.length).toBeGreaterThan(0);
      expect(
        parsed.routes.some((route: { localCounselRole?: string }) => route.localCounselRole === "US private offering / securities counsel")
      ).toBe(true);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b|raw KYC|private key/i);

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

      expect(await screen.findByText(/## Local Counsel Routing Plan/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(parsed.planHash))).toBeInTheDocument();
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  }, 20000);

  it("shows and downloads the Source Update Approval Queue when source review is due", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:source-approval-queue");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);
      vi.useRealTimers();

      const queue = screen.getByRole("region", { name: /Source Update Approval Queue/i });
      expect(
        within(queue).getByText(/Not legal advice. Source update approvals are audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
      expect(within(queue).getAllByText(/approval required/i).length).toBeGreaterThan(0);
      expect(within(queue).getByRole("button", { name: /Download Source Approval Queue JSON/i })).toBeEnabled();

      fireEvent.click(within(queue).getByRole("button", { name: /Download Source Approval Queue JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:source-approval-queue");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Source Approval Queue JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          queueVersion: "lexproof-regulatory-source-approval-queue-v1",
          status: "needs-approval",
          notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
        })
      );
      expect(parsed.items.length).toBeGreaterThan(0);
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.useRealTimers();
    }
  });

  it("syncs Source Update Approval Queue metadata to the Phase 2 API", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/workspaces/sample-yieldpassport/source-approvals");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.createdBy).toBe("Compliance");
      expect(body.queue).toEqual(
        expect.objectContaining({
          queueVersion: "lexproof-regulatory-source-approval-queue-v1",
          status: expect.stringMatching(/needs-approval|needs-metadata/),
          totalItemCount: expect.any(Number),
          notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
        })
      );
      expect(body.queue.items.length).toBeGreaterThan(0);
      expect(String(init?.body)).not.toContain("rawSourceBody");
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          syncVersion: "lexproof-source-approval-sync-v1",
          workspaceId: "sample-yieldpassport",
          queueHash: "a".repeat(64),
          syncedCount: body.queue.items.length,
          records: body.queue.items.map((item: { id: string; clauseId: string; jurisdiction: string; citation: string }, index: number) => ({
            recordVersion: "lexproof-source-approval-record-v1",
            id: `source-approval-record-${index + 1}`,
            workspaceId: "sample-yieldpassport",
            queueHash: "a".repeat(64),
            sourceApprovalItemId: item.id,
            clauseId: item.clauseId,
            jurisdiction: item.jurisdiction,
            regulator: "Reviewer",
            citation: item.citation,
            sourceName: "Reviewed source",
            sourceUrl: "https://example.test/source",
            priority: "P1",
            approvalStatus: "approval-required",
            reviewStatus: "review-due",
            effectiveAsOf: "2024-06-30",
            lastReviewedAt: "2026-06-01",
            nextReviewDueAt: "2026-09-01",
            reviewerNotes: "Review source freshness before counsel handoff.",
            nextAction: "Refresh and approve source metadata before it changes source matching.",
            approvalGate:
              "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
            status: "pending-review",
            matchingBehaviorChanged: false,
            createdBy: "Compliance",
            createdAt: "2026-10-01T00:00:00.000Z",
            notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
          })),
          notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
        },
        201
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);
      vi.useRealTimers();

      const queue = screen.getByRole("region", { name: /Source Update Approval Queue/i });
      fireEvent.change(within(queue).getByLabelText(/Source Approval API base URL/i), {
        target: { value: "https://api.lexproof.test" }
      });
      fireEvent.click(within(queue).getByRole("button", { name: /Sync Source Approval Queue/i }));

      expect(await within(queue).findByText(/Source approvals synced/i)).toBeInTheDocument();
      expect(within(queue).getByText(/Matching behavior unchanged/i)).toBeInTheDocument();
      expect(within(queue).getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("refreshes persisted Source Update Approval records from the Phase 2 API", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/workspaces/sample-yieldpassport/source-approvals");
      expect(init).toEqual({ method: "GET" });
      return appJsonResponse(
        [
          {
            recordVersion: "lexproof-source-approval-record-v1",
            id: "source-approval-record-persisted-ui",
            workspaceId: "sample-yieldpassport",
            queueHash: "a".repeat(64),
            sourceApprovalItemId: "source-approval-control-eu-mica-title-ii-white-paper",
            clauseId: "control-eu-mica-title-ii-white-paper",
            jurisdiction: "European Union",
            regulator: "ESMA",
            citation: "Regulation (EU) 2023/1114, Title II",
            sourceName: "EUR-Lex",
            sourceUrl: "https://eur-lex.europa.eu/",
            priority: "P1",
            approvalStatus: "approval-required",
            reviewStatus: "review-due",
            effectiveAsOf: "2024-06-30",
            lastReviewedAt: "2026-06-01",
            nextReviewDueAt: "2026-09-01",
            reviewerNotes: "Review source freshness before counsel handoff.",
            nextAction: "Refresh and approve MiCA Title II source metadata before it changes source matching.",
            approvalGate:
              "Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata.",
            status: "pending-review",
            matchingBehaviorChanged: false,
            createdBy: "Compliance",
            createdAt: "2026-10-01T00:00:00.000Z",
            notLegalAdviceBoundary: "Not legal advice. Source approval records are audit preparation workflow metadata only."
          }
        ],
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const queue = screen.getByRole("region", { name: /Source Update Approval Queue/i });
    fireEvent.change(within(queue).getByLabelText(/Source Approval API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.click(within(queue).getByRole("button", { name: /Refresh Source Approval Records/i }));

    expect(await within(queue).findByText(/Source approval records refreshed: 1 persisted record/i)).toBeInTheDocument();
    const persisted = within(screen.getByRole("region", { name: /Persisted Source Approval Records/i }));
    expect(persisted.getByText(/European Union/i)).toBeInTheDocument();
    expect(persisted.getByText(/Refresh and approve MiCA Title II source metadata/i)).toBeInTheDocument();
    expect(persisted.getByText(/Not legal advice. Source approval records are audit preparation workflow metadata only./i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("syncs Source Review Ledger metadata to the Phase 2 API", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/workspaces/sample-yieldpassport/source-reviews");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.createdBy).toBe("Compliance");
      expect(body.sourceReview).toEqual(
        expect.objectContaining({
          status: expect.stringMatching(/current|review-due|metadata-missing/),
          totalSourceCount: expect.any(Number),
          notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
        })
      );
      expect(body.sourceReview.items.length).toBeGreaterThan(0);
      expect(String(init?.body)).not.toContain("rawSourceBody");
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          syncVersion: "lexproof-source-review-sync-v1",
          workspaceId: "sample-yieldpassport",
          ledgerHash: "b".repeat(64),
          syncedCount: body.sourceReview.items.length,
          records: body.sourceReview.items.map(
            (item: { clauseId: string; jurisdiction: string; citation: string; reviewStatus: string }, index: number) => ({
              recordVersion: "lexproof-source-review-record-v1",
              id: `source-review-record-${index + 1}`,
              workspaceId: "sample-yieldpassport",
              ledgerHash: "b".repeat(64),
              sourceReviewItemId: `source-review-${item.clauseId}`,
              clauseId: item.clauseId,
              jurisdiction: item.jurisdiction,
              regulator: "Reviewer",
              citation: item.citation,
              sourceName: "Reviewed source",
              sourceUrl: "https://example.test/source",
              reviewStatus: item.reviewStatus,
              priority: item.reviewStatus === "metadata-missing" ? "P0" : item.reviewStatus === "review-due" ? "P1" : "P2",
              effectiveAsOf: "2024-06-30",
              lastReviewedAt: "2026-06-01",
              nextReviewDueAt: "2026-09-01",
              reviewerNotes: "Review source freshness before counsel handoff.",
              nextAction: "Refresh source metadata before counsel handoff.",
              status: item.reviewStatus === "current" ? "current" : "pending-review",
              matchingBehaviorChanged: false,
              createdBy: "Compliance",
              createdAt: "2026-10-01T00:00:00.000Z",
              notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
            })
          ),
          notLegalAdviceBoundary: "Not legal advice. Source review records are audit preparation lineage metadata only."
        },
        201
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const ledger = screen.getByRole("region", { name: /Source Review Ledger/i });
    fireEvent.change(within(ledger).getByLabelText(/Source Review API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.click(within(ledger).getByRole("button", { name: /Sync Source Review Ledger/i }));

    expect(await within(ledger).findByText(/Source review ledger synced/i)).toBeInTheDocument();
    expect(within(ledger).getByText(/Matching behavior unchanged/i)).toBeInTheDocument();
    expect(within(ledger).getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("includes the Source Update Approval Queue in the Counsel Pack Markdown preview when approvals are open", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));

    try {
      render(<App />);
      vi.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

      const memo = await screen.findByText(/## Source Update Approval Queue/i);

      expect(memo).toHaveClass("memo");
      expect(memo).toHaveTextContent(/Not legal advice. Source update approvals are audit preparation workflow metadata only./i);
      expect(memo).toHaveTextContent(
        /Source updates cannot change matching behavior until counsel or compliance review records the refreshed source metadata./i
      );
      expect(memo).toHaveTextContent(/- Queue status: needs-approval/i);
      expect(memo.textContent ?? "").not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it("includes Source Freshness Board scheduling metadata in the Counsel Pack preview", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));

    try {
      render(<App />);
      vi.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

      const memo = await screen.findByText(/## Source Freshness Board/i);

      expect(memo).toHaveClass("memo");
      expect(memo).toHaveTextContent(/Not legal advice. Source freshness boards are audit preparation scheduling metadata only./i);
      expect(memo).toHaveTextContent(/- Board status: attention-needed/i);
      expect(memo).toHaveTextContent(/- Board hash: [a-f0-9]{64}/i);
      expect(memo).toHaveTextContent(/- Overdue sources: [1-9]/i);
      expect(memo.textContent ?? "").not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads a judge-ready demo scenario from the seeded scenario library", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Demo Scenario Library/i })).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Demo scenarios are synthetic audit preparation paths only./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /High-risk RWA launch/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /AI legal workflow review/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/High-risk RWA launch proof signals/i)).toHaveTextContent(
      /10 steps \/ 3 artifacts \/ 7 source-control signals/i
    );
    expect(screen.getByLabelText(/High-risk RWA launch proof signals/i)).toHaveTextContent(
      /Not legal advice. Demo scenario proof signals are audit preparation readiness metadata only./i
    );
    expect(screen.getByLabelText(/High-risk RWA launch proof signals/i)).toHaveTextContent(/NYDFS BitLicense/i);
    expect(screen.getByLabelText(/AI legal workflow review proof signals/i)).toHaveTextContent(/source-control signals/i);
    expect(screen.getAllByText(/GRC Ticket Export/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Start High-risk RWA launch/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("YieldPassport");
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));
    expect(await screen.findByText(/Yield-bearing or investment-like asset/i)).toBeInTheDocument();
    expect(screen.getAllByText(/23 NYCRR Part 200; NYDFS Updated Guidance on Custodial Structures, September 30, 2025/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New York NYDFS virtual-currency business activity and license-route evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New York NYDFS custody segregation, beneficial-interest, and disclosure evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Regulation \(EU\) 2022\/2554, DORA Articles 5-16, 17-23, and 28/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU DORA ICT risk management and incident-response evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Regulation \(EU\) 2023\/1113; EBA Travel Rule Guidelines under Regulation \(EU\) 2023\/1113/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU TFR crypto-asset transfer information register/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Regulation \(EU\) 2022\/858, Articles 2, 4, 5, 6, 7, 8, and 9/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU DLT financial-instrument and market-infrastructure perimeter evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FinCEN FIN-2019-G001; 31 C\.F\.R\. 1022\.210; 31 C\.F\.R\. 1010\.410\(e\)-\(f\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/US FinCEN CVC MSB activity-scope and AML program evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /GRC Ticket Export/i })).toBeInTheDocument();
  });

  it("starts the AI legal workflow scenario in Model Intake with synthetic facts", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start AI legal workflow review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("LexAssist Evidence Desk");
    expect(await screen.findByRole("heading", { name: /Model Intake/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Model Intake JSON/i })).toBeInTheDocument();
    expect(screen.getByText(/AI events are audit-prep records for human review. Not legal advice/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      (await screen.findAllByText(/NIST AI RMF 1\.0 and NIST AI 600-1 Generative AI Profile/i)).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/US legal AI professional responsibility counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/US AI governance \/ model risk counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Model AI Governance Framework for Agentic AI/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore agentic AI action-space and human-approval evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore agentic AI logging, monitoring, and user-responsibility evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore AI governance \/ agentic AI counsel/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/MAS Notice PSN02 and Guidelines to Notice PSN02/i)).toHaveLength(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  }, 20000);

  it("starts the DAO proposal scenario with source-backed governance controls", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start DAO proposal review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("ClauseGuard DAO");
    expect(await screen.findByRole("heading", { name: "Human Review", level: 2 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/SEC Release No\. 81207, The DAO Report, July 25, 2017/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CFTC Release No\. 8590-22; CFTC v\. Ooki DAO default judgment, June 8, 2023/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CFTC bZeroX \/ Ooki DAO enforcement action and default judgment/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Regulation \(EU\) 2023\/1114, Recital 22 and Article 2\(1\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU MiCA DAO \/ CASP perimeter counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU MiCA DAO decentralisation and intermediary evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Brazil VASP scenario in the source graph with official-source gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Brazil VASP source review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Brazil VASP Launch Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      (await screen.findAllByText(/Law No. 14,478\/2022 and Banco Central virtual asset service regulation/i)).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/CVM Guidance Opinion 40, 11 October 2022/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brazil virtual asset service scope and authorization intake/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brazil crypto-security classification and disclosure evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Singapore DPT custody scenario with MAS PSN02 AML/CFT and customer-asset safeguard gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Singapore DPT custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("HarborKey DPT Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/MAS Notice PSN02 and Guidelines to Notice PSN02/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore DPT AML\/CFT risk assessment and CDD evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore data redaction and model handoff evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MAS Guidelines PS-G03 on consumer protection safeguards by DPT service providers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore DPT customer asset segregation and safeguarding evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Singapore DPT custody disclosure and reconciliation evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Hong Kong VATP custody scenario with SFC custody evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Hong Kong VATP custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("HarborBridge VATP Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/SFC Guidelines for Virtual Asset Trading Platform Operators, Part X/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong VATP client asset custody and associated-entity evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong VATP wallet control, reconciliation, and compensation evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Hong Kong HKMA stablecoin issuer scenario with licensing, reserve, and AML evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Hong Kong HKMA stablecoin issuer review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("HarborMint Stablecoin Issuer Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /Stablecoins Ordinance \(Cap\. 656\); HKMA Regulatory Regime for Stablecoin Issuers, 1 August 2025; HKMA Supervisory and AML\/CFT Guidelines, August 2025/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong HKMA stablecoin issuer licensing and activity-scope evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong HKMA stablecoin reserve, redemption, and supervision evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong HKMA stablecoin AML\/CFT and user-protection evidence/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/SFC Guidelines for Virtual Asset Trading Platform Operators, Part X/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Hong Kong SFC tokenised product scenario with primary and secondary trading evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Hong Kong tokenised product review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("HarborYield Tokenised Product Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /SFC Circular Ref\. 26EC22, Tokenisation of SFC-authorised investment products, 20 April 2026; SFC Circular Ref\. 26EC23, Secondary trading of tokenised SFC-authorised investment products, 20 April 2026/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong SFC tokenised product authorisation and consultation evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong SFC tokenisation arrangement, ownership-record, and smart-contract evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hong Kong SFC secondary trading fair-pricing, liquidity, and disclosure evidence/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Stablecoins Ordinance \(Cap\. 656\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SFC Guidelines for Virtual Asset Trading Platform Operators, Part X/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Japan crypto custody scenario with FSA custody evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Japan crypto custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("SakuraKey Crypto Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /FSA Guidelines for Supervision of Crypto-Asset Exchange Service Providers; FSA Regulating the crypto assets landscape in Japan, December 2022/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Japan crypto-asset exchange \/ custody counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Japan FSA registration and user-asset protection evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Canada CTP custody scenario with CSA PRU custody evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Canada CTP custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("MapleVault CTP Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /CSA Staff Notice 21-332 Crypto Asset Trading Platforms: Pre-Registration Undertakings; Joint CSA\/IIROC Staff Notice 21-329/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Canada crypto asset trading platform counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Canada CTP registration, PRU, and investor-protection evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Australia digital asset scenario with ASIC and AUSTRAC evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Australia digital asset review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("SouthernCross Digital Asset Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /ASIC INFO 225 Digital assets: Financial products and services; ASIC RG 133; AUSTRAC virtual asset designated services and obligations guidance/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Australia digital assets \/ AML-CTF counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Australia/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Korea VASP user protection scenario with FSC and KoFIU evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Korea VASP user protection review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("HanRiver VASP User Protection Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /FSC Virtual Asset User Protection Act implementation; Enforcement Decree; KoFIU VASP reporting and AML guidance/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/South Korea virtual asset \/ AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Korea VASP user-asset protection, custody, and disclosure evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Korea KoFIU VASP reporting, AML\/CFT, CDD, and STR evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the India VDA PMLA scenario with FIU-IND evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start India VDA PMLA review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Mumbai VDA PMLA Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /PMLA VDA Notification S\.O\. 1072\(E\), 7 March 2023; FIU-IND AML\/CFT Guidelines for Reporting Entities Providing Services Related to VDAs, 10 March 2023/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/India VDA \/ PMLA AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/India VDA SP FIU-IND registration and activity-scope evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/India VDA AML\/CFT reporting, CDD\/EDD, STR, and Travel Rule evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Thailand digital asset custody scenario with SEC and AMLO evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Thailand digital asset custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Bangkok Digital Asset Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/Emergency Decree on Digital Asset Businesses B\.E\. 2561 \(2018\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Thailand digital asset \/ AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Thailand digital asset business license, custody, and client-asset evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Thailand AMLO AML\/CDD and high-risk customer controls/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Indonesia OJK crypto trading scenario with licensing, whitelist, and governance gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Indonesia OJK crypto trading review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Jakarta OJK Crypto Trading Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/OJK POJK Number 27 of 2024, as amended by POJK Number 23 of 2025/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Indonesia digital financial asset \/ crypto regulatory counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Indonesia OJK digital financial asset trading licensing and whitelist evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Indonesia OJK trading governance, product, and reporting controls/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Malaysia digital asset exchange scenario with SC and BNM evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Malaysia digital asset exchange review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Kuala Lumpur Digital Asset Exchange Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/Guidelines on Digital Assets issued 28 October 2020, revised 19 August 2024/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Malaysia digital asset \/ AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Malaysia SC DAX\/DAC registration, trading, and custody evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Malaysia BNM digital currency AML\/CFT reporting-institution controls/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Philippines VASP custody scenario with BSP evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Philippines VASP custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Manila VASP Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/Circular No\. 1108, Guidelines for Virtual Asset Service Providers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Philippines virtual asset \/ AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Philippines BSP VASP registration, activity, and custody-scope evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Philippines BSP AML\/CFT due-diligence, monitoring, and STR controls/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the South Africa CASP Travel Rule scenario with FSCA and FIC evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start South Africa CASP Travel Rule review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Cape Town CASP Travel Rule Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/Declaration of a crypto asset as a financial product/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FIC Directive 9 concerning the implementation of the Travel Rule/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/South Africa financial services \/ AML counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/South Africa FSCA CASP\/FSP licensing and activity-scope evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/South Africa FIC Travel Rule, RMCP, and transfer-control evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the UK cryptoasset AML scenario with FCA registration and Travel Rule gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start UK cryptoasset AML review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Thames Cryptoasset AML Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /FCA Cryptoassets: AML\/CTF regime; Cryptoassets: What we expect to see in your application for registration; FCA Travel Rule expectations, 17 August 2023/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK cryptoasset AML \/ financial crime counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK FCA cryptoasset MLR registration and activity-scope evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK cryptoasset AML controls, SAR, sanctions, and Travel Rule evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Germany MiCAR custody scenario with BaFin custody evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Germany MiCAR custody review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("RhineVault MiCAR Custody Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(/Regulation \(EU\) 2023\/1114 Articles 60, 62, and 75; BaFin\/Bundesbank MiCAR supervisory information/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Germany BaFin \/ MiCAR crypto custody counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/custody safeguarding and client-position evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the UAE VARA operating scenario with activity-scope and custody source gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start UAE VARA operating review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Dubai VARA Operating Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/VARA Virtual Assets and Related Activities Regulations 2023/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/VARA Compliance and Risk Management Rulebook/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE virtual-assets \/ financial regulatory counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE virtual asset activity scope and licensing evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE compliance, AML\/CFT, and audit control evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE client virtual asset custody and proof-of-reserves evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the Swiss FINMA stablecoin scenario with token and stablecoin evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Swiss FINMA stablecoin review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("Helvetia Stablecoin Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(screen.getAllByText(/FINMA ICO Guidelines, 16 February 2018/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FINMA Guidance 06\/2024, Stablecoins, 26 July 2024/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swiss stablecoin \/ financial services counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swiss token classification memo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swiss stablecoin issuer and bank-guarantee perimeter evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swiss stablecoin AML, sanctions, and transfer-risk evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the US GENIUS Act stablecoin scenario with issuer, reserve, AML, and sanctions evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start US GENIUS Act stablecoin review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("LibertyDollar Stablecoin Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(
        /GENIUS Act, Pub\. L\. 119-27, 12 U\.S\.C\. 5901 et seq\.; Treasury GENIUS Act implementation NPRMs, 2026; OCC Bulletin 2026-3/i
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/US payment stablecoin \/ GENIUS Act counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/US GENIUS Act permitted-issuer, reserve, and redemption evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/US GENIUS Act BSA\/AML and sanctions program evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the EU MiCA ART/EMT stablecoin scenario with issuer, white paper, reserve, and redemption evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start EU MiCA ART\/EMT stablecoin review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("EuroMint MiCA Stablecoin Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(/Regulation \(EU\) 2023\/1114, Titles III-IV, Articles 16, 36, 39, 48, 49, 51, and 55/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU MiCA stablecoin issuer counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU MiCA ART\/EMT issuer authorisation and white-paper evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EU MiCA ART\/EMT reserve, redemption, and recovery evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the UK qualifying stablecoin scenario with issuer, backing, safeguarding, and redemption evidence gaps", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start UK qualifying stablecoin issuer review/i }));

    expect(screen.getByLabelText(/Project name/i)).toHaveValue("SterlingMint Stablecoin Review");
    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));

    expect(
      screen.getAllByText(/FCA PS26\/10 Stablecoin issuance, 30 June 2026; BoE\/FCA joint approach to systemic stablecoin issuers, June 2026/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK qualifying stablecoin \/ FCA-BoE counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK qualifying stablecoin issuer permission, admission, and disclosure evidence/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UK qualifying stablecoin backing, safeguarding, and redemption evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  });

  it("starts the marketing claims scenario with promotion source gaps and the marketing counsel template", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start Marketing claims review/i }));

    const projectWorkspace = within(screen.getByRole("complementary", { name: /Project workspace/i }));
    expect(projectWorkspace.getByLabelText(/Project name/i)).toHaveValue("SignalBridge Marketing Review");
    expect(await screen.findByRole("heading", { name: "Counsel Pack", level: 2 })).toBeInTheDocument();
    const counselPack = screen.getByRole("heading", { name: "Counsel Pack", level: 2 }).closest("section");
    expect(counselPack).toBeInstanceOf(HTMLElement);
    const counselPackPanel = within(counselPack as HTMLElement);
    await waitFor(() => expect(counselPackPanel.getByLabelText(/Export template/i)).toHaveValue("marketing-claims"));
    expect(counselPackPanel.getAllByText(/Marketing Claims Review/i).length).toBeGreaterThan(0);
    expect(counselPackPanel.getAllByText(/Route source-triggered promotional risk flags to counsel without deciding legality./i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Risk Audit/i }));
    const commandCenter = within(screen.getByRole("region", { name: /Regulatory Command Center/i }));

    expect(commandCenter.getAllByText(/16 C\.F\.R\. Part 255/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/Regulation \(EU\) 2023\/1114, Articles 7-8/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/FCA PS23\/6 and FG23\/3/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/VARA Virtual Assets and Related Activities Regulations 2023/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/VARA Regulations on the Marketing of Virtual Assets and Related Activities 2024/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/US endorsement and material-connection disclosure evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/EU MiCA marketing communication identification and white-paper consistency evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/EU MiCA marketing notification and publication-timing evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/UK client categorisation and appropriateness evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/UAE VARA marketing approval and risk-warning evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getAllByText(/UAE VARA KOL, incentive, and marketing recordkeeping evidence/i).length).toBeGreaterThan(0);
    expect(commandCenter.getByText(/Not legal advice. Regulatory graph output is audit preparation material only./i)).toBeInTheDocument();
  }, 20000);

  it("routes stale marketing evidence recertification from the workspace action queue to the ledger", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Start Marketing claims review/i }));
      vi.useRealTimers();

      const actionQueue = screen.getByRole("region", { name: /Workspace Action Queue/i });

      expect(await within(actionQueue).findByText(/Recertify stale evidence/i)).toBeInTheDocument();
      expect(within(actionQueue).getByText(/Claims inventory/i)).toBeInTheDocument();
      expect(within(actionQueue).getByText(/Not legal advice/i)).toBeInTheDocument();

      fireEvent.click(within(actionQueue).getByRole("button", { name: /Open recertification queue/i }));

      expect(await screen.findByRole("heading", { name: /Evidence Ledger/i }, { timeout: 10000 })).toBeInTheDocument();
      expect(await screen.findByRole("region", { name: /Evidence Recertification Queue/i }, { timeout: 10000 })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  }, 20000);

  it("shows judge demo readiness and checks the Phase 2 API without private credentials", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn((_blob: Blob | MediaSource) => "blob:demo-runbook");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    const fetchMock = vi.fn(async (url: RequestInfo | URL) =>
      new Response(
        JSON.stringify(createDemoApiMockPayload(String(url))),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }

      return createObjectUrl(blob);
    });
    URL.revokeObjectURL = revokeObjectUrl;
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      const readinessHeading = screen.getByRole("heading", { name: /Judge Demo Readiness/i });
      const readinessPanel = readinessHeading.closest("section");

      expect(readinessPanel).not.toBeNull();
      const readiness = within(readinessPanel as HTMLElement);
      expect(readiness.getByText(/Not legal advice. Demo readiness checks are audit preparation readiness metadata only./i)).toBeInTheDocument();
      expect(readiness.getByText(/Phase 2 API preflight not checked/i)).toBeInTheDocument();
      expect(readiness.getByText(/Private credentials not required ready/i)).toBeInTheDocument();
      expect(readiness.getAllByText(/npm run verify/i).length).toBeGreaterThan(0);
      const smokeChecklist = within(readiness.getByRole("region", { name: /Demo Smoke Checklist/i }));
      expect(smokeChecklist.getByRole("heading", { name: /Demo Smoke Checklist/i })).toBeInTheDocument();
      expect(smokeChecklist.getByText(/Run verification/i)).toBeInTheDocument();
      expect(smokeChecklist.getByText(/Phase 2 API preflight/i)).toBeInTheDocument();
      expect(smokeChecklist.getByText(/Not legal advice. Demo smoke checklists are audit preparation readiness metadata only./i)).toBeInTheDocument();

      fireEvent.change(readiness.getByLabelText(/Demo API base URL/i), { target: { value: "http://127.0.0.1:8787" } });
      fireEvent.click(readiness.getByRole("button", { name: /Check Demo API/i }));

      expect(await readiness.findByText(/Phase 2 API preflight ready/i)).toBeInTheDocument();
      expect(readiness.getAllByText(/lexproof-phase-2-backend-v1/i).length).toBeGreaterThan(0);
      expect(readiness.getByText(/modelGateway: mock-run-ready/i)).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8787/api/health", { method: "GET" });
      expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8787/api/preflight", { method: "GET" });
      expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8787/api/workspaces/demo-smoke-preflight/reviews/queue", {
        method: "GET"
      });

      await act(async () => {
        fireEvent.click(smokeChecklist.getByRole("button", { name: /Download Demo Smoke Checklist JSON/i }));
      });

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      const smokePayload = await readAppBlobText(capturedBlobs[0]);
      const parsedSmoke = JSON.parse(smokePayload);
      expect(parsedSmoke).toEqual(
        expect.objectContaining({
          checklistVersion: "lexproof-demo-smoke-checklist-v1",
          status: "ready",
          commandCount: 6,
          notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
        })
      );
      expect(smokePayload).toContain("npm run verify");
      expect(smokePayload).toContain("npm run demo:smoke");
      expect(smokePayload).toContain("phase-2-api-preflight");
      expect(smokePayload).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);

      await waitFor(() => expect(readiness.getByRole("button", { name: /Download Demo Runbook JSON/i })).toBeEnabled());
      await act(async () => {
        fireEvent.click(readiness.getByRole("button", { name: /Download Demo Runbook JSON/i }));
      });

      await waitFor(() => expect(capturedBlobs.length).toBe(2));
      expect(click).toHaveBeenCalledTimes(2);
      const payload = await readAppBlobText(capturedBlobs[1]);
      const parsed = JSON.parse(payload);
      expect(parsed).toEqual(
        expect.objectContaining({
          runbookVersion: "lexproof-demo-runbook-v1",
          status: "ready",
          apiPreflightStatus: "ready",
          notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
        })
      );
      expect(parsed.runbookHash).toMatch(/^[a-f0-9]{64}$/);
      expect(payload).toContain("Model Connect");
      expect(payload).toContain("Evidence Vault");
      expect(payload).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));
      const exportInventory = within(await screen.findByRole("region", { name: /Export Safety Inventory/i }));
      await waitFor(() => {
        expect(exportInventory.getByText("API Preflight Report JSON")).toBeInTheDocument();
        expect(exportInventory.getByText("Keep API Preflight Report JSON with the judge handoff packet; 8/8 safe route checks passed.")).toBeInTheDocument();
        expect(exportInventory.getByText("Demo Smoke Checklist JSON")).toBeInTheDocument();
        expect(
          exportInventory.getByText("Keep the Demo Smoke Checklist with judge setup notes; 6 commands and 8 smoke steps are represented.")
        ).toBeInTheDocument();
        expect(exportInventory.getAllByText(/Hash aaaaaaaaaaaa/i).length).toBeGreaterThan(0);
      });
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("shows and downloads the judge Submission Pack from Sources", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:submission-pack");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      const submissionPack = await screen.findByRole("region", { name: /Submission Pack/i });
      expect(within(submissionPack).getByText(/Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only./i)).toBeInTheDocument();
      await waitFor(() => {
        expect(within(submissionPack).getByRole("heading", { name: /Known limitations/i })).toBeInTheDocument();
        expect(within(submissionPack).getByRole("heading", { name: /Export safety summary/i })).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Handoff needs action/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/External model providers remain disabled/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Manifest hash/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Regulatory Source Pack hash/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Source Coverage hash/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Source Coverage status/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText(/Demo Runbook hash/i)).toBeInTheDocument();
        expect(within(submissionPack).getByText("Regulatory Source Coverage JSON", { exact: true })).toBeInTheDocument();
        expect(within(submissionPack).getByText("Demo Runbook JSON", { exact: true })).toBeInTheDocument();
      });

      const downloadButton = await within(submissionPack).findByRole("button", { name: /Download Submission Pack JSON/i });
      await waitFor(() => expect(downloadButton).not.toBeDisabled());
      fireEvent.click(downloadButton);

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:submission-pack");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Submission Pack JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          packVersion: "lexproof-submission-pack-v1",
          targetHackathon: "BLI Legal Tech Hackathon 2",
          packHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          exportSafetySummary: expect.objectContaining({
            status: "needs-action",
            exportHandoffAllowed: false,
            manifestReady: true,
            regulatorySourcePackReady: true,
            regulatorySourceCoverageReady: true,
            demoRunbookReady: false,
            notLegalAdviceBoundary: "Not legal advice. Submission export safety is audit preparation handoff metadata only."
          }),
          notLegalAdviceBoundary:
            "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only."
        })
      );
      expect(parsed.regulatorySourceCoverageHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.regulatorySourceCoverageStatus).toBe("needs-evidence");
      expect(parsed.sourceCoverageJurisdictionCount).toBeGreaterThan(0);
      expect(parsed.sourceCoverageOpenEvidenceRequestCount).toBeGreaterThan(0);
      expect(parsed.exportSafetySummary.nextActions).toEqual(
        expect.arrayContaining([
          "Save a Counsel Pack version to lock Markdown and source-pack hashes.",
          "Complete Demo API preflight and download the Demo Runbook JSON before judge handoff."
        ])
      );
      expect(parsed.demoRunbookHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.requiredAssets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: "Demo Runbook JSON",
            status: "needs-action"
          }),
          expect.objectContaining({
            label: "Regulatory Source Coverage JSON",
            status: "needs-action"
          })
        ])
      );
      expect(parsed.knownLimitations.map((item: { id: string }) => item.id)).toEqual(
        expect.arrayContaining(["not-legal-advice", "local-first-storage", "simulated-anchor"])
      );
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
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
    const aiReviewPanel = screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement;
    const aiReview = within(aiReviewPanel);
    fireEvent.click(aiReview.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await security.findByText(/Model provider ready/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(security.getByText(/Mock local reviewer/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    const evidencePanel = screen.getByRole("heading", { name: /Evidence Ledger/i }).closest("section") as HTMLElement;
    const evidenceLedger = within(evidencePanel);
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence label/i), { target: { value: "Unsafe security packet" } });
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(evidenceLedger.getByRole("button", { name: /Add evidence item/i }));

    expect(await security.findByText(/Evidence storage blocked/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(security.getAllByText(/Remove blocked materials before Evidence Vault sync or export handoff./i).length).toBeGreaterThan(0);
    expect(security.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(security.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  }, 60000);

  it("downloads a metadata-only Model Connect receipt without exposing session credentials", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:model-connect-receipt");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
      const aiReviewPanel = screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement;
      const aiReview = within(aiReviewPanel);
      fireEvent.click(aiReview.getByRole("button", { name: /Validate Model Connect/i }));

      expect(await aiReview.findByText(/Model Connect receipt/i, {}, { timeout: 10000 })).toBeInTheDocument();
      fireEvent.click(aiReview.getByRole("button", { name: /Download Model Connect Receipt JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:model-connect-receipt");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Model Connect receipt JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          receiptVersion: "lexproof-model-connect-receipt-v1",
          provider: "mock",
          mode: "local-mock",
          status: "ready",
          notLegalAdviceBoundary: "Not legal advice. Model Connect validates audit-prep routing only."
        })
      );
      expect(payload).not.toContain("apiKey");
      expect(payload).not.toContain("sk-");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  }, 20000);

  it("shows recoverable AI Review provider errors without leaking provider secrets or legal conclusions", async () => {
    const apiKey = "sk-live-abcdefghijklmnopqrstuvwxyz123456";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const fetchMock = vi.fn(async () =>
      appJsonResponse(
        {
          error: `Provider rejected api_key=${apiKey} after raw KYC passport data and private key ${privateKey}; final legal decision required.`,
          code: "MODEL_PROVIDER_REJECTED",
          recoveryAction: `Rotate private key ${privateKey}, remove passport data, then retry without legal opinion reliance.`,
          notLegalAdviceBoundary: "Not legal advice. Model provider errors are audit preparation workflow metadata only."
        },
        429
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    const aiReviewPanel = screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement;
    const aiReview = within(aiReviewPanel);
    fireEvent.change(aiReview.getByLabelText("Provider"), { target: { value: "openai-compatible" } });
    fireEvent.change(aiReview.getByLabelText("Base URL"), { target: { value: "https://api.lexproof-model.test/v1" } });
    fireEvent.change(aiReview.getByLabelText("Model name"), { target: { value: "gpt-review" } });
    fireEvent.change(aiReview.getByLabelText("API key"), { target: { value: "sk-test-session-only" } });
    fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await screen.findByText(/Model Connect receipt/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Run AI Review/i }));

    const errorAlert = await aiReview.findByRole("alert");
    expect(within(errorAlert).getByText(/Provider rejected/i)).toBeInTheDocument();
    expect(within(errorAlert).getByText(/Rotate \[redacted-private-key\]/i)).toBeInTheDocument();
    expect(
      within(errorAlert).getByText(/Not legal advice. Model provider errors are audit preparation workflow metadata only./i)
    ).toBeInTheDocument();
    const errorText = errorAlert.textContent ?? "";
    expect(errorText).not.toContain(apiKey);
    expect(errorText).not.toContain(privateKey);
    expect(errorText).not.toMatch(/raw KYC|passport data|legal opinion|final legal decision/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 15000);

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
    const aiReviewPanel = screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement;
    const aiReview = within(aiReviewPanel);
    fireEvent.click(aiReview.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await registry.findByText(/Server model provider disabled/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(registry.getByText(/Local mock route is ready; the real server provider remains disabled by default./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    const evidencePanel = screen.getByRole("heading", { name: /Evidence Ledger/i }).closest("section") as HTMLElement;
    const evidenceLedger = within(evidencePanel);
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence label/i), { target: { value: "Unsafe adapter packet" } });
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
    fireEvent.change(evidenceLedger.getByLabelText(/Evidence content/i), {
      target: {
        value:
          "Contains private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, sk-live-abcdef1234567890, and raw KYC packet."
      }
    });
    fireEvent.click(evidenceLedger.getByRole("button", { name: /Add evidence item/i }));

    expect(await registry.findByText(/Object storage vault blocked/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(registry.getByText(/Document parser \/ OCR blocked/i)).toBeInTheDocument();
    expect(registry.getAllByText(/Remove blocked materials before enabling this adapter./i).length).toBeGreaterThan(0);
    expect(registry.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(registry.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  }, 30000);

  it("blocks chain anchor readiness for an empty evidence workspace", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registryPanel = registryHeading.closest("section");
    expect(registryPanel).not.toBeNull();
    const registry = within(registryPanel as HTMLElement);

    expect(await registry.findByText(/Chain anchor blocked/i)).toBeInTheDocument();
    expect(registry.getByText(/No metadata-only evidence records are available for anchor review./i)).toBeInTheDocument();
    expect(
      registry.getAllByText(/Add at least one metadata-only evidence item before chain anchor policy review./i).length
    ).toBeGreaterThan(0);
    expect(
      registry.getAllByText(/Add metadata-only evidence in the Evidence Ledger before enabling this adapter./i).length
    ).toBeGreaterThan(0);
    expect(
      registry.getAllByText(/Not legal advice. Integration adapter readiness is audit preparation metadata only./i).length
    ).toBeGreaterThan(0);
  }, 15000);

  it("downloads Integration Enablement Dossier and Gate JSON without enabling external adapters", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:integration-enablement-dossier");
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

      const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
      const registryPanel = registryHeading.closest("section");
      expect(registryPanel).not.toBeNull();
      const registry = within(registryPanel as HTMLElement);

      expect(await registry.findByRole("heading", { name: /Integration Enablement Dossier/i })).toBeInTheDocument();
      expect(await registry.findByText(/External enablement remains disabled/i)).toBeInTheDocument();
      expect(registry.getByText(/Dossier hash/i)).toBeInTheDocument();
      const gate = within(registry.getByRole("region", { name: /Integration Enablement Gate/i }));
      expect(await gate.findByText(/Gate hash/i)).toBeInTheDocument();
      expect(gate.getAllByText(/missing receipt/i).length).toBeGreaterThan(0);
      expect(gate.getByText(/Download Enablement Gate JSON/i)).toBeInTheDocument();
      const receiptCoverage = within(registry.getByRole("region", { name: /Integration Policy Receipt Coverage/i }));
      expect(receiptCoverage.getByText(/0\/4 receipts/i)).toBeInTheDocument();
      expect(receiptCoverage.getAllByText(/missing server receipt/i).length).toBeGreaterThanOrEqual(4);

      fireEvent.click(gate.getByRole("button", { name: /Download Enablement Gate JSON/i }));
      fireEvent.click(registry.getByRole("button", { name: /Download Enablement Dossier JSON/i }));

      const gatePayloadBlob = capturedBlobs[0];
      expect(gatePayloadBlob).toBeInstanceOf(Blob);
      if (!gatePayloadBlob) {
        throw new Error("Integration Enablement Gate did not create a blob.");
      }
      const gatePayload = await readAppBlobText(gatePayloadBlob);
      const parsedGate = JSON.parse(gatePayload);

      expect(parsedGate).toEqual(
        expect.objectContaining({
          gateVersion: "lexproof-integration-enablement-gate-v1",
          gateStatus: "blocked",
          externalEnablementAllowed: false,
          externalEnablementStatus: "blocked-by-policy",
          missingReceiptCount: 4,
          notLegalAdviceBoundary: "Not legal advice. Integration enablement gates are audit preparation workflow metadata only."
        })
      );
      expect(parsedGate.gateHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsedGate.queueItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "receipt-object-storage",
            status: "missing-receipt",
            externalCapabilityAllowed: false
          })
        ])
      );
      expect(gatePayload).not.toContain("sk-live-");

      const payloadBlob = capturedBlobs[1];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Integration Enablement Dossier did not create a blob.");
      }
      expect(createObjectUrl).toHaveBeenCalledTimes(2);
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          dossierVersion: "lexproof-integration-enablement-dossier-v1",
          externalEnablementAllowed: false,
          policyReportCount: 6,
          policyReceiptCoverageCount: 4,
          policyReceiptPresentCount: 0,
          policyReceiptCoveredCount: 0,
          policyReceiptMissingCount: 4,
          notLegalAdviceBoundary: "Not legal advice. Integration enablement dossiers are audit preparation metadata only."
        })
      );
      expect(parsed.dossierHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.policyReports.length).toBe(6);
      expect(parsed.policyReceiptCoverage).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            policyId: "object-storage",
            coverageStatus: "missing",
            externalCapabilityAllowed: false,
            recoveryAction: expect.stringContaining("Evaluate Object Storage Policy against the Phase 2 API")
          })
        ])
      );
      expect(payload).toContain("Not legal advice");
      expect(payload).not.toContain("sk-live-");
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:integration-enablement-dossier");
      expect(click).toHaveBeenCalledTimes(2);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  }, 20000);

  it("shows Model Gateway provider policy readiness before external server providers can be enabled", async () => {
    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registryPanel = registryHeading.closest("section");

    expect(registryPanel).not.toBeNull();
    const registry = within(registryPanel as HTMLElement);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    const aiReviewPanel = screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement;
    const aiReview = within(aiReviewPanel);
    fireEvent.click(aiReview.getByRole("button", { name: /Validate Model Connect/i }));

    expect(await registry.findByRole("heading", { name: /Model Gateway Provider Policy/i }, { timeout: 10000 })).toBeInTheDocument();
    const policy = within(registry.getByRole("region", { name: /Model Gateway Provider Policy/i }));
    expect(policy.getByText(/Mock local reviewer gateway ready/i)).toBeInTheDocument();
    expect(policy.getByText(/OpenAI-compatible gateway disabled/i)).toBeInTheDocument();
    expect(policy.getByText(/Enterprise model proxy gateway disabled/i)).toBeInTheDocument();
    expect(policy.getByText("Server-side secret policy")).toBeInTheDocument();
    expect(policy.getAllByText("Provider allowlist").length).toBeGreaterThan(0);
    expect(policy.getAllByText("Human review enforcement").length).toBeGreaterThan(0);
    expect(policy.getByRole("heading", { name: /Secret Policy Evaluation/i })).toBeInTheDocument();
    expect(policy.getByRole("button", { name: /Download Provider Policy JSON/i })).toBeEnabled();
    expect(policy.getByText(/Not legal advice. Model Gateway provider policy is audit preparation metadata only./i)).toBeInTheDocument();
  }, 20000);

  it("refreshes Model Gateway provider policy from the server API without collecting credentials", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/model-gateway/provider-policy");
      expect(init).toEqual({ method: "GET" });
      return appJsonResponse(
        {
          reportVersion: "lexproof-model-gateway-provider-policy-v1",
          generatedAt: "2026-06-30T00:00:00.000Z",
          overallStatus: "needs-policy",
          enabledProviderCount: 1,
          deferredProviderCount: 2,
          adapters: [
            {
              provider: "mock",
              label: "Mock local reviewer gateway",
              enabled: true,
              mode: "local-mock",
              credentialPolicy: "no credentials accepted",
              status: "ready",
              readinessEvidence: "Mock local reviewer gateway is enabled for metadata-only mock review.",
              requiredControls: ["redaction-gate", "human-review-enforcement"]
            },
            {
              provider: "openai-compatible",
              label: "OpenAI-compatible gateway",
              enabled: false,
              mode: "external-provider-placeholder",
              credentialPolicy: "deferred until server-side secret policy is approved",
              status: "disabled",
              readinessEvidence: "OpenAI-compatible gateway remains disabled until policy approval.",
              requiredControls: [
                "server-side-secret-policy",
                "provider-allowlist",
                "egress-logging",
                "redaction-gate",
                "human-review-enforcement"
              ],
              disabledReason: "External provider proxying is disabled until controls are approved."
            }
          ],
          controls: [
            {
              id: "server-side-secret-policy",
              label: "Server-side secret policy",
              status: "needs-policy",
              evidence: "No KMS-backed provider credential storage or secret rotation policy is approved yet.",
              recoveryAction: "Approve KMS-backed secret storage before external provider proxying."
            }
          ],
          nextActions: ["Keep external provider proxying disabled until provider allowlist and egress logging are reviewed."],
          notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const policy = within(registry.getByRole("region", { name: /Model Gateway Provider Policy/i }));

    fireEvent.change(policy.getByLabelText(/Provider Policy API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.click(policy.getByRole("button", { name: /Refresh Server Provider Policy/i }));

    expect(await policy.findByText(/Server provider policy synced/i)).toBeInTheDocument();
    expect(policy.getAllByText(/Server-side secret policy/i).length).toBeGreaterThan(0);
    expect(policy.getByText(/Not legal advice. Model Gateway provider policy is audit preparation metadata only./i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 20000);

  it("refreshes server provider policy with Model Connect receipt metadata but without the session API key", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/model-gateway/provider-policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body).toEqual({
        modelConnectReceipt: {
          provider: "openai-compatible",
          mode: "session-openai-compatible",
          status: "ready",
          blockers: []
        }
      });
      expect(String(init?.body)).not.toContain("sk-test-session-only");
      expect(String(init?.body)).not.toContain("api.lexproof-model.test");
      return appJsonResponse(
        {
          reportVersion: "lexproof-model-gateway-provider-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "needs-policy",
          enabledProviderCount: 1,
          deferredProviderCount: 2,
          adapters: [
            {
              provider: "mock",
              label: "Mock local reviewer gateway",
              enabled: true,
              mode: "local-mock",
              credentialPolicy: "no credentials accepted",
              status: "ready",
              readinessEvidence: "Mock local reviewer gateway is enabled for metadata-only mock review.",
              requiredControls: ["redaction-gate", "human-review-enforcement"]
            },
            {
              provider: "openai-compatible",
              label: "OpenAI-compatible gateway",
              enabled: false,
              mode: "external-provider-placeholder",
              credentialPolicy: "deferred until server-side secret policy is approved",
              status: "needs-policy",
              readinessEvidence:
                "OpenAI-compatible gateway has a session-only browser receipt, but server proxying remains disabled until provider policy controls are approved.",
              requiredControls: [
                "server-side-secret-policy",
                "provider-allowlist",
                "egress-logging",
                "redaction-gate",
                "human-review-enforcement"
              ]
            }
          ],
          controls: [
            {
              id: "server-side-secret-policy",
              label: "Server-side secret policy",
              status: "needs-policy",
              evidence: "No KMS-backed provider credential storage or secret rotation policy is approved yet.",
              recoveryAction: "Approve KMS-backed secret storage before external provider proxying."
            },
            {
              id: "redaction-gate",
              label: "Redaction Gate",
              status: "ready",
              evidence: "Model Connect has no current redaction blockers for audit-prep routing.",
              recoveryAction: "Keep Redaction Gate mandatory before any provider request."
            }
          ],
          nextActions: ["Approve server-side secret policy before enabling OpenAI-compatible gateway."],
          notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /AI Review/i }));
    const aiReview = within(screen.getByRole("heading", { name: "AI Review", level: 2 }).closest("section") as HTMLElement);
    fireEvent.change(aiReview.getByLabelText("Provider"), { target: { value: "openai-compatible" } });
    fireEvent.change(aiReview.getByLabelText("Base URL"), { target: { value: "https://api.lexproof-model.test/v1" } });
    fireEvent.change(aiReview.getByLabelText("Model name"), { target: { value: "gpt-review" } });
    fireEvent.change(aiReview.getByLabelText("API key"), { target: { value: "sk-test-session-only" } });
    fireEvent.click(screen.getByRole("button", { name: /Validate Model Connect/i }));

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const policy = within(registry.getByRole("region", { name: /Model Gateway Provider Policy/i }));

    fireEvent.change(policy.getByLabelText(/Provider Policy API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.click(policy.getByRole("button", { name: /Refresh Server Provider Policy/i }));

    expect(await policy.findByText(/Server provider policy synced/i)).toBeInTheDocument();
    expect(policy.getByText(/OpenAI-compatible gateway needs policy/i)).toBeInTheDocument();
    expect(policy.getByText(/No KMS-backed provider credential storage/i)).toBeInTheDocument();
    expect(policy.queryByText(/sk-test-session-only/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 20000);

  it("evaluates Model Gateway secret policy readiness without enabling external providers", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/model-gateway/secret-policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body).toEqual({
        policy: {
          policyOwner: "Security lead",
          kmsBackedStorageApproved: true,
          rotationDays: 30,
          accessReviewCadence: "quarterly",
          providerAllowlistApproved: true,
          egressLoggingApproved: true,
          incidentResponseRunbookApproved: true,
          noClientSecretPersistence: true,
          humanReviewRequired: true,
          notes: "Policy approved for future gateway review."
        }
      });
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          reportVersion: "lexproof-model-gateway-secret-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "ready",
          requiredControlCount: 7,
          approvedControlCount: 7,
          externalProviderProxyingAllowed: false,
          externalProviderProxyingStatus: "policy-ready-not-enabled",
          controls: [
            {
              id: "kms-secret-storage",
              label: "KMS-backed secret storage",
              status: "ready",
              evidence: "KMS-backed provider credential storage is approved for future server gateway review.",
              recoveryAction: "Keep KMS-backed secret storage mandatory before adapter enablement."
            },
            {
              id: "provider-allowlist",
              label: "Provider allowlist",
              status: "ready",
              evidence: "Provider allowlist is approved for future server gateway review.",
              recoveryAction: "Keep provider allowlist mandatory before adapter enablement."
            }
          ],
          nextActions: ["Keep external provider proxying disabled until an adapter enablement change is reviewed."],
          notLegalAdviceBoundary: "Not legal advice. Model Gateway secret policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const policy = within(registry.getByRole("region", { name: /Model Gateway Provider Policy/i }));

    fireEvent.change(policy.getByLabelText(/Provider Policy API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.change(policy.getByLabelText(/Secret policy owner/i), { target: { value: "Security lead" } });
    fireEvent.change(policy.getByLabelText(/Rotation days/i), { target: { value: "30" } });
    fireEvent.change(policy.getByLabelText(/Access review cadence/i), { target: { value: "quarterly" } });
    fireEvent.click(policy.getByLabelText(/KMS-backed secret storage/i));
    fireEvent.click(policy.getByLabelText(/Provider allowlist/i));
    fireEvent.click(policy.getByLabelText(/Egress logging/i));
    fireEvent.click(policy.getByLabelText(/Incident response runbook/i));
    fireEvent.change(policy.getByLabelText(/Secret policy notes/i), {
      target: { value: "Policy approved for future gateway review." }
    });
    fireEvent.click(policy.getByRole("button", { name: /Evaluate Server Secret Policy/i }));

    expect(await policy.findByText(/Secret policy report synced/i)).toBeInTheDocument();
    expect(policy.getAllByText(/KMS-backed secret storage/i).length).toBeGreaterThan(0);
    expect(policy.getByText(/External provider proxying remains disabled/i)).toBeInTheDocument();
    expect(policy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 20000);

  it("evaluates object storage policy readiness without enabling external storage", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/integrations/object-storage/policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.policy).toEqual({
        policyOwner: "Storage owner",
        retentionDays: 365,
        deletionSlaDays: 30,
        encryptionAtRestApproved: true,
        bucketAllowlistApproved: true,
        accessLoggingApproved: true,
        lifecyclePolicyApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Policy approved for future object storage review."
      });
      expect(body.context).toEqual(
        expect.objectContaining({
          workspaceId: "sample-yieldpassport",
          evidenceCount: expect.any(Number),
          retentionStatus: expect.any(String),
          vaultSyncAllowed: expect.any(Boolean),
          blockerCount: expect.any(Number),
          manifestHash: expect.stringMatching(/^[a-f0-9]{64}$/)
        })
      );
      expect(String(init?.body)).not.toContain("rawEvidence");
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          reportVersion: "lexproof-object-storage-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "ready",
          requiredControlCount: 10,
          approvedControlCount: 10,
          externalObjectStorageAllowed: false,
          externalObjectStorageStatus: "policy-ready-not-enabled",
          controls: [
            {
              id: "retention-boundary",
              label: "Retention boundary",
              status: "ready",
              evidence: "Retention policy is ready for metadata-only vault handoff.",
              recoveryAction: "Keep raw object storage disabled until adapter enablement review."
            },
            {
              id: "encryption-at-rest",
              label: "Encryption at rest",
              status: "ready",
              evidence: "Encryption at rest is approved for future object storage review.",
              recoveryAction: "Keep encryption mandatory before adapter enablement."
            }
          ],
          nextActions: ["Keep external object storage disabled until a separate storage adapter enablement review."],
          notLegalAdviceBoundary: "Not legal advice. Object storage policy is audit preparation metadata only.",
          evaluationRecord: {
            recordVersion: "lexproof-integration-policy-evaluation-record-v1",
            id: "integration-policy-evaluation-1111111111111111",
            workspaceId: body.context.workspaceId,
            policyId: "object-storage",
            reportVersion: "lexproof-object-storage-policy-v1",
            overallStatus: "ready",
            approvedControlCount: 10,
            requiredControlCount: 10,
            externalCapabilityAllowed: false,
            externalCapabilityStatus: "policy-ready-not-enabled",
            reportHash: "b".repeat(64),
            contextHash: "c".repeat(64),
            policyHash: "d".repeat(64),
            evaluatorId: "Storage owner",
            source: "server",
            createdAt: "2026-07-03T00:00:00.000Z",
            nextActions: ["Keep external object storage disabled until adapter enablement review."],
            notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
          }
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const storagePolicy = within(registry.getByRole("region", { name: /Object Storage Policy Evaluation/i }));

    fireEvent.change(storagePolicy.getByLabelText(/Storage Policy API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.change(storagePolicy.getByLabelText(/Storage policy owner/i), { target: { value: "Storage owner" } });
    fireEvent.change(storagePolicy.getByLabelText(/Retention days/i), { target: { value: "365" } });
    fireEvent.change(storagePolicy.getByLabelText(/Deletion SLA days/i), { target: { value: "30" } });
    fireEvent.click(storagePolicy.getByLabelText(/Encryption at rest/i));
    fireEvent.click(storagePolicy.getByLabelText(/Bucket allowlist/i));
    fireEvent.click(storagePolicy.getByLabelText(/Access logging/i));
    fireEvent.click(storagePolicy.getByLabelText(/Lifecycle policy/i));
    await waitFor(() => {
      expect(storagePolicy.getByLabelText(/Encryption at rest/i)).toBeChecked();
      expect(storagePolicy.getByLabelText(/Bucket allowlist/i)).toBeChecked();
      expect(storagePolicy.getByLabelText(/Access logging/i)).toBeChecked();
      expect(storagePolicy.getByLabelText(/Lifecycle policy/i)).toBeChecked();
      expect(storagePolicy.getByText("9/10")).toBeInTheDocument();
    });
    fireEvent.change(storagePolicy.getByLabelText(/Storage policy notes/i), {
      target: { value: "Policy approved for future object storage review." }
    });
    fireEvent.click(storagePolicy.getByRole("button", { name: /Evaluate Server Storage Policy/i }));

    expect(await storagePolicy.findByText(/Storage policy report synced/i)).toBeInTheDocument();
    const receipts = within(registry.getByRole("region", { name: /Integration Policy Evaluation Receipts/i }));
    expect(receipts.getByText(/1 recorded/i)).toBeInTheDocument();
    expect(receipts.getByText(/Object Storage Policy/i)).toBeInTheDocument();
    expect(receipts.getByText(/10\/10 controls ready; external capability is disabled/i)).toBeInTheDocument();
    expect(receipts.getByText(/Not legal advice. Integration policy evaluation records are audit preparation metadata only./i)).toBeInTheDocument();
    expect(storagePolicy.getAllByText(/External object storage remains disabled/i).length).toBeGreaterThan(0);
    expect(storagePolicy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 30000);

  it("refreshes persisted integration policy evaluation receipts from the Phase 2 API", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe(
        "https://api.lexproof.test/api/workspaces/sample-yieldpassport/integration-policy-evaluations"
      );
      expect(init).toEqual({ method: "GET" });
      return appJsonResponse(
        [
          {
            recordVersion: "lexproof-integration-policy-evaluation-record-v1",
            id: "integration-policy-evaluation-persisted-ui",
            workspaceId: "sample-yieldpassport",
            policyId: "document-parser",
            reportVersion: "lexproof-document-parser-policy-v1",
            overallStatus: "needs-policy",
            approvedControlCount: 7,
            requiredControlCount: 9,
            externalCapabilityAllowed: false,
            externalCapabilityStatus: "needs-policy",
            reportHash: "a".repeat(64),
            contextHash: "b".repeat(64),
            policyHash: "c".repeat(64),
            evaluatorId: "Integration policy evaluator",
            source: "server",
            createdAt: "2026-07-01T00:00:00.000Z",
            nextActions: ["Approve parser retention and access logging before adapter enablement review."],
            notLegalAdviceBoundary: "Not legal advice. Integration policy evaluation records are audit preparation metadata only."
          }
        ],
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const receipts = within(registry.getByRole("region", { name: /Integration Policy Evaluation Receipts/i }));

    fireEvent.change(receipts.getByLabelText(/Policy Receipts API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.click(receipts.getByRole("button", { name: /Refresh Policy Receipts/i }));

    expect(await receipts.findByText(/Policy receipts synced/i)).toBeInTheDocument();
    expect(receipts.getByText(/1 recorded/i)).toBeInTheDocument();
    expect(receipts.getByText(/Document Parser Policy/i)).toBeInTheDocument();
    expect(receipts.getByText(/7\/9 controls ready; external capability is disabled/i)).toBeInTheDocument();
    expect(receipts.getByText(/Not legal advice. Integration policy evaluation records are audit preparation metadata only./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(registry.getByText(/Server receipts/i).parentElement).toHaveTextContent("1");
    });
    const dossier = within(registry.getByRole("region", { name: /Integration Enablement Dossier/i }));
    const coverage = within(dossier.getByRole("region", { name: /Integration Policy Receipt Coverage/i }));
    await waitFor(() => expect(coverage.getByText(/1\/4 receipts/i)).toBeInTheDocument());
    expect(coverage.getByText(/server receipt needs policy/i)).toBeInTheDocument();
    expect(coverage.getAllByText(/Document Parser Policy/i).length).toBeGreaterThan(0);
    expect(coverage.getByText(/Server receipt integration-policy-evaluation-persisted-ui/i)).toBeInTheDocument();
    expect(coverage.getAllByText(/missing server receipt/i).length).toBeGreaterThanOrEqual(3);
    expect(coverage.getByText(/Not legal advice. Server policy receipts are audit preparation evidence/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("evaluates document parser policy readiness without enabling external parsing", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/integrations/document-parser/policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.policy).toEqual({
        policyOwner: "Document owner",
        maxDocumentSizeMb: 10,
        rawDocumentRetentionDays: 14,
        deletionSlaDays: 7,
        parsingPurpose: "Extract source citations for audit preparation.",
        redactionBeforeParsingApproved: true,
        noTrainingUseConfirmed: true,
        accessLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Policy approved for future document parser review."
      });
      expect(body.context).toEqual(
        expect.objectContaining({
          evidenceCount: expect.any(Number),
          retentionStatus: expect.any(String),
          vaultSyncAllowed: expect.any(Boolean),
          blockerCount: expect.any(Number),
          exportBlockerCount: expect.any(Number),
          manifestHash: expect.stringMatching(/^[a-f0-9]{64}$/)
        })
      );
      expect(String(init?.body)).not.toContain("rawDocumentBytes");
      expect(String(init?.body)).not.toContain("rawDocumentBody");
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          reportVersion: "lexproof-document-parser-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "ready",
          requiredControlCount: 10,
          approvedControlCount: 10,
          externalDocumentParsingAllowed: false,
          externalDocumentParsingStatus: "policy-ready-not-enabled",
          controls: [
            {
              id: "retention-boundary",
              label: "Retention boundary",
              status: "ready",
              evidence: "Retention policy is ready for metadata-only parser review.",
              recoveryAction: "Keep raw document parsing disabled until adapter enablement review."
            },
            {
              id: "redaction-before-parsing",
              label: "Redaction before parsing",
              status: "ready",
              evidence: "Redaction before parsing is approved.",
              recoveryAction: "Keep redaction mandatory before parser adapter enablement."
            }
          ],
          nextActions: ["Keep external document parsing disabled until a separate raw-document adapter enablement review."],
          notLegalAdviceBoundary: "Not legal advice. Document parser policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const parserPolicy = within(registry.getByRole("region", { name: /Document Parser Policy Evaluation/i }));

    fireEvent.change(parserPolicy.getByLabelText(/Document Parser API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.change(parserPolicy.getByLabelText(/Parser policy owner/i), { target: { value: "Document owner" } });
    fireEvent.change(parserPolicy.getByLabelText(/Max document size MB/i), { target: { value: "10" } });
    fireEvent.change(parserPolicy.getByLabelText(/Raw document retention days/i), { target: { value: "14" } });
    fireEvent.change(parserPolicy.getByLabelText(/Parser deletion SLA days/i), { target: { value: "7" } });
    fireEvent.change(parserPolicy.getByLabelText(/Parsing purpose/i), {
      target: { value: "Extract source citations for audit preparation." }
    });
    fireEvent.click(parserPolicy.getByLabelText(/Redaction before parsing/i));
    fireEvent.click(parserPolicy.getByLabelText(/No model training use/i));
    fireEvent.click(parserPolicy.getByLabelText(/Parser access logging/i));
    await waitFor(() => {
      expect(parserPolicy.getByLabelText(/Redaction before parsing/i)).toBeChecked();
      expect(parserPolicy.getByLabelText(/No model training use/i)).toBeChecked();
      expect(parserPolicy.getByLabelText(/Parser access logging/i)).toBeChecked();
      expect(parserPolicy.getByText("9/10")).toBeInTheDocument();
    });
    fireEvent.change(parserPolicy.getByLabelText(/Parser policy notes/i), {
      target: { value: "Policy approved for future document parser review." }
    });
    fireEvent.click(parserPolicy.getByRole("button", { name: /Evaluate Server Parser Policy/i }));

    expect(await parserPolicy.findByText(/Parser policy report synced/i)).toBeInTheDocument();
    expect(parserPolicy.getAllByText(/External document parsing remains disabled/i).length).toBeGreaterThan(0);
    expect(parserPolicy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 30000);

  it("evaluates chain anchor policy readiness without enabling external chain writes", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/integrations/chain-anchor/policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.policy).toEqual({
        policyOwner: "Web3 owner",
        targetNetwork: "ethereum-sepolia",
        walletCustodyModel: "Multisig policy wallet",
        signerRole: "Compliance reviewer",
        transactionLoggingApproved: true,
        privacyReviewApproved: true,
        publicPayloadLimitedApproved: true,
        userConsentApproved: true,
        noRawEvidenceOnChainConfirmed: true,
        humanReviewRequired: true,
        notes: "Policy approved for future chain anchor review."
      });
      expect(body.context).toEqual(
        expect.objectContaining({
          evidenceCount: expect.any(Number),
          retentionStatus: expect.any(String),
          vaultSyncAllowed: expect.any(Boolean),
          blockerCount: expect.any(Number),
          exportBlockerCount: expect.any(Number),
          manifestHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          counselPackVersionCount: expect.any(Number),
          simulatedAnchorAvailable: true
        })
      );
      expect(String(init?.body)).not.toContain("privateKey");
      expect(String(init?.body)).not.toContain("signedTransaction");
      expect(String(init?.body)).not.toContain("rawEvidenceBody");
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("sk-");
      return appJsonResponse(
        {
          reportVersion: "lexproof-chain-anchor-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "ready",
          requiredControlCount: 10,
          approvedControlCount: 10,
          externalChainAnchoringAllowed: false,
          externalChainAnchoringStatus: "policy-ready-not-enabled",
          anchorMode: "simulated-only",
          controls: [
            {
              id: "manifest-linkage",
              label: "Manifest linkage",
              status: "ready",
              evidence: "Manifest hash is available for simulated anchor review.",
              recoveryAction: "Keep chain writes disabled until wallet signing review."
            },
            {
              id: "privacy-review",
              label: "Privacy review",
              status: "ready",
              evidence: "Privacy review is approved for future chain anchor review.",
              recoveryAction: "Keep privacy review mandatory before transaction enablement."
            }
          ],
          nextActions: ["Keep chain anchoring simulated until a separate wallet signing and transaction enablement review."],
          notLegalAdviceBoundary: "Not legal advice. Chain anchor policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const anchorPolicy = within(registry.getByRole("region", { name: /Chain Anchor Policy Evaluation/i }));

    fireEvent.change(anchorPolicy.getByLabelText(/Chain Anchor API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.change(anchorPolicy.getByLabelText(/Anchor policy owner/i), { target: { value: "Web3 owner" } });
    fireEvent.change(anchorPolicy.getByLabelText(/Anchor network/i), { target: { value: "ethereum-sepolia" } });
    fireEvent.change(anchorPolicy.getByLabelText(/Wallet custody policy/i), { target: { value: "Multisig policy wallet" } });
    fireEvent.change(anchorPolicy.getByLabelText(/Signer role/i), { target: { value: "Compliance reviewer" } });
    fireEvent.click(anchorPolicy.getByLabelText(/Transaction logging/i));
    fireEvent.click(anchorPolicy.getByLabelText(/Privacy review/i));
    fireEvent.click(anchorPolicy.getByLabelText(/Public payload limited/i));
    fireEvent.click(anchorPolicy.getByLabelText(/User consent recorded/i));
    fireEvent.click(anchorPolicy.getByLabelText(/No raw evidence on-chain/i));
    await waitFor(() => {
      expect(anchorPolicy.getByLabelText(/Transaction logging/i)).toBeChecked();
      expect(anchorPolicy.getByLabelText(/Privacy review/i)).toBeChecked();
      expect(anchorPolicy.getByLabelText(/Public payload limited/i)).toBeChecked();
      expect(anchorPolicy.getByLabelText(/User consent recorded/i)).toBeChecked();
      expect(anchorPolicy.getByLabelText(/No raw evidence on-chain/i)).toBeChecked();
      expect(anchorPolicy.getByText("9/10")).toBeInTheDocument();
    });
    fireEvent.change(anchorPolicy.getByLabelText(/Anchor policy notes/i), {
      target: { value: "Policy approved for future chain anchor review." }
    });
    fireEvent.click(anchorPolicy.getByRole("button", { name: /Evaluate Server Anchor Policy/i }));

    expect(await anchorPolicy.findByText(/Anchor policy report synced/i)).toBeInTheDocument();
    expect(anchorPolicy.getAllByText(/External chain anchoring remains disabled/i).length).toBeGreaterThan(0);
    expect(anchorPolicy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 30000);

  it("evaluates GRC destination policy readiness without creating external tickets", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.lexproof.test/api/integrations/grc-destination/policy");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body ?? "{}"));
      expect(body.policy).toEqual({
        policyOwner: "GRC owner",
        destinationSystem: "jira",
        destinationQueue: "LEGAL-AUDIT",
        fieldMappingApproved: true,
        authenticationPolicyApproved: true,
        redactionPolicyApproved: true,
        ticketOwnershipApproved: true,
        retryAndAuditLoggingApproved: true,
        noSensitiveMaterialConfirmed: true,
        humanReviewRequired: true,
        notes: "Policy approved for future GRC destination review."
      });
      expect(body.context).toEqual(
        expect.objectContaining({
          remediationItemCount: expect.any(Number),
          exportSafetyStatus: expect.any(String),
          exportBlockerCount: expect.any(Number),
          integrationAdapterStatus: expect.any(String),
          localTicketExportAvailable: expect.any(Boolean)
        })
      );
      expect(String(init?.body)).not.toContain("apiKey");
      expect(String(init?.body)).not.toContain("webhookSecret");
      expect(String(init?.body)).not.toContain("rawTicketBody");
      expect(String(init?.body)).not.toContain("sk-");
      expect(String(init?.body)).not.toContain("passport data");
      return appJsonResponse(
        {
          reportVersion: "lexproof-grc-destination-policy-v1",
          generatedAt: "2026-07-01T00:00:00.000Z",
          overallStatus: "ready",
          requiredControlCount: 10,
          approvedControlCount: 10,
          externalGrcTicketCreationAllowed: false,
          externalGrcTicketCreationStatus: "policy-ready-not-enabled",
          exportMode: "metadata-only-json",
          controls: [
            {
              id: "destination-scope",
              label: "Destination scope",
              status: "ready",
              evidence: "Destination system and queue are defined for future adapter review.",
              recoveryAction: "Keep external ticket creation disabled until destination enablement review."
            },
            {
              id: "retry-audit-logging",
              label: "Retry and audit logging",
              status: "ready",
              evidence: "Retry and audit logging are approved for future GRC destination review.",
              recoveryAction: "Keep retry and audit logging mandatory before destination adapter enablement."
            }
          ],
          nextActions: ["Keep external GRC ticket creation disabled until a separate destination adapter enablement review."],
          notLegalAdviceBoundary: "Not legal advice. GRC destination policy is audit preparation metadata only."
        },
        200
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const grcPolicy = within(registry.getByRole("region", { name: /GRC Destination Policy Evaluation/i }));

    fireEvent.change(grcPolicy.getByLabelText(/GRC Destination API base URL/i), {
      target: { value: "https://api.lexproof.test" }
    });
    fireEvent.change(grcPolicy.getByLabelText(/GRC policy owner/i), { target: { value: "GRC owner" } });
    fireEvent.change(grcPolicy.getByLabelText(/Destination system/i), { target: { value: "jira" } });
    fireEvent.change(grcPolicy.getByLabelText(/Destination queue/i), { target: { value: "LEGAL-AUDIT" } });
    fireEvent.click(grcPolicy.getByLabelText(/Field mapping/i));
    fireEvent.click(grcPolicy.getByLabelText(/Authentication policy/i));
    fireEvent.click(grcPolicy.getByLabelText(/Export redaction/i));
    fireEvent.click(grcPolicy.getByLabelText(/Ticket ownership/i));
    fireEvent.click(grcPolicy.getByLabelText(/Retry and audit logging/i));
    await waitFor(() => {
      expect(grcPolicy.getByLabelText(/Field mapping/i)).toBeChecked();
      expect(grcPolicy.getByLabelText(/Authentication policy/i)).toBeChecked();
      expect(grcPolicy.getByLabelText(/Export redaction/i)).toBeChecked();
      expect(grcPolicy.getByLabelText(/Ticket ownership/i)).toBeChecked();
      expect(grcPolicy.getByLabelText(/Retry and audit logging/i)).toBeChecked();
    });
    fireEvent.change(grcPolicy.getByLabelText(/GRC policy notes/i), {
      target: { value: "Policy approved for future GRC destination review." }
    });
    fireEvent.click(grcPolicy.getByRole("button", { name: /Evaluate Server GRC Policy/i }));

    expect(await grcPolicy.findByText(/GRC policy report synced/i)).toBeInTheDocument();
    expect(grcPolicy.getAllByText(/External GRC ticket creation remains disabled/i).length).toBeGreaterThan(0);
    expect(grcPolicy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 30000);

  it("shows provider policy API failure recovery without weakening the Not legal advice boundary", async () => {
    const fetchMock = vi.fn(async () =>
      appJsonResponse(
        {
          error: "Provider policy API is unavailable.",
          code: "MODEL_GATEWAY_POLICY_UNAVAILABLE",
          recoveryAction: "Start the Phase 2 API and retry provider policy refresh.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        },
        503
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const registryHeading = await screen.findByRole("heading", { name: /Integration Readiness Registry/i });
    const registry = within(registryHeading.closest("section") as HTMLElement);
    const policy = within(registry.getByRole("region", { name: /Model Gateway Provider Policy/i }));

    fireEvent.click(policy.getByRole("button", { name: /Refresh Server Provider Policy/i }));

    expect(await policy.findByText(/Provider policy API is unavailable./i)).toBeInTheDocument();
    expect(policy.getByText(/Start the Phase 2 API and retry provider policy refresh./i)).toBeInTheDocument();
    expect(policy.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
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
    expect(screen.getByRole("heading", { name: /Evidence Templates/i })).toBeInTheDocument();

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
  }, 60000);

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
  }, 20000);

  it("lets Evidence Ledger move local evidence through review-stage statuses", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    const draftStatus = screen.getByLabelText(/Evidence status/i) as HTMLSelectElement;
    expect(Array.from(draftStatus.options).map((option) => option.value)).toEqual(
      expect.arrayContaining(["draft", "requested", "received", "under-review", "verified", "rejected"])
    );

    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Review stage evidence" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "under-review" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Metadata-only reviewer packet without raw private data." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Review stage evidence")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("under-review");

    fireEvent.change(screen.getByLabelText(/Status for evidence 1/i), { target: { value: "rejected" } });

    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("rejected");
    expect(screen.getByText(/Not legal advice; vault records are audit preparation workflow metadata/i)).toBeInTheDocument();
  });

  it("surfaces stale source-linked evidence in the recertification queue and lets the user refresh it", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Load sample scenario/i), { target: { value: "SignalBridge Marketing Review" } });
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    const queue = await screen.findByRole("region", { name: /Evidence Recertification Queue/i });

    expect(await within(queue).findByText(/needs-recertification/i)).toBeInTheDocument();
    expect(within(queue).getByText("Claims inventory")).toBeInTheDocument();
    expect(within(queue).getByText(/Recertify source-linked evidence before counsel\/export reliance/i)).toBeInTheDocument();
    expect(within(queue).getByText(/Not legal advice/i)).toBeInTheDocument();
    expect(within(queue).getByRole("button", { name: /Download Recertification Queue JSON/i })).toBeEnabled();

    fireEvent.click(within(queue).getByRole("button", { name: /Mark Claims inventory recertified/i }));

    await waitFor(() =>
      expect(within(queue).getAllByText(/No recertification action is due for reliance-ready evidence/i).length).toBeGreaterThan(0)
    );
    expect(within(queue).getByRole("button", { name: /Download Recertification Queue JSON/i })).toBeDisabled();
  });

  it("opens a metadata-only replacement request from rejected local evidence", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Rejected local evidence" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "rejected" } });
    fireEvent.change(screen.getByLabelText(/Source reference/i), {
      target: { value: "regulatory control: control-eu-mica-title-ii-white-paper" }
    });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Rejected packet with stale facts that should not be copied." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    expect(await screen.findByText("Rejected local evidence")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("rejected");

    fireEvent.click(screen.getByRole("button", { name: /Create replacement for Rejected local evidence/i }));

    expect(await screen.findByText("Replacement for Rejected local evidence")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status for evidence 2/i)).toHaveValue("requested");
    expect((screen.getByLabelText(/Source for evidence 2/i) as HTMLInputElement).value).toContain(
      "replacement for evidence:"
    );
    const replacementContent = (screen.getByLabelText(/Content for evidence 2/i) as HTMLTextAreaElement).value;
    expect(replacementContent).toContain("Not legal advice");
    expect(replacementContent).not.toContain("stale facts");
  }, 20000);

  it("adds a local file as hashed evidence metadata without showing raw file content", async () => {
    render(<App />);

    const file = new File(["Confidential launch memo body"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: Date.UTC(2026, 5, 29, 8, 0, 0)
    });

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Local evidence file/i), { target: { files: [file] } });

    expect(await screen.findByDisplayValue("local file: launch-approval.pdf")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Local file metadata")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/File SHA-256:/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/Confidential launch memo body/i)).not.toBeInTheDocument();
  }, 20000);

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
  }, 30000);

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
    expect(await screen.findByRole("heading", { name: /Evidence Retention Remediation Queue/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Delete or replace Unsafe retention packet before Evidence Vault sync/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Download Remediation Queue JSON/i })).toBeEnabled();
    const retention = within(retentionPanel as HTMLElement);
    expect(retention.getAllByText(/\[redacted-private-key\]/i).length).toBeGreaterThan(0);
    expect(retention.queryByText(/0xaaaaaaaa/i)).not.toBeInTheDocument();
    expect(retention.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
  }, 30000);

  it("syncs Evidence Ledger metadata to the backend Evidence Vault and displays the vault manifest hash", async () => {
    const uploadedForms: FormData[] = [];
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:evidence-vault-manifest");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
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
      linkedControlIds: ["control-eu-mica-title-ii-white-paper"],
      containsRawKycOrPersonalData: false,
      createdAt: "2026-06-30T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z"
    };
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        uploadedForms.push(init.body as FormData);
        return appJsonResponse(vaultRecord, 201);
      }

      if (path.endsWith("/evidence/evidence-vault-ui") && init?.method === "PATCH") {
        expect(JSON.parse(String(init.body))).toEqual(
          expect.objectContaining({
            status: "verified",
            linkedRiskFlagIds: ["governance-approval"],
            linkedControlIds: ["control-eu-mica-title-ii-white-paper"]
          })
        );
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
      fireEvent.change(screen.getByLabelText(/Source reference/i), {
        target: {
          value: "risk evidence requirement: governance-approval; regulatory control: control-eu-mica-title-ii-white-paper"
        }
      });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "verified" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Raw board approval facts stay local and are represented by hash only." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      expect(await screen.findByText("Vault approval memo")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Evidence Vault Sync/i })).toBeInTheDocument();
      expect(screen.getByText(/Not legal advice; vault records are audit preparation workflow metadata/i)).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Sync Evidence Vault/i }));
      });

      expect(await screen.findByText(/Evidence Vault synced 1 records/i)).toBeInTheDocument();
      const vaultBundleHash = screen.getByText(/Vault bundle SHA-256/i).closest(".vault-hash") as HTMLElement;
      expect(within(vaultBundleHash).getByText("a".repeat(64))).toBeInTheDocument();
      const vaultRecords = within(screen.getByLabelText(/Evidence Vault records/i));
      expect(vaultRecords.getByText(/vault-approval-memo.metadata.json/i)).toBeInTheDocument();
      expect(vaultRecords.getByText(/verified · Compliance · v2/i)).toBeInTheDocument();
      expect(vaultRecords.getByText(/Controls: control-eu-mica-title-ii-white-paper/i)).toBeInTheDocument();

      const uploadedFile = uploadedForms[0].get("file") as Blob;
      const uploadedPayload = await readAppBlobText(uploadedFile);
      expect(uploadedPayload).toContain("localContentHash");
      expect(uploadedPayload).toContain("governance-approval");
      expect(uploadedPayload).toContain("control-eu-mica-title-ii-white-paper");
      expect(uploadedPayload).not.toContain("Raw board approval facts stay local");
      expect(uploadedForms[0].get("linkedControlIds")).toBe("control-eu-mica-title-ii-white-paper");
      expect(uploadedForms[0].get("containsRawKycOrPersonalData")).toBe("false");

      fireEvent.click(screen.getByRole("button", { name: /Download Vault Manifest JSON/i }));

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:evidence-vault-manifest");
      const manifestPayload = await readAppBlobText(capturedBlobs[0]);
      const parsedManifest = JSON.parse(manifestPayload);
      expect(parsedManifest).toEqual(
        expect.objectContaining({
          manifestVersion: "lexproof-evidence-vault-manifest-v1",
          bundleHash: "a".repeat(64),
          notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
        })
      );
      expect(manifestPayload).not.toContain("Raw board approval facts stay local");

      const lineageDigest = await screen.findByRole("region", { name: /Evidence Vault Lineage Digest/i });
      expect(within(lineageDigest).getByText(/Not legal advice/i)).toBeInTheDocument();
      expect(within(lineageDigest).getByText(/ready/i)).toBeInTheDocument();
      expect(within(lineageDigest).getByText(/control-eu-mica-title-ii-white-paper/i)).toBeInTheDocument();
      fireEvent.click(within(lineageDigest).getByRole("button", { name: /Download Lineage Digest JSON/i }));

      expect(click).toHaveBeenCalledTimes(2);
      const lineagePayload = await readAppBlobText(capturedBlobs[1]);
      const parsedLineage = JSON.parse(lineagePayload);
      expect(parsedLineage).toEqual(
        expect.objectContaining({
          digestVersion: "lexproof-evidence-vault-lineage-digest-v1",
          manifestHash: "a".repeat(64),
          readinessStatus: "ready",
          notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
        })
      );
      expect(parsedLineage.digestHash).toMatch(/^[a-f0-9]{64}$/);
      expect(lineagePayload).not.toContain("Raw board approval facts stay local");

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));
      const exportInventoryRegion = await screen.findByRole("region", { name: /Export Safety Inventory/i });
      await waitFor(() =>
        expect(within(exportInventoryRegion).getByText(/Evidence Vault Lineage Digest JSON/i)).toBeInTheDocument()
      );
      expect(
        within(exportInventoryRegion).getByText(/Keep the Evidence Vault Lineage Digest with the final evidence handoff packet/i)
      ).toBeInTheDocument();
      fireEvent.click(within(exportInventoryRegion).getByRole("button", { name: /Download Export Inventory JSON/i }));

      expect(click).toHaveBeenCalledTimes(3);
      const inventoryPayload = await readAppBlobText(capturedBlobs[2]);
      const parsedInventory = JSON.parse(inventoryPayload);
      const lineageArtifact = parsedInventory.artifacts.find(
        (artifact: { id: string }) => artifact.id === "evidence-vault-lineage-digest"
      );
      expect(lineageArtifact).toEqual(
        expect.objectContaining({
          label: "Evidence Vault Lineage Digest JSON",
          category: "evidence",
          exportMode: "metadata-only-json",
          status: "ready",
          available: true,
          artifactHash: parsedLineage.digestHash,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Evidence Vault lineage digests summarize audit preparation metadata only."
        })
      );
      expect(inventoryPayload).not.toContain("Raw board approval facts stay local");

      fireEvent.click(screen.getByRole("button", { name: "Counsel Pack" }));
      const checklistRegion = await screen.findByRole("region", { name: /Counsel Handoff Checklist/i });
      await waitFor(() =>
        expect(within(checklistRegion).getAllByText(/Evidence Vault Lineage Digest/i).length).toBeGreaterThan(0)
      );
      const lineageChecklistItem = Array.from(checklistRegion.querySelectorAll<HTMLElement>(".handoff-checklist-item")).find(
        (item) => item.textContent?.includes("Evidence Vault Lineage Digest")
      );
      expect(lineageChecklistItem).toBeInstanceOf(HTMLElement);
      expect(lineageChecklistItem?.textContent).toContain("0 open rejected");
      expect(lineageChecklistItem?.textContent).toContain("Keep the Evidence Vault Lineage Digest hash");
      expect(within(checklistRegion).getByText(/Not legal advice. Counsel handoff checklists/i)).toBeInTheDocument();
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  }, LONG_APP_FLOW_TIMEOUT_MS);

  it("shows Evidence Vault control coverage after syncing AI workflow template evidence", async () => {
    const aiWorkflowTemplate = getEvidenceTemplate("ai-compliance-workflow");
    const aiWorkflowTemplateItemCount = aiWorkflowTemplate.items.length;
    const aiWorkflowControlIds = getTemplateControlIds("ai-compliance-workflow");
    const uploadedRecords: Array<{
      id: string;
      filename: string;
      status: string;
      owner: string;
      linkedControlIds: string[];
    }> = [];
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);

      if (path.endsWith("/evidence") && init?.method === "POST") {
        const form = init.body as FormData;
        const filename = ((form.get("file") as File | null)?.name ?? `ai-template-${uploadedRecords.length + 1}.metadata.json`).toString();
        const linkedControlIds = String(form.get("linkedControlIds") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const owner = String(form.get("owner") ?? "Compliance");
        const record = {
          recordVersion: "lexproof-evidence-vault-record-v1",
          id: `evidence-vault-ai-${uploadedRecords.length + 1}`,
          workspaceId: "workspace-ai-controls",
          filename,
          mimeType: "application/json",
          byteSize: 512,
          fileHash: `${uploadedRecords.length + 1}`.repeat(64).slice(0, 64),
          storageMode: "server-vault",
          status: "requested",
          owner,
          sourceNote: "Metadata-only sync",
          version: 1,
          linkedRiskFlagIds: [],
          linkedControlIds,
          containsRawKycOrPersonalData: false,
          createdAt: `2026-07-01T00:00:0${uploadedRecords.length}.000Z`,
          updatedAt: `2026-07-01T00:00:0${uploadedRecords.length}.000Z`
        };
        uploadedRecords.push({
          id: record.id,
          filename: record.filename,
          status: record.status,
          owner: record.owner,
          linkedControlIds: record.linkedControlIds
        });
        return appJsonResponse(record, 201);
      }

      if (path.includes("/evidence/") && init?.method === "PATCH") {
        const evidenceId = path.split("/evidence/")[1] ?? "";
        const patch = JSON.parse(String(init.body ?? "{}")) as {
          status?: string;
          owner?: string;
          linkedControlIds?: string[];
        };
        const index = uploadedRecords.findIndex((record) => record.id === decodeURIComponent(evidenceId));
        if (index === -1) {
          return appJsonResponse({ message: "Missing evidence record" }, 404);
        }
        uploadedRecords[index] = {
          ...uploadedRecords[index],
          status: patch.status ?? uploadedRecords[index].status,
          owner: patch.owner ?? uploadedRecords[index].owner,
          linkedControlIds: patch.linkedControlIds ?? uploadedRecords[index].linkedControlIds
        };
        return appJsonResponse(
          {
            recordVersion: "lexproof-evidence-vault-record-v1",
            ...uploadedRecords[index],
            workspaceId: "workspace-ai-controls",
            mimeType: "application/json",
            byteSize: 512,
            fileHash: `${index + 1}`.repeat(64).slice(0, 64),
            storageMode: "server-vault",
            sourceNote: "Metadata-only sync",
            version: 1,
            linkedRiskFlagIds: [],
            containsRawKycOrPersonalData: false,
            createdAt: `2026-07-01T00:00:0${index}.000Z`,
            updatedAt: `2026-07-01T00:00:1${index}.000Z`
          },
          200
        );
      }

      if (path.endsWith("/evidence-manifest") && init?.method === "GET") {
        return appJsonResponse(
          {
            manifestVersion: "lexproof-evidence-vault-manifest-v1",
            workspaceId: "workspace-ai-controls",
            generatedAt: "2026-07-01T00:00:00.000Z",
            itemCount: uploadedRecords.length,
            items: uploadedRecords.map((record, index) => ({
              sequence: index + 1,
              evidenceId: record.id,
              filename: record.filename,
              mimeType: "application/json",
              byteSize: 512,
              fileHash: `${index + 1}`.repeat(64).slice(0, 64),
              storageMode: "server-vault",
              status: record.status,
              owner: record.owner,
              version: 1,
              linkedRiskFlagIds: [],
              linkedControlIds: record.linkedControlIds,
              containsRawKycOrPersonalData: false
            })),
            bundleHash: "c".repeat(64),
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
      fireEvent.click(screen.getByRole("button", { name: /Apply AI compliance workflow template/i }));
      fireEvent.click(await screen.findByRole("button", { name: /Sync Evidence Vault/i }));

      expect(
        await screen.findByText(new RegExp(`Evidence Vault synced ${aiWorkflowTemplateItemCount} records`, "i"))
      ).toBeInTheDocument();
      const coverage = within(screen.getByRole("region", { name: /Evidence Vault Control Coverage/i }));
      expect(coverage.getByRole("heading", { name: /Evidence Vault Control Coverage/i })).toBeInTheDocument();
      expect(
        coverage.getByText(
          new RegExp(
            `${aiWorkflowControlIds.length} controls linked across ${aiWorkflowTemplateItemCount} vault records and ${aiWorkflowTemplateItemCount} manifest items`,
            "i"
          )
        )
      ).toBeInTheDocument();
      for (const controlId of aiWorkflowControlIds) {
        expect(coverage.getByText(new RegExp(controlId, "i"))).toBeInTheDocument();
      }
      expect(coverage.getAllByText(/Needs review/i).length).toBeGreaterThan(0);
      expect(coverage.getAllByText(/Move linked vault evidence through Human Review before export reliance/i).length).toBeGreaterThan(0);
      expect(coverage.getByText(/Not legal advice. Evidence Vault control coverage is audit preparation metadata only./i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

      expect(await screen.findByText(/## Evidence Vault Control Coverage/i)).toBeInTheDocument();
      for (const controlId of aiWorkflowControlIds) {
        expect(screen.getByText(new RegExp(`${controlId}: needs-review`, "i"))).toBeInTheDocument();
      }
      expect(screen.getAllByText(/Move linked vault evidence through Human Review before export reliance/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Not legal advice. Evidence Vault control coverage is audit preparation metadata only./i)).toBeInTheDocument();
      const checklist = within(screen.getByRole("region", { name: /Counsel Handoff Checklist/i }));
      expect(checklist.getByText(/Evidence Vault Control Coverage/i)).toBeInTheDocument();
      expect(checklist.getByText(new RegExp(`0/${aiWorkflowControlIds.length} controls ready for handoff`, "i"))).toBeInTheDocument();
      expect(checklist.getByText(new RegExp(`needs review: ${aiWorkflowControlIds.length}`, "i"))).toBeInTheDocument();
      expect(checklist.getByText(/Move linked vault evidence through Human Review before export reliance/i)).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  }, LONG_APP_FLOW_TIMEOUT_MS);

  it("explains the Evidence Vault empty state before metadata sync", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    expect(await screen.findByRole("heading", { name: /Evidence Vault Sync/i })).toBeInTheDocument();
    expect(screen.getByText(/Add or apply at least one evidence item before syncing Evidence Vault/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sync Evidence Vault/i })).toBeDisabled();
    expect(screen.getByText(/Not legal advice; vault records are audit preparation workflow metadata/i)).toBeInTheDocument();
  });

  it("blocks unsafe local file metadata before adding file evidence", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const unsafeFile = new File(["metadata body stays local"], `raw KYC packet ${apiKey} private key ${privateKey}.pdf`, {
      type: "application/pdf",
      lastModified: Date.UTC(2026, 6, 5, 8, 30, 0)
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Local evidence file/i), {
      target: { files: [unsafeFile] }
    });

    expect(await screen.findByText(/Local file metadata intake blocked before hashing/i)).toBeInTheDocument();
    const boundary = within(screen.getByRole("region", { name: /Local file metadata boundary/i }));
    expect(boundary.getByRole("heading", { name: /Local File Metadata Boundary/i })).toBeInTheDocument();
    expect(boundary.getByText(/Blocked before hashing/i)).toBeInTheDocument();
    expect(boundary.getByText(/credential-material/i)).toBeInTheDocument();
    expect(boundary.getByText(/private-key-material/i)).toBeInTheDocument();
    expect(boundary.getByText(/raw-kyc/i)).toBeInTheDocument();
    expect(boundary.getByText(/rename or replace the evidence with metadata-only labels/i)).toBeInTheDocument();
    expect(boundary.getByText(/Not legal advice. Evidence metadata boundary checks/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Label for evidence 1/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(apiKey);
    expect(document.body.textContent).not.toContain(privateKey);
    expect(document.body.textContent).not.toContain("raw KYC packet");
  });

  it("previews unsafe manual evidence draft boundaries before downstream handoff", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe draft evidence" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: `Contains ${apiKey}, private key ${privateKey}, and raw KYC packet.` }
    });

    const boundary = within(await screen.findByRole("region", { name: /Evidence draft boundary preview/i }));
    expect(boundary.getByRole("heading", { name: /Evidence Draft Boundary Preview/i })).toBeInTheDocument();
    expect(boundary.getByText(/Blocked downstream/i)).toBeInTheDocument();
    expect(boundary.getByText(/credential-material/i)).toBeInTheDocument();
    expect(boundary.getByText(/private-key-material/i)).toBeInTheDocument();
    expect(boundary.getByText(/raw-kyc/i)).toBeInTheDocument();
    expect(boundary.getByText(/replace blocked material with a metadata-only summary/i)).toBeInTheDocument();
    expect(boundary.getByText(/Not legal advice. Evidence metadata boundary checks/i)).toBeInTheDocument();
    expect(boundary.getByRole("heading", { name: /Evidence Draft Boundary Preview/i }).closest("section")?.textContent).not.toContain(
      apiKey
    );
    expect(boundary.getByRole("heading", { name: /Evidence Draft Boundary Preview/i }).closest("section")?.textContent).not.toContain(
      privateKey
    );
    expect(boundary.getByRole("heading", { name: /Evidence Draft Boundary Preview/i }).closest("section")?.textContent).not.toContain(
      "raw KYC packet"
    );
    expect(screen.getByRole("button", { name: /Add evidence item/i })).toBeEnabled();
  });

  it("shows structured Evidence Vault duplicate recovery details without losing the non-advice boundary", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith("/evidence") && init?.method === "POST") {
        return appJsonResponse(
          {
            error: "Duplicate evidence hash already exists in this workspace.",
            code: "EVIDENCE_DUPLICATE_HASH",
            recoveryAction: "Use the existing record, update its status, or upload a replacement with a changed metadata hash.",
            duplicateEvidenceId: "evidence-vault-existing",
            duplicateStatus: "verified",
            notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
          },
          409
        );
      }

      throw new Error(`Unexpected request ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Duplicate vault memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Source reference/i), { target: { value: "risk evidence requirement: governance-approval" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "verified" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Duplicate evidence facts stay local and are represented by hash only." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));
      fireEvent.click(screen.getByRole("button", { name: /Sync Evidence Vault/i }));

      expect(await screen.findByText(/Duplicate evidence hash already exists in this workspace/i)).toBeInTheDocument();
      const recoveryPanel = screen.getByRole("region", { name: /Evidence Vault recovery details/i });
      expect(within(recoveryPanel).getByText(/EVIDENCE_DUPLICATE_HASH/i)).toBeInTheDocument();
      expect(within(recoveryPanel).getByText(/Use the existing record, update its status, or upload a replacement/i)).toBeInTheDocument();
      expect(within(recoveryPanel).getByText(/Duplicate evidence ID/i)).toBeInTheDocument();
      expect(within(recoveryPanel).getByText(/evidence-vault-existing/i)).toBeInTheDocument();
      expect(within(recoveryPanel).getByText(/Duplicate status/i)).toBeInTheDocument();
      expect(within(recoveryPanel).getByText("verified")).toBeInTheDocument();
      expect(within(recoveryPanel).getByText(/Not legal advice. This API creates audit preparation workflow records only./i)).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
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
  }, LONG_APP_FLOW_TIMEOUT_MS);

  it("runs the full Secure Review Workspace journey across evidence vault, model gateway, and human review", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createdBlobs: Blob[] = [];
    const createObjectUrl = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        createdBlobs.push(blob);
      }
      return "blob:lexproof-model-run-receipt";
    });
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
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

      if (path.endsWith("/model-runs") && init?.method === "GET") {
        return appJsonResponse(
          [
            {
              id: "model-gateway-run-full",
              providerLabel: "Mock local reviewer gateway",
              model: "lexproof-mock",
              status: "completed",
              redactionStatus: "clean",
              humanReviewStatus: "needs-review",
              payloadHash: "c".repeat(64),
              responseHash: "d".repeat(64),
              sourceEvidenceHash: "e".repeat(64),
              retryState: "not-needed",
              remediationSteps: [],
              requiresHumanReview: true,
              boundary: "AI-assisted draft for audit preparation only. Not legal advice."
            }
          ],
          200
        );
      }

      if (path.endsWith("/reviews") && init?.method === "GET") {
        return appJsonResponse(
          [
            {
              recordVersion: "lexproof-human-review-record-v1",
              id: "human-review-full",
              workspaceId: "project-ui",
              targetType: "model-run",
              targetId: "model-gateway-run-full",
              reviewerId: "Compliance",
              status: "requested",
              comment: "Review Model Gateway output before audit-prep reliance. AI-assisted draft only. Not legal advice.",
              createdAt: "2026-06-30T00:00:00.000Z",
              updatedAt: "2026-06-30T00:00:00.000Z",
              notLegalAdviceBoundary: "Not legal advice. Human review records track audit preparation workflow status."
            }
          ],
          200
        );
      }

      if (path.endsWith("/audit-log?targetType=human-review") && init?.method === "GET") {
        return appJsonResponse(
          [
            createAppAuditLogRecord({
              id: "audit-log-review",
              action: "model.run.human-review-queued",
              targetType: "human-review",
              targetId: "human-review-full",
              createdAt: "2026-06-30T00:00:04.000Z"
            })
          ],
          200
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
              action: "model.run.human-review-queued",
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
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
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
      const auditLogExplorer = within(screen.getByRole("region", { name: /Server Audit Log Explorer/i }));
      expect(auditLogExplorer.getByRole("heading", { name: /Server Audit Log Explorer/i })).toBeInTheDocument();
      expect(screen.getByText(/Last audit action model.run.human-review-queued/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit actors Compliance/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download Audit Log JSON/i })).toBeInTheDocument();
      fireEvent.change(auditLogExplorer.getByLabelText(/Audit log target type/i), { target: { value: "human-review" } });
      fireEvent.click(auditLogExplorer.getByRole("button", { name: /Refresh Server Audit Log/i }));
      expect(await auditLogExplorer.findByText(/Audit Log refreshed: 1 metadata-only record/i)).toBeInTheDocument();
      expect(auditLogExplorer.getByText(/Target types human-review/i)).toBeInTheDocument();
      expect(auditLogExplorer.getAllByText(/model.run.human-review-queued/i).length).toBeGreaterThan(0);
      expect(auditLogExplorer.getByText(/Not legal advice. Audit Log exports are review workspace metadata only./i)).toBeInTheDocument();
      const modelRunLedger = within(screen.getByRole("region", { name: /Server Model Run Ledger/i }));
      expect(modelRunLedger.getByRole("heading", { name: /Server Model Run Ledger/i })).toBeInTheDocument();
      expect(modelRunLedger.getByText(/Latest run model-gateway-run-full/i)).toBeInTheDocument();
      fireEvent.click(modelRunLedger.getByRole("button", { name: /Refresh Server Model Runs/i }));
      expect(await modelRunLedger.findByText(/Model Gateway runs refreshed: 1 metadata-only run/i)).toBeInTheDocument();
      expect(modelRunLedger.getAllByText(/Human review needs-review/i).length).toBeGreaterThan(0);
      expect(modelRunLedger.getAllByText(/Retry state not-needed/i).length).toBeGreaterThan(0);
      expect(modelRunLedger.getAllByText(/AI-assisted draft for audit preparation only. Not legal advice./i).length).toBeGreaterThan(0);
      fireEvent.click(modelRunLedger.getByRole("button", { name: /Download Model Run Receipt JSON/i }));
      await waitFor(() => expect(modelRunLedger.getByText(/Model Run receipt ready:/i)).toBeInTheDocument());
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      const modelRunReceipt = JSON.parse(await readAppBlobText(createdBlobs[0])) as Record<string, unknown>;
      expect(modelRunReceipt.receiptVersion).toBe("lexproof-model-gateway-run-receipt-v1");
      expect(modelRunReceipt.runId).toBe("model-gateway-run-full");
      expect(modelRunReceipt.receiptHash).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(modelRunReceipt)).toContain("Not legal advice");
      expect(JSON.stringify(modelRunReceipt)).not.toContain("Approval summary represented by metadata hash");
      expect(JSON.stringify(modelRunReceipt)).not.toContain("apiKey");
      const modelEvaluationSection = screen.getByRole("heading", { name: /Model Gateway Evaluation/i }).closest("section");
      expect(modelEvaluationSection).not.toBeNull();
      const modelEvaluation = within(modelEvaluationSection as HTMLElement);
      expect(modelEvaluation.getByText(/Payload hash cccccccccccc/i)).toBeInTheDocument();
      expect(modelEvaluation.getByText(/Source evidence eeeeeeeeeeee/i)).toBeInTheDocument();
      expect(modelEvaluation.getByText(/Human review needs-review/i)).toBeInTheDocument();
      expect(modelEvaluation.getByRole("button", { name: /Download Model Evaluation JSON/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));
      const exportInventory = within(await screen.findByRole("region", { name: /Export Safety Inventory/i }));
      await waitFor(() => {
        expect(exportInventory.getByText(/Model Gateway Evaluation JSON/i)).toBeInTheDocument();
        expect(exportInventory.getByText(/Route Model Gateway Evaluation through Human Review before relying on model output/i)).toBeInTheDocument();
        expect(exportInventory.getByText("Audit Log Export JSON")).toBeInTheDocument();
        expect(exportInventory.getByText("Keep Audit Log Export JSON with the secure review handoff packet.")).toBeInTheDocument();
      });
      expect(exportInventory.getAllByText(/Hash dddddddddddd/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  }, LONG_APP_FLOW_TIMEOUT_MS);

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
            code: "MODEL_GATEWAY_BOUNDARY_FAILED",
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
      expect(screen.getByText(/MODEL_GATEWAY_BOUNDARY_FAILED/i)).toBeInTheDocument();
      expect(screen.getAllByText(/model-gateway-run-blocked-ui/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/blocked-until-remediated/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pass the Redaction Gate before creating a server Model Gateway run/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Not legal advice. This API creates audit preparation workflow records only./i)).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  }, LONG_APP_FLOW_TIMEOUT_MS);

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
  }, 15000);

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

  it("downloads the Demo Runbook JSON from the Sources handoff", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:sources-demo-runbook");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      const submissionPack = await screen.findByRole("region", { name: /Submission Pack/i });
      await waitFor(() => {
        expect(within(submissionPack).getByText(/Demo Runbook hash/i)).toBeInTheDocument();
      });
      const downloadButton = await within(submissionPack).findByRole("button", { name: /Download Demo Runbook JSON/i });
      await waitFor(() => expect(downloadButton).toBeEnabled());
      fireEvent.click(downloadButton);

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:sources-demo-runbook");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Demo Runbook JSON blob to be created from Sources.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          runbookVersion: "lexproof-demo-runbook-v1",
          apiPreflightStatus: "not-checked",
          notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
        })
      );
      expect(parsed.runbookHash).toMatch(/^[a-f0-9]{64}$/);
      expect(payload).toContain("Counsel Pack -> Sources");
      expect(payload).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("downloads a metadata-only Judge Handoff Bundle from Sources", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:judge-handoff-bundle");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      const bundlePanel = await screen.findByRole("region", { name: /Judge Handoff Bundle/i });
      await waitFor(() => {
        expect(within(bundlePanel).getByText(/Submission Pack JSON/i)).toBeInTheDocument();
        expect(within(bundlePanel).getAllByText(/Demo Runbook JSON/i).length).toBeGreaterThan(0);
        expect(within(bundlePanel).getByText(/Export Safety Inventory JSON/i)).toBeInTheDocument();
        expect(within(bundlePanel).getByText(/Counsel Handoff Checklist JSON/i)).toBeInTheDocument();
      });
      const downloadButton = await screen.findByRole("button", { name: /Download Judge Handoff Bundle JSON/i });
      await waitFor(() => expect(downloadButton).toBeEnabled());
      fireEvent.click(downloadButton);

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:judge-handoff-bundle");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Judge Handoff Bundle JSON blob to be created from Sources.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          bundleVersion: "lexproof-judge-handoff-bundle-v1",
          artifactCount: 4,
          exportHandoffAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Judge handoff bundles are audit preparation metadata only."
        })
      );
      expect(parsed.bundleHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "submission-pack", artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
          expect.objectContaining({ id: "demo-runbook", artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
          expect.objectContaining({ id: "export-safety-inventory", artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
          expect.objectContaining({ id: "counsel-handoff-checklist", artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/) })
        ])
      );
      expect(payload).toContain("Not legal advice");
      expect(payload).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("routes Judge Handoff Bundle recovery actions to the matching workbench surface", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

    let bundlePanel = await screen.findByRole("region", { name: /Judge Handoff Bundle/i });
    await waitFor(() => {
      expect(
        within(bundlePanel).getByText(/Not legal advice. Judge handoff readiness is audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
    });

    fireEvent.click(await within(bundlePanel).findByRole("button", { name: /Open Counsel Pack/i }));
    expect(await screen.findByRole("heading", { name: /^Counsel Pack$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Sources/i }));
    bundlePanel = await screen.findByRole("region", { name: /Judge Handoff Bundle/i });

    fireEvent.click(await within(bundlePanel).findByRole("button", { name: /Open Judge Demo Readiness/i }));
    expect(await screen.findByRole("heading", { name: /Audit Wizard/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Judge Demo Readiness/i })).toBeInTheDocument();
  });

  it("shows and downloads a Handoff Recovery Playbook from Sources", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:handoff-recovery-playbook");
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

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      const playbookPanel = await screen.findByRole("region", { name: /Handoff Recovery Playbook/i });
      await waitFor(() => {
        expect(within(playbookPanel).getByText(/Handoff recovery active/i)).toBeInTheDocument();
        expect(within(playbookPanel).getByText(/Recover Manifest Drift Guard/i)).toBeInTheDocument();
      });
      expect(
        within(playbookPanel).getByText(/Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
      const openEvidenceButtons = within(playbookPanel).getAllByRole("button", { name: /Open Evidence Ledger/i });
      expect(openEvidenceButtons.length).toBeGreaterThan(0);

      fireEvent.click(within(playbookPanel).getByRole("button", { name: /Download Recovery Playbook JSON/i }));

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:handoff-recovery-playbook");
      const payload = await readAppBlobText(capturedBlobs[0]);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          playbookVersion: "lexproof-handoff-recovery-playbook-v1",
          exportHandoffAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only."
        })
      );
      expect(parsed.playbookHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sourceArtifactId: "manifest-drift-report",
            targetSurface: "evidence",
            notLegalAdviceBoundary: "Not legal advice. Handoff recovery steps are audit preparation workflow metadata only."
          })
        ])
      );
      expect(payload).not.toMatch(/\bsk-live\b|private key 0x|raw KYC|legal opinion|final legal decision/i);

      fireEvent.click(openEvidenceButtons[0]);
      expect(await screen.findByRole("heading", { name: /Evidence Ledger/i })).toBeInTheDocument();
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("downloads an Export Safety Inventory that blocks unsafe handoff without leaking secrets", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:export-safety-inventory");
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

      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Unsafe export bundle" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Text" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: {
          value:
            "Contains sk-live-abcdef1234567890abcdef1234567890, private key 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, and raw KYC packet."
        }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      await waitFor(() => {
        const inventory = within(screen.getByRole("region", { name: /Export Safety Inventory/i }));
        expect(inventory.getByText(/Not legal advice. Export Safety Inventory is audit preparation handoff metadata only./i)).toBeInTheDocument();
        expect(inventory.getByText(/Export handoff blocked/i)).toBeInTheDocument();
        expect(inventory.getAllByText(/Unsafe export bundle/i).length).toBeGreaterThan(0);
        expect(inventory.queryByText(/sk-live-abcdef/i)).not.toBeInTheDocument();
      });

      const inventory = within(screen.getByRole("region", { name: /Export Safety Inventory/i }));

      fireEvent.click(inventory.getByRole("button", { name: /Download Export Inventory JSON/i }));

      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Export Safety Inventory did not create a blob.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          inventoryVersion: "lexproof-export-safety-inventory-v1",
          overallStatus: "blocked",
          exportHandoffAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."
        })
      );
      expect(parsed.inventoryHash).toMatch(/^[a-f0-9]{64}$/);
      expect(payload).toContain("[redacted-api-key]");
      expect(payload).toContain("[redacted-private-key]");
      expect(payload).not.toContain("sk-live-abcdef1234567890");
      expect(payload).not.toContain("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
      expect(payload).not.toContain("raw KYC packet");
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:export-safety-inventory");
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("includes Source Freshness Board in the Export Safety Inventory handoff", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:export-safety-source-freshness");
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
      vi.useRealTimers();

      fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

      const inventoryRegion = await screen.findByRole("region", { name: /Export Safety Inventory/i });
      const inventory = within(inventoryRegion);
      await waitFor(() => expect(inventory.getByText(/Source Freshness Board JSON/i)).toBeInTheDocument());
      await waitFor(() => expect(inventory.getByText(/Source Update Approval Queue JSON/i)).toBeInTheDocument());
      await waitFor(() => expect(inventory.getAllByText(/Evidence Recertification Queue JSON/i).length).toBeGreaterThan(0));
      await waitFor(() => expect(inventory.getByText(/Demo Runbook JSON/i)).toBeInTheDocument());
      await waitFor(() => expect(inventory.getByText(/Demo Smoke Checklist JSON/i)).toBeInTheDocument());
      await waitFor(() => expect(inventory.getByText(/Review the Source Freshness Board lanes before external handoff./i)).toBeInTheDocument());
      expect(
        inventory.getByText(/Not legal advice. Export Safety Inventory is audit preparation handoff metadata only./i)
      ).toBeInTheDocument();

      fireEvent.click(inventory.getByRole("button", { name: /Download Export Inventory JSON/i }));

      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Export Safety Inventory did not create a Source Freshness Board blob.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);
      const sourceFreshnessArtifact = parsed.artifacts.find((artifact: { id: string }) => artifact.id === "source-freshness-board");
      const sourceApprovalArtifact = parsed.artifacts.find(
        (artifact: { id: string }) => artifact.id === "source-update-approval-queue"
      );
      const recertificationArtifact = parsed.artifacts.find(
        (artifact: { id: string }) => artifact.id === "evidence-recertification-queue"
      );
      const demoRunbookArtifact = parsed.artifacts.find((artifact: { id: string }) => artifact.id === "demo-runbook");
      const demoSmokeArtifact = parsed.artifacts.find((artifact: { id: string }) => artifact.id === "demo-smoke-checklist");

      expect(sourceFreshnessArtifact).toEqual(
        expect.objectContaining({
          label: "Source Freshness Board JSON",
          category: "source-lineage",
          exportMode: "metadata-only-json",
          status: "needs-review",
          available: true,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Source freshness boards are audit preparation scheduling metadata only."
        })
      );
      expect(sourceFreshnessArtifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(sourceFreshnessArtifact.warnings).toEqual(
        expect.arrayContaining(["Source Freshness Board status is attention-needed; review lanes before counsel handoff."])
      );
      expect(sourceApprovalArtifact).toEqual(
        expect.objectContaining({
          label: "Source Update Approval Queue JSON",
          category: "source-lineage",
          exportMode: "metadata-only-json",
          status: "needs-review",
          required: false,
          available: true,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Source update approvals are audit preparation workflow metadata only."
        })
      );
      expect(sourceApprovalArtifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(sourceApprovalArtifact.warnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /Source Update Approval Queue status is needs-approval with \d+ open gates; source matching remains gated until refreshed metadata is reviewed\./
          )
        ])
      );
      expect(recertificationArtifact).toEqual(
        expect.objectContaining({
          label: "Evidence Recertification Queue JSON",
          category: "evidence",
          exportMode: "metadata-only-json",
          required: false,
          available: true,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
        })
      );
      expect(recertificationArtifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(demoRunbookArtifact).toEqual(
        expect.objectContaining({
          label: "Demo Runbook JSON",
          category: "submission",
          exportMode: "metadata-only-json",
          required: true,
          available: true,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Demo runbooks are audit preparation demo metadata only."
        })
      );
      expect(demoRunbookArtifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(demoSmokeArtifact).toEqual(
        expect.objectContaining({
          label: "Demo Smoke Checklist JSON",
          category: "submission",
          exportMode: "metadata-only-json",
          required: true,
          available: true,
          metadataOnly: true,
          rawContentIncluded: false,
          notLegalAdviceBoundary: "Not legal advice. Demo smoke checklists are audit preparation readiness metadata only."
        })
      );
      expect(demoSmokeArtifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
      expect(demoSmokeArtifact.warnings).toEqual(
        expect.arrayContaining([
          "Demo Smoke Checklist status is needs-api with API preflight not-checked; complete clean-clone smoke recovery before judge handoff."
        ])
      );
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|raw KYC|private key/i);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:export-safety-source-freshness");
      expect(click).toHaveBeenCalledTimes(1);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.useRealTimers();
    }
  });

  it("shows and downloads a Counsel Handoff Checklist from the Counsel Pack", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn(() => "blob:counsel-handoff-checklist");
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
      await act(async () => {
        render(<App />);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
      });

      const checklistRegion = await screen.findByRole("region", { name: /Counsel Handoff Checklist/i });
      let checklist = within(checklistRegion);
      expect(
        checklist.getByText(/Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only./i)
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          within(screen.getByRole("region", { name: /Counsel Handoff Checklist/i })).getByRole("button", {
            name: /Download Handoff Checklist JSON/i
          })
        ).toBeInTheDocument()
      );
      checklist = within(screen.getByRole("region", { name: /Counsel Handoff Checklist/i }));
      expect(checklist.getAllByText(/Handoff blocked|Handoff needs action|Handoff needs review/i).length).toBeGreaterThan(0);
      expect(checklist.getAllByText(/Counsel Pack Version/i).length).toBeGreaterThan(0);
      expect(checklist.getAllByText(/Export Safety Inventory/i).length).toBeGreaterThan(0);
      expect(checklist.getAllByText(/Evidence Manifest/i).length).toBeGreaterThan(0);
      await waitFor(() =>
        expect(
          within(screen.getByRole("region", { name: /Counsel Handoff Checklist/i })).getByText(
            /Evidence Recertification Queue/i
          )
        ).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(checklist.getByRole("button", { name: /Download Handoff Checklist JSON/i }));
      });

      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Counsel Handoff Checklist did not create a blob.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          checklistVersion: "lexproof-counsel-handoff-checklist-v1",
          handoffAllowed: false,
          notLegalAdviceBoundary: "Not legal advice. Counsel handoff checklists are audit preparation workflow metadata only."
        })
      );
      expect(parsed.checklistHash).toMatch(/^[a-f0-9]{64}$/);
      expect(parsed.items.length).toBeGreaterThanOrEqual(6);
      expect(parsed.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "evidence-recertification-queue",
            label: "Evidence Recertification Queue",
            artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            notLegalAdviceBoundary: "Not legal advice. Evidence recertification queues are audit preparation workflow metadata only."
          })
        ])
      );
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b|\blegally approved\b/i);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-handoff-checklist");
      expect(click).toHaveBeenCalledTimes(1);
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

  it("shows concrete empty evidence intake guidance and applies a recommended template", async () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Empty Evidence AI Desk" } });
    fireEvent.change(screen.getByLabelText(/Asset model/i), { target: { value: "AI model governance workflow" } });

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));

    await waitFor(() => expect(container.querySelector(".evidence-intake-guidance")).toBeInTheDocument());
    const intakeGuidance = within(container.querySelector(".evidence-intake-guidance") as HTMLElement);
    expect(intakeGuidance.getByRole("heading", { name: /Evidence Intake Guidance/i })).toBeInTheDocument();
    expect(intakeGuidance.getByText(/Start with AI compliance workflow evidence/i)).toBeInTheDocument();
    expect(
      intakeGuidance.getByText(/Not legal advice. Evidence intake guidance is audit preparation workflow metadata only./i)
    ).toBeInTheDocument();

    fireEvent.click(intakeGuidance.getByRole("button", { name: /Apply recommended AI compliance workflow template/i }));

    await waitFor(() => expect(container.querySelector<HTMLInputElement>("#evidence-1-label")?.value).toBe("AI system use policy"));
    expect(screen.getByLabelText("Status for evidence 1")).toHaveValue("requested");
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
  }, LONG_APP_FLOW_TIMEOUT_MS);

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
  }, LONG_APP_FLOW_TIMEOUT_MS);

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

    expect(await screen.findByText(/Rejected from review. Linked evidence is marked rejected for replacement recovery/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    expect(screen.getByLabelText(/Status for evidence 1/i)).toHaveValue("rejected");
  }, 20000);

  it("downloads a metadata-only Human Review Recovery Packet for rejected decisions", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const revokeObjectUrl = vi.fn();
    const capturedBlobs: Blob[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return "blob:human-review-recovery-packet";
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /New project/i }));
      fireEvent.change(screen.getByLabelText(/Project name/i), { target: { value: "Review Recovery Desk" } });
      fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
      fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Rejected recovery memo" } });
      fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
      fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "received" } });
      fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
      fireEvent.change(screen.getByLabelText(/Evidence content/i), {
        target: { value: "Evidence summary for recovery packet testing." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

      fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));
      expect(await screen.findByText("Rejected recovery memo")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/Status for Rejected recovery memo/i), { target: { value: "rejected" } });
      fireEvent.change(screen.getByLabelText(/Decision note for Rejected recovery memo/i), {
        target: { value: "Rejected stale audit-prep evidence; replace before handoff." }
      });
      fireEvent.click(screen.getByRole("button", { name: /Save decision for Rejected recovery memo/i }));

      expect(await screen.findByText(/Rejected from review. Linked evidence is marked rejected for replacement recovery/i)).toBeInTheDocument();
      const recoveryPacketPanel = within(screen.getByRole("region", { name: /Human Review Recovery Packet/i }));
      expect(recoveryPacketPanel.getByText(/returned or rejected review item/i)).toBeInTheDocument();
      fireEvent.click(recoveryPacketPanel.getByRole("button", { name: /Download Recovery Packet JSON/i }));

      await waitFor(() => expect(capturedBlobs.length).toBe(1));
      const payload = await readAppBlobText(capturedBlobs[0]);
      const packet = JSON.parse(payload);

      expect(packet.packetVersion).toBe("lexproof-human-review-recovery-packet-v1");
      expect(packet.packetHash).toMatch(/^[a-f0-9]{64}$/);
      expect(packet.projectName).toBe("Review Recovery Desk");
      expect(packet.status).toBe("needs-recovery");
      expect(packet.summary.totalRecoveryCount).toBeGreaterThan(0);
      expect(packet.summary.rejectedCount).toBeGreaterThan(0);
      expect(packet.notLegalAdviceBoundary).toBe(
        "Not legal advice. Human review recovery packets are audit preparation workflow metadata only."
      );
      expect(packet.items.some((item: { title: string; recoveryAction: string }) => item.title === "Rejected recovery memo" && item.recoveryAction.includes("replacement evidence metadata"))).toBe(true);
      expect(payload).not.toMatch(/sk-live|private key|raw KYC|\bcompliant\b|\bnon-compliant\b|\blegal approval\b/i);
      await waitFor(() => expect(recoveryPacketPanel.getByText(/Recovery packet hash/i)).toBeInTheDocument());
    } finally {
      click.mockRestore();
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
    }
  }, 20000);

  it("filters the Human Review queue by target type, status, reviewer, and search text", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /New project/i }));
    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    fireEvent.change(screen.getByLabelText(/Evidence label/i), { target: { value: "Custody support memo" } });
    fireEvent.change(screen.getByLabelText(/Evidence kind/i), { target: { value: "Markdown" } });
    fireEvent.change(screen.getByLabelText(/Evidence status/i), { target: { value: "requested" } });
    fireEvent.change(screen.getByLabelText(/Evidence owner/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Evidence content/i), {
      target: { value: "Custody support is missing and should be returned for evidence review." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Add evidence item/i }));

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));

    expect(await screen.findByText("Custody support memo")).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice. Human review decisions track audit preparation workflow status only./i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Human review target type/i), { target: { value: "evidence" } });
    fireEvent.change(screen.getByLabelText(/Human review status/i), { target: { value: "needs-more-evidence" } });
    fireEvent.change(screen.getByLabelText(/Human review reviewer/i), { target: { value: "Compliance" } });
    fireEvent.change(screen.getByLabelText(/Search human review queue/i), { target: { value: "custody support" } });

    const filteredQueue = screen.getByRole("list", { name: /Filtered human review queue/i });
    expect(screen.getByText(/Showing 1 of/i)).toBeInTheDocument();
    expect(within(filteredQueue).getByText("Custody support memo")).toBeInTheDocument();
    expect(within(filteredQueue).queryByText(/AI Review run/i)).not.toBeInTheDocument();
    expect(within(filteredQueue).queryByText(/Regulation \(EU\) 2023\/1114/i)).not.toBeInTheDocument();
  });

  it("queues saved Counsel Pack versions for Human Review before export handoff", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
    const saveButton = await screen.findByRole("button", { name: /Save Pack Version/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);

    expect(await screen.findByText(/Version 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));
    fireEvent.change(screen.getByLabelText(/Human review target type/i), { target: { value: "counsel-pack" } });

    const filteredQueue = screen.getByRole("list", { name: /Filtered human review queue/i });
    expect(screen.getByText(/Not legal advice. Human review decisions track audit preparation workflow status only./i)).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 of/i)).toBeInTheDocument();
    expect(within(filteredQueue).getByText(/Counsel Pack v1/i)).toBeInTheDocument();
    expect(within(filteredQueue).getByText(/open review items/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Status for .*Counsel Pack v1/i), { target: { value: "reviewed" } });
    fireEvent.change(screen.getByLabelText(/Decision note for .*Counsel Pack v1/i), {
      target: { value: "Reviewed export metadata for audit-prep handoff." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save decision for .*Counsel Pack v1/i }));

    expect(await screen.findByText(/Human review decision saved for .*Counsel Pack v1/i)).toBeInTheDocument();
    expect(screen.getByText(/Not legal advice; this is an audit preparation workflow status/i)).toBeInTheDocument();
  }, 20000);

  it("includes saved Human Review timeline metadata in the Counsel Pack preview", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));
    expect(await screen.findByRole("heading", { name: /^Human Review$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Status for Yield-bearing or investment-like asset/i), { target: { value: "reviewed" } });
    fireEvent.change(screen.getByLabelText(/Reviewer for Yield-bearing or investment-like asset/i), {
      target: { value: "Outside counsel" }
    });
    fireEvent.change(screen.getByLabelText(/Decision note for Yield-bearing or investment-like asset/i), {
      target: { value: "Reviewed risk flag for audit-prep export." }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save decision for Yield-bearing or investment-like asset/i }));

    expect(await screen.findByText(/Human review decision saved for Yield-bearing or investment-like asset/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));

    await screen.findByText(/## Human Review Timeline/i);
    const memo = document.querySelector(".memo");
    expect(memo).toHaveTextContent(/## Human Review Timeline/i);
    expect(memo).toHaveTextContent(/Not legal advice. Human review timeline entries are audit preparation metadata only./i);
    expect(memo).toHaveTextContent(/review.decision.saved/i);
    expect(memo).toHaveTextContent(/reviewer: Outside counsel/i);
    expect(memo).toHaveTextContent(/Reviewed risk flag for audit-prep export/i);
    expect(memo).toHaveTextContent(/human-review-audit-/i);
  }, LONG_APP_FLOW_TIMEOUT_MS);

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

  it("routes due regulatory source review actions into Human Review as clause-match items", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T00:00:00.000Z"));

    try {
      render(<App />);
      await act(async () => {
        await Promise.resolve();
      });

      fireEvent.click(screen.getByRole("button", { name: /Human Review/i }));

      const humanReviewHeading = screen.getByRole("heading", { level: 2, name: "Human Review" });
      const humanReviewPanel = humanReviewHeading.closest("section");

      expect(humanReviewPanel).not.toBeNull();
      const humanReview = within(humanReviewPanel as HTMLElement);
      expect(humanReview.getAllByText(/Clause match/i).length).toBeGreaterThan(0);
      expect(humanReview.getAllByText(/Regulation \(EU\) 2023\/1114, Title II/i).length).toBeGreaterThan(0);
      expect(humanReview.getAllByText(/Refresh Regulation \(EU\) 2023\/1114, Title II source metadata before counsel handoff/i).length).toBeGreaterThan(0);
      expect(humanReview.getAllByText(/Not legal advice/i).length).toBeGreaterThan(0);

      fireEvent.change(humanReview.getByLabelText(/Status for Regulation \(EU\) 2023\/1114, Title II/i), {
        target: { value: "reviewed" }
      });
      fireEvent.change(humanReview.getByLabelText(/Reviewer for Regulation \(EU\) 2023\/1114, Title II/i), {
        target: { value: "EU counsel" }
      });
      fireEvent.change(humanReview.getByLabelText(/Decision note for Regulation \(EU\) 2023\/1114, Title II/i), {
        target: { value: "Source refresh reviewed for audit-prep handoff." }
      });
      fireEvent.click(humanReview.getByRole("button", { name: /Save decision for Regulation \(EU\) 2023\/1114, Title II/i }));

      expect(humanReview.getByText(/Human review decision saved for Regulation \(EU\) 2023\/1114, Title II/i)).toBeInTheDocument();
      expect(humanReview.getByText(/Not legal advice; this is an audit preparation workflow status/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("registers a model connection profile and AI event intake record with a hash", async () => {
    const unsafeApiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const unsafeBearerToken = "abcdef1234567890";
    const unsafePrivateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
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
      target: { value: `Review raw KYC packet using ${unsafeApiKey}.` }
    });
    fireEvent.change(screen.getByLabelText(/Event output summary/i), {
      target: {
        value: `final legal decision: legally compliant after passport data review and private key ${unsafePrivateKey}.`
      }
    });
    fireEvent.change(screen.getByLabelText(/Model action/i), {
      target: { value: `Generated legal opinion with bearer token ${unsafeBearerToken}.` }
    });
    fireEvent.change(screen.getByLabelText(/Event human reviewer/i), { target: { value: "Compliance" } });
    fireEvent.click(screen.getByRole("button", { name: /Add AI event/i }));

    expect(await screen.findByText(/Evidence review/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/\[redacted-legal-conclusion\]/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[redacted-private-key\]/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\[redacted-secret\]/i).length).toBeGreaterThan(0);
    const eventCardText = screen.getByText(/\[redacted-legal-conclusion\]:/i).closest(".run-card")?.textContent ?? "";
    expect(eventCardText).not.toContain(unsafeApiKey);
    expect(eventCardText).not.toContain(unsafeBearerToken);
    expect(eventCardText).not.toContain(unsafePrivateKey);
    expect(eventCardText).not.toMatch(/raw KYC packet|passport data|legal opinion|final legal decision|legally compliant/i);
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
  }, 20000);

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
    const counselPackHeading = await screen.findByRole("heading", { name: /^Counsel Pack$/i });
    const counselPack = within(counselPackHeading.closest("section") as HTMLElement);

    expect(counselPack.getByLabelText(/Export template/i)).toHaveValue("rwa-tokenized-asset");
    expect(counselPack.getByText(/Recommended for current project/i)).toBeInTheDocument();
    expect(counselPack.getAllByText(/Tokenized Asset \/ RWA Review/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(counselPack.getByText(/## Source Review Ledger/i)).toBeInTheDocument());
    expect(
      counselPack.getAllByText(/Not legal advice. Source review metadata is audit preparation lineage only./i).length
    ).toBeGreaterThan(0);

    fireEvent.change(counselPack.getByLabelText(/Export template/i), { target: { value: "ai-governance" } });

    expect(counselPack.getByLabelText(/Export template/i)).toHaveValue("ai-governance");
    await waitFor(() => expect(counselPack.getAllByText(/AI Governance Review/i).length).toBeGreaterThan(0));
    await waitFor(() => expect(counselPack.getByText(/Template Review Agenda/i)).toBeInTheDocument());
    expect(
      counselPack.getAllByText(/Confirm model purpose, allowed data classes, redaction status, and human review owner./i).length
    ).toBeGreaterThan(0);
    expect(counselPack.getAllByText(/Not legal advice. Export templates are audit preparation routing aids only./i).length).toBeGreaterThan(0);
  }, 15000);

  it("downloads a metadata-only Regulatory Source Pack JSON from the Counsel Pack", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrl = vi.fn(() => "blob:regulatory-source-pack");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const capturedBlobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return createObjectUrl();
    });
    URL.revokeObjectURL = revokeObjectUrl;

    try {
      render(<App />);

      fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
      const sourcePackButton = await screen.findByRole("button", { name: /Download Source Pack JSON/i });
      await waitFor(() => expect(sourcePackButton).not.toBeDisabled());
      fireEvent.click(sourcePackButton);

      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:regulatory-source-pack");
      const payloadBlob = capturedBlobs[0];
      expect(payloadBlob).toBeInstanceOf(Blob);
      if (!payloadBlob) {
        throw new Error("Expected Source Pack JSON blob to be created.");
      }
      const payload = await readAppBlobText(payloadBlob);
      const parsed = JSON.parse(payload);

      expect(parsed).toEqual(
        expect.objectContaining({
          packVersion: "lexproof-regulatory-source-pack-v1",
          packHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          notLegalAdviceBoundary: "Not legal advice. Regulatory source packs are audit preparation materials only."
        })
      );
      expect(parsed.clauses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            clauseId: "eu-mica-title-ii-white-paper",
            sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng"
          })
        ])
      );
      expect(parsed.sourceReview).toEqual(
        expect.objectContaining({
          status: "current",
          reviewWindowDays: 90,
          notLegalAdviceBoundary: "Not legal advice. Source review metadata is audit preparation lineage only."
        })
      );
      expect(payload).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  });

  it("saves Counsel Pack versions and shows a diff between exports", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return "blob:counsel-pack-version";
    });
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
      fireEvent.click(screen.getByRole("button", { name: /Download Diff JSON/i }));

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalledTimes(2);
      expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
      const diffPayload = await readAppBlobText(capturedBlobs[1]);
      expect(diffPayload).toContain("lexproof-counsel-pack-version-diff-v1");
      expect(diffPayload).toContain("Not legal advice");
      expect(diffPayload).toContain("review status");
      expect(diffPayload).not.toContain("# Counsel Pack");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
    }
  }, 20000);

  it("flags manifest drift after evidence changes make the saved Counsel Pack version stale", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
    const saveButton = await screen.findByRole("button", { name: /Save Pack Version/i });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);

    expect(await screen.findByText(/Version 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Evidence Ledger/i }));
    const evidenceContent = await screen.findByLabelText(/Content for evidence 1/i);
    fireEvent.change(evidenceContent, {
      target: { value: `${(evidenceContent as HTMLTextAreaElement).value} Updated manifest drift guard metadata.` }
    });

    const driftGuard = await screen.findByRole("region", { name: /Manifest Drift Guard/i });
    await waitFor(() => {
      expect(within(driftGuard).getByText(/Version 1 was saved against an older Evidence Manifest/i)).toBeInTheDocument();
      expect(within(driftGuard).getByText(/Save a fresh Counsel Pack version before external counsel or judge handoff./i)).toBeInTheDocument();
    });
    expect(within(driftGuard).getByRole("button", { name: /Download Manifest Drift JSON/i })).toBeInTheDocument();
    expect(
      within(driftGuard).getByText(/Not legal advice. Manifest drift reports are audit preparation export-readiness metadata only./i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Counsel Pack/i }));
    const counselDriftGuard = await screen.findByRole("region", { name: /Manifest Drift Guard/i });
    expect(within(counselDriftGuard).getAllByText(/Counsel Pack Version/i).length).toBeGreaterThan(0);
    expect(within(counselDriftGuard).getByText(/Version 1 was saved against an older Evidence Manifest/i)).toBeInTheDocument();
  }, 20000);

  it("creates server-side Counsel Pack export records from version metadata", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const capturedBlobs: Blob[] = [];
    const createObjectUrl = vi.fn((blob: Blob | MediaSource) => {
      if (blob instanceof Blob) {
        capturedBlobs.push(blob);
      }
      return "blob:counsel-pack-export-receipt";
    });
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    URL.createObjectURL = createObjectUrl;
    URL.revokeObjectURL = revokeObjectUrl;
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
          includesCredentialMaterial: false,
          sourcePackHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          sourceReviewStatus: expect.stringMatching(/^(current|review-due|metadata-missing)$/)
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
          sourcePackHash: body.sourcePackHash,
          sourceReviewStatus: body.sourceReviewStatus,
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

      fireEvent.click(screen.getByRole("button", { name: /Download Server Export Receipt JSON/i }));
      await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:counsel-pack-export-receipt");
      const receiptPayload = await readAppBlobText(capturedBlobs[0]);
      expect(receiptPayload).toContain("lexproof-counsel-pack-export-record-receipt-v1");
      expect(receiptPayload).toContain("receiptHash");
      expect(receiptPayload).toContain("Not legal advice");
      expect(receiptPayload).not.toContain("# Counsel Pack");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      click.mockRestore();
      vi.unstubAllGlobals();
    }
  }, 20000);

  it("shows server Counsel Pack export recovery guidance when API record creation fails", async () => {
    const fetchMock = vi.fn(async () =>
      appJsonResponse(
        {
          error: "Artifact hash must be a SHA-256 hex digest.",
          code: "COUNSEL_PACK_EXPORT_INVALID_HASH",
          recoveryAction: "Save a fresh Counsel Pack version before creating a server export record.",
          notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
        },
        400
      )
    );
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

      expect(await screen.findByText(/Artifact hash must be a SHA-256 hex digest./i)).toBeInTheDocument();
      expect(screen.getByText(/COUNSEL_PACK_EXPORT_INVALID_HASH/i)).toBeInTheDocument();
      expect(screen.getByText(/Save a fresh Counsel Pack version before creating a server export record./i)).toBeInTheDocument();
      expect(
        screen.getByText(/Not legal advice. This API creates audit preparation workflow records only./i)
      ).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  }, 20000);

  it("shows jurisdiction-specific audit preparation checklist items", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Jurisdiction Checklist/i }));

    expect(await screen.findByRole("heading", { name: /Jurisdiction Checklist/i })).toBeInTheDocument();
    expect(await screen.findByText(/US offering and asset classification review/i)).toBeInTheDocument();
    expect(screen.getByText(/EU crypto-asset disclosure readiness review/i)).toBeInTheDocument();
    expect(screen.getByText(/Jurisdiction Packs/i)).toBeInTheDocument();
    expect(screen.getByText(/Policy controls/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Local counsel routing/i).length).toBeGreaterThan(0);
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

    expect((await screen.findAllByText(/Singapore fintech \/ digital asset counsel/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Swiss DLT \/ financial services counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UAE virtual-assets \/ financial regulatory counsel/i).length).toBeGreaterThan(0);
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
    await waitFor(() => expect(screen.getByRole("button", { name: /Create Simulated Anchor Receipt/i })).toBeEnabled(), {
      timeout: 5000
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Simulated Anchor Receipt/i }));

    expect(await screen.findByText(/Simulated Anchor Receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/not a real on-chain write/i)).toBeInTheDocument();
    expect(screen.getByText(/not-submitted/i)).toBeInTheDocument();
  }, 10000);
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

function createDemoApiMockPayload(url: string): unknown {
  if (url.endsWith("/api/health")) {
    return {
      status: "ok",
      service: "lexproof-secure-review-workspace-api",
      version: "lexproof-phase-2-backend-v1",
      capabilities: {
        modelGateway: "mock-run-ready",
        evidenceVault: "metadata-versioning-ready",
        humanReview: "repository-ready",
        exports: "metadata-records-ready",
        auditLog: "repository-ready"
      },
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    };
  }
  if (url.endsWith("/api/preflight")) {
    return {
      reportVersion: "lexproof-api-preflight-v1",
      status: "ready",
      routeFamilyCount: 7,
      routeFamilies: [],
      implementedRouteCount: 24,
      implementedRoutes: [],
      externalSideEffectsAllowed: false,
      reportHash: "a".repeat(64),
      notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only."
    };
  }
  if (url.endsWith("/api/model-gateway/adapters")) {
    return [];
  }
  if (url.endsWith("/api/model-gateway/provider-policy")) {
    return {
      reportVersion: "lexproof-model-gateway-provider-policy-v1",
      notLegalAdviceBoundary: "Not legal advice. Model Gateway provider policy is audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/evidence-manifest")) {
    return {
      manifestVersion: "lexproof-evidence-vault-manifest-v1",
      workspaceId: "demo-smoke-preflight",
      notLegalAdviceBoundary: "Not legal advice. Evidence manifests summarize audit preparation metadata only."
    };
  }
  if (url.endsWith("/api/workspaces/demo-smoke-preflight/reviews/queue")) {
    return {
      queueVersion: "lexproof-server-human-review-queue-v1",
      workspaceId: "demo-smoke-preflight",
      notLegalAdviceBoundary: "Not legal advice. Human review queues are audit preparation workflow metadata only."
    };
  }
  if (
    url.endsWith("/api/workspaces/demo-smoke-preflight/exports") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/audit-log") ||
    url.endsWith("/api/workspaces/demo-smoke-preflight/integration-policy-evaluations")
  ) {
    return [];
  }

  return {};
}

function installAppLocalStorage(initialValues: Record<string, string> = {}) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  const values = new Map(Object.entries(initialValues));
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => {
      values.clear();
    }),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    }
  } as Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage
  });

  return {
    storage,
    restore: () => {
      if (originalDescriptor) {
        Object.defineProperty(window, "localStorage", originalDescriptor);
      } else {
        Reflect.deleteProperty(window, "localStorage");
      }
    }
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

function createFastDigest(data: BufferSource): ArrayBuffer {
  const input =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const digest = new Uint8Array(32);

  for (let index = 0; index < input.length; index += 1) {
    digest[index % digest.length] = (digest[index % digest.length] + input[index] + index * 31) % 256;
    digest[(index * 7) % digest.length] = digest[(index * 7) % digest.length] ^ ((input[index] + index) % 256);
  }

  return digest.buffer;
}
