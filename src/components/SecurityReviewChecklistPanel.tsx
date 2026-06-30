import { Bot, DatabaseZap, Link2, ShieldCheck } from "lucide-react";
import type { SecurityReviewArea, SecurityReviewChecklistReport, SecurityReviewChecklistItem } from "../lib/securityReviewChecklist";

type SecurityReviewChecklistPanelProps = {
  report: SecurityReviewChecklistReport;
  onNavigate: (target: SecurityReviewTarget) => void;
};

type SecurityReviewTarget = "ai" | "evidence" | "counsel";

const areaIcons: Record<SecurityReviewArea, typeof ShieldCheck> = {
  "model-provider": Bot,
  "evidence-storage": DatabaseZap,
  "anchor-integration": Link2
};

export function SecurityReviewChecklistPanel({ report, onNavigate }: SecurityReviewChecklistPanelProps) {
  return (
    <section className={`security-review-panel ${report.overallStatus}`} aria-label="Security Review Checklist">
      <div className="split-title compact-title">
        <div>
          <ShieldCheck size={17} aria-hidden="true" />
          <h3>Security Review Checklist</h3>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{statusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="security-review-summary">
        <span>{report.readyCount} ready</span>
        <span>{report.reviewCount} needs review</span>
        <span>{report.blockerCount} blocked</span>
      </div>
      <div className="security-review-grid">
        {report.items.map((item) => (
          <SecurityReviewItem key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="security-review-actions">
        <strong>Next actions</strong>
        <ul>
          {report.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SecurityReviewItem({
  item,
  onNavigate
}: {
  item: SecurityReviewChecklistItem;
  onNavigate: SecurityReviewChecklistPanelProps["onNavigate"];
}) {
  const Icon = areaIcons[item.area];
  const target = targetForArea(item.area);

  return (
    <article className={`security-review-item ${item.status}`}>
      <header>
        <Icon size={17} aria-hidden="true" />
        <strong>
          {item.title} {statusLabel(item.status)}
        </strong>
      </header>
      <p>{item.evidence}</p>
      <small>{item.requiredBeforeRealIntegration}</small>
      <div className="inline-actions">
        <span>{item.recoveryAction}</span>
        <button type="button" className="secondary" onClick={() => onNavigate(target)}>
          {targetLabel(target)}
        </button>
      </div>
    </article>
  );
}

function statusLabel(status: SecurityReviewChecklistReport["overallStatus"]): string {
  if (status === "needs-review") {
    return "needs review";
  }

  return status;
}

function targetForArea(area: SecurityReviewArea): SecurityReviewTarget {
  if (area === "model-provider") {
    return "ai";
  }

  if (area === "evidence-storage") {
    return "evidence";
  }

  return "counsel";
}

function targetLabel(target: SecurityReviewTarget): string {
  if (target === "ai") {
    return "Review model gate";
  }

  if (target === "evidence") {
    return "Review evidence gate";
  }

  return "Review anchor gate";
}
