import type { AuditResult } from "./auditEngine";
import type { AIReviewResult } from "./aiReview";
import { redactClassifiedText } from "./dataClassification";
import type { ProjectProfile } from "./projectModel";

export type CounselQuestionStatus = "open" | "answered" | "deferred";
export type CounselQuestionSource = "risk-rule" | "ai-review" | "manual";

export type CounselQuestion = {
  id: string;
  projectId: string;
  question: string;
  relatedFlagId?: string;
  priority: "P0" | "P1" | "P2";
  status: CounselQuestionStatus;
  source: CounselQuestionSource;
  notLegalAdviceBoundary: "Not legal advice. Counsel questions are audit preparation prompts only.";
};

const COUNSEL_QUESTION_BOUNDARY = "Not legal advice. Counsel questions are audit preparation prompts only." as const;
const counselQuestionPriorities = ["P0", "P1", "P2"] as const;
const counselQuestionStatuses = ["open", "answered", "deferred"] as const;
const counselQuestionSources = ["risk-rule", "ai-review", "manual"] as const;
const legalConclusionPattern =
  /\b(final\s+legal\s+decision|legal\s+opinion|legal\s+approval|legally\s+compliant|legally\s+non-compliant|compliance\s+decision)\b/gi;

type QuestionTemplate = {
  suffix: string;
  question: string;
  priority: "P0" | "P1" | "P2";
};

const QUESTIONS_BY_FLAG: Record<string, QuestionTemplate[]> = {
  "asset-yield": [
    {
      suffix: "classification",
      question: "Which asset classification, offering, exemption, and disclosure assumptions must counsel validate before external claims?",
      priority: "P0"
    }
  ],
  custody: [
    {
      suffix: "authority",
      question: "Who can initiate, approve, pause, and recover wallet operations, and where is that authority documented?",
      priority: "P0"
    }
  ],
  retail: [
    {
      suffix: "user-access",
      question: "Which user eligibility, marketing, and suitability boundaries should counsel review before public access?",
      priority: "P1"
    }
  ],
  "sensitive-data": [
    {
      suffix: "data-boundary",
      question: "Which KYC, sanctions, wallet-history, or personal-data fields must stay outside exportable audit materials?",
      priority: "P1"
    }
  ],
  "public-launch": [
    {
      suffix: "launch-gates",
      question: "Which approvals must be complete before launch claims, public access, or investor communications go live?",
      priority: "P1"
    }
  ],
  "ai-workflow": [
    {
      suffix: "ai-review",
      question: "Which human review checkpoints and source citations are required before relying on AI-assisted legal or compliance output?",
      priority: "P1"
    }
  ],
  "evidence-anchor": [
    {
      suffix: "anchor-scope",
      question: "What exactly is hashed or anchored, what remains private, and who can verify the manifest receipt?",
      priority: "P2"
    }
  ]
};

export function createDefaultCounselQuestions(project: ProjectProfile, audit: AuditResult): CounselQuestion[] {
  return audit.flags.flatMap((flag) =>
    (QUESTIONS_BY_FLAG[flag.id] ?? []).map((template) => ({
      id: `${project.id}-${flag.id}-${template.suffix}`,
      projectId: project.id,
      question: template.question,
      relatedFlagId: flag.id,
      priority: template.priority,
      status: "open",
      source: "risk-rule",
      notLegalAdviceBoundary: COUNSEL_QUESTION_BOUNDARY
    }))
  );
}

export function createQuestionsFromAIReview(project: ProjectProfile, review: AIReviewResult): CounselQuestion[] {
  return review.draftQuestions.map((question, index) => {
    const safeQuestion = sanitizeCounselQuestionText(question);

    return {
      id: `${project.id}-ai-review-${index + 1}-${slug(safeQuestion)}`,
      projectId: project.id,
      question: safeQuestion,
      priority: "P1",
      status: "open",
      source: "ai-review",
      notLegalAdviceBoundary: COUNSEL_QUESTION_BOUNDARY
    };
  });
}

