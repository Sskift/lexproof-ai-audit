import { Bot, CheckCircle2, ClipboardList, DatabaseZap, FileText, ShieldCheck, UserCheck } from "lucide-react";
import type { AuditResult } from "../lib/auditEngine";
import type { ModelConnectReceipt } from "../lib/modelConnect";

type SecureReviewWorkspaceProps = {
  projectReady: boolean;
  evidenceCount: number;
  auditRiskLevel: AuditResult["riskLevel"];
  modelConnectReceipt: ModelConnectReceipt | null;
  humanReviewOpenCount: number;
  manifestHash?: string;
  onNavigate: (target: "wizard" | "ai" | "model" | "review" | "evidence" | "counsel") => void;
};

export function SecureReviewWorkspace({
  projectReady,
  evidenceCount,
  auditRiskLevel,
  modelConnectReceipt,
  humanReviewOpenCount,
  manifestHash,
  onNavigate
}: SecureReviewWorkspaceProps) {
  const modelReady = modelConnectReceipt?.status === "ready";
  const manifestReady = Boolean(manifestHash);
  const reviewReady = humanReviewOpenCount === 0;

  return (
    <section className="secure-workspace-panel" aria-label="Secure Review Workspace">
      <div className="secure-workspace-header">
        <div>
          <p className="eyebrow">Secure Review Workspace</p>
          <h2>Secure Review Workspace</h2>
          <p>Not legal advice. Secure review workspace records are audit preparation materials only.</p>
        </div>
        <div className={`secure-risk ${auditRiskLevel}`}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{auditRiskLevel} risk</span>
        </div>
      </div>

      <div className="secure-flow-grid">
        <WorkflowStep
          icon={ClipboardList}
          title="Project Facts"
          status={projectReady ? "ready" : "needs-input"}
          detail={projectReady ? "Workspace facts are ready for deterministic audit." : "Complete required project facts first."}
          actionLabel="Review facts"
          onAction={() => onNavigate("wizard")}
        />
        <WorkflowStep
          icon={DatabaseZap}
          title="Evidence Vault"
          status={evidenceCount > 0 ? "ready" : "needs-input"}
          detail={evidenceCount > 0 ? `${evidenceCount} evidence records available.` : "Add or request evidence before review handoff."}
          actionLabel="Manage evidence"
          onAction={() => onNavigate("evidence")}
        />
        <WorkflowStep
          icon={Bot}
          title="Model Connect"
          status={modelReady ? "ready" : "needs-input"}
          detail={modelReady ? `${modelConnectReceipt.providerLabel} validated.` : "Validate a mock or session-only model connection."}
          actionLabel="Connect Model"
          onAction={() => onNavigate("ai")}
        />
        <WorkflowStep
          icon={UserCheck}
          title="Human Review"
          status={reviewReady ? "ready" : "needs-review"}
          detail={reviewReady ? "No open review decisions." : `${humanReviewOpenCount} review decisions need human attention.`}
          actionLabel="Open queue"
          onAction={() => onNavigate("review")}
        />
        <WorkflowStep
          icon={FileText}
          title="Counsel Pack"
          status={manifestReady ? "ready" : "needs-input"}
          detail={manifestReady ? `Manifest ${manifestHash?.slice(0, 12)}... ready.` : "Manifest is still being generated."}
          actionLabel="Prepare pack"
          onAction={() => onNavigate("counsel")}
        />
      </div>
    </section>
  );
}

type WorkflowStepProps = {
  icon: typeof ClipboardList;
  title: string;
  status: "ready" | "needs-input" | "needs-review";
  detail: string;
  actionLabel: string;
  onAction: () => void;
};

function WorkflowStep({ icon: Icon, title, status, detail, actionLabel, onAction }: WorkflowStepProps) {
  return (
    <article className={`secure-flow-step ${status}`}>
      <header>
        <Icon size={17} aria-hidden="true" />
        <span>{statusLabel(status)}</span>
      </header>
      <strong>{title}</strong>
      <p>{detail}</p>
      <button type="button" className="secondary" onClick={onAction}>
        <CheckCircle2 size={15} aria-hidden="true" />
        {actionLabel}
      </button>
    </article>
  );
}

function statusLabel(status: WorkflowStepProps["status"]): string {
  if (status === "ready") {
    return "ready";
  }

  if (status === "needs-review") {
    return "needs review";
  }

  return "needs input";
}
