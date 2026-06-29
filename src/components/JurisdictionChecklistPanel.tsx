import { Globe2 } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import type { AuditResult } from "../lib/auditEngine";
import { createJurisdictionChecklist } from "../lib/jurisdictionChecklist";
import type { ProjectProfile } from "../lib/projectModel";

type JurisdictionChecklistPanelProps = {
  project: ProjectProfile;
  audit: AuditResult;
};

export function JurisdictionChecklistPanel({ project, audit }: JurisdictionChecklistPanelProps) {
  const checklist = createJurisdictionChecklist(project, audit);

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={Globe2}
        title="Jurisdiction Checklist"
        subtitle="US, EU, and UK preparation checklist items for counsel review. Not legal advice."
      />

      <div className="notice-banner">
        <Globe2 size={18} aria-hidden="true" />
        <p>Checklist items are review prompts for audit preparation only. They do not determine compliance status.</p>
      </div>

      <div className="jurisdiction-grid">
        {checklist.length === 0 ? (
          <p className="empty-state">No jurisdiction checklist items generated from the current facts.</p>
        ) : null}
        {checklist.map((item) => (
          <article key={item.id} className={`jurisdiction-card ${item.status}`}>
            <div className="jurisdiction-card-header">
              <span>{item.jurisdiction}</span>
              <span className={`priority ${item.priority}`}>{item.priority}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.reason}</p>
            <small>
              {statusLabel(item.status)} · {item.source}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function statusLabel(status: string): string {
  return status === "evidence-ready" ? "Evidence ready" : "Review needed";
}
