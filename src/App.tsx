import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  ClipboardList,
  DatabaseZap,
  FileText,
  Github,
  Globe2,
  Link2,
  Scale,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { AIReviewPanel } from "./components/AIReviewPanel";
import { AuditWizard, SectionHeader, riskCopy } from "./components/AuditWizard";
import { CounselPackPanel } from "./components/CounselPackPanel";
import { EvidenceLedger } from "./components/EvidenceLedger";
import { ExportSafetyInventoryPanel } from "./components/ExportSafetyInventoryPanel";
import { GrcTicketExportPanel } from "./components/GrcTicketExportPanel";
import { HumanReviewPanel } from "./components/HumanReviewPanel";
import { IntegrationReadinessPanel } from "./components/IntegrationReadinessPanel";
import { JudgeHandoffBundlePanel } from "./components/JudgeHandoffBundlePanel";
import { JurisdictionChecklistPanel } from "./components/JurisdictionChecklistPanel";
import { ModelIntakePanel } from "./components/ModelIntakePanel";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { RegulatoryCommandCenter } from "./components/RegulatoryCommandCenter";
import { SecureReviewWorkspace } from "./components/SecureReviewWorkspace";
import { SecurityReviewChecklistPanel } from "./components/SecurityReviewChecklistPanel";
import { SubmissionPackPanel } from "./components/SubmissionPackPanel";
import { demoReadinessScreenshotRefs } from "./data/demoReadiness";
import { demoScenarios } from "./data/demoScenarios";
import { sampleProfiles } from "./data/sampleProfiles";
import { analyzeAuditProfile, createSubmissionFit, type AuditFlag, type AuditProfile, type RemediationItem } from "./lib/auditEngine";
import { createRedactionReport, type AIReviewResult } from "./lib/aiReview";
import { buildMarkdownCounselPack } from "./lib/counselPack";
import { createServerCounselPackExportRecord } from "./lib/counselPackExportClient";
import {
  counselPackTemplates,
  getCounselPackTemplateById,
  recommendCounselPackTemplate,
  type CounselPackTemplateId
} from "./lib/counselPackTemplates";
import {
  createCounselPackVersionRecord,
  type CounselPackVersionRecord
} from "./lib/counselPackVersions";
import {
  createCounselHandoffChecklist,
  type CounselHandoffChecklist
} from "./lib/counselHandoffChecklist";
import {
  createDefaultCounselReviewItems,
  mergeCounselReviewQueues,
  type CounselReviewItem
} from "./lib/counselReview";
import {
  createDefaultCounselQuestions,
  createManualCounselQuestion,
  createQuestionsFromAIReview,
  mergeCounselQuestionQueues,
  sortCounselQuestionsForReview,
  type CounselQuestion
} from "./lib/counselQuestions";
import { createDataBoundaryReport } from "./lib/dataBoundary";
import {
  createEvidenceCreatedEvent,
  createEvidenceRemovedEvent,
  createEvidenceUpdateEvent,
  type EvidenceAuditEvent
} from "./lib/evidenceAuditTrail";
import {
  createDocumentParserPolicyReport,
  type DocumentParserPolicyContext,
  type DocumentParserPolicyDraft,
  type DocumentParserPolicyReport
} from "./lib/documentParserPolicy";
import {
  createChainAnchorPolicyReport,
  type ChainAnchorPolicyContext,
  type ChainAnchorPolicyDraft,
  type ChainAnchorPolicyReport
} from "./lib/chainAnchorPolicy";
import {
  ChainAnchorPolicyClientError,
  fetchChainAnchorPolicyReport
} from "./lib/chainAnchorPolicyClient";
import {
  DocumentParserPolicyClientError,
  fetchDocumentParserPolicyReport
} from "./lib/documentParserPolicyClient";
import { findDemoScenarioById, validateDemoScenarioLibrary } from "./lib/demoScenarioLibrary";
import { createDemoReadinessReport, type DemoApiPreflight } from "./lib/demoReadiness";
import { createDemoRunbook, type DemoRunbook } from "./lib/demoRunbook";
import { createEvidenceIntakeGuidance } from "./lib/evidenceIntakeGuidance";
import { createEvidenceManifest, type EvidenceManifest } from "./lib/evidenceManifest";
import {
  createEvidenceRecertificationQueue,
  type EvidenceRecertificationQueue
} from "./lib/evidenceRecertification";
import {
  createDemoRunbookExportArtifact,
  createExportSafetyInventory,
  createSourceFreshnessBoardExportArtifact,
  type ExportSafetyArtifactInput,
  type ExportSafetyInventory
} from "./lib/exportSafetyInventory";
import { createEvidenceItemsFromTemplate, listEvidenceTemplates, recommendEvidenceTemplates } from "./lib/evidenceTemplates";
import {
  createGrcDestinationPolicyReport,
  type GrcDestinationPolicyContext,
  type GrcDestinationPolicyDraft,
  type GrcDestinationPolicyReport
} from "./lib/grcDestinationPolicy";
import {
  fetchGrcDestinationPolicyReport,
  GrcDestinationPolicyClientError
} from "./lib/grcDestinationPolicyClient";
import { createGrcTicketExport, type GrcTicketExportBundle } from "./lib/grcTicketExport";
import {
  createIntegrationEnablementDossier,
  type IntegrationEnablementDossier
} from "./lib/integrationEnablementDossier";
import { createJudgeHandoffBundle, type JudgeHandoffBundle } from "./lib/judgeHandoffBundle";
import { createIntegrationReadinessRegistry } from "./lib/integrationReadiness";
import {
  createModelGatewayProviderPolicyReport,
  defaultModelGatewayProviderAdapters,
  type ModelGatewayProviderPolicyReport
} from "./lib/modelGatewayProviderPolicy";
import {
  createModelGatewaySecretPolicyReport,
  type ModelGatewaySecretPolicyDraft,
  type ModelGatewaySecretPolicyReport
} from "./lib/modelGatewaySecretPolicy";
import {
  fetchModelGatewayProviderPolicy,
  ModelGatewayProviderPolicyClientError
} from "./lib/modelGatewayProviderPolicyClient";
import {
  fetchModelGatewaySecretPolicyReport,
  ModelGatewaySecretPolicyClientError
} from "./lib/modelGatewaySecretPolicyClient";
import {
  createLocalCounselRoutingPlan,
  type LocalCounselRoutingPlan
} from "./lib/localCounselRouting";
import {
  createObjectStoragePolicyReport,
  type ObjectStoragePolicyContext,
  type ObjectStoragePolicyDraft,
  type ObjectStoragePolicyReport
} from "./lib/objectStoragePolicy";
import {
  fetchObjectStoragePolicyReport,
  ObjectStoragePolicyClientError
} from "./lib/objectStoragePolicyClient";
import {
  createHumanReviewDecision,
  createHumanReviewQueue,
  createHumanReviewTimeline,
  humanReviewStatusToAIEventStatus,
  humanReviewStatusToCounselReviewStatus,
  humanReviewStatusToEvidenceStatus,
  type HumanReviewDecision,
  type HumanReviewDecisionUpdate,
  type HumanReviewQueueItem
} from "./lib/humanReviewWorkflow";
import { createEvidenceRequestFromRequirement } from "./lib/missingEvidenceWorkflow";
import { runAIReviewWithLedger, type ModelReviewRun } from "./lib/modelReviewLedger";
import {
  createMockModelProvider,
  createOpenAICompatibleModelProvider,
  ModelProviderClientError,
  validateModelSettings,
  type ModelSettings
} from "./lib/modelProvider";
import { createModelConnectReceipt, type ModelConnectReceipt } from "./lib/modelConnect";
import {
  applyAIEventReviewUpdate,
  buildModelIntakeSummary,
  createAIReviewEventFromRun,
  sanitizeAIEventRecord,
  type AIEventRecord,
  type ModelConnectionProfile,
  type ModelIntakeSummary
} from "./lib/modelIntake";
import { validateProjectProfile, type EvidenceItem, type ProjectProfile } from "./lib/projectModel";
import { createRetentionPolicyReport } from "./lib/retentionPolicy";
import type {
  CounselPackExportRecord,
  RegulatorySourceApprovalSyncResult,
  RegulatorySourceReviewSyncResult
} from "./lib/phase2Types";
import {
  createJurisdictionEvidenceMap,
  type JurisdictionEvidenceMap
} from "./lib/jurisdictionEvidenceMap";
import {
  createJurisdictionReadinessDigest,
  type JurisdictionReadinessDigest
} from "./lib/jurisdictionReadinessDigest";
import { createRegulatoryControlMatrix } from "./lib/regulatoryControlMatrix";
import { createRegulatoryGraph } from "./lib/regulatoryGraph";
import {
  createRegulatorySourcePack,
  type RegulatorySourcePack
} from "./lib/regulatorySourcePack";
import { createRegulatorySourceApprovalQueue } from "./lib/regulatorySourceApproval";
import {
  RegulatorySourceApprovalClientError,
  syncRegulatorySourceApprovalQueue
} from "./lib/regulatorySourceApprovalClient";
import {
  RegulatorySourceReviewClientError,
  syncRegulatorySourceReviewLedger
} from "./lib/regulatorySourceReviewClient";
import {
  createRegulatorySourceReviewPacket,
  type RegulatorySourceReviewPacket
} from "./lib/regulatorySourceReviewPacket";
import { createRegulatorySourceReview } from "./lib/regulatorySourceReview";
import {
  createSourceFreshnessBoard,
  type SourceFreshnessBoard
} from "./lib/sourceFreshnessBoard";
import { createRiskIssueCards, type RiskIssueCard } from "./lib/riskExplainers";
import {
  createRiskEvidenceCoverage,
  type RiskEvidenceCoverage,
  type RiskEvidenceRequirement
} from "./lib/riskEvidence";
import { createSecurityReviewChecklist } from "./lib/securityReviewChecklist";
import { createSubmissionPack, type SubmissionDemoRunbookSummary, type SubmissionPack } from "./lib/submissionPack";
import { createWorkspaceActionQueue, type WorkspaceActionTarget } from "./lib/workspaceActionQueue";
import { createWorkspaceCockpitBrief } from "./lib/workspaceCockpitBrief";
import { createWorkspaceJourney } from "./lib/workspaceJourney";

type TabId = WorkspaceActionTarget;

const STORAGE_KEY = "lexproof.currentProject.v1";
const MODEL_SETTINGS_KEY = "lexproof.modelSettings.v1";
const MODEL_REVIEW_RUNS_KEY = "lexproof.modelReviewRuns.v1";
const MODEL_INTAKE_PROFILE_KEY = "lexproof.modelIntakeProfile.v1";
const MODEL_INTAKE_EVENTS_KEY = "lexproof.modelIntakeEvents.v1";
const COUNSEL_QUESTIONS_KEY = "lexproof.counselQuestions.v1";
const COUNSEL_REVIEWS_KEY = "lexproof.counselReviews.v1";
const EVIDENCE_AUDIT_TRAIL_KEY = "lexproof.evidenceAuditTrail.v1";
const HUMAN_REVIEW_DECISIONS_KEY = "lexproof.humanReviewDecisions.v1";
const COUNSEL_PACK_VERSIONS_KEY = "lexproof.counselPackVersions.v1";
const COUNSEL_PACK_SERVER_EXPORTS_KEY = "lexproof.counselPackServerExports.v1";

const defaultModelGatewaySecretPolicyDraft: ModelGatewaySecretPolicyDraft = {
  policyOwner: "",
  kmsBackedStorageApproved: false,
  rotationDays: 0,
  accessReviewCadence: "none",
  providerAllowlistApproved: false,
  egressLoggingApproved: false,
  incidentResponseRunbookApproved: false,
  noClientSecretPersistence: true,
  humanReviewRequired: true,
  notes: ""
};

const defaultObjectStoragePolicyDraft: ObjectStoragePolicyDraft = {
  policyOwner: "",
  retentionDays: 0,
  deletionSlaDays: 0,
  encryptionAtRestApproved: false,
  bucketAllowlistApproved: false,
  accessLoggingApproved: false,
  lifecyclePolicyApproved: false,
  noSensitiveMaterialConfirmed: true,
  humanReviewRequired: true,
  notes: ""
};

const defaultDocumentParserPolicyDraft: DocumentParserPolicyDraft = {
  policyOwner: "",
  maxDocumentSizeMb: 0,
  rawDocumentRetentionDays: 0,
  deletionSlaDays: 0,
  parsingPurpose: "",
  redactionBeforeParsingApproved: false,
  noTrainingUseConfirmed: false,
  accessLoggingApproved: false,
  noSensitiveMaterialConfirmed: true,
  humanReviewRequired: true,
  notes: ""
};

