import { redactClassifiedText } from "./dataClassification.js";
import { listPhase2ApiRoutes, type Phase2ApiMethod } from "./phase2ApiContracts.js";

export type ApiPreflightCapabilityId =
  | "model-gateway"
  | "model-connect"
  | "evidence-vault"
  | "human-review"
  | "exports"
  | "audit-log"
  | "source-review"
  | "integration-policies";

export type ApiPreflightCapability = {
  id: ApiPreflightCapabilityId;
  status: string;
  summary: string;
};

export type ApiPreflightRouteFamilyId =
  | "model-gateway-adapters"
  | "model-gateway-provider-policy"
  | "model-gateway-run-recovery"
  | "evidence-vault-manifest"
  | "evidence-vault-lineage-digest"
  | "human-review-queue"
  | "source-review-ledger"
  | "source-review-packet"
  | "source-approval-queue"
  | "source-approval-packet"
  | "counsel-pack-exports"
  | "counsel-pack-export-recovery"
  | "audit-log"
  | "audit-log-export"
  | "integration-policy-evaluations"
  | "integration-policy-receipt-bundle";

export type ApiPreflightRouteFamily = {
  id: ApiPreflightRouteFamilyId;
  label: string;
  method: Extract<Phase2ApiMethod, "GET">;
  path: string;
  status: "ready";
  responseContract: string;
  sideEffectBoundary: string;
  noRawDataAccepted: boolean;
  recoveryAction: string;
};

export type ApiPreflightImplementedRoute = {
  method: Phase2ApiMethod | "GET";
  path: string;
  domain: string;
  implemented: boolean;
  notLegalAdviceBoundary: string;
};

export type ApiPreflightReport = {
  reportVersion: "lexproof-api-preflight-v1";
  status: "ready";
  service: "lexproof-secure-review-workspace-api";
  version: "lexproof-phase-2-backend-v1";
  generatedAt: string;
  capabilities: ApiPreflightCapability[];
  routeFamilyCount: number;
  routeFamilies: ApiPreflightRouteFamily[];
  implementedRouteCount: number;
  implementedRoutes: ApiPreflightImplementedRoute[];
  limitations: string[];
  externalSideEffectsAllowed: false;
  reportHash: string;
  notLegalAdviceBoundary: "Not legal advice. API preflight reports are audit preparation readiness metadata only.";
};

export type CreateApiPreflightReportOptions = {
  generatedAt?: string;
  capabilities?: ApiPreflightCapability[];
  routeFamilies?: ApiPreflightRouteFamily[];
  limitations?: string[];
};

type ApiPreflightHashSubject = Omit<ApiPreflightReport, "generatedAt" | "reportHash">;

const NOT_LEGAL_ADVICE_BOUNDARY =
  "Not legal advice. API preflight reports are audit preparation readiness metadata only." as const;

const defaultCapabilities: ApiPreflightCapability[] = [
  {
    id: "model-gateway",
    status: "mock-run-ready",
    summary: "Mock Model Gateway runs persist metadata-only hashes, retry state, and human-review status."
  },
  {
    id: "model-connect",
    status: "policy-ready",
    summary: "Model Connect provider and secret policy checks are available without storing model credentials."
  },
  {
    id: "evidence-vault",
    status: "metadata-versioning-ready",
    summary: "Evidence Vault routes hash uploads server-side and return metadata, lineage, status, and manifest records."
  },
  {
    id: "human-review",
    status: "repository-ready",
    summary: "Human Review routes persist queue, returned, rejected, reviewed, and recovery-packet workflow metadata."
  },
  {
    id: "exports",
    status: "metadata-records-ready",
    summary: "Counsel Pack export records store hashes, version metadata, review summaries, and source counts only."
  },
  {
    id: "audit-log",
    status: "repository-ready",
    summary: "Audit Log routes expose filtered metadata records and integrity exports without raw payloads or legal conclusions."
  },
  {
    id: "source-review",
    status: "metadata-sync-ready",
    summary: "Source Review Ledger and Source Approval Queue list persisted metadata without raw source bodies or matching changes."
  },
  {
    id: "integration-policies",
    status: "disabled-adapter-policy-ready",
    summary: "Object storage, document parser, chain anchor, and GRC destination policies evaluate metadata only."
  }
];

