import type { AuditResult } from "./auditEngine";
import type { CounselReviewItem } from "./counselReview";
import type { CounselQuestion } from "./counselQuestions";
import type { EvidenceManifest } from "./evidenceManifest";
import type { ProjectProfile } from "./projectModel";

export function buildMarkdownCounselPack(
  project: ProjectProfile,
  audit: AuditResult,
  manifest: EvidenceManifest,
  counselQuestions: CounselQuestion[] = [],
  counselReviews: CounselReviewItem[] = []
): string {
  const flags = audit.flags.map((flag) => `- [${flag.severity}] ${flag.title}: ${flag.rationale}`).join("\n");
  const remediation = audit.remediation.map((item) => `- ${item.priority} ${item.owner}: ${item.action}`).join("\n");
  const evidence = manifest.items
    .map((item) => `- ${item.sequence}. ${item.label} (${item.kind}, ${item.status}) — ${item.contentHash}`)
    .join("\n");
  const questions = counselQuestions
    .map((item) => `- ${item.priority} ${item.status} [${item.relatedFlagId ?? item.source}] ${item.question}`)
    .join("\n");
  const reviews = counselReviews.map(formatReviewItem).join("\n");
  const sources = audit.sourcePack.map((source) => `- ${source.title}: ${source.url}`).join("\n");

  return [
    `# ${project.projectName} Counsel Pack`,
    "",
    "Not legal advice. This document is audit preparation material for counsel and compliance review.",
    "",
    "## Project Profile",
    `- Entity type: ${project.entityType}`,
    `- Jurisdictions: ${project.jurisdictions.join(", ")}`,
    `- Asset model: ${project.assetModel}`,
    `- User exposure: ${project.userType}`,
    `- Custody model: ${project.custodyModel}`,
    `- Data boundary: ${project.dataSensitivity}`,
    `- AI usage: ${project.aiUsage}`,
    `- Blockchain use: ${project.blockchainUse}`,
    `- Operating stage: ${project.operatingStage}`,
    "",
    "## Risk Summary",
    `- Risk level: ${audit.riskLevel}`,
    `- Risk score: ${audit.score}/100`,
    `- Manifest bundle SHA-256: ${manifest.bundleHash}`,
    "",
    "## Risk Flags",
    flags || "- No material flags detected in the current facts.",
    "",
    "## Counsel Questions",
    questions || "- No counsel questions have been added yet.",
    "",
    "## Counsel Review Status",
    reviews || "- No counsel review statuses have been generated yet.",
    "",
    "## Remediation Queue",
    remediation,
    "",
    "## Evidence Manifest",
    `- Manifest version: ${manifest.manifestVersion}`,
    `- Generated at: ${manifest.generatedAt}`,
    `- Evidence item count: ${manifest.itemCount}`,
    evidence || "- No evidence items have been added yet.",
    "",
    "## Source Pack",
    sources
  ].join("\n");
}

function formatReviewItem(item: CounselReviewItem): string {
  const reviewer = item.reviewer.trim() || "unassigned";
  const note = item.reviewerNote.trim() ? `\n  - note: ${item.reviewerNote.trim()}` : "";
  return `- ${item.priority} ${item.status} [${item.flagId}] ${item.title} (${item.owner}; ${item.evidenceSummary}; reviewer: ${reviewer})${note}`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildPrintableCounselPackHtml(title: string, markdown: string): string {
  const safeTitle = escapeHtml(title);
  const safeMarkdown = escapeHtml(markdown);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${safeTitle}</title>`,
    "<style>",
    ":root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
    "body { margin: 0; background: #f7faf9; color: #1c2b2f; }",
    "main { max-width: 860px; margin: 0 auto; padding: 32px; background: #ffffff; min-height: 100vh; }",
    "h1 { margin: 0 0 8px; font-size: 22px; }",
    ".boundary { margin: 0 0 20px; color: #596b70; font-size: 13px; }",
    "pre { white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }",
    "@media print { body { background: #ffffff; } main { padding: 0; max-width: none; } button { display: none; } }",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    `<h1>${safeTitle}</h1>`,
    '<p class="boundary">Not legal advice. Browser print output is audit preparation material for counsel and compliance review.</p>',
    `<pre>${safeMarkdown}</pre>`,
    "</main>",
    "</body>",
    "</html>"
  ].join("");
}

export function printCounselPackPdf(title: string, markdown: string): void {
  const printWindow = window.open("", "_blank", "width=960,height=720");
  if (!printWindow) {
    throw new Error("Unable to open counsel pack print window.");
  }

  try {
    printWindow.opener = null;
  } catch {
    // Some browsers expose opener as read-only for this window mode.
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintableCounselPackHtml(title, markdown));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
