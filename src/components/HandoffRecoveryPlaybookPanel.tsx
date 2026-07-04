import { ArrowRight, CheckCircle2, Download, ListChecks, TriangleAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  downloadHandoffRecoveryPlaybookJson,
  type HandoffRecoveryPlaybook,
  type HandoffRecoveryPlaybookStatus,
  type HandoffRecoverySeverity
} from "../lib/handoffRecoveryPlaybook";
import type { WorkspaceActionTarget } from "../lib/workspaceActionQueue";

type HandoffRecoveryPlaybookPanelProps = {
  playbook: HandoffRecoveryPlaybook | null;
  onNavigate: (target: WorkspaceActionTarget) => void;
};

export function HandoffRecoveryPlaybookPanel({ playbook, onNavigate }: HandoffRecoveryPlaybookPanelProps) {
  const status = playbook?.status ?? "calculating";

  return (
    <section className={`handoff-recovery-playbook ${status}`} role="region" aria-label="Handoff Recovery Playbook">
      <SectionHeader
        icon={ListChecks}
        title="Handoff Recovery Playbook"
        subtitle="Ordered recovery steps for blocked, missing, or stale handoff artifacts."
      />
      <p className="section-note">
        {playbook?.notLegalAdviceBoundary ??
          "Not legal advice. Handoff Recovery Playbooks are audit preparation workflow metadata only."}
      </p>

      {!playbook ? <p className="empty-state">Handoff Recovery Playbook is calculating from Sources artifacts.</p> : null}

      {playbook ? (
        <>
          <div className="handoff-recovery-summary">
            <RecoveryFact label="Playbook hash" value={playbook.playbookHash} />
            <RecoveryFact label="Status" value={formatStatus(playbook.status)} />
            <RecoveryFact label="Steps" value={String(playbook.stepCount)} />
            <RecoveryFact label="Blocked" value={String(playbook.blockedCount)} />
            <RecoveryFact label="Needs action" value={String(playbook.needsActionCount)} />
            <RecoveryFact label="Needs review" value={String(playbook.needsReviewCount)} />
          </div>

          <div className="handoff-recovery-actions">
            <div>
              <strong>{playbook.exportHandoffAllowed ? "Handoff recovery clear" : "Handoff recovery active"}</strong>
              <span>{playbook.nextActions[0]}</span>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => downloadHandoffRecoveryPlaybookJson(`${slug(playbook.projectName)}-handoff-recovery-playbook.json`, playbook)}
            >
              <Download size={16} aria-hidden="true" />
              Download Recovery Playbook JSON
            </button>
          </div>

          {playbook.steps.length === 0 ? (
            <div className="handoff-recovery-clear">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>All tracked Sources, counsel, and export artifacts are ready for metadata-only handoff.</span>
            </div>
          ) : (
            <div className="handoff-recovery-steps" role="list" aria-label="Handoff recovery steps">
              {playbook.steps.map((step) => (
                <article key={step.id} className={`handoff-recovery-step ${step.severity}`} role="listitem">
                  <header>
                    <span>Step {step.rank}</span>
                    <strong>{step.title}</strong>
                    <StatusPill severity={step.severity} />
                  </header>
                  <p>{step.reason}</p>
                  <small>{step.recoveryAction}</small>
                  <div className="handoff-recovery-step-footer">
                    <code>{step.artifactHash ? `hash ${step.artifactHash.slice(0, 12)}...` : step.sourceLabel}</code>
                    <button type="button" className="secondary" onClick={() => onNavigate(step.targetSurface)}>
                      <ArrowRight size={16} aria-hidden="true" />
                      Open {tabLabel(step.targetSurface)}
                    </button>
                  </div>
                  <small>{step.notLegalAdviceBoundary}</small>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function RecoveryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="handoff-recovery-fact">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function StatusPill({ severity }: { severity: HandoffRecoverySeverity }) {
  return (
    <span className={`handoff-recovery-pill ${severity}`}>
      <TriangleAlert size={14} aria-hidden="true" />
      {formatStatus(severity)}
    </span>
  );
}

function formatStatus(status: HandoffRecoveryPlaybookStatus | HandoffRecoverySeverity): string {
  return status.replace(/-/g, " ");
}

function tabLabel(target: WorkspaceActionTarget): string {
  const labels: Record<WorkspaceActionTarget, string> = {
    wizard: "Audit Wizard",
    ai: "AI Review",
    model: "Model Intake",
    review: "Human Review",
    jurisdiction: "Jurisdiction Checklist",
    risk: "Risk Audit",
    evidence: "Evidence Ledger",
    counsel: "Counsel Pack",
    sources: "Sources"
  };

  return labels[target];
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "lexproof"
  );
}
