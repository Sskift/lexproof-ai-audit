import { ClipboardList, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import type { AuditResult } from "../lib/auditEngine";
import type { ProjectProfile } from "../lib/projectModel";

type AuditWizardProps = {
  project: ProjectProfile;
  audit: AuditResult;
};

const steps = [
  { id: "facts", label: "Facts", icon: ClipboardList },
  { id: "risk", label: "Risk", icon: ShieldCheck },
  { id: "handoff", label: "Handoff", icon: FileCheck2 }
] as const;

export function AuditWizard({ project, audit }: AuditWizardProps) {
  return (
    <section className="panel stage-panel">
      <SectionHeader
        icon={Scale}
        title="Audit Wizard"
        subtitle="Step through the project facts, risk triggers, and counsel handoff queue before export."
      />

      <div className="wizard-steps" aria-label="Audit wizard steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="wizard-step">
              <Icon size={17} aria-hidden="true" />
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </div>
          );
        })}
      </div>

      <div className="wizard-grid">
        <section className="wizard-section">
          <h3>1. Project Facts</h3>
          <div className="intake-grid">
            <Fact label="Project" value={project.projectName || "Unnamed project"} />
            <Fact label="Entity" value={project.entityType || "Not set"} />
            <Fact label="Jurisdictions" value={project.jurisdictions.join(", ") || "Not set"} />
            <Fact label="Stage" value={project.operatingStage || "Not set"} />
            <Fact label="Asset model" value={project.assetModel || "Not set"} />
            <Fact label="Users" value={project.userType || "Not set"} />
          </div>
        </section>

        <section className="wizard-section">
          <h3>2. AI, Data, And Chain Boundaries</h3>
          <div className="intake-grid">
            <Fact label="Custody" value={project.custodyModel || "Not set"} />
            <Fact label="Data" value={project.dataSensitivity || "Not set"} />
            <Fact label="AI Usage" value={project.aiUsage || "Not set"} />
            <Fact label="Blockchain Use" value={project.blockchainUse || "Not set"} />
          </div>
        </section>

        <section className="wizard-section">
          <h3>3. Review Gate</h3>
          <div className="risk-summary compact">
            <div className={`score-ring ${audit.riskLevel}`}>
              <strong>{audit.score}</strong>
              <span>{audit.riskLevel}</span>
            </div>
            <div className="summary-copy">
              <h3>{riskCopy(audit.riskLevel)}</h3>
              <p>Not legal advice. Use this as audit preparation material for counsel and compliance review.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export function SectionHeader({
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

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function riskCopy(level: string): string {
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
