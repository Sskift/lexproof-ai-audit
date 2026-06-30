import { Bot, ClipboardList, DatabaseZap, Download, FileText, Link2, PlugZap, ShieldCheck } from "lucide-react";
import type {
  IntegrationAdapterCategory,
  IntegrationAdapterId,
  IntegrationReadinessAdapter,
  IntegrationReadinessRegistry
} from "../lib/integrationReadiness";
import {
  exportModelGatewayProviderPolicyJson,
  type ModelGatewayProviderPolicyReport,
  type ModelGatewayProviderPolicyStatus
} from "../lib/modelGatewayProviderPolicy";

type IntegrationReadinessPanelProps = {
  registry: IntegrationReadinessRegistry;
  providerPolicyReport: ModelGatewayProviderPolicyReport;
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

export function IntegrationReadinessPanel({ registry, providerPolicyReport, onNavigate }: IntegrationReadinessPanelProps) {
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
      <ModelGatewayProviderPolicyPanel report={providerPolicyReport} />
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

function ModelGatewayProviderPolicyPanel({ report }: { report: ModelGatewayProviderPolicyReport }) {
  return (
    <section className={`model-gateway-provider-policy ${report.overallStatus}`} aria-label="Model Gateway Provider Policy">
      <div className="split-title compact-title">
        <div>
          <ShieldCheck size={17} aria-hidden="true" />
          <h3>Model Gateway Provider Policy</h3>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary">
        <ProviderPolicyFact label="Enabled providers" value={String(report.enabledProviderCount)} />
        <ProviderPolicyFact label="Deferred providers" value={String(report.deferredProviderCount)} />
        <ProviderPolicyFact label="Provider controls" value={String(report.controls.length)} />
      </div>
      <div className="provider-policy-grid">
        {report.adapters.map((adapter) => (
          <article key={adapter.provider} className={`provider-policy-card ${adapter.status}`}>
            <header>
              <Bot size={16} aria-hidden="true" />
              <strong>
                {adapter.label} {policyStatusLabel(adapter.status)}
              </strong>
            </header>
            <p>{adapter.readinessEvidence}</p>
            <small>{adapter.credentialPolicy}</small>
            {adapter.disabledReason ? <small>{adapter.disabledReason}</small> : null}
          </article>
        ))}
      </div>
      <div className="provider-control-list">
        {report.controls.map((control) => (
          <article key={control.id} className={`provider-control ${control.status}`}>
            <header>
              <span>{policyStatusLabel(control.status)}</span>
              <strong>{control.label}</strong>
            </header>
            <p>{control.evidence}</p>
            <small>{control.recoveryAction}</small>
          </article>
        ))}
      </div>
      <div className="inline-actions provider-policy-actions">
        <span>{report.nextActions[0]}</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadProviderPolicyJson("model-gateway-provider-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download Provider Policy JSON
        </button>
      </div>
    </section>
  );
}

function downloadProviderPolicyJson(filename: string, report: ModelGatewayProviderPolicyReport): void {
  const blob = new Blob([exportModelGatewayProviderPolicyJson(report)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ProviderPolicyFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function policyStatusLabel(status: ModelGatewayProviderPolicyStatus): string {
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
