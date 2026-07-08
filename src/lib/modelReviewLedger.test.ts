import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import type { AIReviewPayload } from "./aiReview";
import {
  createModelReviewRun,
  exportModelReviewRunJson,
  parseStoredModelReviewRuns,
  runAIReviewWithLedger,
  sanitizeModelReviewRun
} from "./modelReviewLedger";
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

  it("redacts unsafe display metadata before exporting a model review ledger run", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const unsafePayload = {
      ...payload,
      project: {
        ...payload.project,
        projectName: `Model Ledger ${apiKey} final legal decision`
      }
    };

    const run = await createModelReviewRun({
      payload: unsafePayload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: `Provider leaked ${apiKey}`,
      model: `model-${privateKey}-raw KYC packet`,
      redactionStatus: "needs-review",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });
    const json = exportModelReviewRunJson(run);

    expect(run.projectName).toContain("[redacted-api-key]");
    expect(run.projectName).toContain("[redacted-legal-conclusion]");
    expect(run.providerLabel).toContain("[redacted-api-key]");
    expect(run.model).toContain("[redacted-private-key]");
    expect(run.model).toContain("[redacted-raw-kyc]");
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).not.toMatch(/final legal decision|raw KYC packet/i);
    expect(json).toContain("AI-assisted draft for audit preparation only. Not legal advice.");
  });

  it("recovers only structurally valid metadata-only runs from local storage", async () => {
    const run = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "clean",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });

    const recovered = parseStoredModelReviewRuns(
      JSON.stringify([
        { ...run, ignoredRawEvidence: "should not survive normalization" },
        { ...run, runId: "provider-api-key-sk-live-abcdef1234567890abcdef1234567890" },
        { ...run, boundary: "AI made a legal opinion." },
        { ...run, payloadHash: "not-a-sha256" },
        { ...run, evidenceSummaryCount: -1 },
        { runVersion: "lexproof-ai-review-run-v1" }
      ])
    );

    expect(recovered).toEqual([run]);
    expect(JSON.stringify(recovered)).not.toContain("ignoredRawEvidence");
  });

  it("returns an empty recovery set for malformed local storage payloads", () => {
    expect(parseStoredModelReviewRuns("{not json")).toEqual([]);
    expect(parseStoredModelReviewRuns(JSON.stringify({ runVersion: "lexproof-ai-review-run-v1" }))).toEqual([]);
    expect(parseStoredModelReviewRuns(null)).toEqual([]);
  });

  it("sanitizes unsafe persisted display metadata before UI recovery and export", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const run = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "needs-review",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });

    const recovered = parseStoredModelReviewRuns(
      JSON.stringify([
        {
          ...run,
          projectName: `Stored project ${apiKey} final legal decision`,
          providerLabel: `Provider ${apiKey}`,
          model: `model-${privateKey}-raw KYC packet`
        }
      ])
    );
    const [recoveredRun] = recovered;
    if (!recoveredRun) {
      throw new Error("Expected a recovered model review run.");
    }
    const json = exportModelReviewRunJson(recoveredRun);
    const serialized = JSON.stringify(recovered);

    expect(recovered).toHaveLength(1);
    expect(recoveredRun.projectName).toContain("[redacted-api-key]");
    expect(recoveredRun.projectName).toContain("[redacted-legal-conclusion]");
    expect(recoveredRun.providerLabel).toContain("[redacted-api-key]");
    expect(recoveredRun.model).toContain("[redacted-private-key]");
    expect(recoveredRun.model).toContain("[redacted-raw-kyc]");
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|final legal decision/i);
    expect(json).not.toContain(apiKey);
    expect(json).not.toContain(privateKey);
    expect(json).toContain("AI-assisted draft for audit preparation only. Not legal advice.");
  });

  it("sanitizes model review runs before local persistence", async () => {
    const apiKey = "sk-live-abcdef1234567890abcdef1234567890";
    const privateKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const run = await createModelReviewRun({
      payload,
      responseContent: JSON.stringify({ extractedFacts: ["Tokenized yield note"] }),
      providerLabel: "Mock local reviewer",
      model: "lexproof-mock",
      redactionStatus: "needs-review",
      generatedAt: "2026-06-29T00:00:00.000Z"
    });

    const sanitized = sanitizeModelReviewRun({
      ...run,
      projectName: `Stored project ${apiKey} final legal decision`,
      providerLabel: `Provider ${apiKey}`,
      model: `model-${privateKey}-raw KYC packet`
    });
    const invalid = sanitizeModelReviewRun({
      ...run,
      runId: `ai-run-${apiKey}`,
      providerLabel: `Provider ${apiKey}`
    });
    const serialized = JSON.stringify(sanitized);

    expect(sanitized).toEqual(
      expect.objectContaining({
        runVersion: "lexproof-ai-review-run-v1",
        runId: run.runId,
        payloadHash: run.payloadHash,
        responseHash: run.responseHash,
        boundary: "AI-assisted draft for audit preparation only. Not legal advice."
      })
    );
    expect(sanitized?.projectName).toContain("[redacted-api-key]");
    expect(sanitized?.projectName).toContain("[redacted-legal-conclusion]");
    expect(sanitized?.providerLabel).toContain("[redacted-api-key]");
    expect(sanitized?.model).toContain("[redacted-private-key]");
    expect(sanitized?.model).toContain("[redacted-raw-kyc]");
    expect(invalid).toBeNull();
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(privateKey);
    expect(serialized).not.toMatch(/raw KYC packet|final legal decision/i);
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
