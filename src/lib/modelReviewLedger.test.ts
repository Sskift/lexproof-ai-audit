import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import type { AIReviewPayload } from "./aiReview";
import { createModelReviewRun, exportModelReviewRunJson, runAIReviewWithLedger } from "./modelReviewLedger";
import type { ModelProvider } from "./modelProvider";
import type { ProjectProfile } from "./projectModel";

const payload: AIReviewPayload = {
  boundary: "Not legal advice. AI output is an audit preparation draft.",
  instructions: "Return JSON only.",
  project: {
    projectName: "Model Ledger Review",
    jurisdictions: ["United States"],
    assetModel: "Tokenized yield note",
    custodyModel: "Platform controls wallet",
    dataSensitivity: "No raw KYC",
    aiUsage: "AI drafts review questions",
    blockchainUse: "Simulated manifest anchor",
    operatingStage: "Private beta"
  },
  riskFlags: [{ id: "asset-yield", title: "Yield-bearing asset", severity: "high", rationale: "Needs review." }],
  evidenceSummaries: [
    {
      label: "Issuer memo",
      kind: "Markdown",
      status: "received",
      owner: "Counsel",
      contentPreview: "Token terms and approval assumptions"
    }
  ],
  missingEvidenceChecklist: []
};

const project: ProjectProfile = {
  id: "project-model-ledger",
  projectName: "Model Ledger Review",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized yield note",
  userType: "Retail users",
  custodyModel: "Platform controls wallet",
  dataSensitivity: "No raw KYC",
  aiUsage: "AI drafts review questions",
  blockchainUse: "Simulated manifest anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "issuer-memo",
      label: "Issuer memo",
      kind: "Markdown",
      content: "Token terms and approval assumptions",
      status: "received",
      owner: "Counsel"
    }
  ]
};

describe("createModelReviewRun", () => {
  it("creates stable payload and response hashes for a model review run", async () => {
    const run = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });
    const repeat = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });

    expect(run.runVersion).toBe("lexproof-ai-review-run-v1");
    expect(run.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(run.responseHash).toMatch(/^[a-f0-9]{64}$/);
    expect(run.payloadHash).toBe(repeat.payloadHash);
    expect(run.responseHash).toBe(repeat.responseHash);
    expect(run.runId).toBe(repeat.runId);
    expect(run.evidenceSummaryCount).toBe(1);
    expect(run.riskFlagCount).toBe(1);
    expect(run.boundary).toContain("Not legal advice");
  });

  it("changes the response hash when model output changes", async () => {
    const firstRun = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean"
    });
    const secondRun = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Different fact"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean"
    });

    expect(secondRun.payloadHash).toBe(firstRun.payloadHash);
    expect(secondRun.responseHash).not.toBe(firstRun.responseHash);
  });

  it("keeps hashes stable but gives separate run IDs to repeated reviews at different times", async () => {
    const firstRun = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });
    const secondRun = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean",
      generatedAt: "2026-06-29T00:01:00.000Z"
    });

    expect(secondRun.payloadHash).toBe(firstRun.payloadHash);
    expect(secondRun.responseHash).toBe(firstRun.responseHash);
    expect(secondRun.runId).not.toBe(firstRun.runId);
  });
});

describe("runAIReviewWithLedger", () => {
  it("runs the provider and records review metadata without changing deterministic risk scoring", async () => {
    const audit = analyzeAuditProfile(project);
    const provider: ModelProvider = {
      providerLabel: "Traceable mock reviewer",
      async completeReview() {
        return {
          providerLabel: "Traceable mock reviewer",
          content: JSON.stringify({
            extractedFacts: ["Tokenized yield note"],
            missingEvidence: ["Marketing review"],
            draftQuestions: ["Who approved launch language?"],
            suggestedRemediation: ["Attach approval log"]
          })
        };
      }
    };

    const { result, run } = await runAIReviewWithLedger(project, audit, project.evidenceItems, provider, {
      model: "lexproof-mock",
      redactionStatus: "needs-review",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });

    expect(result.modelBoundary).toContain("Not legal advice");
    expect(result.missingEvidence).toEqual(expect.arrayContaining(["Marketing review"]));
    expect(run.providerLabel).toBe("Traceable mock reviewer");
    expect(run.model).toBe("lexproof-mock");
    expect(run.redactionStatus).toBe("needs-review");
    expect(run.riskFlagCount).toBe(audit.flags.length);
    expect(exportModelReviewRunJson(run)).toContain(run.payloadHash);
  });
});
