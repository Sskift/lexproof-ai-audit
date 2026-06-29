import { CheckCircle2, Download, FileText } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import { downloadMarkdownFile } from "../lib/counselPack";
import type { SubmissionFit } from "../lib/auditEngine";
import { downloadManifestJson, type EvidenceManifest } from "../lib/evidenceManifest";

type CounselPackPanelProps = {
  projectName: string;
  fit: SubmissionFit;
  manifest: EvidenceManifest | null;
  markdown: string;
};

export function CounselPackPanel({ projectName, fit, manifest, markdown }: CounselPackPanelProps) {
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
        </div>
      </div>

      <pre className="memo">{markdown}</pre>
    </section>
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
