import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import {
  createDefaultCounselQuestions,
  createQuestionsFromAIReview,
  mergeCounselQuestionQueues,
  type CounselQuestion
} from "./counselQuestions";
import type { AIReviewResult } from "./aiReview";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "question-project",
  projectName: "Question Desk",
  entityType: "Startup issuer",
  jurisdictions: ["United States"],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail users",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC references excluded from export",
  aiUsage: "AI flags legal review questions with citations",
  blockchainUse: "Simulated evidence hash registry",
  operatingStage: "Planned public launch",
  evidenceItems: []
};

describe("createDefaultCounselQuestions", () => {
  it("creates deterministic non-advice counsel questions from risk flags", () => {
    const audit = analyzeAuditProfile(project);
    const questions = createDefaultCounselQuestions(project, audit);

    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "question-project-asset-yield-classification",
          question: expect.stringContaining("classification"),
          relatedFlagId: "asset-yield",
          priority: "P0",
          status: "open",
          source: "risk-rule"
        }),
        expect.objectContaining({
          id: "question-project-custody-authority",
          question: expect.stringContaining("wallet operations"),
          relatedFlagId: "custody",
          priority: "P0"
        })
      ])
    );
    expect(questions.every((item) => item.notLegalAdviceBoundary.includes("Not legal advice"))).toBe(true);
  });
});

describe("mergeCounselQuestionQueues", () => {
  it("keeps edited user questions while adding non-duplicate AI review questions", () => {
    const existing: CounselQuestion[] = [
      {
        id: "question-project-asset-yield-classification",
        projectId: "question-project",
        question: "Edited counsel classification question?",
        relatedFlagId: "asset-yield",
        priority: "P0",
        status: "answered",
        source: "risk-rule",
        notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only."
      }
    ];
    const aiReview: AIReviewResult = {
      extractedFacts: [],
      missingEvidence: [],
      draftQuestions: [
        "Edited counsel classification question?",
        "Which artifacts can be shared with counsel without exposing raw KYC or personal data?"
      ],
      suggestedRemediation: [],
      modelBoundary: "AI-assisted draft for audit preparation only. Not legal advice."
    };

    const merged = mergeCounselQuestionQueues(existing, createQuestionsFromAIReview(project, aiReview));

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      question: "Edited counsel classification question?",
      status: "answered"
    });
    expect(merged[1]).toMatchObject({
      question: "Which artifacts can be shared with counsel without exposing raw KYC or personal data?",
      status: "open",
      source: "ai-review",
      priority: "P1"
    });
  });
});
