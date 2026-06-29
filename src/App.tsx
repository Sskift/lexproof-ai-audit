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
  ShieldCheck
} from "lucide-react";
import { AIReviewPanel } from "./components/AIReviewPanel";
import { AuditWizard, SectionHeader, riskCopy } from "./components/AuditWizard";
import { CounselPackPanel } from "./components/CounselPackPanel";
import { EvidenceLedger } from "./components/EvidenceLedger";
import { JurisdictionChecklistPanel } from "./components/JurisdictionChecklistPanel";
import { ModelIntakePanel } from "./components/ModelIntakePanel";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { SecureReviewWorkspace } from "./components/SecureReviewWorkspace";
import { sampleProfiles } from "./data/sampleProfiles";
import { analyzeAuditProfile, createSubmissionFit, type AuditFlag, type AuditProfile, type RemediationItem } from "./lib/auditEngine";
import { createRedactionReport, type AIReviewResult } from "./lib/aiReview";
import { buildMarkdownCounselPack } from "./lib/counselPack";
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
import {
  createEvidenceCreatedEvent,
  createEvidenceRemovedEvent,
  createEvidenceUpdateEvent,
  type EvidenceAuditEvent
} from "./lib/evidenceAuditTrail";
import { createEvidenceManifest, type EvidenceManifest } from "./lib/evidenceManifest";
import { createEvidenceItemsFromTemplate, listEvidenceTemplates, recommendEvidenceTemplates } from "./lib/evidenceTemplates";
import { createEvidenceRequestFromRequirement } from "./lib/missingEvidenceWorkflow";
import { runAIReviewWithLedger, type ModelReviewRun } from "./lib/modelReviewLedger";
import {
  createMockModelProvider,
  createOpenAICompatibleModelProvider,
  validateModelSettings,
  type ModelSettings
} from "./lib/modelProvider";
import { createModelConnectReceipt, type ModelConnectReceipt } from "./lib/modelConnect";
import {
  applyAIEventReviewUpdate,
  buildModelIntakeSummary,
  createAIReviewEventFromRun,
  type AIEventRecord,
  type ModelConnectionProfile,
  type ModelIntakeSummary
} from "./lib/modelIntake";
import { validateProjectProfile, type EvidenceItem, type ProjectProfile } from "./lib/projectModel";
import { createRiskIssueCards, type RiskIssueCard } from "./lib/riskExplainers";
import {
  createRiskEvidenceCoverage,
  type RiskEvidenceCoverage,
  type RiskEvidenceRequirement
} from "./lib/riskEvidence";

type TabId = "wizard" | "ai" | "model" | "jurisdiction" | "risk" | "evidence" | "counsel" | "sources";

const STORAGE_KEY = "lexproof.currentProject.v1";
const MODEL_SETTINGS_KEY = "lexproof.modelSettings.v1";
const MODEL_REVIEW_RUNS_KEY = "lexproof.modelReviewRuns.v1";
const MODEL_INTAKE_PROFILE_KEY = "lexproof.modelIntakeProfile.v1";
const MODEL_INTAKE_EVENTS_KEY = "lexproof.modelIntakeEvents.v1";
const COUNSEL_QUESTIONS_KEY = "lexproof.counselQuestions.v1";
const COUNSEL_REVIEWS_KEY = "lexproof.counselReviews.v1";
const EVIDENCE_AUDIT_TRAIL_KEY = "lexproof.evidenceAuditTrail.v1";

