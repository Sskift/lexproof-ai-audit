import { evidenceTemplates, type EvidenceTemplate } from "../data/evidenceTemplates";
import type { EvidenceItem, ProjectProfile } from "./projectModel";

export type { EvidenceTemplate } from "../data/evidenceTemplates";

export function listEvidenceTemplates(): EvidenceTemplate[] {
  return evidenceTemplates.map(cloneTemplate);
}

export function recommendEvidenceTemplates(project: ProjectProfile): EvidenceTemplate[] {
  const projectText = [
    project.projectName,
    project.entityType,
    project.jurisdictions.join(" "),
    project.assetModel,
    project.userType,
    project.custodyModel,
    project.dataSensitivity,
    project.aiUsage,
    project.blockchainUse,
    project.operatingStage
  ]
    .join(" ")
    .toLowerCase();

  return listEvidenceTemplates()
    .map((template) => ({ template, score: scoreTemplate(template, projectText) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.template);
}

export function createEvidenceItemsFromTemplate(templateId: string): EvidenceItem[] {
  const template = evidenceTemplates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error(`Unknown evidence template: ${templateId}`);
  }
  return template.items.map((item) => ({ ...item }));
}

function scoreTemplate(template: EvidenceTemplate, projectText: string): number {
  return template.triggerKeywords.reduce((score, keyword) => (projectText.includes(keyword) ? score + 1 : score), 0);
}

function cloneTemplate(template: EvidenceTemplate): EvidenceTemplate {
  return {
    ...template,
    triggerKeywords: [...template.triggerKeywords],
    items: template.items.map((item) => ({ ...item }))
  };
}
