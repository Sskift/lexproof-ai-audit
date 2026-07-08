import { useEffect, useState } from "react";
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
  downloadIntegrationEnablementGateJson,
  downloadIntegrationEnablementDossierJson,
  type IntegrationEnablementDossier,
  type IntegrationEnablementGate,
  type IntegrationEnablementPolicyReceiptCoverage,
  type IntegrationPolicyReceiptCoverageStatus
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
import {
  createIntegrationPolicyEvaluationReceiptBundle,
  downloadIntegrationPolicyReceiptRecoveryPacketJson,
  downloadIntegrationPolicyEvaluationReceiptBundleJson,
  type IntegrationPolicyEvaluationReceiptBundle,
  type IntegrationPolicyEvaluationRecord,
  type IntegrationPolicyReceiptRecoveryPacket
} from "../lib/integrationPolicyEvaluation";
import {
  fetchIntegrationPolicyEvaluationReceiptBundle,
  fetchIntegrationPolicyReceiptRecoveryPacket,
  IntegrationPolicyEvaluationClientError
} from "../lib/integrationPolicyEvaluationClient";

type IntegrationReadinessPanelProps = {
  registry: IntegrationReadinessRegistry;
  enablementDossier: IntegrationEnablementDossier | null;
  enablementGate: IntegrationEnablementGate | null;
  workspaceId: string;
  integrationPolicyEvaluationRecords: IntegrationPolicyEvaluationRecord[];
  integrationPolicyEvaluationApiBaseUrl: string;
  integrationPolicyEvaluationSyncStatus: "idle" | "syncing" | "synced" | "error";
  integrationPolicyEvaluationSyncError: string;
  integrationPolicyEvaluationSyncRecoveryAction: string;
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
  onIntegrationPolicyEvaluationApiBaseUrlChange: (value: string) => void;
  onRefreshIntegrationPolicyEvaluations: () => Promise<void> | void;
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
  enablementGate,
  workspaceId,
  integrationPolicyEvaluationRecords,
  integrationPolicyEvaluationApiBaseUrl,
  integrationPolicyEvaluationSyncStatus,
  integrationPolicyEvaluationSyncError,
  integrationPolicyEvaluationSyncRecoveryAction,
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
  onIntegrationPolicyEvaluationApiBaseUrlChange,
  onRefreshIntegrationPolicyEvaluations,
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
      <IntegrationEnablementDossierPanel dossier={enablementDossier} gate={enablementGate} />
      <IntegrationPolicyEvaluationReceiptsPanel
        workspaceId={workspaceId}
        records={integrationPolicyEvaluationRecords}
        apiBaseUrl={integrationPolicyEvaluationApiBaseUrl}
        syncStatus={integrationPolicyEvaluationSyncStatus}
        syncError={integrationPolicyEvaluationSyncError}
        syncRecoveryAction={integrationPolicyEvaluationSyncRecoveryAction}
        onApiBaseUrlChange={onIntegrationPolicyEvaluationApiBaseUrlChange}
        onRefresh={onRefreshIntegrationPolicyEvaluations}
      />
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

function IntegrationEnablementDossierPanel({
  dossier,
  gate
}: {
  dossier: IntegrationEnablementDossier | null;
  gate: IntegrationEnablementGate | null;
}) {
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
        <ProviderPolicyFact label="Server receipts" value={dossier ? String(dossier.policyEvaluationRecordCount) : "0"} />
        <ProviderPolicyFact
          label="Receipt coverage"
          value={dossier ? `${dossier.policyReceiptPresentCount}/${dossier.policyReceiptCoverageCount}` : "0/0"}
        />
        <ProviderPolicyFact label="External enablement" value={dossier?.externalEnablementAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Ready adapters" value={dossier ? String(dossier.readyCount) : "0"} />
        <ProviderPolicyFact label="Needs policy" value={dossier ? String(dossier.needsPolicyCount) : "0"} />
        <ProviderPolicyFact label="Missing receipts" value={dossier ? String(dossier.policyReceiptMissingCount) : "0"} />
        <ProviderPolicyFact label="Blocked" value={dossier ? String(dossier.blockedCount + dossier.blockerCount) : "0"} />
      </div>
      <IntegrationEnablementGatePanel gate={gate} />
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
      <PolicyReceiptCoveragePanel coverage={dossier?.policyReceiptCoverage ?? []} />
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

function IntegrationEnablementGatePanel({ gate }: { gate: IntegrationEnablementGate | null }) {
  const visibleItems = gate?.queueItems.slice(0, 6) ?? [];

  return (
    <section className={`integration-enablement-gate ${gate?.gateStatus ?? "disabled"}`} aria-label="Integration Enablement Gate">
      <div className="split-title compact-title">
        <div>
          <ShieldCheck size={16} aria-hidden="true" />
          <h5>Integration Enablement Gate</h5>
        </div>
        <span className={`workflow-status ${gate?.gateStatus ?? "disabled"}`}>
          {gate ? statusLabel(gate.gateStatus) : "calculating"}
        </span>
      </div>
      <p className="section-note">
        {gate?.notLegalAdviceBoundary ?? "Not legal advice. Integration enablement gates are audit preparation workflow metadata only."}
      </p>
      <div className="provider-policy-summary secret-policy-summary">
        <ProviderPolicyFact label="Gate hash" value={gate ? `${gate.gateHash.slice(0, 12)}...` : "Calculating"} />
        <ProviderPolicyFact label="Queue items" value={gate ? String(gate.queueItemCount) : "0"} />
        <ProviderPolicyFact label="Blockers" value={gate ? String(gate.blockerCount) : "0"} />
        <ProviderPolicyFact label="Missing receipts" value={gate ? String(gate.missingReceiptCount) : "0"} />
        <ProviderPolicyFact label="External enablement" value={gate?.externalEnablementAllowed ? "Enabled" : "Disabled"} />
      </div>
      <div className="integration-enablement-gate-list">
        {visibleItems.map((item) => (
          <article key={item.id} className={`provider-control ${gateItemClass(item.status)}`}>
            <header>
              <span>{gateItemLabel(item.status)}</span>
              <strong>{item.label}</strong>
            </header>
            <p>{item.blocker}</p>
            <small>{item.recoveryAction}</small>
            {item.referenceHash ? <small>reference {item.referenceHash.slice(0, 12)}...</small> : null}
          </article>
        ))}
      </div>
      <div className="inline-actions provider-policy-actions">
        <span>{gate?.nextAction ?? "Wait for integration enablement gate calculation."}</span>
        <button
          type="button"
          className="secondary"
          disabled={!gate}
          onClick={() => gate && downloadIntegrationEnablementGateJson("integration-enablement-gate.json", gate)}
        >
          <Download size={16} aria-hidden="true" />
          Download Enablement Gate JSON
        </button>
      </div>
    </section>
  );
}

function PolicyReceiptCoveragePanel({ coverage }: { coverage: IntegrationEnablementPolicyReceiptCoverage[] }) {
  return (
    <section className="integration-policy-receipt-coverage" aria-label="Integration Policy Receipt Coverage">
      <div className="split-title compact-title">
        <div>
          <ReceiptText size={16} aria-hidden="true" />
          <h5>Policy Receipt Coverage</h5>
        </div>
        <span className="workflow-status disabled">
          {coverage.filter((item) => item.source === "server").length}/{coverage.length} receipts
        </span>
      </div>
      <p className="section-note">
        Not legal advice. Server policy receipts are audit preparation evidence for future adapter enablement review only.
      </p>
      <div className="integration-policy-receipt-coverage-list">
        {coverage.map((item) => (
          <article key={item.policyId} className={`provider-control ${receiptCoverageClass(item.coverageStatus)}`}>
            <header>
              <span>{receiptCoverageLabel(item.coverageStatus)}</span>
              <strong>{item.label}</strong>
            </header>
            <p>
              {item.latestRecordId
                ? `Server receipt ${item.latestRecordId}; external capability remains disabled.`
                : "Missing server receipt; external capability remains disabled."}
            </p>
            <small>
              {item.reportHash ? `report ${item.reportHash.slice(0, 12)}... · policy ${item.policyHash?.slice(0, 12)}...` : item.externalCapabilityStatus}
            </small>
            <small>{item.recoveryAction}</small>
            <small>{item.notLegalAdviceBoundary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function IntegrationPolicyEvaluationReceiptsPanel({
  workspaceId,
  records,
  apiBaseUrl,
  syncStatus,
  syncError,
  syncRecoveryAction,
  onApiBaseUrlChange,
  onRefresh
}: {
  workspaceId: string;
  records: IntegrationPolicyEvaluationRecord[];
  apiBaseUrl: string;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  syncError: string;
  syncRecoveryAction: string;
  onApiBaseUrlChange: (value: string) => void;
  onRefresh: () => Promise<void> | void;
}) {
  const [serverBundle, setServerBundle] = useState<IntegrationPolicyEvaluationReceiptBundle | null>(null);
  const [serverBundleStatus, setServerBundleStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [serverBundleError, setServerBundleError] = useState("");
  const [serverBundleRecoveryAction, setServerBundleRecoveryAction] = useState("");
  const [serverRecoveryPacket, setServerRecoveryPacket] = useState<IntegrationPolicyReceiptRecoveryPacket | null>(null);
  const [serverRecoveryPacketStatus, setServerRecoveryPacketStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [serverRecoveryPacketError, setServerRecoveryPacketError] = useState("");
  const [serverRecoveryPacketRecoveryAction, setServerRecoveryPacketRecoveryAction] = useState("");
  const latestRecords = records.slice(0, 4);

  useEffect(() => {
    setServerBundle(null);
    setServerBundleStatus("idle");
    setServerBundleError("");
    setServerBundleRecoveryAction("");
    setServerRecoveryPacket(null);
    setServerRecoveryPacketStatus("idle");
    setServerRecoveryPacketError("");
    setServerRecoveryPacketRecoveryAction("");
  }, [workspaceId]);

  const downloadReceiptBundle = async () => {
    if (!records.length) {
      return;
    }
    const bundle = await createIntegrationPolicyEvaluationReceiptBundle({
      workspaceId: records[0].workspaceId,
      records
    });
    downloadIntegrationPolicyEvaluationReceiptBundleJson("integration-policy-receipt-bundle.json", bundle);
  };
  const refreshServerReceiptBundle = async () => {
    setServerBundleStatus("syncing");
    setServerBundleError("");
    setServerBundleRecoveryAction("");

    try {
      const bundle = await fetchIntegrationPolicyEvaluationReceiptBundle({
        apiBaseUrl,
        workspaceId
      });
      setServerBundle(bundle);
      setServerRecoveryPacket(null);
      setServerRecoveryPacketStatus("idle");
      setServerBundleStatus("synced");
    } catch (error) {
      setServerBundle(null);
      setServerBundleStatus("error");
      if (error instanceof IntegrationPolicyEvaluationClientError) {
        setServerBundleError(error.message);
        setServerBundleRecoveryAction(error.recoveryAction);
        return;
      }
      setServerBundleError(error instanceof Error ? error.message : "Policy receipt bundle refresh failed.");
      setServerBundleRecoveryAction("Start the Phase 2 API and retry policy receipt bundle refresh.");
    }
  };
  const downloadServerReceiptBundle = () => {
    if (!serverBundle) {
      return;
    }

    downloadIntegrationPolicyEvaluationReceiptBundleJson("server-integration-policy-receipt-bundle.json", serverBundle);
  };
  const refreshServerRecoveryPacket = async () => {
    setServerRecoveryPacketStatus("syncing");
    setServerRecoveryPacketError("");
    setServerRecoveryPacketRecoveryAction("");

    try {
      const packet = await fetchIntegrationPolicyReceiptRecoveryPacket({
        apiBaseUrl,
        workspaceId
      });
      setServerRecoveryPacket(packet);
      setServerRecoveryPacketStatus("synced");
    } catch (error) {
      setServerRecoveryPacket(null);
      setServerRecoveryPacketStatus("error");
      if (error instanceof IntegrationPolicyEvaluationClientError) {
        setServerRecoveryPacketError(error.message);
        setServerRecoveryPacketRecoveryAction(error.recoveryAction);
        return;
      }
      setServerRecoveryPacketError(error instanceof Error ? error.message : "Policy receipt recovery packet refresh failed.");
      setServerRecoveryPacketRecoveryAction("Start the Phase 2 API and retry policy receipt recovery packet refresh.");
    }
  };
  const downloadServerRecoveryPacket = () => {
    if (!serverRecoveryPacket) {
      return;
    }

    downloadIntegrationPolicyReceiptRecoveryPacketJson(
      "server-integration-policy-receipt-recovery-packet.json",
      serverRecoveryPacket
    );
  };

  return (
    <section className={`integration-policy-receipts ${syncStatus}`} aria-label="Integration Policy Evaluation Receipts">
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
      <div className={`provider-policy-sync ${syncStatus}`}>
        <label>
          <span>Policy Receipts API base URL</span>
          <input
            type="url"
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            placeholder="http://127.0.0.1:8787"
            aria-label="Policy Receipts API base URL"
          />
        </label>
        <button type="button" className="secondary" onClick={onRefresh} disabled={syncStatus === "syncing"}>
          <RefreshCcw size={16} aria-hidden="true" />
          {syncStatus === "syncing" ? "Refreshing Policy Receipts" : "Refresh Policy Receipts"}
        </button>
        <small>
          Pulls persisted workspace receipts from the Phase 2 API. No policy payloads, credentials, raw evidence, raw KYC,
          personal data, or external write commands are fetched.
        </small>
        {syncStatus === "synced" ? <span className="save-state">Policy receipts synced</span> : null}
        {syncError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{syncError}</strong>
            {syncRecoveryAction ? <span>{syncRecoveryAction}</span> : null}
            <small>Not legal advice. Receipt refresh is audit preparation workflow metadata only.</small>
          </div>
        ) : null}
      </div>
      <div className="inline-actions provider-policy-actions">
        <span>Bundle persisted receipts into one metadata-only adapter enablement evidence artifact.</span>
        <button type="button" className="secondary" onClick={() => void downloadReceiptBundle()} disabled={!records.length}>
          <Download size={16} aria-hidden="true" />
          Download Policy Receipt Bundle JSON
        </button>
      </div>
      <div className={`integration-policy-server-bundle ${serverBundleStatus}`}>
        <div className="split-title compact-title">
          <div>
            <ReceiptText size={16} aria-hidden="true" />
            <strong>Server Receipt Bundle</strong>
          </div>
          <span className="workflow-status disabled">External enablement disabled</span>
        </div>
        <p>
          {serverBundle
            ? `${serverBundle.recordCount} persisted receipt${serverBundle.recordCount === 1 ? "" : "s"} bundled from the Phase 2 API.`
            : "Refresh the persisted server bundle to verify adapter enablement remains disabled after reload."}
        </p>
        {serverBundle ? (
          <div className="integration-policy-server-bundle-facts">
            <ProviderPolicyFact label="Bundle" value={`${serverBundle.bundleHash.slice(0, 12)}...`} />
            <ProviderPolicyFact label="Records" value={String(serverBundle.recordCount)} />
            <ProviderPolicyFact label="Missing" value={String(serverBundle.missingPolicyIds.length)} />
            <ProviderPolicyFact label="Blocked" value={String(serverBundle.blockedCount)} />
            <ProviderPolicyFact label="External" value={serverBundle.externalEnablementAllowed ? "Enabled" : "Disabled"} />
          </div>
        ) : null}
        {serverBundle ? (
          <div
            className="integration-policy-server-bundle-actions"
            role="status"
            aria-label="Server Receipt Bundle actions"
          >
            <strong>Receipt bundle actions</strong>
            {serverBundle.nextActions.map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        ) : null}
        {serverBundleError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{serverBundleError}</strong>
            {serverBundleRecoveryAction ? <span>{serverBundleRecoveryAction}</span> : null}
            <small>Not legal advice. Receipt bundle refresh is metadata-only and does not enable adapters.</small>
          </div>
        ) : null}
        <div className="inline-actions provider-policy-actions">
          <button type="button" className="secondary" onClick={() => void refreshServerReceiptBundle()} disabled={serverBundleStatus === "syncing"}>
            <RefreshCcw size={16} aria-hidden="true" />
            {serverBundleStatus === "syncing" ? "Refreshing Server Bundle" : "Refresh Server Receipt Bundle"}
          </button>
          <button type="button" className="secondary" onClick={downloadServerReceiptBundle} disabled={!serverBundle}>
            <Download size={16} aria-hidden="true" />
            Download Server Receipt Bundle JSON
          </button>
        </div>
        <small>{serverBundle?.notLegalAdviceBoundary ?? "Not legal advice. Integration policy receipt bundles are audit preparation metadata only."}</small>
      </div>
      <div className={`integration-policy-server-bundle server-receipt-recovery ${serverRecoveryPacketStatus}`}>
        <div className="split-title compact-title">
          <div>
            <ReceiptText size={16} aria-hidden="true" />
            <strong>Server Receipt Recovery Packet</strong>
          </div>
          <span className="workflow-status disabled">
            {serverRecoveryPacket
              ? `${serverRecoveryPacket.summary.totalRecoveryCount} recovery item${
                  serverRecoveryPacket.summary.totalRecoveryCount === 1 ? "" : "s"
                }`
              : "not refreshed"}
          </span>
        </div>
        <p>
          {serverRecoveryPacket
            ? `${serverRecoveryPacket.recordCount} persisted integration policy receipt${
                serverRecoveryPacket.recordCount === 1 ? "" : "s"
              } checked while external enablement remains disabled.`
            : "Refresh the server recovery packet to verify missing, blocked, needs-policy, or stale receipts before adapter enablement review."}
        </p>
        {serverRecoveryPacket ? (
          <div className="integration-policy-server-bundle-facts">
            <ProviderPolicyFact label="Packet" value={`${serverRecoveryPacket.packetHash.slice(0, 12)}...`} />
            <ProviderPolicyFact label="Missing" value={String(serverRecoveryPacket.summary.missingPolicyCount)} />
            <ProviderPolicyFact label="Blocked" value={String(serverRecoveryPacket.summary.blockedCount)} />
            <ProviderPolicyFact label="Needs policy" value={String(serverRecoveryPacket.summary.needsPolicyCount)} />
            <ProviderPolicyFact label="Stale" value={String(serverRecoveryPacket.summary.staleReceiptCount)} />
          </div>
        ) : null}
        {serverRecoveryPacket ? (
          <div
            className="integration-policy-server-bundle-actions"
            role="status"
            aria-label="Server Receipt Recovery Packet actions"
          >
            <strong>Receipt recovery actions</strong>
            {serverRecoveryPacket.nextActions.map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        ) : null}
        {serverRecoveryPacketError ? (
          <div className="provider-policy-error" role="alert">
            <strong>{serverRecoveryPacketError}</strong>
            {serverRecoveryPacketRecoveryAction ? <span>{serverRecoveryPacketRecoveryAction}</span> : null}
            <small>Not legal advice. Receipt recovery refresh is metadata-only and does not enable adapters.</small>
          </div>
        ) : null}
        <div className="inline-actions provider-policy-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => void refreshServerRecoveryPacket()}
            disabled={serverRecoveryPacketStatus === "syncing"}
          >
            <RefreshCcw size={16} aria-hidden="true" />
            {serverRecoveryPacketStatus === "syncing" ? "Refreshing Receipt Recovery Packet" : "Refresh Receipt Recovery Packet"}
          </button>
          <button type="button" className="secondary" onClick={downloadServerRecoveryPacket} disabled={!serverRecoveryPacket}>
            <Download size={16} aria-hidden="true" />
            Download Receipt Recovery Packet JSON
          </button>
        </div>
        <small>
          {serverRecoveryPacket?.notLegalAdviceBoundary ??
            "Not legal advice. Integration policy receipt recovery packets are audit preparation metadata only."}
        </small>
      </div>
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

function receiptCoverageLabel(status: IntegrationPolicyReceiptCoverageStatus): string {
  if (status === "covered") {
    return "server receipt covered";
  }

  if (status === "missing") {
    return "missing server receipt";
  }

  if (status === "needs-policy") {
    return "server receipt needs policy";
  }

  return "server receipt blocked";
}

function receiptCoverageClass(status: IntegrationPolicyReceiptCoverageStatus): IntegrationReadinessRegistry["overallStatus"] {
  if (status === "covered") {
    return "ready";
  }

  if (status === "missing") {
    return "needs-policy";
  }

  return status;
}

function gateItemLabel(status: IntegrationEnablementGate["queueItems"][number]["status"]): string {
  if (status === "missing-receipt") {
    return "missing receipt";
  }

  if (status === "needs-policy") {
    return "needs policy";
  }

  if (status === "disabled") {
    return "disabled";
  }

  return "blocked";
}

function gateItemClass(status: IntegrationEnablementGate["queueItems"][number]["status"]): IntegrationReadinessRegistry["overallStatus"] {
  if (status === "missing-receipt" || status === "needs-policy") {
    return "needs-policy";
  }

  if (status === "disabled") {
    return "disabled";
  }

  return "blocked";
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
