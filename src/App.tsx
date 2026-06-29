import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Bot, ClipboardList, DatabaseZap, FileText, Github, Link2, Scale, ShieldCheck } from "lucide-react";
import { AIReviewPanel } from "./components/AIReviewPanel";
import { AuditWizard, SectionHeader, riskCopy } from "./components/AuditWizard";
import { CounselPackPanel } from "./components/CounselPackPanel";
import { EvidenceLedger } from "./components/EvidenceLedger";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { sampleProfiles } from "./data/sampleProfiles";
import { analyzeAuditProfile, createSubmissionFit, type AuditFlag, type AuditProfile, type RemediationItem } from "./lib/auditEngine";
import { runAIReview, type AIReviewResult } from "./lib/aiReview";
import { buildMarkdownCounselPack } from "./lib/counselPack";
import { createEvidenceManifest, type EvidenceManifest } from "./lib/evidenceManifest";
import {
  createMockModelProvider,
  createOpenAICompatibleModelProvider,
  validateModelSettings,
  type ModelSettings
} from "./lib/modelProvider";
import { validateProjectProfile, type EvidenceItem, type ProjectProfile } from "./lib/projectModel";

type TabId = "wizard" | "ai" | "risk" | "evidence" | "counsel" | "sources";

const STORAGE_KEY = "lexproof.currentProject.v1";
const MODEL_SETTINGS_KEY = "lexproof.modelSettings.v1";

const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardList }> = [
  { id: "wizard", label: "Audit Wizard", icon: ClipboardList },
  { id: "ai", label: "AI Review", icon: Bot },
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
  const [aiReview, setAIReview] = useState<AIReviewResult | null>(null);
  const [aiReviewStatus, setAIReviewStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [aiReviewError, setAIReviewError] = useState("");

  const audit = useMemo(() => analyzeAuditProfile(project), [project]);
  const fit = useMemo(() => createSubmissionFit(), []);
  const validation = useMemo(() => validateProjectProfile(project), [project]);
  const modelSettingsValidation = useMemo(() => validateModelSettings(modelSettings), [modelSettings]);
  const markdown = useMemo(
    () =>
      manifest
        ? buildMarkdownCounselPack(project, audit, manifest)
        : "Evidence manifest is calculating. Not legal advice; counsel pack output is audit preparation material.",
    [audit, manifest, project]
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
    if (validation.valid) {
      safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project, validation.valid]);

  useEffect(() => {
    const { apiKey: _apiKey, ...nonSecretSettings } = modelSettings;
    safeStorage()?.setItem(MODEL_SETTINGS_KEY, JSON.stringify(nonSecretSettings));
  }, [modelSettings]);

  const updateProject = (nextProject: ProjectProfile) => {
    setProject({ ...nextProject, updatedAt: new Date().toISOString() });
  };

  const loadSample = (projectName: string) => {
    const profile = sampleProfiles.find((item) => item.projectName === projectName);
    if (!profile) {
      return;
    }
    setProject(projectFromAuditProfile(profile));
    setShowValidation(false);
    setSavedAt("");
    setActiveTab("wizard");
  };

  const newProject = () => {
    setProject(createBlankProject());
    setShowValidation(false);
    setSavedAt("");
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
    setProject((current) => ({
      ...current,
      evidenceItems: [
        ...current.evidenceItems,
        {
          ...item,
          id: createLocalId("evidence"),
          kind: item.kind.trim() || "Note",
          label: item.label.trim(),
          content: item.content.trim(),
          addedAt: now,
          updatedAt: now
        }
      ],
      updatedAt: now
    }));
  };

  const updateEvidence = (index: number, updates: Partial<EvidenceItem>) => {
    const now = new Date().toISOString();
    setProject((current) => ({
      ...current,
      evidenceItems: current.evidenceItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates, updatedAt: now } : item
      ),
      updatedAt: now
    }));
  };

  const removeEvidence = (index: number) => {
    const now = new Date().toISOString();
    setProject((current) => ({
      ...current,
      evidenceItems: current.evidenceItems.filter((_, itemIndex) => itemIndex !== index),
      updatedAt: now
    }));
  };

  const handleRunAIReview = async () => {
    setAIReviewError("");
    if (!modelSettingsValidation.valid) {
      setAIReviewStatus("error");
      setAIReviewError(modelSettingsValidation.errors.join(" "));
      return;
    }

    setAIReviewStatus("running");
    try {
      const provider =
        modelSettings.provider === "mock" ? createMockModelProvider() : createOpenAICompatibleModelProvider(modelSettings);
      const nextReview = await runAIReview(project, audit, project.evidenceItems, provider);
      setAIReview(nextReview);
      setAIReviewStatus("complete");
    } catch (error) {
      setAIReviewStatus("error");
      setAIReviewError(error instanceof Error ? error.message : "Model review failed.");
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
              status={aiReviewStatus}
              error={aiReviewError}
              onSettingsChange={setModelSettings}
              onRunReview={handleRunAIReview}
            />
          ) : null}
          {activeTab === "risk" ? <RiskAuditPanel audit={audit} /> : null}
          {activeTab === "evidence" ? (
            <EvidenceLedger
              evidenceItems={project.evidenceItems}
              manifest={manifest}
              onAddEvidence={addEvidence}
              onUpdateEvidence={updateEvidence}
              onRemoveEvidence={removeEvidence}
            />
          ) : null}
          {activeTab === "counsel" ? (
            <CounselPackPanel projectName={project.projectName} fit={fit} manifest={manifest} markdown={markdown} />
          ) : null}
          {activeTab === "sources" ? <SourcesPanel audit={audit} /> : null}
        </section>
      </main>
    </div>
  );
}

function RiskAuditPanel({ audit }: { audit: ReturnType<typeof analyzeAuditProfile> }) {
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
        {audit.flags.map((flag) => (
          <FlagCard key={flag.id} flag={flag} />
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

function FlagCard({ flag }: { flag: AuditFlag }) {
  return (
    <article className={`flag-card ${flag.severity}`}>
      <div>
        <AlertTriangle size={18} aria-hidden="true" />
        <span>{flag.severity}</span>
      </div>
      <h3>{flag.title}</h3>
      <p>{flag.rationale}</p>
      <small>{flag.source}</small>
    </article>
  );
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
