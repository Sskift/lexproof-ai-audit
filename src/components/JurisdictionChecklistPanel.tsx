import { Globe2 } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import type { AuditResult } from "../lib/auditEngine";
import { createJurisdictionChecklist } from "../lib/jurisdictionChecklist";
import { createJurisdictionPacks, type JurisdictionPack } from "../lib/jurisdictionPacks";
import type { ProjectProfile } from "../lib/projectModel";

type JurisdictionChecklistPanelProps = {
  project: ProjectProfile;
  audit: AuditResult;
};

export function JurisdictionChecklistPanel({ project, audit }: JurisdictionChecklistPanelProps) {
  const checklist = createJurisdictionChecklist(project, audit);
  const packs = createJurisdictionPacks(project, audit);

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={Globe2}
        title="Jurisdiction Checklist"
        subtitle="Jurisdiction preparation checklist items and local-counsel routing for counsel review. Not legal advice."
      />

      <div className="notice-banner">
        <Globe2 size={18} aria-hidden="true" />
        <p>Checklist items are review prompts for audit preparation only. They do not determine compliance status.</p>
      </div>

      <section className="jurisdiction-pack-section">
        <div className="panel-title compact-title">
          <Globe2 size={17} aria-hidden="true" />
          <h3>Jurisdiction Packs</h3>
        </div>
        <div className="pack-section-summary">
          <strong>Policy controls</strong>
          <span>Local counsel routing</span>
        </div>
        <div className="jurisdiction-pack-grid">
          {packs.map((pack) => (
            <JurisdictionPackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>

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

function JurisdictionPackCard({ pack }: { pack: JurisdictionPack }) {
  return (
    <article className="jurisdiction-pack-card">
      <header>
        <div>
          <span>{pack.packVersion}</span>
          <h3>{pack.jurisdiction}</h3>
        </div>
        <small>{pack.source}</small>
      </header>
      <p>{pack.summary}</p>
      <div className="jurisdiction-route">
        <strong>Counsel route</strong>
        <span>{pack.localCounselRoute.recommendedRole}</span>
        <small>
          Trigger: {pack.localCounselRoute.trigger}. {pack.localCounselRoute.handoffNote}
        </small>
      </div>
      <div className="jurisdiction-controls">
        {pack.controls.map((control) => (
          <article key={control.id} className={`jurisdiction-control ${control.status}`}>
            <div>
              <span className={`priority ${control.priority}`}>{control.priority}</span>
              <strong>{control.title}</strong>
            </div>
            <p>
              {control.owner} · {control.relatedFlagIds.join(", ")}
            </p>
            <small>{formatControlStatus(control.status, control.evidenceLabels)}</small>
          </article>
        ))}
      </div>
      <small>Not legal advice. This pack is an audit preparation routing aid only.</small>
    </article>
  );
}

function formatControlStatus(status: string, evidenceLabels: string[]): string {
  return status === "evidence-ready" ? `evidence ready: ${evidenceLabels.join(", ")}` : "needs evidence";
}

function statusLabel(status: string): string {
  return status === "evidence-ready" ? "Evidence ready" : "Review needed";
}
