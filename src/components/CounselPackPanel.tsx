import { useState } from "react";
import { Anchor, CheckCircle2, Download, FileText } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  createSimulatedAnchorReceipt,
  downloadAnchorReceiptJson,
  type SimulatedAnchorReceipt
} from "../lib/anchorReceipt";
import { CounselQuestionsPanel } from "./CounselQuestionsPanel";
import { downloadMarkdownFile } from "../lib/counselPack";
import type { CounselQuestion } from "../lib/counselQuestions";
import type { SubmissionFit } from "../lib/auditEngine";
import { downloadManifestJson, type EvidenceManifest } from "../lib/evidenceManifest";

type CounselPackPanelProps = {
  projectName: string;
  fit: SubmissionFit;
  manifest: EvidenceManifest | null;
  markdown: string;
  counselQuestions: CounselQuestion[];
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, updates: Partial<CounselQuestion>) => void;
  onRemoveQuestion: (id: string) => void;
};

export function CounselPackPanel({
  projectName,
  fit,
  manifest,
  markdown,
  counselQuestions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion
}: CounselPackPanelProps) {
  const [receipt, setReceipt] = useState<SimulatedAnchorReceipt | null>(null);

  const createReceipt = () => {
    if (!manifest) {
      return;
    }
    setReceipt(createSimulatedAnchorReceipt(manifest, "ethereum-sepolia"));
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
