import { useState } from "react";
import { Anchor, CheckCircle2, Download, FileText, Printer } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  createSimulatedAnchorReceipt,
  downloadAnchorReceiptJson,
  type SimulatedAnchorReceipt
} from "../lib/anchorReceipt";
import { CounselQuestionsPanel } from "./CounselQuestionsPanel";
import { downloadMarkdownFile, printCounselPackPdf } from "../lib/counselPack";
import type { CounselReviewItem, CounselReviewStatus } from "../lib/counselReview";
import type { CounselQuestion } from "../lib/counselQuestions";
import type { SubmissionFit } from "../lib/auditEngine";
import { downloadManifestJson, type EvidenceManifest } from "../lib/evidenceManifest";

type CounselPackPanelProps = {
  projectName: string;
  fit: SubmissionFit;
  manifest: EvidenceManifest | null;
  markdown: string;
  counselQuestions: CounselQuestion[];
  counselReviews: CounselReviewItem[];
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, updates: Partial<CounselQuestion>) => void;
  onRemoveQuestion: (id: string) => void;
  onUpdateReview: (id: string, updates: Partial<CounselReviewItem>) => void;
};

export function CounselPackPanel({
  projectName,
  fit,
  manifest,
  markdown,
  counselQuestions,
  counselReviews,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onUpdateReview
}: CounselPackPanelProps) {
  const [receipt, setReceipt] = useState<SimulatedAnchorReceipt | null>(null);
  const [printError, setPrintError] = useState("");

  const createReceipt = () => {
    if (!manifest) {
      return;
    }
    setReceipt(createSimulatedAnchorReceipt(manifest, "ethereum-sepolia"));
  };

  const printCounselPack = () => {
    setPrintError("");
    try {
      printCounselPackPdf(`${projectName} Counsel Pack`, markdown);
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : "Unable to open counsel pack print window.");
    }
  };

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={FileText}
        title="Counsel Pack"
        subtitle="Download a Markdown audit-prep packet with non-advice disclaimer, facts, flags, owners, manifest hash, and sources."
      />

      <div className="submission-strip">
        {fit.requiredAssets.map((asset) => (
          <span key={asset}>
            <CheckCircle2 size={15} aria-hidden="true" />
            {asset}
          </span>
        ))}
      </div>

      <CounselQuestionsPanel
        questions={counselQuestions}
        onAddQuestion={onAddQuestion}
        onUpdateQuestion={onUpdateQuestion}
        onRemoveQuestion={onRemoveQuestion}
      />

      <CounselReviewStatusPanel reviews={counselReviews} onUpdateReview={onUpdateReview} />

      <div className="counsel-actions">
        <div>
          <span>Manifest bundle SHA-256</span>
          <code>{manifest?.bundleHash ?? "calculating"}</code>
        </div>
        <div className="export-buttons">
          <button type="button" onClick={() => downloadMarkdownFile(`${slug(projectName)}-counsel-pack.md`, markdown)}>
            <Download size={16} aria-hidden="true" />
            Download Markdown
          </button>
          <button type="button" className="secondary" onClick={printCounselPack}>
            <Printer size={16} aria-hidden="true" />
            Print / Save PDF
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!manifest}
            onClick={() => manifest && downloadManifestJson(`${slug(projectName)}-manifest.json`, manifest)}
          >
            <Download size={16} aria-hidden="true" />
            Download Manifest JSON
          </button>
          <button type="button" className="secondary" disabled={!manifest} onClick={createReceipt}>
            <Anchor size={16} aria-hidden="true" />
            {!manifest ? "Calculating Anchor Receipt" : receipt ? "Refresh Receipt" : "Create Simulated Anchor Receipt"}
          </button>
        </div>
        {printError ? <p className="save-state">{printError}</p> : null}
      </div>

      {receipt ? (
        <section className="anchor-receipt">
          <div className="panel-title compact-title">
            <Anchor size={17} aria-hidden="true" />
            <h3>Simulated Anchor Receipt</h3>
          </div>
          <div className="receipt-grid">
            <ReceiptFact label="Mode" value={receipt.mode} />
            <ReceiptFact label="Status" value={receipt.status} />
            <ReceiptFact label="Network" value={receipt.network} />
            <ReceiptFact label="Receipt ID" value={receipt.receiptId} />
            <ReceiptFact label="Bundle hash" value={receipt.bundleHash} wide />
          </div>
          <p>{receipt.disclaimer}</p>
          <button
            type="button"
            className="secondary"
            onClick={() => downloadAnchorReceiptJson(`${slug(projectName)}-anchor-receipt.json`, receipt)}
          >
            <Download size={16} aria-hidden="true" />
            Download Receipt JSON
          </button>
        </section>
      ) : null}

      <pre className="memo">{markdown}</pre>
    </section>
  );
}

function CounselReviewStatusPanel({
  reviews,
  onUpdateReview
}: {
  reviews: CounselReviewItem[];
  onUpdateReview: (id: string, updates: Partial<CounselReviewItem>) => void;
}) {
  return (
    <section className="review-status-panel">
      <div className="panel-title compact-title">
        <CheckCircle2 size={17} aria-hidden="true" />
        <h3>Counsel Review Status</h3>
      </div>
      <p className="section-note">
        Track counsel and compliance review readiness for each deterministic risk flag. Not legal advice.
      </p>
      <div className="review-status-list">
        {reviews.length === 0 ? <p className="empty-state">No risk flags require counsel review yet.</p> : null}
        {reviews.map((review, index) => {
          const sequence = index + 1;
          return (
            <article key={review.id} className={`review-status-card ${review.status}`}>
              <header>
                <span className={`priority ${review.priority}`}>{review.priority}</span>
                <div>
                  <strong>{review.title}</strong>
                  <small>
                    {review.owner} · {review.severity} · {review.evidenceSummary}
                  </small>
                </div>
              </header>
              <div className="review-status-grid">
                <label className="editor-field" htmlFor={`review-${sequence}-status`}>
                  <span className="field-label">Status</span>
                  <select
                    id={`review-${sequence}-status`}
                    aria-label={`Status for review ${sequence}`}
                    value={review.status}
                    onChange={(event) => onUpdateReview(review.id, { status: event.target.value as CounselReviewStatus })}
                  >
                    <option value="not-started">not-started</option>
                    <option value="needs-evidence">needs-evidence</option>
                    <option value="ready-for-counsel">ready-for-counsel</option>
                    <option value="reviewed">reviewed</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
                <label className="editor-field" htmlFor={`review-${sequence}-reviewer`}>
                  <span className="field-label">Reviewer</span>
                  <input
                    id={`review-${sequence}-reviewer`}
                    aria-label={`Reviewer for review ${sequence}`}
                    value={review.reviewer}
                    onChange={(event) => onUpdateReview(review.id, { reviewer: event.target.value })}
                    placeholder="Counsel or compliance owner"
                  />
                </label>
                <label className="editor-field review-note-field" htmlFor={`review-${sequence}-note`}>
                  <span className="field-label">Review note</span>
                  <textarea
                    id={`review-${sequence}-note`}
                    aria-label={`Review note ${sequence}`}
                    value={review.reviewerNote}
                    onChange={(event) => onUpdateReview(review.id, { reviewerNote: event.target.value })}
                    placeholder="Decision, blocker, or evidence request"
                  />
                </label>
              </div>
              <small>{review.notLegalAdviceBoundary}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReceiptFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "lexproof"
  );
}
