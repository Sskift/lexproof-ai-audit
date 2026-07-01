import { Download, FileJson, ShieldCheck, TriangleAlert } from "lucide-react";
import { SectionHeader } from "./AuditWizard";
import {
  downloadExportSafetyInventoryJson,
  type ExportSafetyInventory,
  type ExportSafetyInventoryStatus
} from "../lib/exportSafetyInventory";

type ExportSafetyInventoryPanelProps = {
  inventory: ExportSafetyInventory | null;
};

export function ExportSafetyInventoryPanel({ inventory }: ExportSafetyInventoryPanelProps) {
  return (
    <section className={`export-safety-inventory ${inventory?.overallStatus ?? "needs-action"}`} role="region" aria-label="Export Safety Inventory">
      <SectionHeader
        icon={ShieldCheck}
        title="Export Safety Inventory"
        subtitle="One safety view for downloadable audit-prep artifacts before external handoff."
      />
      <p className="section-note">
        {inventory?.notLegalAdviceBoundary ?? "Not legal advice. Export Safety Inventory is audit preparation handoff metadata only."}
      </p>

      {!inventory ? <p className="empty-state">Export Safety Inventory is calculating from current workspace metadata.</p> : null}

      {inventory ? (
        <>
          <div className="export-inventory-summary">
            <ExportInventoryFact label="Inventory hash" value={inventory.inventoryHash} />
            <ExportInventoryFact label="Boundary status" value={inventory.boundaryStatus} />
            <ExportInventoryFact label="Export handoff" value={inventory.exportHandoffAllowed ? "allowed" : "blocked"} />
            <ExportInventoryFact label="Artifacts" value={String(inventory.artifactCount)} />
          </div>

          <div className="export-inventory-actions">
            <strong>Export handoff {inventory.exportHandoffAllowed ? "allowed" : "blocked"}</strong>
            <span>
              {inventory.readyCount} ready | {inventory.needsReviewCount} needs review | {inventory.missingRequiredCount} missing |{" "}
              {inventory.blockedCount} blocked
            </span>
            <button type="button" className="secondary" onClick={() => downloadExportSafetyInventoryJson("export-safety-inventory.json", inventory)}>
              <Download size={16} aria-hidden="true" />
              Download Export Inventory JSON
            </button>
          </div>

          {inventory.blockers.length > 0 ? (
            <div className="export-inventory-blockers" role="alert">
              <TriangleAlert size={17} aria-hidden="true" />
              <div>
                <strong>Blocked export handoff</strong>
                <ul>
                  {inventory.blockers.slice(0, 5).map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="export-inventory-grid">
            {inventory.artifacts.map((artifact) => (
              <article key={artifact.id} className={`export-inventory-card ${artifact.status}`}>
                <header>
                  <FileJson size={16} aria-hidden="true" />
                  <strong>{artifact.label}</strong>
                  <span>{statusLabel(artifact.status)}</span>
                </header>
                <p>{artifact.exportMode}</p>
                <small>{artifact.artifactHash ? `Hash ${artifact.artifactHash.slice(0, 12)}...` : "Hash pending or not applicable"}</small>
                <small>{artifact.recoveryAction}</small>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExportInventoryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="export-inventory-fact">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function statusLabel(status: ExportSafetyInventoryStatus): string {
  if (status === "needs-action") {
    return "needs action";
  }

  if (status === "needs-review") {
    return "needs review";
  }

  return status;
}
