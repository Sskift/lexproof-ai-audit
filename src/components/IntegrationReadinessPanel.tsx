import { Bot, ClipboardList, DatabaseZap, FileText, Link2, PlugZap } from "lucide-react";
import type {
  IntegrationAdapterCategory,
  IntegrationAdapterId,
  IntegrationReadinessAdapter,
  IntegrationReadinessRegistry
} from "../lib/integrationReadiness";

type IntegrationReadinessPanelProps = {
  registry: IntegrationReadinessRegistry;
  onNavigate: (target: IntegrationReadinessTarget) => void;
};

type IntegrationReadinessTarget = "ai" | "evidence" | "counsel" | "risk";

const categoryIcons: Record<IntegrationAdapterCategory, typeof PlugZap> = {
  "model-provider": Bot,
  "evidence-storage": DatabaseZap,
  anchor: Link2,
  "document-processing": FileText,
  "workflow-export": ClipboardList
};

export function IntegrationReadinessPanel({ registry, onNavigate }: IntegrationReadinessPanelProps) {
  return (
    <section className={`integration-readiness-panel ${registry.overallStatus}`} aria-label="Integration Readiness Registry">
      <div className="split-title compact-title">
        <div>
          <PlugZap size={17} aria-hidden="true" />
          <h3>Integration Readiness Registry</h3>
        </div>
        <span className={`workflow-status ${registry.overallStatus}`}>{statusLabel(registry.overallStatus)}</span>
      </div>
      <p className="section-note">{registry.notLegalAdviceBoundary}</p>
      <div className="integration-readiness-summary">
        <span>{registry.readyCount} ready</span>
        <span>{registry.needsPolicyCount} needs policy</span>
        <span>{registry.blockedCount} blocked</span>
        <span>{registry.disabledCount} disabled</span>
      </div>
      <div className="integration-adapter-grid">
        {registry.adapters.map((adapter) => (
          <IntegrationAdapterCard key={adapter.id} adapter={adapter} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="integration-next-actions">
        <strong>Adapter recovery path</strong>
        <ul>
          {registry.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function IntegrationAdapterCard({
  adapter,
  onNavigate
}: {
  adapter: IntegrationReadinessAdapter;
  onNavigate: IntegrationReadinessPanelProps["onNavigate"];
}) {
  const Icon = categoryIcons[adapter.category];
  const target = targetForAdapter(adapter.id);

  return (
    <article className={`integration-adapter-card ${adapter.status}`}>
      <header>
        <Icon size={17} aria-hidden="true" />
        <strong>
          {adapter.label} {statusLabel(adapter.status)}
        </strong>
      </header>
      <p>{adapter.readinessEvidence}</p>
      {adapter.disabledReason ? <small>{adapter.disabledReason}</small> : null}
      {adapter.validationErrors.length > 0 ? (
        <ul className="integration-validation-list" aria-label={`${adapter.label} validation errors`}>
          {adapter.validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <small>{adapter.requiredPolicy}</small>
      <div className="inline-actions">
        <span>{adapter.recoveryAction}</span>
        <button type="button" className="secondary" onClick={() => onNavigate(target)}>
          {targetLabel(target)}
        </button>
      </div>
      <small>{adapter.notLegalAdviceBoundary}</small>
    </article>
  );
}

function statusLabel(status: IntegrationReadinessRegistry["overallStatus"]): string {
  if (status === "needs-policy") {
    return "needs policy";
  }

  return status;
}

function targetForAdapter(adapterId: IntegrationAdapterId): IntegrationReadinessTarget {
  if (adapterId === "server-model-provider") {
    return "ai";
  }

  if (adapterId === "grc-ticket-export") {
    return "risk";
  }

  if (adapterId === "chain-anchor") {
    return "counsel";
  }

  return "evidence";
}

function targetLabel(target: IntegrationReadinessTarget): string {
  if (target === "ai") {
    return "Open model gate";
  }

  if (target === "risk") {
    return "Open remediation queue";
  }

  if (target === "counsel") {
    return "Open anchor export";
  }

  return "Open evidence gate";
}