const defaultRouteFamilies: ApiPreflightRouteFamily[] = [
  createRouteFamily({
    id: "model-gateway-adapters",
    label: "Model Gateway adapters",
    path: "/api/model-gateway/adapters",
    responseContract: "ModelGatewayAdapterDescriptor[]",
    sideEffectBoundary: "Registry lookup only; no provider call, credential storage, or model inference."
  }),
  createRouteFamily({
    id: "model-gateway-provider-policy",
    label: "Model Connect provider policy",
    path: "/api/model-gateway/provider-policy",
    responseContract: "ModelGatewayProviderPolicyReport",
    sideEffectBoundary: "Provider policy metadata only; disabled external providers stay disabled."
  }),
  createRouteFamily({
    id: "model-gateway-run-recovery",
    label: "Model Gateway run recovery",
    path: "/api/workspaces/:workspaceId/model-runs/recovery",
    responseContract: "ModelGatewayRunRecoveryPacket",
    sideEffectBoundary: "Run recovery packet returns model-run hashes, retry state, human-review blockers, and recovery actions only."
  }),
  createRouteFamily({
    id: "evidence-vault-manifest",
    label: "Evidence Vault manifest",
    path: "/api/workspaces/:workspaceId/evidence-manifest",
    responseContract: "EvidenceVaultManifest",
    sideEffectBoundary: "Manifest generation returns persisted evidence metadata and hashes without raw file bytes."
  }),
  createRouteFamily({
    id: "evidence-vault-lineage-digest",
    label: "Evidence Vault lineage digest",
    path: "/api/workspaces/:workspaceId/evidence-lineage-digest",
    responseContract: "EvidenceVaultLineageDigest",
    sideEffectBoundary:
      "Lineage digest returns active/replaced/rejected counts, manifest hash, lineage links, and linked control IDs without raw evidence."
  }),
  createRouteFamily({
    id: "human-review-queue",
    label: "Human Review queue",
    path: "/api/workspaces/:workspaceId/reviews/queue",
    responseContract: "ServerHumanReviewQueueView",
    sideEffectBoundary: "Queue view reads review workflow metadata and does not represent legal approval."
  }),
  createRouteFamily({
    id: "source-review-ledger",
    label: "Source Review Ledger",
    path: "/api/workspaces/:workspaceId/source-reviews",
    responseContract: "RegulatorySourceReviewRecord[]",
    sideEffectBoundary: "Source review list returns persisted source metadata only and cannot change matching behavior."
  }),
  createRouteFamily({
    id: "source-review-packet",
    label: "Source Review packet",
    path: "/api/workspaces/:workspaceId/source-reviews/packet",
    responseContract: "ServerRegulatorySourceReviewPacket",
    sideEffectBoundary: "Source review packet returns record hashes, ledger hashes, review counts, and recovery actions only."
  }),
  createRouteFamily({
    id: "source-approval-queue",
    label: "Source Approval Queue",
    path: "/api/workspaces/:workspaceId/source-approvals",
    responseContract: "RegulatorySourceApprovalRecord[]",
    sideEffectBoundary: "Source approval list returns approval-gate metadata only and cannot approve legal conclusions."
  }),
  createRouteFamily({
    id: "source-approval-packet",
    label: "Source Approval packet",
    path: "/api/workspaces/:workspaceId/source-approvals/packet",
    responseContract: "ServerRegulatorySourceApprovalPacket",
    sideEffectBoundary: "Source approval packet returns queue hashes, approval-gate counts, record hashes, and recovery actions only."
  }),
  createRouteFamily({
    id: "counsel-pack-exports",
    label: "Counsel Pack exports",
    path: "/api/workspaces/:workspaceId/exports",
    responseContract: "CounselPackExportRecord[]",
    sideEffectBoundary: "Export list returns artifact hashes and metadata only, never raw Markdown or PDF content."
  }),
  createRouteFamily({
    id: "counsel-pack-export-recovery",
    label: "Counsel Pack export recovery",
    path: "/api/workspaces/:workspaceId/exports/counsel-pack/recovery",
    responseContract: "CounselPackExportRecoveryPacket",
    sideEffectBoundary: "Export recovery packet returns record hashes, readiness blockers, and recovery actions only."
  }),
  createRouteFamily({
    id: "audit-log",
    label: "Audit Log",
    path: "/api/workspaces/:workspaceId/audit-log",
    responseContract: "AuditLogRecord[]",
    sideEffectBoundary: "Audit log reads filtered metadata, before/after hashes, and redacted summaries only."
  }),
  createRouteFamily({
    id: "audit-log-export",
    label: "Audit Log export",
    path: "/api/workspaces/:workspaceId/audit-log/export",
    responseContract: "AuditLogExportRecord",
    sideEffectBoundary: "Audit log export returns redacted event hashes, integrity chain hash, and boundary findings only."
  }),
  createRouteFamily({
    id: "integration-policy-evaluations",
    label: "Integration Policy Evaluation receipts",
    path: "/api/workspaces/:workspaceId/integration-policy-evaluations",
    responseContract: "IntegrationPolicyEvaluationRecord[]",
    sideEffectBoundary: "Receipt lookup returns policy hashes and adapter readiness metadata without external writes."
  }),
  createRouteFamily({
    id: "integration-policy-receipt-bundle",
    label: "Integration Policy receipt bundle",
    path: "/api/workspaces/:workspaceId/integration-policy-evaluations/bundle",
    responseContract: "IntegrationPolicyEvaluationReceiptBundle",
    sideEffectBoundary:
      "Receipt bundle returns persisted policy receipt hashes, missing policy IDs, disabled enablement state, and next actions only."
  })
];

