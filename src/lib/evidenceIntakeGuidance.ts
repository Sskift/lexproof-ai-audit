import type { EvidenceTemplate } from "./evidenceTemplates";
import type { EvidenceItem, EvidenceOwner, ProjectProfile } from "./projectModel";
import type { RiskEvidenceCoverage, RiskEvidenceRequirement } from "./riskEvidence";

export type EvidenceIntakeGuidanceStatus = "needs-evidence" | "ready";

export type EvidenceIntakeGuidanceAction = {
  id: string;
  actionType: "apply-template" | "prefill-request" | "manual-entry";
  title: string;
  description: string;
  priority?: RiskEvidenceRequirement["priority"];
  source?: string;
  owner: EvidenceOwner;
  templateId?: string;
  requirementId?: string;
  relatedFlagId?: string;
};

export type EvidenceIntakeGuidance = {
  status: EvidenceIntakeGuidanceStatus;
  summary: string;
  actions: EvidenceIntakeGuidanceAction[];
  notLegalAdviceBoundary: "Not legal advice. Evidence intake guidance is audit preparation workflow metadata only.";
};

export type EvidenceIntakeGuidanceInput = {
  project: ProjectProfile;
  evidenceItems: EvidenceItem[];
  riskEvidenceCoverage: RiskEvidenceCoverage[];
  evidenceTemplates: EvidenceTemplate[];
  recommendedTemplateIds: string[];
};

const boundary = "Not legal advice. Evidence intake guidance is audit preparation workflow metadata only." as const;

const priorityRank: Record<RiskEvidenceRequirement["priority"], number> = {
  P0: 0,
  P1: 1,
  P2: 2
};

export function createEvidenceIntakeGuidance(input: EvidenceIntakeGuidanceInput): EvidenceIntakeGuidance {
  const recommendedTemplates = getRecommendedTemplates(input.evidenceTemplates, input.recommendedTemplateIds);
  const missingRequirements = getMissingRequirements(input.riskEvidenceCoverage);
  const actions = [
    ...recommendedTemplates.slice(0, 1).map(createTemplateAction),
    ...missingRequirements.slice(0, 3).map(createRequirementAction),
    createManualAction(input.project)
  ];

  if (input.evidenceItems.length > 0) {
    return {
      status: "ready",
      summary: `${input.evidenceItems.length} evidence records already exist. Continue filling missing high-priority evidence before export handoff.`,
      actions,
      notLegalAdviceBoundary: boundary
    };
  }

  const firstTemplate = recommendedTemplates[0];

  return {
    status: "needs-evidence",
    summary: firstTemplate
      ? `Start with ${firstTemplate.shortLabel} evidence: ${firstTemplate.description}`
      : "Start with metadata-only evidence summaries tied to the highest-priority audit flags.",
    actions,
    notLegalAdviceBoundary: boundary
  };
}

function getRecommendedTemplates(templates: EvidenceTemplate[], ids: string[]): EvidenceTemplate[] {
  const byId = new Map(templates.map((template) => [template.id, template]));
  const ordered = ids.map((id) => byId.get(id)).filter((template): template is EvidenceTemplate => Boolean(template));

  if (ordered.length > 0) {
    return ordered;
  }

  return templates.slice(0, 1);
}

function getMissingRequirements(coverage: RiskEvidenceCoverage[]): RiskEvidenceRequirement[] {
  const seen = new Set<string>();
  const requirements = coverage
    .flatMap((item) => item.requirements)
    .filter((requirement) => requirement.status !== "covered")
    .sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]);

  return requirements.filter((requirement) => {
    if (seen.has(requirement.id)) {
      return false;
    }
    seen.add(requirement.id);
    return true;
  });
}

function createTemplateAction(template: EvidenceTemplate): EvidenceIntakeGuidanceAction {
  return {
    id: `template-${template.id}`,
    actionType: "apply-template",
    title: `Apply ${template.shortLabel} template`,
    description: `Creates ${template.items.length} requested metadata-only evidence records. ${template.notLegalAdviceBoundary}`,
    owner: "Compliance",
    templateId: template.id
  };
}

function createRequirementAction(requirement: RiskEvidenceRequirement): EvidenceIntakeGuidanceAction {
  return {
    id: `requirement-${requirement.id}`,
    actionType: "prefill-request",
    title: requirement.title,
    description: requirement.reason,
    priority: requirement.priority,
    owner: requirement.priority === "P0" ? "Counsel" : "Compliance",
    source: `risk evidence requirement: ${requirement.id}`,
    requirementId: requirement.id,
    relatedFlagId: requirement.relatedFlagId
  };
}

function createManualAction(project: ProjectProfile): EvidenceIntakeGuidanceAction {
  const projectName = project.projectName.trim() || "this project";

  return {
    id: "manual-metadata-summary",
    actionType: "manual-entry",
    title: "Add metadata-only evidence summary",
    description: `Create a short synthetic-safe summary for ${projectName}. Do not paste raw KYC, private keys, credentials, personal data, or raw files.`,
    owner: "Founder",
    source: "manual evidence intake"
  };
}
