import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  FileText,
  Github,
  Gavel,
  Layers3,
  Link2,
  LockKeyhole,
  Scale,
  ShieldCheck
} from "lucide-react";
import { sampleProfiles } from "./data/sampleProfiles";
import {
  analyzeAuditProfile,
  buildCounselMemo,
  createEvidenceHash,
  createSubmissionFit,
  type AuditFlag,
  type AuditProfile,
  type RemediationItem
} from "./lib/auditEngine";

type TabId = "intake" | "risk" | "evidence" | "counsel" | "sources";

const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardList }> = [
  { id: "intake", label: "Intake", icon: ClipboardList },
  { id: "risk", label: "Risk Audit", icon: ShieldCheck },
  { id: "evidence", label: "Evidence Ledger", icon: DatabaseZap },
  { id: "counsel", label: "Counsel Pack", icon: FileText },
  { id: "sources", label: "Sources", icon: BookOpen }
];

export default function App() {
  const [selectedName, setSelectedName] = useState(sampleProfiles[0].projectName);
  const [activeTab, setActiveTab] = useState<TabId>("risk");
  const [customNote, setCustomNote] = useState("Add launch facts, token terms, jurisdiction notes, and missing approvals here.");
  const [evidenceHash, setEvidenceHash] = useState("calculating");

  const profile = useMemo(
    () => sampleProfiles.find((item) => item.projectName === selectedName) ?? sampleProfiles[0],
    [selectedName]
  );
  const enrichedProfile = useMemo<AuditProfile>(
    () => ({
      ...profile,
      evidenceItems: [
        ...profile.evidenceItems,
        { label: "Operator note", kind: "Internal note", content: customNote }
      ]
    }),
    [customNote, profile]
  );
  const audit = useMemo(() => analyzeAuditProfile(enrichedProfile), [enrichedProfile]);
  const fit = useMemo(() => createSubmissionFit(), []);
  const memo = useMemo(() => buildCounselMemo(enrichedProfile, audit, evidenceHash), [audit, enrichedProfile, evidenceHash]);

  useEffect(() => {
    let live = true;
    setEvidenceHash("calculating");
    createEvidenceHash(enrichedProfile.evidenceItems).then((hash) => {
      if (live) {
        setEvidenceHash(hash);
      }
    });
    return () => {
      live = false;
    };
  }, [enrichedProfile]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BLI Legal Tech Hackathon 2 MVP</p>
          <h1>LexProof AuditOS</h1>
          <p className="lead">
            A structured legal and compliance audit workspace for Web3 teams preparing counsel-ready evidence packs.
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
        <aside className="left-rail" aria-label="Project intake">
          <section className="panel">
            <div className="panel-title">
              <Gavel size={18} aria-hidden="true" />
              <h2>Audit Profile</h2>
            </div>
            <label className="field-label" htmlFor="profile-select">
              Scenario
            </label>
            <select id="profile-select" value={selectedName} onChange={(event) => setSelectedName(event.target.value)}>
              {sampleProfiles.map((item) => (
                <option key={item.projectName} value={item.projectName}>
                  {item.projectName}
                </option>
              ))}
            </select>

            <div className="profile-facts">
              <Fact label="Entity" value={profile.entityType} />
              <Fact label="Users" value={profile.userType} />
              <Fact label="Custody" value={profile.custodyModel} />
              <Fact label="Stage" value={profile.operatingStage} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Layers3 size={18} aria-hidden="true" />
              <h2>Hackathon Fit</h2>
            </div>
            <div className="fit-grid">
              <Metric label="Prize/Effort" value={fit.scorecard.prizeToEffort} />
              <Metric label="Deadline" value={fit.scorecard.deadlineRoom} />
              <Metric label="Scope" value={fit.scorecard.scopeFit} />
              <Metric label="Risk" value={fit.scorecard.implementationRisk} />
            </div>
            <div className="tag-cloud">
              {fit.themeCoverage.map((theme) => (
                <span key={theme}>{theme}</span>
              ))}
            </div>
          </section>
        </aside>

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

          {activeTab === "intake" && (
            <section className="panel stage-panel">
              <SectionHeader
                icon={ClipboardList}
                title="Intake"
                subtitle="Capture facts that counsel and compliance need before a blockchain product is described externally."
              />
              <div className="intake-grid">
                <Fact label="Jurisdictions" value={profile.jurisdictions.join(", ")} />
                <Fact label="Asset Model" value={profile.assetModel} />
                <Fact label="Data Sensitivity" value={profile.dataSensitivity} />
                <Fact label="AI Usage" value={profile.aiUsage} />
                <Fact label="Blockchain Use" value={profile.blockchainUse} />
              </div>
              <label className="field-label" htmlFor="operator-note">
                Operator note added to evidence hash
              </label>
              <textarea id="operator-note" value={customNote} onChange={(event) => setCustomNote(event.target.value)} />
            </section>
          )}

          {activeTab === "risk" && (
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
                    The engine converts project facts into counsel-ready flags, owner assignments, and evidence tasks. It does
                    not make legal conclusions.
                  </p>
                </div>
              </div>
              <div className="flag-grid">
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
          )}

          {activeTab === "evidence" && (
            <section className="panel stage-panel">
              <SectionHeader
                icon={DatabaseZap}
                title="Evidence Ledger"
                subtitle="Every memo, policy, and operator note is normalized into a tamper-evident hash for review handoff."
              />
              <div className="hash-banner">
                <LockKeyhole size={20} aria-hidden="true" />
                <div>
                  <span>Evidence bundle SHA-256</span>
                  <code>{evidenceHash}</code>
                </div>
              </div>
              <div className="ledger-list">
                {enrichedProfile.evidenceItems.map((item, index) => (
                  <article key={`${item.label}-${index}`} className="ledger-item">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{item.label}</h3>
                      <p>{item.kind}</p>
                    </div>
                    <BadgeCheck size={18} aria-label="Included in hash" />
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "counsel" && (
            <section className="panel stage-panel">
              <SectionHeader
                icon={FileText}
                title="Counsel Pack"
                subtitle="Copy-ready Markdown brief with non-advice disclaimer, facts, flags, owners, and sources."
              />
              <div className="submission-strip">
                {fit.requiredAssets.map((asset) => (
                  <span key={asset}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {asset}
                  </span>
                ))}
              </div>
              <pre className="memo">{memo}</pre>
            </section>
          )}

          {activeTab === "sources" && (
            <section className="panel stage-panel">
              <SectionHeader
                icon={BookOpen}
                title="Sources"
                subtitle="Research pack used to pick the hackathon and shape this MVP."
              />
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
                <p>
                  Submission package expects a public GitHub repository, README, demo video, and DoraHacks BUIDL entry.
                </p>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle
}: {
  icon: typeof ClipboardList;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-header">
      <Icon size={22} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <strong>{value}/10</strong>
      <span>{label}</span>
    </div>
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

function riskCopy(level: string): string {
  if (level === "critical") {
    return "Counsel-first launch gate required";
  }
  if (level === "high") {
    return "Material review before public claims";
  }
  if (level === "moderate") {
    return "Document assumptions before pilots";
  }
  return "Low-risk education or documentation flow";
}
