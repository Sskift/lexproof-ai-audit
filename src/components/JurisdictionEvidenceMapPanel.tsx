import { Download, Globe2, ListChecks, ShieldCheck } from "lucide-react";
import {
  downloadJurisdictionEvidenceMapJson,
  type JurisdictionEvidenceMap,
  type JurisdictionEvidenceMapStatus
} from "../lib/jurisdictionEvidenceMap";

type JurisdictionEvidenceMapPanelProps = {
  map: JurisdictionEvidenceMap;
  projectId: string;
};

export function JurisdictionEvidenceMapPanel({ map, projectId }: JurisdictionEvidenceMapPanelProps) {
  return (
    <section className={`jurisdiction-evidence-map ${map.status}`} aria-label="Jurisdiction Evidence Map">
      <div className="jurisdiction-map-header">
        <div className="reg-section-title">
          <Globe2 size={17} aria-hidden="true" />
          <h3>Jurisdiction Evidence Map</h3>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadJurisdictionEvidenceMapJson(`lexproof-${projectId}-jurisdiction-evidence-map.json`, map)}
        >
          <Download size={15} aria-hidden="true" />
          Download Jurisdiction Evidence Map JSON
        </button>
      </div>

      <div className="reg-control-boundary">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{map.notLegalAdviceBoundary}</span>
      </div>

      <div className="jurisdiction-map-summary">
        <MapFact label="Status" value={formatMapStatus(map.status)} helper={`${map.totalControlCount} source controls`} />
        <MapFact label="Jurisdictions" value={map.jurisdictionCount} helper="grouped from control matrix" />
        <MapFact
          label="Open evidence"
          value={map.totalOpenEvidenceRequestCount}
          helper={`${map.highestPriority} highest priority`}
        />
        <MapFact label="Map hash" value={map.mapHash.slice(0, 12)} helper="metadata-only SHA-256" />
      </div>

      <div className="jurisdiction-map-grid" role="list" aria-label="Jurisdiction evidence requests">
        {map.jurisdictions.length === 0 ? (
          <p className="empty-state">
            No jurisdiction controls are available yet. Add project jurisdictions and launch facts to build evidence requests.
          </p>
        ) : null}
        {map.jurisdictions.map((jurisdiction) => (
          <article key={jurisdiction.jurisdiction} className={`jurisdiction-map-card ${jurisdiction.status}`} role="listitem">
            <header>
              <span>{formatMapStatus(jurisdiction.status)}</span>
              <strong>{jurisdiction.jurisdiction}</strong>
            </header>

            <div className="jurisdiction-map-facts">
              <small>{jurisdiction.controlCount} controls</small>
              <small>{jurisdiction.openEvidenceRequestCount} open evidence</small>
              <small>{jurisdiction.p0OpenEvidenceRequestCount} P0 blockers</small>
            </div>

            <div className="jurisdiction-map-topics" aria-label={`${jurisdiction.jurisdiction} topics`}>
              {jurisdiction.topics.slice(0, 4).map((topic) => (
                <span key={topic.topic}>
                  {formatTopic(topic.topic)} ({topic.controlCount})
                </span>
              ))}
            </div>

            <p>{jurisdiction.localCounselRoles.join(", ") || "Counsel route not assigned"}</p>

            {jurisdiction.topOpenEvidenceRequests.length > 0 ? (
              <div className="jurisdiction-map-requests">
                {jurisdiction.topOpenEvidenceRequests.slice(0, 3).map((request) => (
                  <div key={`${request.citation}-${request.title}`} className="jurisdiction-map-request">
                    <ListChecks size={14} aria-hidden="true" />
                    <span>
                      <strong>{request.priority}</strong> {request.title}
                      <small>{request.sourceName} - {request.citation}</small>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="jurisdiction-map-empty">No open evidence requests for this jurisdiction.</p>
            )}

            <small>{jurisdiction.nextAction}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function MapFact({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="jurisdiction-map-fact">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function formatMapStatus(status: JurisdictionEvidenceMapStatus): string {
  if (status === "needs-evidence") {
    return "needs evidence";
  }
  if (status === "needs-source-review") {
    return "needs source review";
  }
  if (status === "metadata-missing") {
    return "metadata missing";
  }
  if (status === "no-controls") {
    return "no controls";
  }
  return "ready for counsel";
}

function formatTopic(topic: string): string {
  return topic.replace(/-/g, " ");
}