const defaultChainAnchorPolicyDraft: ChainAnchorPolicyDraft = {
  policyOwner: "",
  targetNetwork: "",
  walletCustodyModel: "",
  signerRole: "",
  transactionLoggingApproved: false,
  privacyReviewApproved: false,
  publicPayloadLimitedApproved: false,
  userConsentApproved: false,
  noRawEvidenceOnChainConfirmed: false,
  humanReviewRequired: true,
  notes: ""
};

const defaultGrcDestinationPolicyDraft: GrcDestinationPolicyDraft = {
  policyOwner: "",
  destinationSystem: "",
  destinationQueue: "",
  fieldMappingApproved: false,
  authenticationPolicyApproved: false,
  redactionPolicyApproved: false,
  ticketOwnershipApproved: false,
  retryAndAuditLoggingApproved: false,
  noSensitiveMaterialConfirmed: true,
  humanReviewRequired: true,
  notes: ""
};

const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardList }> = [
  { id: "wizard", label: "Audit Wizard", icon: ClipboardList },
  { id: "ai", label: "AI Review", icon: Bot },
  { id: "model", label: "Model Intake", icon: Bot },
  { id: "review", label: "Human Review", icon: UserCheck },
  { id: "jurisdiction", label: "Jurisdiction Checklist", icon: Globe2 },
  { id: "risk", label: "Risk Audit", icon: ShieldCheck },
  { id: "evidence", label: "Evidence Ledger", icon: DatabaseZap },
  { id: "counsel", label: "Counsel Pack", icon: FileText },
  { id: "sources", label: "Sources", icon: BookOpen }
];