const defaultLimitations = [
  "No API route accepts raw KYC packets, private keys, wallet seed phrases, or model provider credentials.",
  "The OpenAI-compatible and enterprise proxy model adapters remain disabled until a separate enablement review is approved.",
  "Evidence Vault responses are metadata-only and do not persist or return uploaded file bytes.",
  "Object storage, OCR/document parser, GRC ticketing, and chain anchoring integrations are policy reports only in this phase.",
  "The API creates audit preparation workflow records only and must not be treated as legal advice."
];

export async function createApiPreflightReport(
  options: CreateApiPreflightReportOptions = {}
): Promise<ApiPreflightReport> {
  const subject: ApiPreflightHashSubject = {
    reportVersion: "lexproof-api-preflight-v1",
    status: "ready",
    service: "lexproof-secure-review-workspace-api",
    version: "lexproof-phase-2-backend-v1",
    capabilities: normalizeCapabilities(options.capabilities ?? defaultCapabilities),
    routeFamilyCount: 0,
    routeFamilies: normalizeRouteFamilies(options.routeFamilies ?? defaultRouteFamilies),
    implementedRouteCount: 0,
    implementedRoutes: createImplementedRoutes(),
    limitations: normalizeStringList(options.limitations ?? defaultLimitations),
    externalSideEffectsAllowed: false,
    notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
  };
  subject.routeFamilyCount = subject.routeFamilies.length;
  subject.implementedRouteCount = subject.implementedRoutes.filter((route) => route.implemented).length;

  return {
    ...subject,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    reportHash: await sha256Hex(stableStringify(subject))
  };
}

export function listApiPreflightRouteFamilies(): ApiPreflightRouteFamily[] {
  return normalizeRouteFamilies(defaultRouteFamilies);
}

export function exportApiPreflightJson(report: ApiPreflightReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function createRouteFamily(input: {
  id: ApiPreflightRouteFamilyId;
  label: string;
  path: string;
  responseContract: string;
  sideEffectBoundary: string;
}): ApiPreflightRouteFamily {
  return {
    ...input,
    method: "GET",
    status: "ready",
    noRawDataAccepted: true,
    recoveryAction: `Confirm ${input.path} is registered and returns metadata-only readiness data.`
  };
}

function normalizeCapabilities(capabilities: ApiPreflightCapability[]): ApiPreflightCapability[] {
  return capabilities
    .map((capability) => ({
      id: capability.id,
      status: sanitizeText(capability.status),
      summary: sanitizeText(capability.summary)
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function normalizeRouteFamilies(routeFamilies: ApiPreflightRouteFamily[]): ApiPreflightRouteFamily[] {
  return routeFamilies
    .map((route) => ({
      id: route.id,
      label: sanitizeText(route.label),
      method: "GET" as const,
      path: sanitizeText(route.path),
      status: "ready" as const,
      responseContract: sanitizeText(route.responseContract),
      sideEffectBoundary: sanitizeText(route.sideEffectBoundary),
      noRawDataAccepted: Boolean(route.noRawDataAccepted),
      recoveryAction: sanitizeText(route.recoveryAction)
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function createImplementedRoutes(): ApiPreflightImplementedRoute[] {
  const systemRoutes: ApiPreflightImplementedRoute[] = [
    {
      method: "GET",
      path: "/api/health",
      domain: "system",
      implemented: true,
      notLegalAdviceBoundary: "Not legal advice. This API creates audit preparation workflow records only."
    },
    {
      method: "GET",
      path: "/api/preflight",
      domain: "system",
      implemented: true,
      notLegalAdviceBoundary: NOT_LEGAL_ADVICE_BOUNDARY
    }
  ];

  return [...systemRoutes, ...listPhase2ApiRoutes().map(createImplementedRoute)]
    .map((route) => ({
      ...route,
      domain: sanitizeText(route.domain),
      path: sanitizeText(route.path),
      notLegalAdviceBoundary: sanitizeText(route.notLegalAdviceBoundary)
    }))
    .sort((left, right) => `${left.domain}:${left.method}:${left.path}`.localeCompare(`${right.domain}:${right.method}:${right.path}`));
}

function createImplementedRoute(route: ReturnType<typeof listPhase2ApiRoutes>[number]): ApiPreflightImplementedRoute {
  return {
    method: route.method,
    path: route.path,
    domain: route.domain,
    implemented: route.implemented,
    notLegalAdviceBoundary: route.notLegalAdviceBoundary
  };
}

function normalizeStringList(items: string[]): string[] {
  return items.map(sanitizeText).filter(Boolean).sort((left, right) => left.localeCompare(right));
}

function sanitizeText(value: string): string {
  return redactClassifiedText(value.replace(/\s+/g, " ").trim());
}

async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