const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardList }> = [
  { id: "wizard", label: "Audit Wizard", icon: ClipboardList },
  { id: "ai", label: "AI Review", icon: Bot },
  { id: "model", label: "Model Intake", icon: Bot },
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
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => loadStoredModelSettings());
  const [modelConnectReceipt, setModelConnectReceipt] = useState<ModelConnectReceipt | null>(null);
  const [modelIntakeProfile, setModelIntakeProfile] = useState<ModelConnectionProfile>(() => loadStoredModelIntakeProfile());
  const [aiEvents, setAIEvents] = useState<AIEventRecord[]>(() => loadStoredAIEvents());
  const [modelIntakeSummary, setModelIntakeSummary] = useState<ModelIntakeSummary | null>(null);
  const [aiReview, setAIReview] = useState<AIReviewResult | null>(null);
  const [aiReviewRuns, setAIReviewRuns] = useState<ModelReviewRun[]>(() => loadStoredModelReviewRuns());
  const [counselQuestions, setCounselQuestions] = useState<CounselQuestion[]>(() => loadStoredCounselQuestions());
  const [counselReviews, setCounselReviews] = useState<CounselReviewItem[]>(() => loadStoredCounselReviews());
  const [evidenceAuditEvents, setEvidenceAuditEvents] = useState<EvidenceAuditEvent[]>(() => loadStoredEvidenceAuditEvents());
  const [aiReviewStatus, setAIReviewStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [aiReviewError, setAIReviewError] = useState("");

  const audit = useMemo(() => analyzeAuditProfile(project), [project]);
  const riskEvidenceCoverage = useMemo(() => createRiskEvidenceCoverage(audit, project.evidenceItems), [audit, project.evidenceItems]);
  const fit = useMemo(() => createSubmissionFit(), []);
  const evidenceTemplates = useMemo(() => listEvidenceTemplates(), []);
  const recommendedEvidenceTemplateIds = useMemo(
    () => recommendEvidenceTemplates(project).map((template) => template.id),
    [project]
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
  const currentEvidenceAuditEvents = useMemo(
    () => evidenceAuditEvents.filter((event) => event.projectId === project.id),
    [evidenceAuditEvents, project.id]
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
        modelIntakeExport
      );
    },
    [
      audit,
      currentAIEvents,
      currentCounselQuestions,
      currentCounselReviews,
      manifest,
      modelIntakeProfile,
      modelIntakeSummary,
      project
    ]
  );

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
    safeStorage()?.setItem(EVIDENCE_AUDIT_TRAIL_KEY, JSON.stringify(evidenceAuditEvents.slice(0, 120)));
  }, [evidenceAuditEvents]);

  const updateProject = (nextProject: ProjectProfile) => {
    setProject({ ...nextProject, updatedAt: new Date().toISOString() });
  };

  const updateModelSettings = (settings: ModelSettings) => {
    setModelSettings(settings);
    setModelConnectReceipt(null);
  };

  const loadSample = (projectName: string) => {
    const profile = sampleProfiles.find((item) => item.projectName === projectName);
    if (!profile) {
      return;
    }
    setProject(projectFromAuditProfile(profile));
    setShowValidation(false);
    setSavedAt("");
    setModelConnectReceipt(null);
    setActiveTab("wizard");
  };

  const newProject = () => {
    setProject(createBlankProject());
    setShowValidation(false);
    setSavedAt("");
    setModelConnectReceipt(null);
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

  const addAIEvent = (event: AIEventRecord) => {
    setAIEvents((current) => [event, ...current].slice(0, 80));
  };

  const updateAIEvent = (id: string, updates: Partial<Pick<AIEventRecord, "humanReviewer" | "reviewStatus">>) => {
    setAIEvents((current) => current.map((event) => (event.id === id ? applyAIEventReviewUpdate(event, updates) : event)));
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
          fit={fit}
          validation={validation}
          showValidation={showValidation}
          savedAt={savedAt}
          onProjectChange={updateProject}
          onLoadSample={loadSample}
          onNewProject={newProject}
          onSave={saveWorkspace}
        />

        <section className="main-stage">
          <SecureReviewWorkspace
            projectReady={validation.valid}
            evidenceCount={project.evidenceItems.length}
            auditRiskLevel={audit.riskLevel}
            modelConnectReceipt={modelConnectReceipt}
            unresolvedAIEvents={modelIntakeSummary?.unresolvedEventCount ?? currentAIEvents.length}
            manifestHash={manifest?.bundleHash}
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
          {activeTab === "jurisdiction" ? <JurisdictionChecklistPanel project={project} audit={audit} /> : null}
          {activeTab === "risk" ? (
            <RiskAuditPanel
              project={project}
              audit={audit}
              onRequestEvidence={(requirement) => addEvidence(createEvidenceRequestFromRequirement(requirement))}
            />
          ) : null}
          {activeTab === "evidence" ? (
            <EvidenceLedger
              evidenceItems={project.evidenceItems}
              evidenceAuditEvents={currentEvidenceAuditEvents}
              manifest={manifest}
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
              markdown={markdown}
              counselQuestions={currentCounselQuestions}
              counselReviews={currentCounselReviews}
              onAddQuestion={addCounselQuestion}
              onUpdateQuestion={updateCounselQuestion}
              onRemoveQuestion={removeCounselQuestion}
              onUpdateReview={updateCounselReview}
            />
          ) : null}
          {activeTab === "sources" ? <SourcesPanel audit={audit} /> : null}
        </section>
      </main>
    </div>
  );
}

function RiskAuditPanel({
  project,
  audit,
  onRequestEvidence
}: {
  project: ProjectProfile;
  audit: ReturnType<typeof analyzeAuditProfile>;
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
    </section>
  );
}

function SourcesPanel({ audit }: { audit: ReturnType<typeof analyzeAuditProfile> }) {
  return (
    <section className="panel stage-panel">
      <SectionHeader icon={BookOpen} title="Sources" subtitle="Research pack used to pick the hackathon and shape this MVP." />
      <div className="source-grid">
        {audit.sourcePack.map((source) => (
          <a key={source.url} className="source-card" href={source.url} target="_blank" rel="noreferrer">
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
    return Array.isArray(parsed) ? parsed.filter((event) => typeof event.id === "string" && typeof event.projectId === "string") : [];
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
