import { CheckCircle2, Download, FileJson, TriangleAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { exportSubmissionPackJson, type SubmissionPack, type SubmissionPackStatus } from "../lib/submissionPack";

type SubmissionPackPanelProps = {
  pack: SubmissionPack | null;
};

export function SubmissionPackPanel({ pack }: SubmissionPackPanelProps) {
  return (
    <section className="submission-pack-panel" role="region" aria-label="Submission Pack">
      <SectionHeader
        icon={FileJson}
        title="Submission Pack"
        subtitle="Judge-facing artifact that summarizes demo readiness, hashes, known limitations, and hackathon fit."
      />
      <p className="section-note">
        {pack?.notLegalAdviceBoundary ??
          "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only."}
      </p>

      {!pack ? <p className="empty-state">Submission Pack is calculating from the current workspace metadata.</p> : null}

      {pack ? (
        <>
          <div className="submission-pack-summary">
            <SubmissionFact label="Pack hash" value={pack.packHash} />
            <SubmissionFact label="Manifest hash" value={pack.manifestHash || "missing"} />
            <SubmissionFact label="Regulatory Source Pack hash" value={pack.regulatorySourcePackHash || "missing"} />
            <SubmissionFact label="Demo readiness" value={pack.demoReadinessStatus} />
          </div>

          <div className="submission-pack-actions">
            <button type="button" className="secondary" onClick={() => downloadSubmissionPackJson(pack)}>
              <Download size={16} aria-hidden="true" />
              Download Submission Pack JSON
            </button>
            <span>
              {pack.evidenceItemCount} evidence items | {pack.counselPackVersionCount} pack versions |{" "}
              {pack.serverExportRecordCount} server export records
            </span>
          </div>

          <div className="submission-pack-grid">
            <section className="submission-pack-section" aria-label="Submission required assets">
              <h3>Required assets</h3>
              <div className="submission-asset-list">
                {pack.requiredAssets.map((asset) => (
                  <article key={asset.label} className={`submission-asset ${asset.status}`}>
                    <header>
                      {asset.status === "ready" ? <CheckCircle2 size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
                      <strong>{asset.label}</strong>
                      <span>{statusLabel(asset.status)}</span>
                    </header>
                    <p>{asset.evidence}</p>
                    <small>{asset.recoveryAction}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="submission-pack-section" aria-label="Submission feature mapping">
              <h3>Hackathon mapping</h3>
              <div className="submission-mapping-list">
                {pack.featureMappings.map((mapping) => (
                  <article key={mapping.criterion} className="submission-mapping">
                    <strong>{mapping.criterion}</strong>
                    <ul>
                      {mapping.productEvidence.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <small>{mapping.boundary}</small>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="submission-pack-section" aria-label="Submission known limitations">
            <h3>Known limitations</h3>
            <div className="submission-limitation-list">
              {pack.knownLimitations.map((item) => (
                <article key={item.id} className="submission-limitation">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{item.mitigation}</small>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

function SubmissionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="submission-fact">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function statusLabel(status: SubmissionPackStatus): string {
  if (status === "needs-action") {
    return "needs action";
  }

  return status;
}

function downloadSubmissionPackJson(pack: SubmissionPack): void {
  const blob = new Blob([exportSubmissionPackJson(pack)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug(pack.projectName)}-submission-pack.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
