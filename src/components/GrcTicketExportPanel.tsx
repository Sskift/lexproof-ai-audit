import { Download, TicketCheck } from "lucide-react";
import {
  downloadGrcTicketExportJson,
  type GrcTicketExportBundle
} from "../lib/grcTicketExport";

type GrcTicketExportPanelProps = {
  bundle: GrcTicketExportBundle;
};

export function GrcTicketExportPanel({ bundle }: GrcTicketExportPanelProps) {
  return (
    <section className={`grc-ticket-export ${bundle.exportAllowed ? "ready" : "blocked"}`} aria-label="GRC Ticket Export">
      <div className="split-title compact-title">
        <div>
          <TicketCheck size={17} aria-hidden="true" />
          <h3>GRC Ticket Export</h3>
        </div>
        <span className={`workflow-status ${bundle.exportAllowed ? "ready" : "blocked"}`}>
          {bundle.exportAllowed ? "ready" : bundle.adapterStatus}
        </span>
      </div>
      <p className="section-note">{bundle.notLegalAdviceBoundary}</p>
      <div className="grc-ticket-summary">
        <span>{bundle.ticketCount} metadata-only remediation tickets</span>
        <span>{bundle.riskLevel} risk</span>
        <span>{bundle.adapterStatus} adapter</span>
      </div>
      {bundle.exportAllowed ? (
        <div className="grc-ticket-list">
          {bundle.tickets.slice(0, 4).map((ticket) => (
            <article key={ticket.id}>
              <span className={`priority ${ticket.priority}`}>{ticket.priority}</span>
              <div>
                <strong>{ticket.title}</strong>
                <p>{ticket.action}</p>
                <small>
                  {ticket.owner} · {ticket.linkedRiskFlagIds.join(", ") || "general-review"}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ul className="grc-ticket-blockers">
          {bundle.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}
      <div className="inline-actions">
        <span>
          {bundle.exportAllowed
            ? "Export metadata-only remediation work for an external GRC or ticketing system."
            : "Resolve adapter blockers before creating a GRC ticket bundle."}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={!bundle.exportAllowed}
          onClick={() => downloadGrcTicketExportJson(`${slug(bundle.projectName)}-grc-tickets.json`, bundle)}
        >
          <Download size={15} aria-hidden="true" />
          Download GRC Tickets JSON
        </button>
      </div>
    </section>
  );
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "lexproof"
  );
}
