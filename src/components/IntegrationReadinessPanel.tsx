import {
  Bot,
  ClipboardList,
  DatabaseZap,
  Download,
  FileText,
  Link2,
  PlugZap,
  ReceiptText,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import type {
  IntegrationAdapterCategory,
  IntegrationAdapterId,
  IntegrationReadinessAdapter,
  IntegrationReadinessRegistry
} from "../lib/integrationReadiness";
import {
  downloadIntegrationEnablementDossierJson,
  type IntegrationEnablementDossier
} from "../lib/integrationEnablementDossier";
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
  exportDocumentParserPolicyJson,
  type DocumentParserPolicyContext,
  type DocumentParserPolicyDraft,
  type DocumentParserPolicyReport
} from "../lib/documentParserPolicy";
import {
  exportChainAnchorPolicyJson,
  type ChainAnchorPolicyContext,
  type ChainAnchorPolicyDraft,
  type ChainAnchorPolicyReport
} from "../lib/chainAnchorPolicy";
import {
  exportGrcDestinationPolicyJson,
  type GrcDestinationPolicyContext,
  type GrcDestinationPolicyDraft,
  type GrcDestinationPolicyReport
} from "../lib/grcDestinationPolicy";
import {
  exportObjectStoragePolicyJson,
  type ObjectStoragePolicyContext,
  type ObjectStoragePolicyDraft,
  type ObjectStoragePolicyReport
} from "../lib/objectStoragePolicy";
import type { IntegrationPolicyEvaluationRecord } from "../lib/integrationPolicyEvaluation";

