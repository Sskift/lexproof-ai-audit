import { useState } from "react";
import { Bot, CheckCircle2, ClipboardList, DatabaseZap, Download, FileText, PlayCircle, ServerCog, ShieldCheck, UserCheck } from "lucide-react";
import type { AuditResult } from "../lib/auditEngine";
import {
  createModelGatewayEvaluationRecord,
  downloadModelGatewayEvaluationJson,
  type ModelGatewayEvaluationRecord
} from "../lib/modelGatewayEvaluation";
import type { ModelConnectReceipt } from "../lib/modelConnect";
import type { ProjectProfile } from "../lib/projectModel";
import { runSecureReviewJourney, type SecureReviewJourneyResult } from "../lib/secureReviewJourney";

type SecureReviewWorkspaceProps = {
  project: ProjectProfile;
  audit: AuditResult;
  projectReady: boolean;
  evidenceCount: number;
  auditRiskLevel: AuditResult["riskLevel"];
  modelConnectReceipt: ModelConnectReceipt | null;
  humanReviewOpenCount: number;
  humanReviewOwner: string;
  manifestHash?: string;
  onNavigate: (target: "wizard" | "ai" | "model" | "review" | "evidence" | "counsel") => void;
};

export function SecureReviewWorkspace({
  project,
  audit,
  projectReady,
  evidenceCount,
  auditRiskLevel,
  modelConnectReceipt,
  humanReviewOpenCount,
  humanReviewOwner,
  manifestHash,
  onNavigate
}: SecureReviewWorkspaceProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [journeyStatus, setJourneyStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [journeyError, setJourneyError] = useState("");
  const [journeyResult, setJourneyResult] = useState<SecureReviewJourneyResult | null>(null);
  const modelReady = modelConnectReceipt?.status === "ready";
  const manifestReady = Boolean(manifestHash);
  const reviewReady = humanReviewOpenCount === 0;

  const runJourney = async () => {
    setJourneyStatus("running");
    setJourneyError("");
    setJourneyResult(null);

    try {
      const result = await runSecureReviewJourney({
        project,
        audit,
        evidenceItems: project.evidenceItems,
        modelConnectReceipt,
        apiBaseUrl,
        humanReviewOwner
      });
      setJourneyResult(result);
      setJourneyStatus("complete");
    } catch (error) {
      setJourneyStatus("error");
      setJourneyError(error instanceof Error ? error.message : "Secure review journey failed.");
    }
  };

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

      <section className={`secure-journey-panel ${journeyStatus}`}>
        <div className="split-title compact-title">
          <div>
            <ServerCog size={17} aria-hidden="true" />
            <h3>Secure Review Journey</h3>
          </div>
          <span className={`workflow-status ${journeyStatus}`}>{journeyStatus}</span>
        </div>
        <p>
          Create a backend workspace, sync metadata-only evidence vault records, create a Model Gateway run receipt, and open a
          human review request. Not legal advice.
        </p>
        <div className="secure-journey-controls">
          <div>
            <label className="field-label" htmlFor="secure-review-api-base">
              Secure Review API base URL
            </label>
            <input
              id="secure-review-api-base"
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder="/api on same host, or http://127.0.0.1:8787"
            />
          </div>
          <button type="button" disabled={journeyStatus === "running"} onClick={() => void runJourney()}>
            <PlayCircle size={16} aria-hidden="true" />
            {journeyStatus === "running" ? "Running Secure Review Journey" : "Run Secure Review Journey"}
          </button>
        </div>
        {journeyError ? (
          <SecureJourneyError message={journeyError} onNavigate={onNavigate} />
        ) : null}
        {journeyResult ? <SecureJourneyResult result={journeyResult} /> : null}
      </section>
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

function SecureJourneyResult({ result }: { result: SecureReviewJourneyResult }) {
  const evaluation = createModelGatewayEvaluationRecord(result.modelGatewayRun);

  return (
    <div className="secure-journey-result">
      <strong>Secure review journey complete</strong>
      <div className="run-facts">
        <JourneyFact label="Vault manifest" value={shortHash(result.evidenceVault.manifest.bundleHash)} />
        <JourneyFact label="Model Gateway response" value={shortHash(result.modelGatewayRun.responseHash)} />
        <JourneyFact label="Human review request" value={result.humanReview.id} />
        <JourneyFact label="Audit log events" value={String(result.auditLogRecords.length)} />
      </div>
      <small>{result.notLegalAdviceBoundary}</small>
      <ModelGatewayEvaluationPanel evaluation={evaluation} />
    </div>
  );
}

function ModelGatewayEvaluationPanel({ evaluation }: { evaluation: ModelGatewayEvaluationRecord }) {
  return (
    <section className={`model-gateway-evaluation ${evaluation.status}`}>
      <div className="split-title compact-title">
        <div>
          <ServerCog size={17} aria-hidden="true" />
          <h3>Model Gateway Evaluation</h3>
        </div>
        <span className={`workflow-status ${evaluation.status}`}>{evaluation.status}</span>
      </div>
      <p className="section-note">{evaluation.notLegalAdviceBoundary}</p>
      <div className="run-facts evaluation-facts">
        <JourneyFact label="Payload hash" value={shortHash(evaluation.hashes.payloadHash)} />
        <JourneyFact label="Response hash" value={shortHash(evaluation.hashes.responseHash)} />
        <JourneyFact label="Source evidence" value={shortHash(evaluation.hashes.sourceEvidenceHash)} />
        <JourneyFact label="Human review" value={evaluation.humanReviewStatus} />
        <JourneyFact label="Retry state" value={evaluation.retryState} />
        <JourneyFact label="Adapter" value={evaluation.adapterMode} />
      </div>
      <div className="model-evaluation-policy">
        <span>Allowed data classes</span>
        <strong>{evaluation.allowedDataClasses.join(", ") || "none declared"}</strong>
        <small>{evaluation.credentialPolicy}. {evaluation.secretPolicy}</small>
      </div>
      <div className="model-evaluation-actions">
        <span>Reviewer action: {evaluation.reviewerAction}</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadModelGatewayEvaluationJson("model-gateway-evaluation.json", evaluation)}
        >
          <Download size={16} aria-hidden="true" />
          Download Model Evaluation JSON
        </button>
      </div>
    </section>
  );
}

function SecureJourneyError({
  message,
  onNavigate
}: {
  message: string;
  onNavigate: SecureReviewWorkspaceProps["onNavigate"];
}) {
  const recovery = recoveryForJourneyError(message);

  return (
    <div className="secure-journey-error" role="alert">
      <strong>{recovery.title}</strong>
      <p>{recovery.detail}</p>
      <small>{message}</small>
      <div className="inline-actions">
        <span>Not legal advice. Fixing this step only prepares workflow records for human review.</span>
        <button type="button" className="secondary" onClick={() => onNavigate(recovery.target)}>
          {recovery.actionLabel}
        </button>
      </div>
    </div>
  );
}

function recoveryForJourneyError(message: string): {
  title: string;
  detail: string;
  actionLabel: string;
  target: Parameters<SecureReviewWorkspaceProps["onNavigate"]>[0];
} {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("model gateway boundary") ||
    normalized.includes("model-gateway-run-") ||
    normalized.includes("retry state:")
  ) {
    return {
      title: "Secure Review Journey cannot run until Model Gateway remediation is complete",
      detail: "Review the server failure receipt, complete the remediation steps, then rerun the secure review journey.",
      actionLabel: "Fix Model Gateway inputs",
      target: "ai"
    };
  }

  if (
    normalized.includes("model connect") ||
    normalized.includes("model name") ||
    normalized.includes("base url") ||
    normalized.includes("api key")
  ) {
    return {
      title: "Secure Review Journey cannot run until Model Connect is ready",
      detail: "Complete Base URL, model name, and API key, or switch to the mock local reviewer, then validate Model Connect again.",
      actionLabel: "Fix Model Connect",
      target: "ai"
    };
  }

  if (normalized.includes("evidence")) {
    return {
      title: "Secure Review Journey needs evidence before vault sync",
      detail: "Add a metadata-only evidence item or apply an evidence template, then rerun the secure review journey.",
      actionLabel: "Add Evidence",
      target: "evidence"
    };
  }

  return {
    title: "Secure Review Journey stopped before completion",
    detail: "Check the API base URL, backend server status, and workspace inputs before retrying.",
    actionLabel: "Review Workspace",
    target: "wizard"
  };
}

function JourneyFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <code>
        {label} {value}
      </code>
    </div>
  );
}

function shortHash(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}