export function createManualCounselQuestion(project: ProjectProfile): CounselQuestion {
  return {
    id: `${project.id}-manual-${Date.now().toString(36)}`,
    projectId: project.id,
    question: "New counsel review question",
    priority: "P1",
    status: "open",
    source: "manual",
    notLegalAdviceBoundary: COUNSEL_QUESTION_BOUNDARY
  };
}

export function sanitizeCounselQuestion(question: CounselQuestion): CounselQuestion {
  const relatedFlagId = sanitizeOptionalCounselQuestionText(question.relatedFlagId);

  return {
    id: sanitizeCounselQuestionText(question.id) || "counsel-question",
    projectId: sanitizeCounselQuestionText(question.projectId) || "project",
    question: sanitizeCounselQuestionText(question.question) || "Counsel review question requires metadata-only clarification.",
    ...(relatedFlagId ? { relatedFlagId } : {}),
    priority: question.priority,
    status: question.status,
    source: question.source,
    notLegalAdviceBoundary: COUNSEL_QUESTION_BOUNDARY
  };
}

export function parseStoredCounselQuestions(raw: string | null | undefined): CounselQuestion[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const question = normalizeStoredCounselQuestion(item);
          return question ? [question] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function mergeCounselQuestionQueues(existing: CounselQuestion[], incoming: CounselQuestion[]): CounselQuestion[] {
  const sanitizedExisting = existing.map(sanitizeCounselQuestion);
  const sanitizedIncoming = incoming.map(sanitizeCounselQuestion);
  const ids = new Set(sanitizedExisting.map((question) => question.id));
  const seen = new Set(sanitizedExisting.map((question) => normalizeQuestion(question.question)));
  const additions = sanitizedIncoming.filter((question) => {
    if (ids.has(question.id)) {
      return false;
    }
    const normalized = normalizeQuestion(question.question);
    if (seen.has(normalized)) {
      return false;
    }
    ids.add(question.id);
    seen.add(normalized);
    return true;
  });

  return [...sanitizedExisting, ...additions];
}

export function sortCounselQuestionsForReview(questions: CounselQuestion[]): CounselQuestion[] {
  const sourceOrder: Record<CounselQuestionSource, number> = {
    "ai-review": 0,
    "risk-rule": 1,
    manual: 2
  };
  const priorityOrder: Record<CounselQuestion["priority"], number> = {
    P0: 0,
    P1: 1,
    P2: 2
  };

  return [...questions].sort((left, right) => {
    const sourceDiff = sourceOrder[left.source] - sourceOrder[right.source];
    if (sourceDiff !== 0) {
      return sourceDiff;
    }
    const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
    return priorityDiff !== 0 ? priorityDiff : left.id.localeCompare(right.id);
  });
}

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeStoredCounselQuestion(value: unknown): CounselQuestion | null {
  if (!isRecord(value) || value.notLegalAdviceBoundary !== COUNSEL_QUESTION_BOUNDARY) {
    return null;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.projectId) ||
    !isNonEmptyString(value.question) ||
    !isOneOf(value.priority, counselQuestionPriorities) ||
    !isOneOf(value.status, counselQuestionStatuses) ||
    !isOneOf(value.source, counselQuestionSources)
  ) {
    return null;
  }

  if (value.relatedFlagId !== undefined && typeof value.relatedFlagId !== "string") {
    return null;
  }

  return sanitizeCounselQuestion({
    id: value.id,
    projectId: value.projectId,
    question: value.question,
    ...(value.relatedFlagId ? { relatedFlagId: value.relatedFlagId } : {}),
    priority: value.priority,
    status: value.status,
    source: value.source,
    notLegalAdviceBoundary: COUNSEL_QUESTION_BOUNDARY
  });
}

function sanitizeOptionalCounselQuestionText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const sanitized = sanitizeCounselQuestionText(value);
  return sanitized || undefined;
}

function sanitizeCounselQuestionText(value: string): string {
  return redactClassifiedText(value)
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<const T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "question"
  );
}