export default function App() {
  const [project, setProject] = useState<ProjectProfile>(() => loadStoredProject() ?? projectFromAuditProfile(sampleProfiles[0]));
  const [activeTab, setActiveTab] = useState<TabId>("wizard");
  const [showValidation, setShowValidation] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [manifest, setManifest] = useState<EvidenceManifest | null>(null);
  const [evidenceRecertificationQueue, setEvidenceRecertificationQueue] = useState<EvidenceRecertificationQueue | null>(null);
  const [localCounselRoutingPlan, setLocalCounselRoutingPlan] = useState<LocalCounselRoutingPlan | null>(null);
  const [integrationEnablementDossier, setIntegrationEnablementDossier] = useState<IntegrationEnablementDossier | null>(null);
  const [exportSafetyInventory, setExportSafetyInventory] = useState<ExportSafetyInventory | null>(null);
  const [judgeHandoffBundle, setJudgeHandoffBundle] = useState<JudgeHandoffBundle | null>(null);
  const [counselHandoffChecklist, setCounselHandoffChecklist] = useState<CounselHandoffChecklist | null>(null);
  const [regulatorySourcePack, setRegulatorySourcePack] = useState<RegulatorySourcePack | null>(null);
  const [regulatorySourceReviewPacket, setRegulatorySourceReviewPacket] = useState<RegulatorySourceReviewPacket | null>(null);
  const [submissionPack, setSubmissionPack] = useState<SubmissionPack | null>(null);
  const [demoApiPreflight, setDemoApiPreflight] = useState<DemoApiPreflight>({ status: "not-checked" });
  const [demoRunbook, setDemoRunbook] = useState<DemoRunbook | null>(null);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => loadStoredModelSettings());
  const [modelConnectReceipt, setModelConnectReceipt] = useState<ModelConnectReceipt | null>(null);
  const [modelIntakeProfile, setModelIntakeProfile] = useState<ModelConnectionProfile>(() => loadStoredModelIntakeProfile());
  const [aiEvents, setAIEvents] = useState<AIEventRecord[]>(() => loadStoredAIEvents());
  const [modelIntakeSummary, setModelIntakeSummary] = useState<ModelIntakeSummary | null>(null);
  const [aiReview, setAIReview] = useState<AIReviewResult | null>(null);
  const [aiReviewRuns, setAIReviewRuns] = useState<ModelReviewRun[]>(() => loadStoredModelReviewRuns());
  const [counselQuestions, setCounselQuestions] = useState<CounselQuestion[]>(() => loadStoredCounselQuestions());
  const [counselReviews, setCounselReviews] = useState<CounselReviewItem[]>(() => loadStoredCounselReviews());
  const [counselPackVersions, setCounselPackVersions] = useState<CounselPackVersionRecord[]>(() =>
    loadStoredCounselPackVersions()
  );
  const [counselPackServerExports, setCounselPackServerExports] = useState<CounselPackExportRecord[]>(() =>
    loadStoredCounselPackServerExports()
  );
  const [evidenceAuditEvents, setEvidenceAuditEvents] = useState<EvidenceAuditEvent[]>(() => loadStoredEvidenceAuditEvents());
  const [humanReviewDecisions, setHumanReviewDecisions] = useState<HumanReviewDecision[]>(() => loadStoredHumanReviewDecisions());
  const [aiReviewStatus, setAIReviewStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [aiReviewError, setAIReviewError] = useState("");
  const [aiReviewErrorRecoveryAction, setAIReviewErrorRecoveryAction] = useState("");
  const [aiReviewErrorBoundary, setAIReviewErrorBoundary] = useState("");
  const [providerPolicyApiBaseUrl, setProviderPolicyApiBaseUrl] = useState("");
  const [serverProviderPolicyReport, setServerProviderPolicyReport] = useState<ModelGatewayProviderPolicyReport | null>(null);
  const [providerPolicySyncStatus, setProviderPolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [providerPolicySyncError, setProviderPolicySyncError] = useState("");
  const [providerPolicySyncRecoveryAction, setProviderPolicySyncRecoveryAction] = useState("");
  const [secretPolicyDraft, setSecretPolicyDraft] = useState<ModelGatewaySecretPolicyDraft>(defaultModelGatewaySecretPolicyDraft);
  const [serverSecretPolicyReport, setServerSecretPolicyReport] = useState<ModelGatewaySecretPolicyReport | null>(null);
  const [secretPolicySyncStatus, setSecretPolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [secretPolicySyncError, setSecretPolicySyncError] = useState("");
  const [secretPolicySyncRecoveryAction, setSecretPolicySyncRecoveryAction] = useState("");
  const [storagePolicyApiBaseUrl, setStoragePolicyApiBaseUrl] = useState("");
  const [storagePolicyDraft, setStoragePolicyDraft] = useState<ObjectStoragePolicyDraft>(defaultObjectStoragePolicyDraft);
  const [serverStoragePolicyReport, setServerStoragePolicyReport] = useState<ObjectStoragePolicyReport | null>(null);
  const [storagePolicySyncStatus, setStoragePolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [storagePolicySyncError, setStoragePolicySyncError] = useState("");
  const [storagePolicySyncRecoveryAction, setStoragePolicySyncRecoveryAction] = useState("");
  const [parserPolicyApiBaseUrl, setParserPolicyApiBaseUrl] = useState("");
  const [parserPolicyDraft, setParserPolicyDraft] = useState<DocumentParserPolicyDraft>(defaultDocumentParserPolicyDraft);
  const [serverParserPolicyReport, setServerParserPolicyReport] = useState<DocumentParserPolicyReport | null>(null);
  const [parserPolicySyncStatus, setParserPolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [parserPolicySyncError, setParserPolicySyncError] = useState("");
  const [parserPolicySyncRecoveryAction, setParserPolicySyncRecoveryAction] = useState("");
  const [anchorPolicyApiBaseUrl, setAnchorPolicyApiBaseUrl] = useState("");
  const [anchorPolicyDraft, setAnchorPolicyDraft] = useState<ChainAnchorPolicyDraft>(defaultChainAnchorPolicyDraft);
  const [serverAnchorPolicyReport, setServerAnchorPolicyReport] = useState<ChainAnchorPolicyReport | null>(null);
  const [anchorPolicySyncStatus, setAnchorPolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [anchorPolicySyncError, setAnchorPolicySyncError] = useState("");
  const [anchorPolicySyncRecoveryAction, setAnchorPolicySyncRecoveryAction] = useState("");
  const [grcDestinationPolicyApiBaseUrl, setGrcDestinationPolicyApiBaseUrl] = useState("");
  const [grcDestinationPolicyDraft, setGrcDestinationPolicyDraft] =
    useState<GrcDestinationPolicyDraft>(defaultGrcDestinationPolicyDraft);
  const [serverGrcDestinationPolicyReport, setServerGrcDestinationPolicyReport] = useState<GrcDestinationPolicyReport | null>(null);
  const [grcDestinationPolicySyncStatus, setGrcDestinationPolicySyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [grcDestinationPolicySyncError, setGrcDestinationPolicySyncError] = useState("");
  const [grcDestinationPolicySyncRecoveryAction, setGrcDestinationPolicySyncRecoveryAction] = useState("");
  const [sourceApprovalApiBaseUrl, setSourceApprovalApiBaseUrl] = useState("");
  const [sourceApprovalSyncResult, setSourceApprovalSyncResult] = useState<RegulatorySourceApprovalSyncResult | null>(null);
  const [sourceApprovalSyncStatus, setSourceApprovalSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [sourceApprovalSyncError, setSourceApprovalSyncError] = useState("");
  const [sourceApprovalSyncRecoveryAction, setSourceApprovalSyncRecoveryAction] = useState("");
  const [sourceReviewApiBaseUrl, setSourceReviewApiBaseUrl] = useState("");
  const [sourceReviewSyncResult, setSourceReviewSyncResult] = useState<RegulatorySourceReviewSyncResult | null>(null);
  const [sourceReviewSyncStatus, setSourceReviewSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [sourceReviewSyncError, setSourceReviewSyncError] = useState("");
  const [sourceReviewSyncRecoveryAction, setSourceReviewSyncRecoveryAction] = useState("");
  const [jurisdictionEvidenceMap, setJurisdictionEvidenceMap] = useState<JurisdictionEvidenceMap | null>(null);
  const [jurisdictionReadinessDigest, setJurisdictionReadinessDigest] = useState<JurisdictionReadinessDigest | null>(null);
  const [sourceFreshnessBoard, setSourceFreshnessBoard] = useState<SourceFreshnessBoard | null>(null);
  const [selectedCounselPackTemplateId, setSelectedCounselPackTemplateId] =
    useState<CounselPackTemplateId>("rwa-tokenized-asset");

  const audit = useMemo(() => analyzeAuditProfile(project), [project]);
  const recommendedCounselPackTemplate = useMemo(() => recommendCounselPackTemplate(project, audit), [audit, project]);
  const selectedCounselPackTemplate = useMemo(
    () => getCounselPackTemplateById(selectedCounselPackTemplateId),
    [selectedCounselPackTemplateId]
  );
  const riskEvidenceCoverage = useMemo(() => createRiskEvidenceCoverage(audit, project.evidenceItems), [audit, project.evidenceItems]);
  const regulatoryGraph = useMemo(() => createRegulatoryGraph(project, audit, project.evidenceItems), [audit, project]);
  const regulatorySourceReview = useMemo(() => createRegulatorySourceReview(regulatoryGraph), [regulatoryGraph]);
  const regulatorySourceApprovalQueue = useMemo(
    () => createRegulatorySourceApprovalQueue(regulatorySourceReview),
    [regulatorySourceReview]
  );
  const regulatoryControlMatrix = useMemo(
    () => createRegulatoryControlMatrix({ graph: regulatoryGraph, sourceReview: regulatorySourceReview }),
    [regulatoryGraph, regulatorySourceReview]
  );
  useEffect(() => {
    let active = true;

    createJurisdictionEvidenceMap({ matrix: regulatoryControlMatrix }).then((nextMap) => {
      if (active) {
        setJurisdictionEvidenceMap(nextMap);
      }
    });

    return () => {
      active = false;
    };
  }, [regulatoryControlMatrix]);
  useEffect(() => {
    let active = true;

    createSourceFreshnessBoard({ sourceReview: regulatorySourceReview }).then((nextBoard) => {
      if (active) {
        setSourceFreshnessBoard(nextBoard);
      }
    });

    return () => {
      active = false;
    };
  }, [regulatorySourceReview]);
  useEffect(() => {
    let active = true;
    setJurisdictionReadinessDigest(null);

    if (jurisdictionEvidenceMap) {
      createJurisdictionReadinessDigest({
        evidenceMap: jurisdictionEvidenceMap,
        localCounselRoutingPlan,
        sourceFreshnessBoard
      }).then((nextDigest) => {
        if (active) {
          setJurisdictionReadinessDigest(nextDigest);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [jurisdictionEvidenceMap, localCounselRoutingPlan, sourceFreshnessBoard]);
  const fit = useMemo(() => createSubmissionFit(), []);
  const demoScenarioValidation = useMemo(() => validateDemoScenarioLibrary(demoScenarios, sampleProfiles), []);
  const demoReadinessReport = useMemo(
    () =>
      createDemoReadinessReport({
        scenarioValidation: demoScenarioValidation,
        scenarioCount: demoScenarioValidation.valid ? demoScenarios.length : 0,
        screenshotRefs: demoReadinessScreenshotRefs,
        apiPreflight: demoApiPreflight
      }),
    [demoApiPreflight, demoScenarioValidation]
  );
  useEffect(() => {
    let live = true;
    setDemoRunbook(null);

    createDemoRunbook({
      readinessReport: demoReadinessReport,
      scenarios: demoScenarioValidation.valid ? demoScenarios : []
    }).then((nextRunbook) => {
      if (live) {
        setDemoRunbook(nextRunbook);
      }
    });

    return () => {
      live = false;
    };
  }, [demoReadinessReport, demoScenarioValidation.valid]);
  const demoRunbookSummary = useMemo<SubmissionDemoRunbookSummary | null>(() => {
    if (!demoRunbook) {
      return null;
    }

    return {
      runbookHash: demoRunbook.runbookHash,
      status: demoRunbook.status,
      apiPreflightStatus: demoRunbook.apiPreflightStatus,
      scenarioCount: demoRunbook.scenarioCount,
      screenshotCount: demoRunbook.screenshotRefs.length,
      notLegalAdviceBoundary: demoRunbook.notLegalAdviceBoundary
    };
  }, [demoRunbook]);
  const evidenceTemplates = useMemo(() => listEvidenceTemplates(), []);
  const recommendedEvidenceTemplateIds = useMemo(
    () => recommendEvidenceTemplates(project).map((template) => template.id),
    [project]
  );
  const evidenceIntakeGuidance = useMemo(
    () =>
      createEvidenceIntakeGuidance({
        project,
        evidenceItems: project.evidenceItems,
        riskEvidenceCoverage,
        evidenceTemplates,
        recommendedTemplateIds: recommendedEvidenceTemplateIds
      }),
    [evidenceTemplates, project, recommendedEvidenceTemplateIds, riskEvidenceCoverage]
  );
  const validation = useMemo(() => validateProjectProfile(project), [project]);
  const modelSettingsValidation = useMemo(() => validateModelSettings(modelSettings), [modelSettings]);
  const currentReviewRuns = useMemo(
    () => aiReviewRuns.filter((run) => run.projectId === project.id).slice(0, 5),
    [aiReviewRuns, project.id]
  );
  const currentAIEvents = useMemo(() => aiEvents.filter((event) => event.projectId === project.id), [aiEvents, project.id]);
  const currentCounselQuestions = useMemo(
    () => sortCounselQuestionsForReview(counselQuestions.filter((question) => question.projectId === project.id)),
    [counselQuestions, project.id]
  );
  const currentCounselReviews = useMemo(
    () => counselReviews.filter((review) => review.projectId === project.id),
    [counselReviews, project.id]
  );
  const currentCounselPackVersions = useMemo(
    () => counselPackVersions.filter((record) => record.projectId === project.id).sort((left, right) => right.version - left.version),
    [counselPackVersions, project.id]
  );
  const currentCounselPackServerExports = useMemo(
    () => counselPackServerExports.filter((record) => record.workspaceId === project.id).sort((left, right) => right.version - left.version),
    [counselPackServerExports, project.id]
  );
  const submissionModelConnectStatus = modelConnectReceipt?.status ?? "not-configured";
  const currentEvidenceAuditEvents = useMemo(
    () => evidenceAuditEvents.filter((event) => event.projectId === project.id),
    [evidenceAuditEvents, project.id]
  );
  const currentHumanReviewDecisions = useMemo(
    () => humanReviewDecisions.filter((decision) => decision.projectId === project.id),
    [humanReviewDecisions, project.id]
  );
  const humanReviewQueue = useMemo(
    () =>
      createHumanReviewQueue({
        projectId: project.id,
        counselReviews: currentCounselReviews,
        evidenceItems: project.evidenceItems,
        aiEvents: currentAIEvents,
        sourceReview: regulatorySourceReview,
        counselPackVersions: currentCounselPackVersions,
        decisions: currentHumanReviewDecisions
      }),
    [
      currentAIEvents,
      currentCounselPackVersions,
      currentCounselReviews,
      currentHumanReviewDecisions,
      project.evidenceItems,
      project.id,
      regulatorySourceReview
    ]
  );
  const humanReviewTimeline = useMemo(
    () =>
      createHumanReviewTimeline({
        projectId: project.id,
        queue: humanReviewQueue,
        decisions: currentHumanReviewDecisions
      }),
    [currentHumanReviewDecisions, humanReviewQueue, project.id]
  );
  const dataBoundaryReport = useMemo(
    () =>
      createDataBoundaryReport({
        project,
        evidenceItems: project.evidenceItems,
        counselQuestions: currentCounselQuestions,
        counselReviews: currentCounselReviews,
        aiEvents: currentAIEvents
      }),
    [currentAIEvents, currentCounselQuestions, currentCounselReviews, project]
  );
  const retentionPolicyReport = useMemo(
    () => createRetentionPolicyReport({ workspaceId: project.id, evidenceItems: project.evidenceItems }),
    [project.evidenceItems, project.id]
  );
  const securityReviewChecklist = useMemo(
    () =>
      createSecurityReviewChecklist({
        modelConnectReceipt,
        retentionPolicyReport,
        dataBoundaryReport,
        manifestHash: manifest?.bundleHash,
        evidenceCount: project.evidenceItems.length
      }),
    [dataBoundaryReport, manifest?.bundleHash, modelConnectReceipt, project.evidenceItems.length, retentionPolicyReport]
  );
  const integrationReadinessRegistry = useMemo(
    () =>
      createIntegrationReadinessRegistry({
        securityReviewChecklist,
        modelConnectReceipt,
        evidenceCount: project.evidenceItems.length,
        manifestHash: manifest?.bundleHash,
        remediationItemCount: audit.remediation.length,
        counselPackVersionCount: currentCounselPackVersions.length
      }),
    [
      audit.remediation.length,
      currentCounselPackVersions.length,
      manifest?.bundleHash,
      modelConnectReceipt,
      project.evidenceItems.length,
      securityReviewChecklist
    ]
  );
  const modelGatewayProviderPolicyReport = useMemo(
    () =>
      createModelGatewayProviderPolicyReport({
        adapters: defaultModelGatewayProviderAdapters,
        modelConnectReceipt
      }),
    [modelConnectReceipt]
  );
  const activeModelGatewayProviderPolicyReport = serverProviderPolicyReport ?? modelGatewayProviderPolicyReport;
  const modelGatewaySecretPolicyReport = useMemo(() => createModelGatewaySecretPolicyReport(secretPolicyDraft), [secretPolicyDraft]);
  const activeModelGatewaySecretPolicyReport = serverSecretPolicyReport ?? modelGatewaySecretPolicyReport;
  const objectStoragePolicyContext = useMemo<ObjectStoragePolicyContext>(
    () => ({
      workspaceId: project.id,
      evidenceCount: project.evidenceItems.length,
      retentionStatus: retentionPolicyReport.status,
      vaultSyncAllowed: retentionPolicyReport.vaultSyncAllowed,
      blockerCount: retentionPolicyReport.blockerCount,
      manifestHash: manifest?.bundleHash
    }),
    [
      manifest?.bundleHash,
      project.evidenceItems.length,
      project.id,
      retentionPolicyReport.blockerCount,
      retentionPolicyReport.status,
      retentionPolicyReport.vaultSyncAllowed
    ]
  );
  const objectStoragePolicyReport = useMemo(
    () => createObjectStoragePolicyReport({ context: objectStoragePolicyContext, policy: storagePolicyDraft }),
    [objectStoragePolicyContext, storagePolicyDraft]
  );
  const activeObjectStoragePolicyReport = serverStoragePolicyReport ?? objectStoragePolicyReport;
  const documentParserPolicyContext = useMemo<DocumentParserPolicyContext>(
    () => ({
      workspaceId: project.id,
      evidenceCount: project.evidenceItems.length,
      retentionStatus: retentionPolicyReport.status,
      vaultSyncAllowed: retentionPolicyReport.vaultSyncAllowed,
      blockerCount: retentionPolicyReport.blockerCount,
      exportBlockerCount: dataBoundaryReport.blockerCount,
      manifestHash: manifest?.bundleHash
    }),
    [
      dataBoundaryReport.blockerCount,
      manifest?.bundleHash,
      project.evidenceItems.length,
      project.id,
      retentionPolicyReport.blockerCount,
      retentionPolicyReport.status,
      retentionPolicyReport.vaultSyncAllowed
    ]
  );
  const documentParserPolicyReport = useMemo(
    () => createDocumentParserPolicyReport({ context: documentParserPolicyContext, policy: parserPolicyDraft }),
    [documentParserPolicyContext, parserPolicyDraft]
  );
  const activeDocumentParserPolicyReport = serverParserPolicyReport ?? documentParserPolicyReport;
  const chainAnchorPolicyContext = useMemo<ChainAnchorPolicyContext>(
    () => ({
      workspaceId: project.id,
      evidenceCount: project.evidenceItems.length,
      retentionStatus: retentionPolicyReport.status,
      vaultSyncAllowed: retentionPolicyReport.vaultSyncAllowed,
      blockerCount: retentionPolicyReport.blockerCount,
      exportBlockerCount: dataBoundaryReport.blockerCount,
      manifestHash: manifest?.bundleHash,
      counselPackVersionCount: currentCounselPackVersions.length,
      simulatedAnchorAvailable: Boolean(manifest?.bundleHash)
    }),
    [
      currentCounselPackVersions.length,
      dataBoundaryReport.blockerCount,
      manifest?.bundleHash,
      project.evidenceItems.length,
      project.id,
      retentionPolicyReport.blockerCount,
      retentionPolicyReport.status,
      retentionPolicyReport.vaultSyncAllowed
    ]
  );
  const chainAnchorPolicyReport = useMemo(
    () => createChainAnchorPolicyReport({ context: chainAnchorPolicyContext, policy: anchorPolicyDraft }),
    [anchorPolicyDraft, chainAnchorPolicyContext]
  );
  const activeChainAnchorPolicyReport = serverAnchorPolicyReport ?? chainAnchorPolicyReport;
  const grcTicketExportAdapterStatus =
    integrationReadinessRegistry.adapters.find((adapter) => adapter.id === "grc-ticket-export")?.status ?? "blocked";
  const grcDestinationPolicyContext = useMemo<GrcDestinationPolicyContext>(
    () => ({
      workspaceId: project.id,
      remediationItemCount: audit.remediation.length,
      exportSafetyStatus: dataBoundaryReport.status,
      exportBlockerCount: dataBoundaryReport.blockerCount,
      integrationAdapterStatus: grcTicketExportAdapterStatus,
      localTicketExportAvailable:
        grcTicketExportAdapterStatus === "ready" && audit.remediation.length > 0 && dataBoundaryReport.exportAllowed
    }),
    [
      audit.remediation.length,
      dataBoundaryReport.blockerCount,
      dataBoundaryReport.exportAllowed,
      dataBoundaryReport.status,
      grcTicketExportAdapterStatus,
      project.id
    ]
  );
  const grcDestinationPolicyReport = useMemo(
    () => createGrcDestinationPolicyReport({ context: grcDestinationPolicyContext, policy: grcDestinationPolicyDraft }),
    [grcDestinationPolicyContext, grcDestinationPolicyDraft]
  );
  const activeGrcDestinationPolicyReport = serverGrcDestinationPolicyReport ?? grcDestinationPolicyReport;
  useEffect(() => {
    let cancelled = false;

    createIntegrationEnablementDossier({
      registry: integrationReadinessRegistry,
      providerPolicyReport: activeModelGatewayProviderPolicyReport,
      secretPolicyReport: activeModelGatewaySecretPolicyReport,
      objectStoragePolicyReport: activeObjectStoragePolicyReport,
      documentParserPolicyReport: activeDocumentParserPolicyReport,
      chainAnchorPolicyReport: activeChainAnchorPolicyReport,
      grcDestinationPolicyReport: activeGrcDestinationPolicyReport
    }).then((dossier) => {
      if (!cancelled) {
        setIntegrationEnablementDossier(dossier);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeChainAnchorPolicyReport,
    activeDocumentParserPolicyReport,
    activeGrcDestinationPolicyReport,
    activeModelGatewayProviderPolicyReport,
    activeModelGatewaySecretPolicyReport,
    activeObjectStoragePolicyReport,
    integrationReadinessRegistry
  ]);
  const workspaceActionQueue = useMemo(
    () =>
      createWorkspaceActionQueue({
        validation,
        regulatoryGraph,
        sourceReview: regulatorySourceReview,
        humanReviewQueue,
        securityReviewChecklist,
        dataBoundaryReport,
        evidenceCount: project.evidenceItems.length,
        manifestHash: manifest?.bundleHash,
        counselPackVersionCount: currentCounselPackVersions.length,
        evidenceRecertificationQueue: evidenceRecertificationQueue ?? undefined
      }),
    [
      currentCounselPackVersions.length,
      dataBoundaryReport,
      evidenceRecertificationQueue,
      humanReviewQueue,
      manifest?.bundleHash,
      project.evidenceItems.length,
      regulatoryGraph,
      regulatorySourceReview,
      securityReviewChecklist,
      validation
    ]
  );
  const workspaceJourney = useMemo(
    () =>
      createWorkspaceJourney({
        validation,
        evidenceCount: project.evidenceItems.length,
        modelConnectStatus: modelConnectReceipt?.status ?? "not-configured",
        regulatoryTriggerCount: regulatoryGraph.matchedClauses.length,
        evidenceGapCount: regulatoryGraph.evidenceGaps.length,
        sourceReviewStatus: regulatorySourceReview.status,
        humanReviewSummary: humanReviewQueue.summary,
        manifestHash: manifest?.bundleHash,
        exportAllowed: dataBoundaryReport.exportAllowed,
        counselPackVersionCount: currentCounselPackVersions.length
      }),
    [
      currentCounselPackVersions.length,
      dataBoundaryReport.exportAllowed,
      humanReviewQueue.summary,
      manifest?.bundleHash,
      modelConnectReceipt?.status,
      project.evidenceItems.length,
      regulatoryGraph.evidenceGaps.length,
      regulatoryGraph.matchedClauses.length,
      regulatorySourceReview.status,
      validation
    ]
  );
  const workspaceCockpitBrief = useMemo(
    () =>
      createWorkspaceCockpitBrief({
        projectName: project.projectName,
        riskLevel: audit.riskLevel,
        riskScore: audit.score,
        evidenceCount: project.evidenceItems.length,
        humanReviewOpenCount: humanReviewQueue.summary.openCount,
        humanReviewBlockedCount: humanReviewQueue.summary.blockedCount,
        manifestHash: manifest?.bundleHash,
        exportAllowed: dataBoundaryReport.exportAllowed,
        counselPackVersionCount: currentCounselPackVersions.length,
        journey: workspaceJourney,
        actionQueue: workspaceActionQueue
      }),
    [
      audit.riskLevel,
      audit.score,
      currentCounselPackVersions.length,
      dataBoundaryReport.exportAllowed,
      humanReviewQueue.summary.blockedCount,
      humanReviewQueue.summary.openCount,
      manifest?.bundleHash,
      project.evidenceItems.length,
      project.projectName,
      workspaceActionQueue,
      workspaceJourney
    ]
  );
  const grcTicketExport = useMemo(
    () =>
      createGrcTicketExport({
        project,
        audit,
        integrationReadinessRegistry
      }),
    [audit, integrationReadinessRegistry, project]
  );
  const markdown = useMemo(
    () => {
      if (!manifest) {
        return "Evidence manifest is calculating. Not legal advice; counsel pack output is audit preparation material.";
      }

      const modelIntakeExport = modelIntakeSummary
        ? {
            profile: modelIntakeProfile,
            events: currentAIEvents,
            summary: modelIntakeSummary
          }
        : undefined;

      return buildMarkdownCounselPack(
        project,
        audit,
        manifest,
        currentCounselQuestions,
        currentCounselReviews,
        modelIntakeExport,
        regulatoryGraph,
        selectedCounselPackTemplate,
        dataBoundaryReport,
        regulatorySourceReview,
        regulatorySourceApprovalQueue,
        humanReviewTimeline,
        evidenceRecertificationQueue ?? undefined,
        localCounselRoutingPlan ?? undefined,
        sourceFreshnessBoard ?? undefined
      );
    },
    [
      audit,
      currentAIEvents,
      currentCounselQuestions,
      currentCounselReviews,
      dataBoundaryReport,
      evidenceRecertificationQueue,
      humanReviewTimeline,
      localCounselRoutingPlan,
      manifest,
      modelIntakeProfile,
      modelIntakeSummary,
      project,
      regulatoryGraph,
      regulatorySourceApprovalQueue,
      regulatorySourceReview,
      selectedCounselPackTemplate,
      sourceFreshnessBoard
    ]
  );

  useEffect(() => {
    setSelectedCounselPackTemplateId(recommendedCounselPackTemplate.id);
  }, [project.id, recommendedCounselPackTemplate.id]);

  useEffect(() => {
    setSourceApprovalSyncResult(null);
    setSourceApprovalSyncStatus("idle");
    setSourceApprovalSyncError("");
    setSourceApprovalSyncRecoveryAction("");
  }, [project.id, regulatorySourceApprovalQueue.totalItemCount]);

  useEffect(() => {
    let live = true;
    setManifest(null);
    createEvidenceManifest(project, audit, project.evidenceItems).then((nextManifest) => {
      if (live) {
        setManifest(nextManifest);
      }
    });
    return () => {
      live = false;
    };
  }, [audit, project]);

  useEffect(() => {
    let live = true;
    setEvidenceRecertificationQueue(null);
    createEvidenceRecertificationQueue({
      workspaceId: project.id,
      evidenceItems: project.evidenceItems
    }).then((nextQueue) => {
      if (live) {
        setEvidenceRecertificationQueue(nextQueue);
      }
    });
    return () => {
      live = false;
    };
  }, [project.evidenceItems, project.id]);

  useEffect(() => {
    let live = true;
    setLocalCounselRoutingPlan(null);
    createLocalCounselRoutingPlan({
      graph: regulatoryGraph,
      sourceReview: regulatorySourceReview
    }).then((nextPlan) => {
      if (live) {
        setLocalCounselRoutingPlan(nextPlan);
      }
    });
    return () => {
      live = false;
    };
  }, [regulatoryGraph, regulatorySourceReview]);

  useEffect(() => {
    let live = true;
    setRegulatorySourcePack(null);
    createRegulatorySourcePack({ graph: regulatoryGraph, sourceReview: regulatorySourceReview }).then((nextPack) => {
      if (live) {
        setRegulatorySourcePack(nextPack);
      }
    });
    return () => {
      live = false;
    };
  }, [regulatoryGraph, regulatorySourceReview]);

  useEffect(() => {
    let live = true;
    setRegulatorySourceReviewPacket(null);
    createRegulatorySourceReviewPacket({
      projectId: project.id,
      projectName: project.projectName,
      sourceReview: regulatorySourceReview
    }).then((nextPacket) => {
      if (live) {
        setRegulatorySourceReviewPacket(nextPacket);
      }
    });
    return () => {
      live = false;
    };
  }, [project.id, project.projectName, regulatorySourceReview]);

  useEffect(() => {
    let live = true;
    setSubmissionPack(null);

    if (!manifest || !regulatorySourcePack) {
      return () => {
        live = false;
      };
    }

    createSubmissionPack({
      project,
      audit,
      fit,
      manifest,
      regulatorySourcePack,
      demoReadinessReport,
      demoRunbookSummary,
      dataBoundaryReport,
      counselPackVersionCount: currentCounselPackVersions.length,
      serverExportRecordCount: currentCounselPackServerExports.length,
      modelConnectStatus: submissionModelConnectStatus
    }).then((nextPack) => {
      if (live) {
        setSubmissionPack(nextPack);
      }
    });

    return () => {
      live = false;
    };
  }, [
    audit,
    currentCounselPackServerExports.length,
    currentCounselPackVersions.length,
    dataBoundaryReport,
    demoReadinessReport,
    demoRunbookSummary,
    fit,
    manifest,
    project,
    regulatorySourcePack,
    submissionModelConnectStatus
  ]);

  const exportSafetyArtifacts = useMemo<ExportSafetyArtifactInput[]>(() => {
    const latestCounselPackVersion = currentCounselPackVersions[0];

    return [
      {
        id: "evidence-manifest",
        label: "Evidence Manifest JSON",
        category: "evidence",
        exportMode: "metadata-only-json",
        required: true,
        available: Boolean(manifest?.bundleHash),
        artifactHash: manifest?.bundleHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Add metadata-only evidence and wait for the Evidence Manifest bundle hash.",
        notLegalAdviceBoundary: "Not legal advice. Evidence manifests are audit preparation hash metadata only."
      },
      {
        id: "regulatory-source-pack",
        label: "Regulatory Source Pack JSON",
        category: "source-lineage",
        exportMode: "metadata-only-json",
        required: true,
        available: Boolean(regulatorySourcePack?.packHash),
        artifactHash: regulatorySourcePack?.packHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Open Counsel Pack or Sources after the source graph and source pack finish calculating.",
        notLegalAdviceBoundary: "Not legal advice. Regulatory source packs are audit preparation source-lineage metadata only."
      },
      {
        id: "counsel-pack-markdown",
        label: "Counsel Pack Markdown/PDF",
        category: "counsel-export",
        exportMode: "audit-prep-markdown",
        required: true,
        available: Boolean(manifest?.bundleHash),
        artifactHash: latestCounselPackVersion?.markdownHash,
        metadataOnly: true,
        rawContentIncluded: false,
        warnings: latestCounselPackVersion ? [] : ["Save a Counsel Pack version to lock the Markdown hash before external handoff."],
        recoveryAction: "Clear Export Safety Gate blockers, open Counsel Pack, and save a Pack Version before external handoff.",
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack Markdown is audit preparation material only."
      },
      {
        id: "counsel-pack-version",
        label: "Counsel Pack Version JSON",
        category: "counsel-export",
        exportMode: "metadata-only-json",
        required: true,
        available: Boolean(latestCounselPackVersion),
        artifactHash: latestCounselPackVersion?.markdownHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Save a Counsel Pack version to capture manifest, Markdown, source-pack, and review-status hashes.",
        notLegalAdviceBoundary: "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
      },
      {
        id: "source-review-packet",
        label: "Source Review Packet JSON",
        category: "source-lineage",
        exportMode: "metadata-only-json",
        required: false,
        available: Boolean(regulatorySourceReviewPacket?.packetHash),
        artifactHash: regulatorySourceReviewPacket?.packetHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Use the command center Source Review Packet export when source refresh actions need handoff.",
        notLegalAdviceBoundary: "Not legal advice. Source review packets are audit preparation source-lineage metadata only."
      },
      createSourceFreshnessBoardExportArtifact(sourceFreshnessBoard),
      {
        id: "local-counsel-routing",
        label: "Local Counsel Routing JSON",
        category: "review-workflow",
        exportMode: "metadata-only-json",
        required: false,
        available: Boolean(localCounselRoutingPlan?.planHash),
        artifactHash: localCounselRoutingPlan?.planHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Use the command center Local Counsel Routing export for jurisdiction and counsel-role handoff.",
        notLegalAdviceBoundary: "Not legal advice. Local counsel routing plans are audit preparation workflow metadata only."
      },
      {
        id: "grc-ticket-export",
        label: "GRC Ticket Export JSON",
        category: "review-workflow",
        exportMode: "metadata-only-json",
        required: false,
        available: grcTicketExport.exportAllowed,
        metadataOnly: true,
        rawContentIncluded: false,
        blockers: grcTicketExport.exportAllowed ? [] : grcTicketExport.blockers,
        recoveryAction: "Resolve GRC adapter readiness and Export Safety Gate blockers before ticket export.",
        notLegalAdviceBoundary: grcTicketExport.notLegalAdviceBoundary
      },
      {
        id: "integration-enablement-dossier",
        label: "Integration Enablement Dossier JSON",
        category: "integration-readiness",
        exportMode: "metadata-only-json",
        required: false,
        available: Boolean(integrationEnablementDossier?.dossierHash),
        artifactHash: integrationEnablementDossier?.dossierHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Open Integration Readiness and wait for the enablement dossier hash.",
        notLegalAdviceBoundary:
          integrationEnablementDossier?.notLegalAdviceBoundary ??
          "Not legal advice. Integration enablement dossiers are audit preparation metadata only."
      },
      createDemoRunbookExportArtifact(demoRunbookSummary),
      {
        id: "submission-pack",
        label: "Submission Pack JSON",
        category: "submission",
        exportMode: "metadata-only-json",
        required: true,
        available: Boolean(submissionPack?.packHash),
        artifactHash: submissionPack?.packHash,
        metadataOnly: true,
        rawContentIncluded: false,
        recoveryAction: "Open Sources after manifest and Regulatory Source Pack calculation completes.",
        notLegalAdviceBoundary:
          submissionPack?.notLegalAdviceBoundary ??
          "Not legal advice. Submission packs are audit preparation artifacts for hackathon judging and counsel handoff only."
      }
    ];
  }, [
    currentCounselPackVersions,
    demoRunbookSummary,
    grcTicketExport,
    integrationEnablementDossier,
    localCounselRoutingPlan,
    manifest?.bundleHash,
    regulatorySourcePack,
    regulatorySourceReviewPacket,
    sourceFreshnessBoard,
    submissionPack
  ]);

  useEffect(() => {
    let live = true;

    createExportSafetyInventory({
      workspaceId: project.id,
      projectName: project.projectName,
      dataBoundaryReport,
      artifacts: exportSafetyArtifacts
    }).then((nextInventory) => {
      if (live) {
        setExportSafetyInventory(nextInventory);
      }
    });

    return () => {
      live = false;
    };
  }, [dataBoundaryReport, exportSafetyArtifacts, project.id, project.projectName]);

  useEffect(() => {
    let live = true;

    if (activeTab !== "sources" || !submissionPack || !demoRunbook || !exportSafetyInventory) {
      setJudgeHandoffBundle(null);
      return () => {
        live = false;
      };
    }

    createJudgeHandoffBundle({
      projectName: project.projectName,
      submissionPack,
      demoRunbook,
      exportSafetyInventory
    }).then((nextBundle) => {
      if (live) {
        setJudgeHandoffBundle(nextBundle);
      }
    });

    return () => {
      live = false;
    };
  }, [activeTab, demoRunbook, exportSafetyInventory, project.projectName, submissionPack]);

  useEffect(() => {
    let live = true;

    createCounselHandoffChecklist({
      projectId: project.id,
      projectName: project.projectName,
      manifestHash: manifest?.bundleHash,
      regulatorySourcePackHash: regulatorySourcePack?.packHash,
      submissionPackHash: submissionPack?.packHash,
      exportSafetyInventory,
      counselReviews: currentCounselReviews,
      counselPackVersions: currentCounselPackVersions,
      serverExportRecords: currentCounselPackServerExports
    }).then((nextChecklist) => {
      if (live) {
        setCounselHandoffChecklist(nextChecklist);
      }
    });

    return () => {
      live = false;
    };
  }, [
    currentCounselPackServerExports,
    currentCounselPackVersions,
    currentCounselReviews,
    exportSafetyInventory,
    manifest?.bundleHash,
    project.id,
    project.projectName,
    regulatorySourcePack?.packHash,
    submissionPack?.packHash
  ]);

  useEffect(() => {
    let live = true;
    setModelIntakeSummary(null);
    buildModelIntakeSummary(modelIntakeProfile, currentAIEvents).then((nextSummary) => {
      if (live) {
        setModelIntakeSummary(nextSummary);
      }
    });
    return () => {
      live = false;
    };
  }, [currentAIEvents, modelIntakeProfile]);

  useEffect(() => {
    if (validation.valid) {
      safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project, validation.valid]);

  useEffect(() => {
    const { apiKey: _apiKey, ...nonSecretSettings } = modelSettings;
    safeStorage()?.setItem(MODEL_SETTINGS_KEY, JSON.stringify(nonSecretSettings));
  }, [modelSettings]);

  useEffect(() => {
    safeStorage()?.setItem(MODEL_REVIEW_RUNS_KEY, JSON.stringify(aiReviewRuns.slice(0, 20)));
  }, [aiReviewRuns]);

  useEffect(() => {
    safeStorage()?.setItem(MODEL_INTAKE_PROFILE_KEY, JSON.stringify(modelIntakeProfile));
  }, [modelIntakeProfile]);

  useEffect(() => {
    safeStorage()?.setItem(MODEL_INTAKE_EVENTS_KEY, JSON.stringify(aiEvents.slice(0, 80)));
  }, [aiEvents]);

  useEffect(() => {
    setCounselQuestions((current) => mergeQuestionsForProject(current, project.id, createDefaultCounselQuestions(project, audit)));
  }, [audit, project]);

  useEffect(() => {
    setCounselReviews((current) =>
      mergeReviewsForProject(current, project.id, createDefaultCounselReviewItems(project, audit, riskEvidenceCoverage))
    );
  }, [audit, project, riskEvidenceCoverage]);

  useEffect(() => {
    safeStorage()?.setItem(COUNSEL_QUESTIONS_KEY, JSON.stringify(counselQuestions.slice(0, 80)));
  }, [counselQuestions]);

  useEffect(() => {
    safeStorage()?.setItem(COUNSEL_REVIEWS_KEY, JSON.stringify(counselReviews.slice(0, 80)));
  }, [counselReviews]);

  useEffect(() => {
    safeStorage()?.setItem(COUNSEL_PACK_VERSIONS_KEY, JSON.stringify(counselPackVersions.slice(0, 120)));
  }, [counselPackVersions]);

  useEffect(() => {
    safeStorage()?.setItem(COUNSEL_PACK_SERVER_EXPORTS_KEY, JSON.stringify(counselPackServerExports.slice(0, 120)));
  }, [counselPackServerExports]);

  useEffect(() => {
    safeStorage()?.setItem(EVIDENCE_AUDIT_TRAIL_KEY, JSON.stringify(evidenceAuditEvents.slice(0, 120)));
  }, [evidenceAuditEvents]);

  useEffect(() => {
    safeStorage()?.setItem(HUMAN_REVIEW_DECISIONS_KEY, JSON.stringify(humanReviewDecisions.slice(0, 120)));
  }, [humanReviewDecisions]);

  const updateProject = (nextProject: ProjectProfile) => {
    setProject({ ...nextProject, updatedAt: new Date().toISOString() });
  };

  const resetModelConnectContext = () => {
    setModelConnectReceipt(null);
    setServerProviderPolicyReport(null);
    setProviderPolicySyncStatus("idle");
    setProviderPolicySyncError("");
    setProviderPolicySyncRecoveryAction("");
  };

  const updateSecretPolicyDraft = (updates: Partial<ModelGatewaySecretPolicyDraft>) => {
    setSecretPolicyDraft((current) => ({ ...current, ...updates }));
    setServerSecretPolicyReport(null);
    setSecretPolicySyncStatus("idle");
    setSecretPolicySyncError("");
    setSecretPolicySyncRecoveryAction("");
  };

  const updateModelSettings = (settings: ModelSettings) => {
    setModelSettings(settings);
    resetModelConnectContext();
  };

  const loadSample = (projectName: string) => {
    const profile = sampleProfiles.find((item) => item.projectName === projectName);
    if (!profile) {
      return;
    }
    setProject(projectFromAuditProfile(profile));
    setShowValidation(false);
    setSavedAt("");
    resetModelConnectContext();
    setActiveTab("wizard");
  };

  const loadDemoScenario = (scenarioId: string) => {
    const scenario = findDemoScenarioById(demoScenarios, scenarioId);
    const profile = scenario ? sampleProfiles.find((item) => item.projectName === scenario.projectName) : undefined;
    if (!scenario || !profile || !demoScenarioValidation.valid) {
      return;
    }

    setProject(projectFromAuditProfile(profile));
    setShowValidation(false);
    setSavedAt("");
    resetModelConnectContext();
    setActiveTab(scenario.recommendedStartTab);
  };

  const newProject = () => {
    setProject(createBlankProject());
    setShowValidation(false);
    setSavedAt("");
    resetModelConnectContext();
    setActiveTab("wizard");
  };

  const saveWorkspace = () => {
    setShowValidation(true);
    if (!validation.valid) {
      return;
    }
    safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(project));
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const addEvidence = (item: EvidenceItem) => {
    const now = new Date().toISOString();
    const nextItem = {
      ...item,
      id: createLocalId("evidence"),
      kind: item.kind.trim() || "Note",
      label: item.label.trim(),
      content: item.content.trim(),
      addedAt: now,
      updatedAt: now
    };

    setProject((current) => ({
      ...current,
      evidenceItems: [...current.evidenceItems, nextItem],
      updatedAt: now
    }));
    setEvidenceAuditEvents((current) => [
      createEvidenceCreatedEvent(project.id, nextItem, nextItem.owner ?? "Founder", now),
      ...current
    ].slice(0, 120));
  };

  const updateEvidence = (index: number, updates: Partial<EvidenceItem>) => {
    const now = new Date().toISOString();
    const previous = project.evidenceItems[index];
    const next = previous ? { ...previous, ...updates, updatedAt: now } : null;

    setProject((current) => ({
      ...current,
      evidenceItems: current.evidenceItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates, updatedAt: now } : item
      ),
      updatedAt: now
    }));

    if (previous && next) {
      const event = createEvidenceUpdateEvent(project.id, previous, next, next.owner ?? previous.owner ?? "Founder", now);
      if (event) {
        setEvidenceAuditEvents((current) => [event, ...current].slice(0, 120));
      }
    }
  };

  const applyEvidenceTemplate = (templateId: string) => {
    const now = new Date().toISOString();
    const items = createEvidenceItemsFromTemplate(templateId).map((item, index) => ({
      ...item,
      id: createLocalId(`template-${index + 1}`),
      addedAt: now,
      updatedAt: now
    }));

    setProject((current) => ({
      ...current,
      evidenceItems: [...current.evidenceItems, ...items],
      updatedAt: now
    }));
    setEvidenceAuditEvents((current) => [
      ...items.map((item) => createEvidenceCreatedEvent(project.id, item, "System", now, "template-applied")),
      ...current
    ].slice(0, 120));
  };

  const removeEvidence = (index: number) => {
    const now = new Date().toISOString();
    const removed = project.evidenceItems[index];

    setProject((current) => ({
      ...current,
      evidenceItems: current.evidenceItems.filter((_, itemIndex) => itemIndex !== index),
      updatedAt: now
    }));

    if (removed) {
      setEvidenceAuditEvents((current) => [
        createEvidenceRemovedEvent(project.id, removed, removed.owner ?? "Founder", now),
        ...current
      ].slice(0, 120));
    }
  };

  const handleRunAIReview = async () => {
    setAIReviewError("");
    setAIReviewErrorRecoveryAction("");
    setAIReviewErrorBoundary("");
    const redactionReport = createRedactionReport(project.evidenceItems);
    if (redactionReport.status === "blocked") {
      setAIReviewStatus("error");
      setAIReviewError("Redaction Gate blocked this model call. Remove secrets or raw private-key material before running review.");
      return;
    }

    if (!modelSettingsValidation.valid) {
      setAIReviewStatus("error");
      setAIReviewError(modelSettingsValidation.errors.join(" "));
      return;
    }

    if (modelSettings.provider !== "mock" && modelConnectReceipt?.status !== "ready") {
      setAIReviewStatus("error");
      setAIReviewError("Validate Model Connect before running a session model.");
      return;
    }

    setAIReviewStatus("running");
    try {
      const provider =
        modelSettings.provider === "mock" ? createMockModelProvider() : createOpenAICompatibleModelProvider(modelSettings);
      const { result, run } = await runAIReviewWithLedger(project, audit, project.evidenceItems, provider, {
        model: modelSettings.model,
        redactionStatus: redactionReport.status
      });
      setAIReview(result);
      setCounselQuestions((current) => mergeQuestionsForProject(current, project.id, createQuestionsFromAIReview(project, result), true));
      setAIReviewRuns((current) => [run, ...current].slice(0, 20));
      setAIEvents((current) => [
        createAIReviewEventFromRun(run, result, modelIntakeProfile.humanReviewOwner),
        ...current.filter((event) => event.sourceRunId !== run.runId)
      ].slice(0, 80));
      setAIReviewStatus("complete");
    } catch (error) {
      setAIReviewStatus("error");
      if (error instanceof ModelProviderClientError) {
        setAIReviewError(error.message);
        setAIReviewErrorRecoveryAction(error.recoveryAction);
        setAIReviewErrorBoundary(error.notLegalAdviceBoundary);
        return;
      }
      setAIReviewError(error instanceof Error ? error.message : "Model review failed.");
    }
  };

  const handleValidateModelConnect = () => {
    const receipt = createModelConnectReceipt({
      settings: modelSettings,
      settingsValidation: modelSettingsValidation,
      redactionStatus: createRedactionReport(project.evidenceItems).status
    });
    setModelConnectReceipt(receipt);
    setServerProviderPolicyReport(null);
    setProviderPolicySyncStatus("idle");
    setProviderPolicySyncError("");
    setProviderPolicySyncRecoveryAction("");

    if (receipt.status === "ready") {
      setModelIntakeProfile((current) => ({
        ...current,
        providerName: receipt.providerLabel,
        modelName: receipt.model || current.modelName,
        endpointType: modelSettings.provider,
        useCase: current.useCase || "Evidence extraction and draft counsel questions",
        dataClasses: current.dataClasses.length > 0 ? current.dataClasses : ["evidence summaries", "policy metadata"],
        humanReviewOwner: current.humanReviewOwner || "Compliance"
      }));
    }
  };

  const addCounselQuestion = () => {
    setCounselQuestions((current) => [...current, createManualCounselQuestion(project)]);
  };

  const updateCounselQuestion = (id: string, updates: Partial<CounselQuestion>) => {
    setCounselQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...updates } : question))
    );
  };

  const removeCounselQuestion = (id: string) => {
    setCounselQuestions((current) => current.filter((question) => question.id !== id));
  };

  const updateCounselReview = (id: string, updates: Partial<CounselReviewItem>) => {
    setCounselReviews((current) =>
      current.map((review) => (review.id === id ? { ...review, ...updates, updatedAt: new Date().toISOString() } : review))
    );
  };

  const saveCounselPackVersion = async () => {
    if (!manifest) {
      throw new Error("Evidence manifest is still calculating.");
    }
    if (!regulatorySourcePack) {
      throw new Error("Regulatory Source Pack is still calculating.");
    }
    if (!dataBoundaryReport.exportAllowed) {
      throw new Error("Export Safety Gate blocked this Counsel Pack. Remove blocked materials before saving a version.");
    }

    const record = await createCounselPackVersionRecord({
      project,
      audit,
      manifest,
      regulatorySourcePack,
      markdown,
      counselReviews: currentCounselReviews,
      previousVersions: currentCounselPackVersions
    });

    setCounselPackVersions((current) => [record, ...current].slice(0, 120));
  };

  const createServerExportRecord = async (apiBaseUrl: string) => {
    if (!dataBoundaryReport.exportAllowed) {
      throw new Error("Export Safety Gate blocked this Counsel Pack. Remove blocked materials before server export.");
    }

    const latestVersion = currentCounselPackVersions[0];
    if (!latestVersion) {
      throw new Error("Save a Counsel Pack version before creating a server export record.");
    }

    const record = await createServerCounselPackExportRecord({
      workspaceId: project.id,
      versionRecord: latestVersion,
      createdBy: modelIntakeProfile.humanReviewOwner || "Compliance",
      apiBaseUrl
    });

    setCounselPackServerExports((current) => [record, ...current].slice(0, 120));
  };

  const refreshProviderPolicyReport = async () => {
    setProviderPolicySyncStatus("syncing");
    setProviderPolicySyncError("");
    setProviderPolicySyncRecoveryAction("");

    try {
      const report = await fetchModelGatewayProviderPolicy({
        apiBaseUrl: providerPolicyApiBaseUrl,
        modelConnectReceipt
      });
      setServerProviderPolicyReport(report);
      setProviderPolicySyncStatus("synced");
    } catch (error) {
      setProviderPolicySyncStatus("error");
      if (error instanceof ModelGatewayProviderPolicyClientError) {
        setProviderPolicySyncError(error.message);
        setProviderPolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setProviderPolicySyncError(error instanceof Error ? error.message : "Provider policy refresh failed.");
      setProviderPolicySyncRecoveryAction("Start the Phase 2 API and retry provider policy refresh.");
    }
  };

  const evaluateSecretPolicyReport = async () => {
    setSecretPolicySyncStatus("syncing");
    setSecretPolicySyncError("");
    setSecretPolicySyncRecoveryAction("");

    try {
      const report = await fetchModelGatewaySecretPolicyReport({
        apiBaseUrl: providerPolicyApiBaseUrl,
        policy: secretPolicyDraft
      });
      setServerSecretPolicyReport(report);
      setSecretPolicySyncStatus("synced");
    } catch (error) {
      setSecretPolicySyncStatus("error");
      if (error instanceof ModelGatewaySecretPolicyClientError) {
        setSecretPolicySyncError(error.message);
        setSecretPolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setSecretPolicySyncError(error instanceof Error ? error.message : "Secret policy evaluation failed.");
      setSecretPolicySyncRecoveryAction("Start the Phase 2 API and retry secret policy evaluation.");
    }
  };

  const updateStoragePolicyDraft = (updates: Partial<ObjectStoragePolicyDraft>) => {
    setStoragePolicyDraft((current) => ({ ...current, ...updates }));
    setServerStoragePolicyReport(null);
    setStoragePolicySyncStatus("idle");
    setStoragePolicySyncError("");
    setStoragePolicySyncRecoveryAction("");
  };

  const evaluateStoragePolicyReport = async () => {
    setStoragePolicySyncStatus("syncing");
    setStoragePolicySyncError("");
    setStoragePolicySyncRecoveryAction("");

    try {
      const report = await fetchObjectStoragePolicyReport({
        apiBaseUrl: storagePolicyApiBaseUrl,
        context: objectStoragePolicyContext,
        policy: storagePolicyDraft
      });
      setServerStoragePolicyReport(report);
      setStoragePolicySyncStatus("synced");
    } catch (error) {
      setStoragePolicySyncStatus("error");
      if (error instanceof ObjectStoragePolicyClientError) {
        setStoragePolicySyncError(error.message);
        setStoragePolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setStoragePolicySyncError(error instanceof Error ? error.message : "Object storage policy evaluation failed.");
      setStoragePolicySyncRecoveryAction("Start the Phase 2 API and retry object storage policy evaluation.");
    }
  };

  const updateParserPolicyDraft = (updates: Partial<DocumentParserPolicyDraft>) => {
    setParserPolicyDraft((current) => ({ ...current, ...updates }));
    setServerParserPolicyReport(null);
    setParserPolicySyncStatus("idle");
    setParserPolicySyncError("");
    setParserPolicySyncRecoveryAction("");
  };

  const evaluateParserPolicyReport = async () => {
    setParserPolicySyncStatus("syncing");
    setParserPolicySyncError("");
    setParserPolicySyncRecoveryAction("");

    try {
      const report = await fetchDocumentParserPolicyReport({
        apiBaseUrl: parserPolicyApiBaseUrl,
        context: documentParserPolicyContext,
        policy: parserPolicyDraft
      });
      setServerParserPolicyReport(report);
      setParserPolicySyncStatus("synced");
    } catch (error) {
      setParserPolicySyncStatus("error");
      if (error instanceof DocumentParserPolicyClientError) {
        setParserPolicySyncError(error.message);
        setParserPolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setParserPolicySyncError(error instanceof Error ? error.message : "Document parser policy evaluation failed.");
      setParserPolicySyncRecoveryAction("Start the Phase 2 API and retry document parser policy evaluation.");
    }
  };

  const updateAnchorPolicyDraft = (updates: Partial<ChainAnchorPolicyDraft>) => {
    setAnchorPolicyDraft((current) => ({ ...current, ...updates }));
    setServerAnchorPolicyReport(null);
    setAnchorPolicySyncStatus("idle");
    setAnchorPolicySyncError("");
    setAnchorPolicySyncRecoveryAction("");
  };

  const evaluateAnchorPolicyReport = async () => {
    setAnchorPolicySyncStatus("syncing");
    setAnchorPolicySyncError("");
    setAnchorPolicySyncRecoveryAction("");

    try {
      const report = await fetchChainAnchorPolicyReport({
        apiBaseUrl: anchorPolicyApiBaseUrl,
        context: chainAnchorPolicyContext,
        policy: anchorPolicyDraft
      });
      setServerAnchorPolicyReport(report);
      setAnchorPolicySyncStatus("synced");
    } catch (error) {
      setAnchorPolicySyncStatus("error");
      if (error instanceof ChainAnchorPolicyClientError) {
        setAnchorPolicySyncError(error.message);
        setAnchorPolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setAnchorPolicySyncError(error instanceof Error ? error.message : "Chain anchor policy evaluation failed.");
      setAnchorPolicySyncRecoveryAction("Start the Phase 2 API and retry chain anchor policy evaluation.");
    }
  };

  const updateGrcDestinationPolicyDraft = (updates: Partial<GrcDestinationPolicyDraft>) => {
    setGrcDestinationPolicyDraft((current) => ({ ...current, ...updates }));
    setServerGrcDestinationPolicyReport(null);
    setGrcDestinationPolicySyncStatus("idle");
    setGrcDestinationPolicySyncError("");
    setGrcDestinationPolicySyncRecoveryAction("");
  };

  const evaluateGrcDestinationPolicyReport = async () => {
    setGrcDestinationPolicySyncStatus("syncing");
    setGrcDestinationPolicySyncError("");
    setGrcDestinationPolicySyncRecoveryAction("");

    try {
      const report = await fetchGrcDestinationPolicyReport({
        apiBaseUrl: grcDestinationPolicyApiBaseUrl,
        context: grcDestinationPolicyContext,
        policy: grcDestinationPolicyDraft
      });
      setServerGrcDestinationPolicyReport(report);
      setGrcDestinationPolicySyncStatus("synced");
    } catch (error) {
      setGrcDestinationPolicySyncStatus("error");
      if (error instanceof GrcDestinationPolicyClientError) {
        setGrcDestinationPolicySyncError(error.message);
        setGrcDestinationPolicySyncRecoveryAction(error.recoveryAction);
        return;
      }
      setGrcDestinationPolicySyncError(error instanceof Error ? error.message : "GRC destination policy evaluation failed.");
      setGrcDestinationPolicySyncRecoveryAction("Start the Phase 2 API and retry GRC destination policy evaluation.");
    }
  };

  const syncSourceApprovalQueue = async () => {
    setSourceApprovalSyncStatus("syncing");
    setSourceApprovalSyncError("");
    setSourceApprovalSyncRecoveryAction("");

    try {
      const result = await syncRegulatorySourceApprovalQueue({
        apiBaseUrl: sourceApprovalApiBaseUrl,
        workspaceId: project.id,
        queue: regulatorySourceApprovalQueue,
        createdBy: modelIntakeProfile.humanReviewOwner || "Compliance"
      });
      setSourceApprovalSyncResult(result);
      setSourceApprovalSyncStatus("synced");
    } catch (error) {
      setSourceApprovalSyncStatus("error");
      if (error instanceof RegulatorySourceApprovalClientError) {
        setSourceApprovalSyncError(error.message);
        setSourceApprovalSyncRecoveryAction(error.recoveryAction);
        return;
      }
      setSourceApprovalSyncError(error instanceof Error ? error.message : "Source approval sync failed.");
      setSourceApprovalSyncRecoveryAction("Start the Phase 2 API and retry source approval sync.");
    }
  };

  const syncSourceReviewLedger = async () => {
    setSourceReviewSyncStatus("syncing");
    setSourceReviewSyncError("");
    setSourceReviewSyncRecoveryAction("");

    try {
      const result = await syncRegulatorySourceReviewLedger({
        apiBaseUrl: sourceReviewApiBaseUrl,
        workspaceId: project.id,
        sourceReview: regulatorySourceReview,
        createdBy: modelIntakeProfile.humanReviewOwner || "Compliance"
      });
      setSourceReviewSyncResult(result);
      setSourceReviewSyncStatus("synced");
    } catch (error) {
      setSourceReviewSyncStatus("error");
      if (error instanceof RegulatorySourceReviewClientError) {
        setSourceReviewSyncError(error.message);
        setSourceReviewSyncRecoveryAction(error.recoveryAction);
        return;
      }
      setSourceReviewSyncError(error instanceof Error ? error.message : "Source review sync failed.");
      setSourceReviewSyncRecoveryAction("Start the Phase 2 API and retry source review sync.");
    }
  };

  const addAIEvent = (event: AIEventRecord) => {
    setAIEvents((current) => [sanitizeAIEventRecord(event), ...current].slice(0, 80));
  };

  const updateAIEvent = (id: string, updates: Partial<Pick<AIEventRecord, "humanReviewer" | "reviewStatus">>) => {
    setAIEvents((current) => current.map((event) => (event.id === id ? applyAIEventReviewUpdate(event, updates) : event)));
  };

  const saveHumanReviewDecision = (item: HumanReviewQueueItem, update: HumanReviewDecisionUpdate) => {
    const decision = createHumanReviewDecision(item, update);
    setHumanReviewDecisions((current) => [decision, ...current].slice(0, 120));

    if (item.targetType === "ai-event") {
      updateAIEvent(item.targetId, {
        reviewStatus: humanReviewStatusToAIEventStatus(decision.status),
        humanReviewer: decision.reviewer
      });
      return;
    }

    if (item.targetType === "risk-flag") {
      updateCounselReview(item.sourceId, {
        status: humanReviewStatusToCounselReviewStatus(decision.status),
        reviewer: decision.reviewer,
        reviewerNote: decision.decisionNote
      });
      return;
    }

    if (item.targetType === "clause-match") {
      return;
    }

    const evidenceIndex = project.evidenceItems.findIndex((evidenceItem, index) => (evidenceItem.id ?? `evidence-${index + 1}`) === item.targetId);
    if (evidenceIndex >= 0) {
      updateEvidence(evidenceIndex, {
        status: humanReviewStatusToEvidenceStatus(decision.status)
      });
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BLI Legal Tech Hackathon 2 MVP</p>
          <h1>LexProof AuditOS</h1>
          <p className="lead">
            A local-first audit workspace that turns Web3 launch facts into review-ready risk triage, evidence manifests, and
            counsel pack exports. Not legal advice.
          </p>
        </div>
        <div className="target-card" aria-label="Hackathon target">
          <Scale size={22} aria-hidden="true" />
          <div>
            <strong>BLI Legal Tech Hackathon 2</strong>
            <span>50k+ support | virtual | deadline Nov 1, 2026</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <ProjectWorkspace
          project={project}
          sampleProfiles={sampleProfiles}
          demoScenarios={demoScenarioValidation.valid ? demoScenarios : []}
          demoScenarioValidation={demoScenarioValidation}
          demoScreenshotRefs={demoReadinessScreenshotRefs}
          demoApiPreflight={demoApiPreflight}
          fit={fit}
          validation={validation}
          showValidation={showValidation}
          savedAt={savedAt}
          onProjectChange={updateProject}
          onLoadSample={loadSample}
          onLoadDemoScenario={loadDemoScenario}
          onDemoApiPreflightChange={setDemoApiPreflight}
          onNewProject={newProject}
          onSave={saveWorkspace}
        />

        <section className="main-stage">
          <RegulatoryCommandCenter
            project={project}
            audit={audit}
            graph={regulatoryGraph}
            sourceReview={regulatorySourceReview}
            sourceReviewApiBaseUrl={sourceReviewApiBaseUrl}
            sourceReviewSyncResult={sourceReviewSyncResult}
            sourceReviewSyncStatus={sourceReviewSyncStatus}
            sourceReviewSyncError={sourceReviewSyncError}
            sourceReviewSyncRecoveryAction={sourceReviewSyncRecoveryAction}
            sourceApprovalQueue={regulatorySourceApprovalQueue}
            sourceApprovalApiBaseUrl={sourceApprovalApiBaseUrl}
            sourceApprovalSyncResult={sourceApprovalSyncResult}
            sourceApprovalSyncStatus={sourceApprovalSyncStatus}
            sourceApprovalSyncError={sourceApprovalSyncError}
            sourceApprovalSyncRecoveryAction={sourceApprovalSyncRecoveryAction}
            controlMatrix={regulatoryControlMatrix}
            jurisdictionEvidenceMap={jurisdictionEvidenceMap}
            jurisdictionReadinessDigest={jurisdictionReadinessDigest}
            sourceFreshnessBoard={sourceFreshnessBoard}
            localCounselRoutingPlan={localCounselRoutingPlan}
            actionQueue={workspaceActionQueue}
            cockpitBrief={workspaceCockpitBrief}
            journey={workspaceJourney}
            sourceReviewPacket={regulatorySourceReviewPacket}
            manifestHash={manifest?.bundleHash}
            onSourceReviewApiBaseUrlChange={setSourceReviewApiBaseUrl}
            onSyncSourceReviewLedger={syncSourceReviewLedger}
            onSourceApprovalApiBaseUrlChange={setSourceApprovalApiBaseUrl}
            onSyncSourceApprovalQueue={syncSourceApprovalQueue}
            onNavigate={setActiveTab}
          />

          <SecureReviewWorkspace
            project={project}
            audit={audit}
            projectReady={validation.valid}
            evidenceCount={project.evidenceItems.length}
            auditRiskLevel={audit.riskLevel}
            modelConnectReceipt={modelConnectReceipt}
            humanReviewOpenCount={humanReviewQueue.summary.openCount + humanReviewQueue.summary.blockedCount}
            humanReviewOwner={modelIntakeProfile.humanReviewOwner}
            manifestHash={manifest?.bundleHash}
            onNavigate={setActiveTab}
          />

          <SecurityReviewChecklistPanel report={securityReviewChecklist} onNavigate={setActiveTab} />

          <IntegrationReadinessPanel
            registry={integrationReadinessRegistry}
            enablementDossier={integrationEnablementDossier}
            providerPolicyReport={activeModelGatewayProviderPolicyReport}
            providerPolicySource={serverProviderPolicyReport ? "server" : "local"}
            providerPolicyApiBaseUrl={providerPolicyApiBaseUrl}
            providerPolicySyncStatus={providerPolicySyncStatus}
            providerPolicySyncError={providerPolicySyncError}
            providerPolicySyncRecoveryAction={providerPolicySyncRecoveryAction}
            secretPolicyDraft={secretPolicyDraft}
            secretPolicyReport={activeModelGatewaySecretPolicyReport}
            secretPolicySource={serverSecretPolicyReport ? "server" : "local"}
            secretPolicySyncStatus={secretPolicySyncStatus}
            secretPolicySyncError={secretPolicySyncError}
            secretPolicySyncRecoveryAction={secretPolicySyncRecoveryAction}
            storagePolicyDraft={storagePolicyDraft}
            storagePolicyContext={objectStoragePolicyContext}
            storagePolicyReport={activeObjectStoragePolicyReport}
            storagePolicySource={serverStoragePolicyReport ? "server" : "local"}
            storagePolicyApiBaseUrl={storagePolicyApiBaseUrl}
            storagePolicySyncStatus={storagePolicySyncStatus}
            storagePolicySyncError={storagePolicySyncError}
            storagePolicySyncRecoveryAction={storagePolicySyncRecoveryAction}
            parserPolicyDraft={parserPolicyDraft}
            parserPolicyContext={documentParserPolicyContext}
            parserPolicyReport={activeDocumentParserPolicyReport}
            parserPolicySource={serverParserPolicyReport ? "server" : "local"}
            parserPolicyApiBaseUrl={parserPolicyApiBaseUrl}
            parserPolicySyncStatus={parserPolicySyncStatus}
            parserPolicySyncError={parserPolicySyncError}
            parserPolicySyncRecoveryAction={parserPolicySyncRecoveryAction}
            anchorPolicyDraft={anchorPolicyDraft}
            anchorPolicyContext={chainAnchorPolicyContext}
            anchorPolicyReport={activeChainAnchorPolicyReport}
            anchorPolicySource={serverAnchorPolicyReport ? "server" : "local"}
            anchorPolicyApiBaseUrl={anchorPolicyApiBaseUrl}
            anchorPolicySyncStatus={anchorPolicySyncStatus}
            anchorPolicySyncError={anchorPolicySyncError}
            anchorPolicySyncRecoveryAction={anchorPolicySyncRecoveryAction}
            grcDestinationPolicyDraft={grcDestinationPolicyDraft}
            grcDestinationPolicyContext={grcDestinationPolicyContext}
            grcDestinationPolicyReport={activeGrcDestinationPolicyReport}
            grcDestinationPolicySource={serverGrcDestinationPolicyReport ? "server" : "local"}
            grcDestinationPolicyApiBaseUrl={grcDestinationPolicyApiBaseUrl}
            grcDestinationPolicySyncStatus={grcDestinationPolicySyncStatus}
            grcDestinationPolicySyncError={grcDestinationPolicySyncError}
            grcDestinationPolicySyncRecoveryAction={grcDestinationPolicySyncRecoveryAction}
            onProviderPolicyApiBaseUrlChange={setProviderPolicyApiBaseUrl}
            onRefreshProviderPolicy={refreshProviderPolicyReport}
            onSecretPolicyDraftChange={updateSecretPolicyDraft}
            onEvaluateSecretPolicy={evaluateSecretPolicyReport}
            onStoragePolicyApiBaseUrlChange={setStoragePolicyApiBaseUrl}
            onStoragePolicyDraftChange={updateStoragePolicyDraft}
            onEvaluateStoragePolicy={evaluateStoragePolicyReport}
            onParserPolicyApiBaseUrlChange={setParserPolicyApiBaseUrl}
            onParserPolicyDraftChange={updateParserPolicyDraft}
            onEvaluateParserPolicy={evaluateParserPolicyReport}
            onAnchorPolicyApiBaseUrlChange={setAnchorPolicyApiBaseUrl}
            onAnchorPolicyDraftChange={updateAnchorPolicyDraft}
            onEvaluateAnchorPolicy={evaluateAnchorPolicyReport}
            onGrcDestinationPolicyApiBaseUrlChange={setGrcDestinationPolicyApiBaseUrl}
            onGrcDestinationPolicyDraftChange={updateGrcDestinationPolicyDraft}
            onEvaluateGrcDestinationPolicy={evaluateGrcDestinationPolicyReport}
            onNavigate={setActiveTab}
          />

          <nav className="tabs" aria-label="Workbench tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {activeTab === "wizard" ? <AuditWizard project={project} audit={audit} /> : null}
          {activeTab === "ai" ? (
            <AIReviewPanel
              project={project}
              audit={audit}
              settings={modelSettings}
              settingsValidation={modelSettingsValidation}
              result={aiReview}
              reviewRuns={currentReviewRuns}
              modelIntakeSummary={modelIntakeSummary}
              status={aiReviewStatus}
              error={aiReviewError}
              errorRecoveryAction={aiReviewErrorRecoveryAction}
              errorBoundary={aiReviewErrorBoundary}
              modelConnectReceipt={modelConnectReceipt}
              onSettingsChange={updateModelSettings}
              onValidateModelConnect={handleValidateModelConnect}
              onRunReview={handleRunAIReview}
            />
          ) : null}
          {activeTab === "model" ? (
            <ModelIntakePanel
              projectId={project.id}
              profile={modelIntakeProfile}
              events={currentAIEvents}
              onProfileChange={setModelIntakeProfile}
              onAddEvent={addAIEvent}
              onUpdateEvent={updateAIEvent}
            />
          ) : null}
          {activeTab === "review" ? (
            <HumanReviewPanel queue={humanReviewQueue} decisions={currentHumanReviewDecisions} onSaveDecision={saveHumanReviewDecision} />
          ) : null}
          {activeTab === "jurisdiction" ? <JurisdictionChecklistPanel project={project} audit={audit} /> : null}
          {activeTab === "risk" ? (
            <RiskAuditPanel
              project={project}
              audit={audit}
              grcTicketExport={grcTicketExport}
              onRequestEvidence={(requirement) => addEvidence(createEvidenceRequestFromRequirement(requirement))}
            />
          ) : null}
          {activeTab === "evidence" ? (
            <EvidenceLedger
              projectId={project.id}
              evidenceItems={project.evidenceItems}
              evidenceAuditEvents={currentEvidenceAuditEvents}
              manifest={manifest}
              evidenceIntakeGuidance={evidenceIntakeGuidance}
              evidenceTemplates={evidenceTemplates}
              recommendedTemplateIds={recommendedEvidenceTemplateIds}
              onAddEvidence={addEvidence}
              onApplyEvidenceTemplate={applyEvidenceTemplate}
              onUpdateEvidence={updateEvidence}
              onRemoveEvidence={removeEvidence}
            />
          ) : null}
          {activeTab === "counsel" ? (
            <CounselPackPanel
              projectName={project.projectName}
              fit={fit}
              manifest={manifest}
              regulatorySourcePack={regulatorySourcePack}
              markdown={markdown}
              counselQuestions={currentCounselQuestions}
              counselReviews={currentCounselReviews}
              exportTemplates={counselPackTemplates}
              selectedExportTemplate={selectedCounselPackTemplate}
              recommendedExportTemplateId={recommendedCounselPackTemplate.id}
              dataBoundaryReport={dataBoundaryReport}
              handoffChecklist={counselHandoffChecklist}
              counselPackVersions={currentCounselPackVersions}
              serverExportRecords={currentCounselPackServerExports}
              onSelectExportTemplate={setSelectedCounselPackTemplateId}
              onAddQuestion={addCounselQuestion}
              onUpdateQuestion={updateCounselQuestion}
              onRemoveQuestion={removeCounselQuestion}
              onUpdateReview={updateCounselReview}
              onSaveVersion={saveCounselPackVersion}
              onCreateServerExport={createServerExportRecord}
            />
          ) : null}
          {activeTab === "sources" ? (
            <SourcesPanel
              audit={audit}
              demoRunbook={demoRunbook}
              exportSafetyInventory={exportSafetyInventory}
              judgeHandoffBundle={judgeHandoffBundle}
              onNavigate={setActiveTab}
              submissionPack={submissionPack}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function RiskAuditPanel({
  project,
  audit,
  grcTicketExport,
  onRequestEvidence
}: {
  project: ProjectProfile;
  audit: ReturnType<typeof analyzeAuditProfile>;
  grcTicketExport: GrcTicketExportBundle;
  onRequestEvidence: (requirement: RiskEvidenceRequirement) => void;
}) {
  const issueCards = createRiskIssueCards(project, audit);
  const evidenceCoverageByFlag = new Map(
    createRiskEvidenceCoverage(audit, project.evidenceItems).map((coverage) => [coverage.flagId, coverage])
  );

  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={ShieldCheck}
        title="Risk Audit"
        subtitle="Weighted triage for legal, compliance, AI, RegTech, and blockchain review."
      />
      <div className="risk-summary">
        <div className={`score-ring ${audit.riskLevel}`}>
          <strong>{audit.score}</strong>
          <span>{audit.riskLevel}</span>
        </div>
        <div className="summary-copy">
          <h3>{riskCopy(audit.riskLevel)}</h3>
          <p>
            The engine converts project facts into counsel-ready flags, owner assignments, and evidence tasks. It does not make
            legal conclusions.
          </p>
        </div>
      </div>
      <div className="flag-grid">
        {audit.flags.length === 0 ? <p className="empty-state">No material flags detected in the current facts.</p> : null}
        {issueCards.map((card) => (
          <FlagCard
            key={card.flagId}
            card={card}
            evidenceCoverage={evidenceCoverageByFlag.get(card.flagId)}
            onRequestEvidence={onRequestEvidence}
          />
        ))}
      </div>
      <h3 className="subhead">Remediation Queue</h3>
      <div className="task-list">
        {audit.remediation.map((item) => (
          <RemediationRow key={`${item.owner}-${item.action}`} item={item} />
        ))}
      </div>
      <GrcTicketExportPanel bundle={grcTicketExport} />
    </section>
  );
}

function SourcesPanel({
  audit,
  demoRunbook,
  exportSafetyInventory,
  judgeHandoffBundle,
  onNavigate,
  submissionPack
}: {
  audit: ReturnType<typeof analyzeAuditProfile>;
  demoRunbook: DemoRunbook | null;
  exportSafetyInventory: ExportSafetyInventory | null;
  judgeHandoffBundle: JudgeHandoffBundle | null;
  onNavigate: (target: WorkspaceActionTarget) => void;
  submissionPack: SubmissionPack | null;
}) {
  return (
    <section className="panel stage-panel">
      <SectionHeader icon={BookOpen} title="Sources" subtitle="Research pack used to pick the hackathon and shape this MVP." />
      <div className="source-grid">
        {audit.sourcePack.map((source) => (
          <a key={`${source.title}-${source.url}`} className="source-card" href={source.url} target="_blank" rel="noreferrer">
            <Link2 size={18} aria-hidden="true" />
            <strong>{source.title}</strong>
            <span>{source.relevance}</span>
          </a>
        ))}
      </div>
      <div className="repo-callout">
        <Github size={20} aria-hidden="true" />
        <p>Submission package expects a public GitHub repository, README, demo video, and DoraHacks BUIDL entry.</p>
      </div>
      <JudgeHandoffBundlePanel bundle={judgeHandoffBundle} onNavigate={onNavigate} />
      <ExportSafetyInventoryPanel inventory={exportSafetyInventory} />
      <SubmissionPackPanel pack={submissionPack} demoRunbook={demoRunbook} />
    </section>
  );
}

function FlagCard({
  card,
  evidenceCoverage,
  onRequestEvidence
}: {
  card: RiskIssueCard;
  evidenceCoverage?: RiskEvidenceCoverage;
  onRequestEvidence: (requirement: RiskEvidenceRequirement) => void;
}) {
  return (
    <article className={`flag-card ${card.severity}`}>
      <div className="flag-meta">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>{card.severity}</span>
      </div>
      <h3>{card.title}</h3>
      <p>{card.rationale}</p>
      <section className="flag-explainer" aria-label={`Why ${card.title} triggered`}>
        <strong>Why this flag triggered</strong>
        <ul>
          {card.whyTriggered.map((trigger) => (
            <li key={trigger}>{trigger}</li>
          ))}
        </ul>
      </section>
      {evidenceCoverage ? <RiskEvidenceWorkflow coverage={evidenceCoverage} onRequestEvidence={onRequestEvidence} /> : null}
      <div className="flag-source-links">
        {card.sourceReferences.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
            <Link2 size={14} aria-hidden="true" />
            {source.title}
          </a>
        ))}
      </div>
      <small>{card.notLegalAdviceBoundary}</small>
    </article>
  );
}

function RiskEvidenceWorkflow({
  coverage,
  onRequestEvidence
}: {
  coverage: RiskEvidenceCoverage;
  onRequestEvidence: (requirement: RiskEvidenceRequirement) => void;
}) {
  return (
    <section className={`risk-evidence-block ${coverage.coverageStatus}`} aria-label={`${coverage.flagTitle} evidence workflow`}>
      <div className="risk-evidence-header">
        <strong>Evidence workflow</strong>
        <span>
          {coverage.coveredCount}/{coverage.totalCount} covered
        </span>
      </div>
      <ul className="risk-evidence-list">
        {coverage.requirements.map((requirement) => (
          <li key={requirement.id} className={requirement.status}>
            <span className={`priority ${requirement.priority}`}>{requirement.priority}</span>
            <div>
              <strong>{requirement.title}</strong>
              <p>{requirement.reason}</p>
              <small>{formatRequirementStatus(requirement.status, requirement.matchedEvidenceLabels)}</small>
              {requirement.status === "missing" ? (
                <button type="button" className="risk-evidence-request" onClick={() => onRequestEvidence(requirement)}>
                  Request evidence: {requirement.title}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <small>{coverage.notLegalAdviceBoundary}</small>
    </section>
  );
}

function formatRequirementStatus(status: RiskEvidenceCoverage["requirements"][number]["status"], labels: string[]): string {
  if (status === "covered") {
    return `covered by ${labels.join(", ")}`;
  }
  if (status === "in-progress") {
    return `in progress from ${labels.join(", ")}`;
  }
  return "missing evidence";
}

function RemediationRow({ item }: { item: RemediationItem }) {
  return (
    <article className="task-row">
      <span className={`priority ${item.priority}`}>{item.priority}</span>
      <strong>{item.owner}</strong>
      <p>{item.action}</p>
    </article>
  );
}

function projectFromAuditProfile(profile: AuditProfile): ProjectProfile {
  const now = new Date().toISOString();
  return {
    ...profile,
    id: `sample-${slug(profile.projectName)}`,
    evidenceItems: profile.evidenceItems.map((item, index) => ({
      ...item,
      id: item.id ?? `sample-${slug(profile.projectName)}-${index + 1}`,
      status: item.status ?? "received",
      owner: item.owner ?? "Founder",
      addedAt: item.addedAt ?? now,
      updatedAt: item.updatedAt ?? now
    })),
    createdAt: now,
    updatedAt: now
  };
}

function createBlankProject(): ProjectProfile {
  const now = new Date().toISOString();
  return {
    id: createLocalId("project"),
    projectName: "",
    entityType: "",
    jurisdictions: [],
    assetModel: "",
    userType: "",
    custodyModel: "",
    dataSensitivity: "",
    aiUsage: "",
    blockchainUse: "",
    operatingStage: "",
    evidenceItems: [],
    createdAt: now,
    updatedAt: now
  };
}

function loadStoredProject(): ProjectProfile | null {
  const raw = safeStorage()?.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ProjectProfile;
    if (parsed && typeof parsed.id === "string" && Array.isArray(parsed.evidenceItems)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function loadStoredModelSettings(): ModelSettings {
  const fallback: ModelSettings = {
    provider: "mock",
    model: "lexproof-mock"
  };
  const raw = safeStorage()?.getItem(MODEL_SETTINGS_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ModelSettings>;
    if (parsed.provider === "mock" || parsed.provider === "openai-compatible") {
      return {
        provider: parsed.provider,
        model: parsed.model || (parsed.provider === "mock" ? "lexproof-mock" : ""),
        baseUrl: parsed.baseUrl
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function loadStoredModelReviewRuns(): ModelReviewRun[] {
  const raw = safeStorage()?.getItem(MODEL_REVIEW_RUNS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ModelReviewRun[];
    return Array.isArray(parsed) ? parsed.filter((run) => run.runVersion === "lexproof-ai-review-run-v1") : [];
  } catch {
    return [];
  }
}

function loadStoredModelIntakeProfile(): ModelConnectionProfile {
  const fallback: ModelConnectionProfile = {
    providerName: "Mock local reviewer",
    modelName: "lexproof-mock",
    endpointType: "mock",
    useCase: "Audit-prep extraction, missing evidence suggestions, and draft counsel questions",
    decisionRole: "human-review-support",
    dataClasses: ["evidence summaries", "project facts", "policy metadata"],
    humanReviewOwner: "Compliance"
  };
  const raw = safeStorage()?.getItem(MODEL_INTAKE_PROFILE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as ModelConnectionProfile;
    if (parsed && typeof parsed.providerName === "string" && Array.isArray(parsed.dataClasses)) {
      return parsed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function loadStoredAIEvents(): AIEventRecord[] {
  const raw = safeStorage()?.getItem(MODEL_INTAKE_EVENTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AIEventRecord[];
    return Array.isArray(parsed)
      ? parsed
          .filter((event) => typeof event.id === "string" && typeof event.projectId === "string")
          .map(sanitizeAIEventRecord)
      : [];
  } catch {
    return [];
  }
}

function loadStoredCounselQuestions(): CounselQuestion[] {
  const raw = safeStorage()?.getItem(COUNSEL_QUESTIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CounselQuestion[];
    return Array.isArray(parsed)
      ? parsed.filter((question) => question.notLegalAdviceBoundary === "Not legal advice. Counsel questions are audit preparation prompts only.")
      : [];
  } catch {
    return [];
  }
}

function loadStoredCounselReviews(): CounselReviewItem[] {
  const raw = safeStorage()?.getItem(COUNSEL_REVIEWS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CounselReviewItem[];
    return Array.isArray(parsed)
      ? parsed.filter((review) => review.notLegalAdviceBoundary === "Not legal advice. Counsel review status is audit preparation workflow only.")
      : [];
  } catch {
    return [];
  }
}

function loadStoredCounselPackVersions(): CounselPackVersionRecord[] {
  const raw = safeStorage()?.getItem(COUNSEL_PACK_VERSIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CounselPackVersionRecord[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (record) =>
            record.recordVersion === "lexproof-counsel-pack-version-v1" &&
            record.notLegalAdviceBoundary ===
              "Not legal advice. Counsel Pack version records are audit preparation export metadata only."
        )
      : [];
  } catch {
    return [];
  }
}

function loadStoredCounselPackServerExports(): CounselPackExportRecord[] {
  const raw = safeStorage()?.getItem(COUNSEL_PACK_SERVER_EXPORTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CounselPackExportRecord[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (record) =>
            record.recordVersion === "lexproof-counsel-pack-export-record-v1" &&
            record.notLegalAdviceBoundary ===
              "Not legal advice. Counsel Pack export records are audit preparation metadata only."
        )
      : [];
  } catch {
    return [];
  }
}

function loadStoredEvidenceAuditEvents(): EvidenceAuditEvent[] {
  const raw = safeStorage()?.getItem(EVIDENCE_AUDIT_TRAIL_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as EvidenceAuditEvent[];
    return Array.isArray(parsed)
      ? parsed.filter((event) => event.eventVersion === "lexproof-evidence-audit-event-v1" && typeof event.projectId === "string")
      : [];
  } catch {
    return [];
  }
}

function loadStoredHumanReviewDecisions(): HumanReviewDecision[] {
  const raw = safeStorage()?.getItem(HUMAN_REVIEW_DECISIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as HumanReviewDecision[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (decision) =>
            decision.decisionVersion === "lexproof-human-review-decision-v1" &&
            decision.notLegalAdviceBoundary === "Not legal advice. Human review decisions track audit preparation workflow status only."
        )
      : [];
  } catch {
    return [];
  }
}

function mergeQuestionsForProject(
  current: CounselQuestion[],
  projectId: string,
  incoming: CounselQuestion[],
  preferIncoming = false
): CounselQuestion[] {
  const otherProjects = current.filter((question) => question.projectId !== projectId);
  const projectQuestions = current.filter((question) => question.projectId === projectId);
  const merged = preferIncoming
    ? mergeCounselQuestionQueues(incoming, projectQuestions)
    : mergeCounselQuestionQueues(projectQuestions, incoming);
  return [...otherProjects, ...merged];
}

function mergeReviewsForProject(current: CounselReviewItem[], projectId: string, incoming: CounselReviewItem[]): CounselReviewItem[] {
  const otherProjects = current.filter((review) => review.projectId !== projectId);
  const projectReviews = current.filter((review) => review.projectId === projectId);
  return [...otherProjects, ...mergeCounselReviewQueues(projectReviews, incoming)];
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage || typeof window.localStorage.getItem !== "function") {
    return null;
  }
  return window.localStorage;
}

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project"
  );
}
