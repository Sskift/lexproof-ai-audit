import { CheckCircle2, Download, FileJson, TriangleAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  downloadJudgeHandoffBundleJson,
  type JudgeHandoffBundle,
  type JudgeHandoffBundleArtifactStatus
} from "../lib/judgeHandoffBundle";

type JudgeHandoffBundlePanelProps = {
  bundle: JudgeHandoffBundle | null;
};

export function JudgeHandoffBundlePanel({ bundle }: JudgeHandoffBundlePanelProps) {
  return (
    <section
      className={`judge-handoff-bundle ${bundle?.exportHandoffAllowed ? "ready" : "needs-action"}`}
      role="region"
      aria-label="Judge Handoff Bundle"
    >
      <SectionHeader
        icon={FileJson}
        title="Judge Handoff Bundle"
        subtitle="Single metadata-only JSON handoff for Submission Pack, Demo Runbook, and Export Safety Inventory."
      />
      <p className="section-note">
        {bundle?.notLegalAdviceBoundary ?? "Not legal advice. Judge handoff bundles are audit preparation metadata only."}
      </p>

      {!bundle ? <p className="empty-state">Judge Handoff Bundle is calculating from Sources artifacts.</p> : null}

      {bundle ? (
        <>
          <div className="judge-handoff-summary">
            <JudgeHandoffFact label="Bundle hash" value={bundle.bundleHash} />
            <JudgeHandoffFact label="Export handoff" value={bundle.exportHandoffAllowed ? "allowed" : "blocked"} />
            <JudgeHandoffFact label="Artifacts" value={String(bundle.artifactCount)} />
            <JudgeHandoffFact label="Ready" value={String(bundle.readyCount)} />
          </div>

          <div className="judge-handoff-actions">
            <strong>Sources handoff {bundle.exportHandoffAllowed ? "ready" : "needs action"}</strong>
            <span>
              {bundle.readyCount} ready | {bundle.needsReviewCount} needs review | {bundle.missingCount} missing |{" "}
              {bundle.blockedCount} blocked
            </span>
            <button
              type="button"
              className="secondary"
              onClick={() => downloadJudgeHandoffBundleJson(`${slug(bundle.projectName)}-judge-handoff-bundle.json`, bundle)}
            >
              <Download size={16} aria-hidden="true" />
              Download Judge Handoff Bundle JSON
            </button>
          </div>

          {bundle.nextActions.length > 0 ? (
            <div className="judge-handoff-next-actions">
              <TriangleAlert size={17} aria-hidden="true" />
              <div>
                <strong>Handoff recovery queue</strong>
                <ul>
                  {bundle.nextActions.slice(0, 5).map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="judge-handoff-grid">
            {bundle.artifacts.map((artifact) => (
              <article key={artifact.id} className={`judge-handoff-artifact ${artifact.status}`}>
                <header>
                  {artifact.status === "ready" ? (
                    <CheckCircle2 size={16} aria-hidden="true" />
                  ) : (
                    <TriangleAlert size={16} aria-hidden="true" />
                  )}
                  <strong>{artifact.label}</strong>
                  <span>{statusLabel(artifact.status)}</span>
                </header>
                <small>{artifact.artifactHash ? `Hash ${artifact.artifactHash.slice(0, 12)}...` : "Hash missing"}</small>
                <small>{artifact.recoveryAction}</small>
                <small>{artifact.notLegalAdviceBoundary}</small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function JudgeHandoffFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="judge-handoff-fact">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function statusLabel(status: JudgeHandoffBundleArtifactStatus): string {
  if (status === "needs-action") {
    return "needs action";
  }

  if (status === "needs-review") {
    return "needs review";
  }

  return status;
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