type IntegrationReadinessPanelProps = {
  registry: IntegrationReadinessRegistry;
  enablementDossier: IntegrationEnablementDossier | null;
  integrationPolicyEvaluationRecords: IntegrationPolicyEvaluationRecord[];
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
  parserPolicyDraft: DocumentParserPolicyDraft;
  parserPolicyContext: DocumentParserPolicyContext;
  parserPolicyReport: DocumentParserPolicyReport;
  parserPolicySource: "local" | "server";
  parserPolicyApiBaseUrl: string;
  parserPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  parserPolicySyncError: string;
  parserPolicySyncRecoveryAction: string;
  anchorPolicyDraft: ChainAnchorPolicyDraft;
  anchorPolicyContext: ChainAnchorPolicyContext;
  anchorPolicyReport: ChainAnchorPolicyReport;
  anchorPolicySource: "local" | "server";
  anchorPolicyApiBaseUrl: string;
  anchorPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  anchorPolicySyncError: string;
  anchorPolicySyncRecoveryAction: string;
  grcDestinationPolicyDraft: GrcDestinationPolicyDraft;
  grcDestinationPolicyContext: GrcDestinationPolicyContext;
  grcDestinationPolicyReport: GrcDestinationPolicyReport;
  grcDestinationPolicySource: "local" | "server";
  grcDestinationPolicyApiBaseUrl: string;
  grcDestinationPolicySyncStatus: "idle" | "syncing" | "synced" | "error";
  grcDestinationPolicySyncError: string;
  grcDestinationPolicySyncRecoveryAction: string;
  onProviderPolicyApiBaseUrlChange: (value: string) => void;
  onRefreshProviderPolicy: () => Promise<void> | void;
  onSecretPolicyDraftChange: (updates: Partial<ModelGatewaySecretPolicyDraft>) => void;
  onEvaluateSecretPolicy: () => Promise<void> | void;
  onStoragePolicyApiBaseUrlChange: (value: string) => void;
  onStoragePolicyDraftChange: (updates: Partial<ObjectStoragePolicyDraft>) => void;
  onEvaluateStoragePolicy: () => Promise<void> | void;
  onParserPolicyApiBaseUrlChange: (value: string) => void;
  onParserPolicyDraftChange: (updates: Partial<DocumentParserPolicyDraft>) => void;
  onEvaluateParserPolicy: () => Promise<void> | void;
  onAnchorPolicyApiBaseUrlChange: (value: string) => void;
  onAnchorPolicyDraftChange: (updates: Partial<ChainAnchorPolicyDraft>) => void;
  onEvaluateAnchorPolicy: () => Promise<void> | void;
  onGrcDestinationPolicyApiBaseUrlChange: (value: string) => void;
  onGrcDestinationPolicyDraftChange: (updates: Partial<GrcDestinationPolicyDraft>) => void;
  onEvaluateGrcDestinationPolicy: () => Promise<void> | void;
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
  enablementDossier,
  integrationPolicyEvaluationRecords,
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
  parserPolicyDraft,
  parserPolicyContext,
  parserPolicyReport,
  parserPolicySource,
  parserPolicyApiBaseUrl,
  parserPolicySyncStatus,
  parserPolicySyncError,
  parserPolicySyncRecoveryAction,
  anchorPolicyDraft,
  anchorPolicyContext,
  anchorPolicyReport,
  anchorPolicySource,
  anchorPolicyApiBaseUrl,
  anchorPolicySyncStatus,
  anchorPolicySyncError,
  anchorPolicySyncRecoveryAction,
  grcDestinationPolicyDraft,
  grcDestinationPolicyContext,
  grcDestinationPolicyReport,
  grcDestinationPolicySource,
  grcDestinationPolicyApiBaseUrl,
  grcDestinationPolicySyncStatus,
  grcDestinationPolicySyncError,
  grcDestinationPolicySyncRecoveryAction,
  onProviderPolicyApiBaseUrlChange,
  onRefreshProviderPolicy,
  onSecretPolicyDraftChange,
  onEvaluateSecretPolicy,
  onStoragePolicyApiBaseUrlChange,
  onStoragePolicyDraftChange,
  onEvaluateStoragePolicy,
  onParserPolicyApiBaseUrlChange,
  onParserPolicyDraftChange,
  onEvaluateParserPolicy,
  onAnchorPolicyApiBaseUrlChange,
  onAnchorPolicyDraftChange,
  onEvaluateAnchorPolicy,
  onGrcDestinationPolicyApiBaseUrlChange,
  onGrcDestinationPolicyDraftChange,
  onEvaluateGrcDestinationPolicy,
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
      <IntegrationEnablementDossierPanel dossier={enablementDossier} />
      <IntegrationPolicyEvaluationReceiptsPanel records={integrationPolicyEvaluationRecords} />
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
      <DocumentParserPolicyPanel
        draft={parserPolicyDraft}
        context={parserPolicyContext}
        report={parserPolicyReport}
        source={parserPolicySource}
        apiBaseUrl={parserPolicyApiBaseUrl}
        syncStatus={parserPolicySyncStatus}
        syncError={parserPolicySyncError}
        syncRecoveryAction={parserPolicySyncRecoveryAction}
        onApiBaseUrlChange={onParserPolicyApiBaseUrlChange}
        onDraftChange={onParserPolicyDraftChange}
        onEvaluate={onEvaluateParserPolicy}
      />
      <ChainAnchorPolicyPanel
        draft={anchorPolicyDraft}
        context={anchorPolicyContext}
        report={anchorPolicyReport}
        source={anchorPolicySource}
        apiBaseUrl={anchorPolicyApiBaseUrl}
        syncStatus={anchorPolicySyncStatus}
        syncError={anchorPolicySyncError}
        syncRecoveryAction={anchorPolicySyncRecoveryAction}
        onApiBaseUrlChange={onAnchorPolicyApiBaseUrlChange}
        onDraftChange={onAnchorPolicyDraftChange}
        onEvaluate={onEvaluateAnchorPolicy}
      />
      <GrcDestinationPolicyPanel
        draft={grcDestinationPolicyDraft}
        context={grcDestinationPolicyContext}
        report={grcDestinationPolicyReport}
        source={grcDestinationPolicySource}
        apiBaseUrl={grcDestinationPolicyApiBaseUrl}
        syncStatus={grcDestinationPolicySyncStatus}
        syncError={grcDestinationPolicySyncError}
        syncRecoveryAction={grcDestinationPolicySyncRecoveryAction}
        onApiBaseUrlChange={onGrcDestinationPolicyApiBaseUrlChange}
        onDraftChange={onGrcDestinationPolicyDraftChange}
        onEvaluate={onEvaluateGrcDestinationPolicy}
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

function IntegrationEnablementDossierPanel({ dossier }: { dossier: IntegrationEnablementDossier | null }) {
  return (
    <section className={`integration-enablement-dossier ${dossier?.overallStatus ?? "disabled"}`} aria-label="Integration Enablement Dossier">
      <div className="split-title compact-title">
        <div>
          <ShieldCheck size={17} aria-hidden="true" />
          <h4>Integration Enablement Dossier</h4>
        </div>
        <span className={`workflow-status ${dossier?.overallStatus ?? "disabled"}`}>
          {dossier ? statusLabel(dossier.overallStatus) : "calculating"}
        </span>
      </div>
      <p className="section-note">
        {dossier?.notLegalAdviceBoundary ?? "Not legal advice. Integration enablement dossiers are audit preparation metadata only."}
      </p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Dossier hash" value={dossier ? `${dossier.dossierHash.slice(0, 12)}...` : "Calculating"} />
        <ProviderPolicyFact label="Policy reports" value={dossier ? String(dossier.policyReportCount) : "0"} />
        <ProviderPolicyFact label="External enablement" value={dossier?.externalEnablementAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Ready adapters" value={dossier ? String(dossier.readyCount) : "0"} />
        <ProviderPolicyFact label="Needs policy" value={dossier ? String(dossier.needsPolicyCount) : "0"} />
        <ProviderPolicyFact label="Blocked" value={dossier ? String(dossier.blockedCount + dossier.blockerCount) : "0"} />
      </div>
      <div className="integration-dossier-policy-list">
        {(dossier?.policyReports ?? []).map((report) => (
          <article key={report.id} className={`provider-control ${report.status}`}>
            <header>
              <span>{statusLabel(report.status)}</span>
              <strong>{report.label}</strong>
            </header>
            <p>
              {report.approvedControlCount}/{report.requiredControlCount} controls ready; {report.externalCapability} is{" "}
              {report.externalCapabilityAllowed ? "enabled" : "disabled"}.
            </p>
            <small>{report.externalCapabilityStatus}</small>
          </article>
        ))}
      </div>
      <div className="inline-actions provider-policy-actions">
        <span>
          External enablement remains disabled. The dossier is metadata-only and does not call providers, storage, OCR,
          ticket systems, or chains.
        </span>
        <button
          type="button"
          className="secondary"
          disabled={!dossier}
          onClick={() => dossier && downloadIntegrationEnablementDossierJson("integration-enablement-dossier.json", dossier)}
        >
          <Download size={16} aria-hidden="true" />
          Download Enablement Dossier JSON
        </button>
      </div>
    </section>
  );
}

function IntegrationPolicyEvaluationReceiptsPanel({ records }: { records: IntegrationPolicyEvaluationRecord[] }) {
  const latestRecords = records.slice(0, 4);

  return (
    <section className="integration-policy-receipts" aria-label="Integration Policy Evaluation Receipts">
      <div className="split-title compact-title">
        <div>
          <ReceiptText size={17} aria-hidden="true" />
          <h4>Policy Evaluation Receipts</h4>
        </div>
        <span className="workflow-status disabled">{latestRecords.length ? `${latestRecords.length} recorded` : "no receipts"}</span>
      </div>
      <p className="section-note">
        Not legal advice. Integration policy evaluation records are audit preparation metadata only.
      </p>
      {latestRecords.length ? (
        <div className="integration-policy-receipt-list">
          {latestRecords.map((record) => (
            <article key={record.id} className={`provider-control ${record.overallStatus}`}>
              <header>
                <span>{policyStatusLabel(record.overallStatus)}</span>
                <strong>{policyLabel(record.policyId)}</strong>
              </header>
              <p>
                {record.approvedControlCount}/{record.requiredControlCount} controls ready; external capability is disabled.
              </p>
              <small>
                report {record.reportHash.slice(0, 12)}... · context {record.contextHash.slice(0, 12)}...
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-ledger">
          Evaluate a server integration policy to create a workspace receipt. No credentials, raw evidence, raw KYC, or personal data are stored.
        </div>
      )}
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

function DocumentParserPolicyPanel({
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
  draft: DocumentParserPolicyDraft;
  context: DocumentParserPolicyContext;
  report: DocumentParserPolicyReport;
  source: "local" | "server";
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onDraftChange: (updates: Partial<DocumentParserPolicyDraft>) => void;
  onEvaluate: () => Promise<void> | void;
}) {
  return (
    <section className={`secret-policy-panel parser-policy-panel ${report.overallStatus}`} aria-label="Document Parser Policy Evaluation">
      <div className="split-title compact-title">
        <div>
          <FileText size={17} aria-hidden="true" />
          <h4>Document Parser Policy Evaluation</h4>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Approved controls" value={`${report.approvedControlCount}/${report.requiredControlCount}`} />
        <ProviderPolicyFact label="Policy source" value={source === "server" ? "Server" : "Local"} />
        <ProviderPolicyFact label="External parsing" value={report.externalDocumentParsingAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Evidence records" value={String(context.evidenceCount)} />
        <ProviderPolicyFact label="Retention" value={context.retentionStatus} />
        <ProviderPolicyFact label="Manifest" value={context.manifestHash ? `${context.manifestHash.slice(0, 12)}...` : "Missing"} />
      </div>
      <div className={`secret-policy-form ${syncStatus}`}>
        <label className="editor-field">
          <span>Document Parser API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            placeholder="http://127.0.0.1:8787"
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>Parser policy owner</span>
          <input
            type="text"
            value={draft.policyOwner}
            placeholder="Document operations"
            onChange={(event) => onDraftChange({ policyOwner: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Max document size MB</span>
          <input
            type="number"
            min={0}
            value={draft.maxDocumentSizeMb}
            onChange={(event) => onDraftChange({ maxDocumentSizeMb: Number(event.target.value) })}
          />
        </label>
        <label className="editor-field">
          <span>Raw document retention days</span>
          <input
            type="number"
            min={0}
            value={draft.rawDocumentRetentionDays}
            onChange={(event) => onDraftChange({ rawDocumentRetentionDays: Number(event.target.value) })}
          />
        </label>
        <label className="editor-field">
          <span>Parser deletion SLA days</span>
          <input
            type="number"
            min={0}
            value={draft.deletionSlaDays}
            onChange={(event) => onDraftChange({ deletionSlaDays: Number(event.target.value) })}
          />
        </label>
        <label className="editor-field secret-policy-notes">
          <span>Parsing purpose</span>
          <textarea
            value={draft.parsingPurpose}
            placeholder="Extract citations and evidence summaries for audit preparation. Do not request legal opinions."
            onChange={(event) => onDraftChange({ parsingPurpose: event.target.value })}
          />
        </label>
        <div className="secret-policy-checklist" aria-label="Document parser policy controls">
          <SecretPolicyToggle
            label="Redaction before parsing"
            checked={draft.redactionBeforeParsingApproved}
            onChange={(checked) => onDraftChange({ redactionBeforeParsingApproved: checked })}
          />
          <SecretPolicyToggle
            label="No model training use"
            checked={draft.noTrainingUseConfirmed}
            onChange={(checked) => onDraftChange({ noTrainingUseConfirmed: checked })}
          />
          <SecretPolicyToggle
            label="Parser access logging"
            checked={draft.accessLoggingApproved}
            onChange={(checked) => onDraftChange({ accessLoggingApproved: checked })}
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
          <span>Parser policy notes</span>
          <textarea
            value={draft.notes}
            placeholder="Metadata only. Do not paste raw documents, API keys, private keys, raw KYC, or personal data."
            onChange={(event) => onDraftChange({ notes: event.target.value })}
          />
        </label>
        <div className="inline-actions secret-policy-actions">
          <span>
            {report.externalDocumentParsingStatus === "policy-ready-not-enabled"
              ? "External document parsing remains disabled until a separate raw-document adapter enablement review."
              : report.nextActions[0]}
          </span>
          <button type="button" className="secondary" onClick={onEvaluate} disabled={syncStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {syncStatus === "syncing" ? "Evaluating Server Parser Policy" : "Evaluate Server Parser Policy"}
          </button>
        </div>
        {syncStatus === "synced" ? <span className="save-state">Parser policy report synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Document parser policy evaluation is audit preparation metadata only.</small>
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
        <span>External document parsing remains disabled by default. Raw document bytes are not parsed or uploaded here.</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadDocumentParserPolicyJson("document-parser-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download Parser Policy JSON
        </button>
      </div>
    </section>
  );
}

function ChainAnchorPolicyPanel({
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
  draft: ChainAnchorPolicyDraft;
  context: ChainAnchorPolicyContext;
  report: ChainAnchorPolicyReport;
  source: "local" | "server";
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onDraftChange: (updates: Partial<ChainAnchorPolicyDraft>) => void;
  onEvaluate: () => Promise<void> | void;
}) {
  return (
    <section className={`secret-policy-panel chain-anchor-policy-panel ${report.overallStatus}`} aria-label="Chain Anchor Policy Evaluation">
      <div className="split-title compact-title">
        <div>
          <Link2 size={17} aria-hidden="true" />
          <h4>Chain Anchor Policy Evaluation</h4>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Approved controls" value={`${report.approvedControlCount}/${report.requiredControlCount}`} />
        <ProviderPolicyFact label="Policy source" value={source === "server" ? "Server" : "Local"} />
        <ProviderPolicyFact label="External anchoring" value={report.externalChainAnchoringAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Evidence records" value={String(context.evidenceCount)} />
        <ProviderPolicyFact label="Manifest" value={context.manifestHash ? `${context.manifestHash.slice(0, 12)}...` : "Missing"} />
        <ProviderPolicyFact label="Counsel versions" value={String(context.counselPackVersionCount)} />
      </div>
      <div className={`secret-policy-form ${syncStatus}`}>
        <label className="editor-field">
          <span>Chain Anchor API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            placeholder="http://127.0.0.1:8787"
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>Anchor policy owner</span>
          <input
            type="text"
            value={draft.policyOwner}
            placeholder="Web3 operations"
            onChange={(event) => onDraftChange({ policyOwner: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Anchor network</span>
          <input
            type="text"
            value={draft.targetNetwork}
            placeholder="ethereum-sepolia"
            onChange={(event) => onDraftChange({ targetNetwork: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Wallet custody policy</span>
          <input
            type="text"
            value={draft.walletCustodyModel}
            placeholder="Multisig policy wallet"
            onChange={(event) => onDraftChange({ walletCustodyModel: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Signer role</span>
          <input
            type="text"
            value={draft.signerRole}
            placeholder="Compliance reviewer"
            onChange={(event) => onDraftChange({ signerRole: event.target.value })}
          />
        </label>
        <div className="secret-policy-checklist" aria-label="Chain anchor policy controls">
          <SecretPolicyToggle
            label="Transaction logging"
            checked={draft.transactionLoggingApproved}
            onChange={(checked) => onDraftChange({ transactionLoggingApproved: checked })}
          />
          <SecretPolicyToggle
            label="Privacy review"
            checked={draft.privacyReviewApproved}
            onChange={(checked) => onDraftChange({ privacyReviewApproved: checked })}
          />
          <SecretPolicyToggle
            label="Public payload limited"
            checked={draft.publicPayloadLimitedApproved}
            onChange={(checked) => onDraftChange({ publicPayloadLimitedApproved: checked })}
          />
          <SecretPolicyToggle
            label="User consent recorded"
            checked={draft.userConsentApproved}
            onChange={(checked) => onDraftChange({ userConsentApproved: checked })}
          />
          <SecretPolicyToggle
            label="No raw evidence on-chain"
            checked={draft.noRawEvidenceOnChainConfirmed}
            onChange={(checked) => onDraftChange({ noRawEvidenceOnChainConfirmed: checked })}
          />
          <SecretPolicyToggle
            label="Human review required"
            checked={draft.humanReviewRequired}
            onChange={(checked) => onDraftChange({ humanReviewRequired: checked })}
          />
        </div>
        <label className="editor-field secret-policy-notes">
          <span>Anchor policy notes</span>
          <textarea
            value={draft.notes}
            placeholder="Metadata only. Do not paste wallet keys, signed transactions, raw KYC, raw evidence, or personal data."
            onChange={(event) => onDraftChange({ notes: event.target.value })}
          />
        </label>
        <div className="inline-actions secret-policy-actions">
          <span>
            {report.externalChainAnchoringStatus === "policy-ready-not-enabled"
              ? "External chain anchoring remains disabled until a separate wallet signing and transaction enablement review."
              : report.nextActions[0]}
          </span>
          <button type="button" className="secondary" onClick={onEvaluate} disabled={syncStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {syncStatus === "syncing" ? "Evaluating Server Anchor Policy" : "Evaluate Server Anchor Policy"}
          </button>
        </div>
        {syncStatus === "synced" ? <span className="save-state">Anchor policy report synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Chain anchor policy evaluation is audit preparation metadata only.</small>
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
        <span>External chain anchoring remains disabled by default. No wallet keys, signed transactions, or raw evidence are collected here.</span>
        <button type="button" className="secondary" onClick={() => downloadChainAnchorPolicyJson("chain-anchor-policy.json", report)}>
          <Download size={16} aria-hidden="true" />
          Download Anchor Policy JSON
        </button>
      </div>
    </section>
  );
}

function GrcDestinationPolicyPanel({
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
  draft: GrcDestinationPolicyDraft;
  context: GrcDestinationPolicyContext;
  report: GrcDestinationPolicyReport;
  source: "local" | "server";
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onDraftChange: (updates: Partial<GrcDestinationPolicyDraft>) => void;
  onEvaluate: () => Promise<void> | void;
}) {
  return (
    <section className={`secret-policy-panel grc-destination-policy-panel ${report.overallStatus}`} aria-label="GRC Destination Policy Evaluation">
      <div className="split-title compact-title">
        <div>
          <ClipboardList size={17} aria-hidden="true" />
          <h4>GRC Destination Policy Evaluation</h4>
        </div>
        <span className={`workflow-status ${report.overallStatus}`}>{policyStatusLabel(report.overallStatus)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Approved controls" value={`${report.approvedControlCount}/${report.requiredControlCount}`} />
        <ProviderPolicyFact label="Policy source" value={source === "server" ? "Server" : "Local"} />
        <ProviderPolicyFact label="External tickets" value={report.externalGrcTicketCreationAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Remediation items" value={String(context.remediationItemCount)} />
        <ProviderPolicyFact label="Export safety" value={context.exportSafetyStatus} />
        <ProviderPolicyFact label="Adapter status" value={context.integrationAdapterStatus} />
      </div>
      <div className={`secret-policy-form ${syncStatus}`}>
        <label className="editor-field">
          <span>GRC Destination API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            placeholder="http://127.0.0.1:8787"
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>GRC policy owner</span>
          <input
            type="text"
            value={draft.policyOwner}
            placeholder="GRC operations"
            onChange={(event) => onDraftChange({ policyOwner: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Destination system</span>
          <input
            type="text"
            value={draft.destinationSystem}
            placeholder="jira"
            onChange={(event) => onDraftChange({ destinationSystem: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Destination queue</span>
          <input
            type="text"
            value={draft.destinationQueue}
            placeholder="LEGAL-AUDIT"
            onChange={(event) => onDraftChange({ destinationQueue: event.target.value })}
          />
        </label>
        <div className="secret-policy-checklist" aria-label="GRC destination policy controls">
          <SecretPolicyToggle
            label="Field mapping"
            checked={draft.fieldMappingApproved}
            onChange={(checked) => onDraftChange({ fieldMappingApproved: checked })}
          />
          <SecretPolicyToggle
            label="Authentication policy"
            checked={draft.authenticationPolicyApproved}
            onChange={(checked) => onDraftChange({ authenticationPolicyApproved: checked })}
          />
          <SecretPolicyToggle
            label="Export redaction"
            checked={draft.redactionPolicyApproved}
            onChange={(checked) => onDraftChange({ redactionPolicyApproved: checked })}
          />
          <SecretPolicyToggle
            label="Ticket ownership"
            checked={draft.ticketOwnershipApproved}
            onChange={(checked) => onDraftChange({ ticketOwnershipApproved: checked })}
          />
          <SecretPolicyToggle
            label="Retry and audit logging"
            checked={draft.retryAndAuditLoggingApproved}
            onChange={(checked) => onDraftChange({ retryAndAuditLoggingApproved: checked })}
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
          <span>GRC policy notes</span>
          <textarea
            value={draft.notes}
            placeholder="Metadata only. Do not paste API keys, webhook secrets, raw ticket bodies, raw KYC, or personal data."
            onChange={(event) => onDraftChange({ notes: event.target.value })}
          />
        </label>
        <div className="inline-actions secret-policy-actions">
          <span>
            {report.externalGrcTicketCreationStatus === "policy-ready-not-enabled"
              ? "External GRC ticket creation remains disabled until a separate destination adapter enablement review."
              : report.nextActions[0]}
          </span>
          <button type="button" className="secondary" onClick={onEvaluate} disabled={syncStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {syncStatus === "syncing" ? "Evaluating Server GRC Policy" : "Evaluate Server GRC Policy"}
          </button>
        </div>
        {syncStatus === "synced" ? <span className="save-state">GRC policy report synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. GRC destination policy evaluation is audit preparation metadata only.</small>
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
        <span>External GRC ticket creation remains disabled by default. No credentials, raw ticket bodies, or external tickets are created here.</span>
        <button
          type="button"
          className="secondary"
          onClick={() => downloadGrcDestinationPolicyJson("grc-destination-policy.json", report)}
        >
          <Download size={16} aria-hidden="true" />
          Download GRC Policy JSON
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

function downloadDocumentParserPolicyJson(filename: string, report: DocumentParserPolicyReport): void {
  const blob = new Blob([exportDocumentParserPolicyJson(report)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadChainAnchorPolicyJson(filename: string, report: ChainAnchorPolicyReport): void {
  const blob = new Blob([exportChainAnchorPolicyJson(report)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadGrcDestinationPolicyJson(filename: string, report: GrcDestinationPolicyReport): void {
  const blob = new Blob([exportGrcDestinationPolicyJson(report)], { type: "application/json;charset=utf-8" });
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

function policyLabel(policyId: IntegrationPolicyEvaluationRecord["policyId"]): string {
  if (policyId === "object-storage") {
    return "Object Storage Policy";
  }

  if (policyId === "document-parser") {
    return "Document Parser Policy";
  }

  if (policyId === "chain-anchor") {
    return "Chain Anchor Policy";
  }

  return "GRC Destination Policy";
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
