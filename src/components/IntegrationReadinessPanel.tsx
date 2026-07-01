import { Bot, ClipboardList, DatabaseZap, Download, FileText, Link2, PlugZap, RefreshCcw, ShieldCheck } from "lucide-react";
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
import {
  exportModelGatewaySecretPolicyJson,
  type ModelGatewaySecretPolicyDraft,
  type ModelGatewaySecretPolicyReport
} from "../lib/modelGatewaySecretPolicy";
import {
  exportObjectStoragePolicyJson,
  type ObjectStoragePolicyContext,
  type ObjectStoragePolicyDraft,
  type ObjectStoragePolicyReport
} from "../lib/objectStoragePolicy";

type IntegrationReadinessPanelProps = {
  registry: IntegrationReadinessRegistry;
  providerPolicyReport: ModelGatewayProviderPolicyReport;
  providerPolicySource: "local" | "server";
  providerPolicyApiBaseUrl: string;
  providerPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  providerPolicySyncError: string;
  providerPolicySyncRecoveryAction: string;
  secretPolicyDraft: ModelGatewaySecretPolicyDraft;
  secretPolicyReport: ModelGatewaySecretPolicyReport;
  secretPolicySource: "local" | "server";
  secretPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  secretPolicySyncError: string;
  secretPolicySyncRecoveryAction: string;
  storagePolicyDraft: ObjectStoragePolicyDraft;
  storagePolicyContext: ObjectStoragePolicyContext;
  storagePolicyReport: ObjectStoragePolicyReport;
  storagePolicySource: "local" | "server";
  storagePolicyApiBaseUrl: string;
  storagePolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  storagePolicySyncError: string;
  storagePolicySyncRecoveryAction: string;
  onProviderPolicyApiBaseUrlChange: (value: string) => void;
  onRefreshProviderPolicy: () => Promise<void> | void;
  onSecretPolicyDraftChange: (updates: Partial<ModelGatewaySecretPolicyDraft>) => void;
  onEvaluateSecretPolicy: () => Promise<void> | void;
  onStoragePolicyApiBaseUrlChange: (value: string) => void;
  onStoragePolicyDraftChange: (updates: Partial<ObjectStoragePolicyDraft>) => void;
  onEvaluateStoragePolicy: () => Promise<void> | void;
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

export function IntegrationReadinessPanel({
  registry,
  providerPolicyReport,
  providerPolicySource,
  providerPolicyApiBaseUrl,
  providerPolicySyncStatus,
  providerPolicySyncError,
  providerPolicySyncRecoveryAction,
  secretPolicyDraft,
  secretPolicyReport,
  secretPolicySource,
  secretPolicySyncStatus,
  secretPolicySyncError,
  secretPolicySyncRecoveryAction,
  storagePolicyDraft,
  storagePolicyContext,
  storagePolicyReport,
  storagePolicySource,
  storagePolicyApiBaseUrl,
  storagePolicySyncStatus,
  storagePolicySyncError,
  storagePolicySyncRecoveryAction,
  onProviderPolicyApiBaseUrlChange,
  onRefreshProviderPolicy,
  onSecretPolicyDraftChange,
  onEvaluateSecretPolicy,
  onStoragePolicyApiBaseUrlChange,
  onStoragePolicyDraftChange,
  onEvaluateStoragePolicy,
  onNavigate
}: IntegrationReadinessPanelProps) {
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
      <ObjectStoragePolicyPanel
        draft={storagePolicyDraft}
        context={storagePolicyContext}
        report={storagePolicyReport}
        source={storagePolicySource}
        apiBaseUrl={storagePolicyApiBaseUrl}
        syncStatus={storagePolicySyncStatus}
        syncError={storagePolicySyncError}
        syncRecoveryAction={storagePolicySyncRecoveryAction}
        onApiBaseUrlChange={onStoragePolicyApiBaseUrlChange}
        onDraftChange={onStoragePolicyDraftChange}
        onEvaluate={onEvaluateStoragePolicy}
      />
      <ModelGatewayProviderPolicyPanel
        report={providerPolicyReport}
        source={providerPolicySource}
        apiBaseUrl={providerPolicyApiBaseUrl}
        syncStatus={providerPolicySyncStatus}
        syncError={providerPolicySyncError}
        syncRecoveryAction={providerPolicySyncRecoveryAction}
        secretPolicyDraft={secretPolicyDraft}
        secretPolicyReport={secretPolicyReport}
        secretPolicySource={secretPolicySource}
        secretPolicySyncStatus={secretPolicySyncStatus}
        secretPolicySyncError={secretPolicySyncError}
        secretPolicySyncRecoveryAction={secretPolicySyncRecoveryAction}
        onApiBaseUrlChange={onProviderPolicyApiBaseUrlChange}
        onRefresh={onRefreshProviderPolicy}
        onSecretPolicyDraftChange={onSecretPolicyDraftChange}
        onEvaluateSecretPolicy={onEvaluateSecretPolicy}
      />
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

function ObjectStoragePolicyPanel({
  draft,
  context,
  report,
  source,
  apiBaseUrl,
  syncStatus,
  syncError,
  syncRecoveryAction,
  onApiBaseUrlChange,
  onDraftChange,
  onEvaluate
}: {
  draft: ObjectStoragePolicyDraft;
  context: ObjectStoragePolicyContext;
  report: ObjectStoragePolicyReport;
  source: "local" | "server";
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onDraftChange: (updates: Partial<ObjectStoragePolicyDraft>) => void;
  onEvaluate: () => Promise<void> | void;
}) {
  return (
    <section className={`secret-policy-panel storage-policy-panel ${report.overallStatus}`} aria-label="Object Storage Policy Evaluation">
      <div className="split-title compact-title">
        <div>
          <DatabaseZap size={17} aria-hidden="true" />
          <h4>Object Storage Policy Evaluation</h4>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Approved controls" value={`${report.approvedControlCount}/${report.requiredControlCount}`} />
        <ProviderPolicyFact label="Policy source" value={source === "server" ? "Server" : "Local"} />
        <ProviderPolicyFact label="External storage" value={report.externalObjectStorageAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Evidence records" value={String(context.evidenceCount)} />
        <ProviderPolicyFact label="Retention" value={context.retentionStatus} />
        <ProviderPolicyFact label="Manifest" value={context.manifestHash ? `${context.manifestHash.slice(0, 12)}...` : "Missing"} />
      </div>
      <div className={`secret-policy-form ${syncStatus}`}>
        <label className="editor-field">
          <span>Storage Policy API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            placeholder="http://127.0.0.1:8787"
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>Storage policy owner</span>
          <input
            type="text"
            value={draft.policyOwner}
            placeholder="Security operations"
            onChange={(event) => onDraftChange({ policyOwner: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Retention days</span>
          <input
            type="number"
            min={0}
            value={draft.retentionDays}
            onChange={(event) => onDraftChange({ retentionDays: Number(event.target.value) })}
          />
        </label>
        <label className="editor-field">
          <span>Deletion SLA days</span>
          <input
            type="number"
            min={0}
            value={draft.deletionSlaDays}
            onChange={(event) => onDraftChange({ deletionSlaDays: Number(event.target.value) })}
          />
        </label>
        <div className="secret-policy-checklist" aria-label="Object storage policy controls">
          <SecretPolicyToggle
            label="Encryption at rest"
            checked={draft.encryptionAtRestApproved}
            onChange={(checked) => onDraftChange({ encryptionAtRestApproved: checked })}
          />
          <SecretPolicyToggle
            label="Bucket allowlist"
            checked={draft.bucketAllowlistApproved}
            onChange={(checked) => onDraftChange({ bucketAllowlistApproved: checked })}
          />
          <SecretPolicyToggle
            label="Access logging"
            checked={draft.accessLoggingApproved}
            onChange={(checked) => onDraftChange({ accessLoggingApproved: checked })}
          />
          <SecretPolicyToggle
            label="Lifecycle policy"
            checked={draft.lifecyclePolicyApproved}
            onChange={(checked) => onDraftChange({ lifecyclePolicyApproved: checked })}
          />
          <SecretPolicyToggle
            label="No sensitive material"
            checked={draft.noSensitiveMaterialConfirmed}
            onChange={(checked) => onDraftChange({ noSensitiveMaterialConfirmed: checked })}
          />
          <SecretPolicyToggle
            label="Human review required"
            checked={draft.humanReviewRequired}
            onChange={(checked) => onDraftChange({ humanReviewRequired: checked })}
          />
        </div>
        <label className="editor-field secret-policy-notes">
          <span>Storage policy notes</span>
          <textarea
            value={draft.notes}
            placeholder="Metadata only. Do not paste raw evidence, API keys, private keys, raw KYC, or personal data."
            onChange={(event) => onDraftChange({ notes: event.target.value })}
          />
        </label>
        <div className="inline-actions secret-policy-actions">
          <span>
            {report.externalObjectStorageStatus === "policy-ready-not-enabled"
              ? "External object storage remains disabled until a separate storage adapter enablement review."
              : report.nextActions[0]}
          </span>
          <button type="button" className="secondary" onClick={onEvaluate} disabled={syncStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {syncStatus === "syncing" ? "Evaluating Server Storage Policy" : "Evaluate Server Storage Policy"}
          </button>
        </div>
        {syncStatus === "synced" ? <span className="save-state">Storage policy report synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Object storage policy evaluation is audit preparation metadata only.</small>
          </div>
        ) : null}
      </div>
      <div className="provider-control-list secret-policy-control-list">
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
        <span>External object storage remains disabled by default. Raw evidence bytes are not uploaded here.</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadObjectStoragePolicyJson("object-storage-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download Storage Policy JSON
        </button>
      </div>
    </section>
  );
}

function ModelGatewayProviderPolicyPanel({
  report,
  source,
  apiBaseUrl,
  syncStatus,
  syncError,
  syncRecoveryAction,
  secretPolicyDraft,
  secretPolicyReport,
  secretPolicySource,
  secretPolicySyncStatus,
  secretPolicySyncError,
  secretPolicySyncRecoveryAction,
  onApiBaseUrlChange,
  onRefresh,
  onSecretPolicyDraftChange,
  onEvaluateSecretPolicy
}: {
  report: ModelGatewayProviderPolicyReport;
  source: "local" | "server";
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  secretPolicyDraft: ModelGatewaySecretPolicyDraft;
  secretPolicyReport: ModelGatewaySecretPolicyReport;
  secretPolicySource: "local" | "server";
  secretPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  secretPolicySyncError: string;
  secretPolicySyncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onRefresh: () => Promise<void> | void;
  onSecretPolicyDraftChange: (updates: Partial<ModelGatewaySecretPolicyDraft>) => void;
  onEvaluateSecretPolicy: () => Promise<void> | void;
}) {
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
      <div className={`provider-policy-sync ${syncStatus}`}>
        <label className="editor-field">
          <span>Provider Policy API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            placeholder="http://127.0.0.1:8787"
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
          />
        </label>
        <button type="button" className="secondary" onClick={onRefresh} disabled={syncStatus === "syncing"}>
          <RefreshCcw size={16} aria-hidden="true" />
          {syncStatus === "syncing" ? "Refreshing Server Provider Policy" : "Refresh Server Provider Policy"}
        </button>
        <small>
          {source === "server" ? "Server provider policy active" : "Local draft provider policy active"}; no credentials are collected.
        </small>
        {syncStatus === "synced" ? <span className="save-state">Server provider policy synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Provider policy refresh is audit preparation metadata only.</small>
          </div>
        ) : null}
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
      <ModelGatewaySecretPolicyPanel
        draft={secretPolicyDraft}
        report={secretPolicyReport}
        source={secretPolicySource}
        syncStatus={secretPolicySyncStatus}
        syncError={secretPolicySyncError}
        syncRecoveryAction={secretPolicySyncRecoveryAction}
        onDraftChange={onSecretPolicyDraftChange}
        onEvaluate={onEvaluateSecretPolicy}
      />
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

function ModelGatewaySecretPolicyPanel({
  draft,
  report,
  source,
  syncStatus,
  syncError,
  syncRecoveryAction,
  onDraftChange,
  onEvaluate
}: {
  draft: ModelGatewaySecretPolicyDraft;
  report: ModelGatewaySecretPolicyReport;
  source: "local" | "server";
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onDraftChange: (updates: Partial<ModelGatewaySecretPolicyDraft>) => void;
  onEvaluate: () => Promise<void> | void;
}) {
  return (
    <section className={`secret-policy-panel ${report.overallStatus}`} aria-label="Model Gateway Secret Policy Evaluation">
      <div className="split-title compact-title">
        <div>
          <ShieldCheck size={17} aria-hidden="true" />
          <h4>Secret Policy Evaluation</h4>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Approved controls" value={`${report.approvedControlCount}/${report.requiredControlCount}`} />
        <ProviderPolicyFact label="Policy source" value={source === "server" ? "Server" : "Local"} />
        <ProviderPolicyFact label="External proxying" value={report.externalProviderProxyingAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className={`secret-policy-form ${syncStatus}`}>
        <label className="editor-field">
          <span>Secret policy owner</span>
          <input
            type="text"
            value={draft.policyOwner}
            placeholder="Security lead"
            onChange={(event) => onDraftChange({ policyOwner: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Rotation days</span>
          <input
            type="number"
            min={0}
            value={draft.rotationDays}
            onChange={(event) => onDraftChange({ rotationDays: Number(event.target.value) })}
          />
        </label>
        <label className="editor-field">
          <span>Access review cadence</span>
          <select
            value={draft.accessReviewCadence}
            onChange={(event) =>
              onDraftChange({
                accessReviewCadence: event.target.value as ModelGatewaySecretPolicyDraft["accessReviewCadence"]
              })
            }
          >
            <option value="none">None</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </label>
        <div className="secret-policy-checklist" aria-label="Secret policy controls">
          <SecretPolicyToggle
            label="KMS-backed secret storage"
            checked={draft.kmsBackedStorageApproved}
            onChange={(checked) => onDraftChange({ kmsBackedStorageApproved: checked })}
          />
          <SecretPolicyToggle
            label="Provider allowlist"
            checked={draft.providerAllowlistApproved}
            onChange={(checked) => onDraftChange({ providerAllowlistApproved: checked })}
          />
          <SecretPolicyToggle
            label="Egress logging"
            checked={draft.egressLoggingApproved}
            onChange={(checked) => onDraftChange({ egressLoggingApproved: checked })}
          />
          <SecretPolicyToggle
            label="Incident response runbook"
            checked={draft.incidentResponseRunbookApproved}
            onChange={(checked) => onDraftChange({ incidentResponseRunbookApproved: checked })}
          />
          <SecretPolicyToggle
            label="No client secret persistence"
            checked={draft.noClientSecretPersistence}
            onChange={(checked) => onDraftChange({ noClientSecretPersistence: checked })}
          />
          <SecretPolicyToggle
            label="Human review required"
            checked={draft.humanReviewRequired}
            onChange={(checked) => onDraftChange({ humanReviewRequired: checked })}
          />
        </div>
        <label className="editor-field secret-policy-notes">
          <span>Secret policy notes</span>
          <textarea
            value={draft.notes}
            placeholder="Metadata only. Do not paste API keys, private keys, raw KYC, or personal data."
            onChange={(event) => onDraftChange({ notes: event.target.value })}
          />
        </label>
        <div className="inline-actions secret-policy-actions">
          <span>
            {report.externalProviderProxyingStatus === "policy-ready-not-enabled"
              ? "External provider proxying remains disabled until a separate adapter enablement review."
              : report.nextActions[0]}
          </span>
          <button type="button" className="secondary" onClick={onEvaluate} disabled={syncStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {syncStatus === "syncing" ? "Evaluating Server Secret Policy" : "Evaluate Server Secret Policy"}
          </button>
        </div>
        {syncStatus === "synced" ? <span className="save-state">Secret policy report synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Secret policy evaluation is audit preparation metadata only.</small>
          </div>
        ) : null}
      </div>
      <div className="provider-control-list secret-policy-control-list">
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
        <span>External provider adapters remain disabled by default. No credentials are collected here.</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadSecretPolicyJson("model-gateway-secret-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download Secret Policy JSON
        </button>
      </div>
    </section>
  );
}

function SecretPolicyToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="secret-policy-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
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

function downloadSecretPolicyJson(filename: string, report: ModelGatewaySecretPolicyReport): void {
  const blob = new Blob([exportModelGatewaySecretPolicyJson(report)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadObjectStoragePolicyJson(filename: string, report: ObjectStoragePolicyReport): void {
  const blob = new Blob([exportObjectStoragePolicyJson(report)], { type: "application/json;charset=utf-8" });
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
