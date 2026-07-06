import { useState } from "react";
import { AlertTriangle, CirclePlus, Gavel, Layers3, Save, Upload } from "lucide-react";
import type { AuditProfile, SubmissionFit } from "../lib/auditEngine";
import type { DemoScenario, DemoScenarioValidationResult } from "../lib/demoScenarioLibrary";
import type { DemoApiPreflight } from "../lib/demoReadiness";
import type { ProjectWorkspaceRecoveryNotice } from "../lib/projectPersistence";
import type { ProjectProfile, ProjectProfileImportResult, ProjectValidationResult } from "../lib/projectModel";
import { DemoReadinessPanel } from "./DemoReadinessPanel";
import { DemoScenarioLibrary } from "./DemoScenarioLibrary";

type ProjectWorkspaceProps = {
  project: ProjectProfile;
  sampleProfiles: AuditProfile[];
  demoScenarios: DemoScenario[];
  demoScenarioValidation: DemoScenarioValidationResult;
  demoScreenshotRefs: string[];
  demoApiPreflight: DemoApiPreflight;
  fit: SubmissionFit;
  validation: ProjectValidationResult;
  showValidation: boolean;
  savedAt: string;
  recoveryNotice?: ProjectWorkspaceRecoveryNotice | null;
  onProjectChange: (project: ProjectProfile) => void;
  onLoadSample: (projectName: string) => void;
  onLoadDemoScenario: (scenarioId: string) => void;
  onImportProjectJson: (json: string) => ProjectProfileImportResult;
  onDemoApiPreflightChange: (preflight: DemoApiPreflight) => void;
  onNewProject: () => void;
  onSave: () => void;
};

export function ProjectWorkspace({
  project,
  sampleProfiles,
  demoScenarios,
  demoScenarioValidation,
  demoScreenshotRefs,
  demoApiPreflight,
  fit,
  validation,
  showValidation,
  savedAt,
  recoveryNotice,
  onProjectChange,
  onLoadSample,
  onLoadDemoScenario,
  onImportProjectJson,
  onDemoApiPreflightChange,
  onNewProject,
  onSave
}: ProjectWorkspaceProps) {
  const [importJson, setImportJson] = useState("");
  const [importResult, setImportResult] = useState<ProjectProfileImportResult | null>(null);
  const updateProject = (updates: Partial<ProjectProfile>) => {
    onProjectChange({ ...project, ...updates });
  };
  const importProfile = () => {
    const result = onImportProjectJson(importJson);
    setImportResult(result);
    if (result.ok) {
      setImportJson("");
    }
  };

  return (
    <aside className="left-rail" aria-label="Project workspace">
      <section className="panel">
        <div className="panel-title">
          <Gavel size={18} aria-hidden="true" />
          <h2>Project Workspace</h2>
        </div>

        <div className="workspace-actions">
          <button type="button" className="secondary" onClick={onNewProject}>
            <CirclePlus size={16} aria-hidden="true" />
            New project
          </button>
          <button type="button" onClick={onSave}>
            <Save size={16} aria-hidden="true" />
            Save workspace
          </button>
        </div>

        {recoveryNotice ? (
          <div className="notice-banner workspace-recovery-notice" role="status" aria-label="Workspace persistence recovery">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>{recoveryNotice.title}</strong>
              <p>{recoveryNotice.message}</p>
              <p>{recoveryNotice.recoveryAction}</p>
              <small>{recoveryNotice.notLegalAdviceBoundary}</small>
            </div>
          </div>
        ) : null}

        <label className="field-label" htmlFor="sample-profile">
          Load sample scenario
        </label>
        <select id="sample-profile" value="" onChange={(event) => onLoadSample(event.target.value)}>
          <option value="" disabled>
            Choose a sample
          </option>
          {sampleProfiles.map((item) => (
            <option key={item.projectName} value={item.projectName}>
              {item.projectName}
            </option>
          ))}
        </select>

        <div className="profile-import-panel" aria-label="Profile JSON import panel">
          <label className="field-label" htmlFor="profile-import-json">
            Import project profile JSON
          </label>
          <textarea
            id="profile-import-json"
            value={importJson}
            onChange={(event) => {
              setImportJson(event.target.value);
              setImportResult(null);
            }}
            placeholder='{"projectName":"AI Governance Desk","jurisdictions":["United States"],"evidenceItems":[]}'
          />
          <button type="button" className="secondary" disabled={!importJson.trim()} onClick={importProfile}>
            <Upload size={16} aria-hidden="true" />
            Import profile JSON
          </button>
          {importResult?.ok ? (
            <p className="save-state">
              Imported profile: {importResult.profile.projectName}. {importResult.profile.evidenceItems.length} evidence item
              {importResult.profile.evidenceItems.length === 1 ? "" : "s"}. {importResult.notLegalAdviceBoundary}
            </p>
          ) : null}
          {importResult?.ok && importResult.warnings.length > 0 ? (
            <ul className="validation-list" aria-label="Project import warnings">
              {importResult.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          {importResult && !importResult.ok ? (
            <ul className="validation-list" aria-label="Project import errors">
              {importResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
              <li>{importResult.notLegalAdviceBoundary}</li>
            </ul>
          ) : null}
        </div>

        <DemoScenarioLibrary
          scenarios={demoScenarios}
          activeProjectName={project.projectName}
          onStartScenario={onLoadDemoScenario}
        />

        <DemoReadinessPanel
          scenarioValidation={demoScenarioValidation}
          scenarios={demoScenarios}
          screenshotRefs={demoScreenshotRefs}
          apiPreflight={demoApiPreflight}
          onApiPreflightChange={onDemoApiPreflightChange}
        />

        <div className="field-stack">
          <label className="field-label" htmlFor="projectName">
            Project name
          </label>
          <input
            id="projectName"
            value={project.projectName}
            onChange={(event) => updateProject({ projectName: event.target.value })}
            placeholder="e.g. YieldPassport"
          />

          <label className="field-label" htmlFor="entityType">
            Entity type
          </label>
          <input
            id="entityType"
            value={project.entityType}
            onChange={(event) => updateProject({ entityType: event.target.value })}
            placeholder="e.g. Startup issuer"
          />

          <label className="field-label" htmlFor="jurisdictions">
            Jurisdictions
          </label>
          <input
            id="jurisdictions"
            value={project.jurisdictions.join(", ")}
            onChange={(event) => updateProject({ jurisdictions: parseList(event.target.value) })}
            placeholder="United States, European Union"
          />

          <label className="field-label" htmlFor="assetModel">
            Asset model
          </label>
          <textarea
            id="assetModel"
            value={project.assetModel}
            onChange={(event) => updateProject({ assetModel: event.target.value })}
          />

          <label className="field-label" htmlFor="userType">
            User exposure
          </label>
          <input id="userType" value={project.userType} onChange={(event) => updateProject({ userType: event.target.value })} />

          <label className="field-label" htmlFor="custodyModel">
            Custody model
          </label>
          <input
            id="custodyModel"
            value={project.custodyModel}
            onChange={(event) => updateProject({ custodyModel: event.target.value })}
          />

          <label className="field-label" htmlFor="dataSensitivity">
            Data sensitivity
          </label>
          <input
            id="dataSensitivity"
            value={project.dataSensitivity}
            onChange={(event) => updateProject({ dataSensitivity: event.target.value })}
          />

          <label className="field-label" htmlFor="aiUsage">
            AI usage
          </label>
          <input id="aiUsage" value={project.aiUsage} onChange={(event) => updateProject({ aiUsage: event.target.value })} />

          <label className="field-label" htmlFor="blockchainUse">
            Blockchain use
          </label>
          <input
            id="blockchainUse"
            value={project.blockchainUse}
            onChange={(event) => updateProject({ blockchainUse: event.target.value })}
          />

          <label className="field-label" htmlFor="operatingStage">
            Operating stage
          </label>
          <input
            id="operatingStage"
            value={project.operatingStage}
            onChange={(event) => updateProject({ operatingStage: event.target.value })}
          />
        </div>

        {showValidation && !validation.valid ? (
          <ul className="validation-list" aria-label="Project validation errors">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <p className="save-state">{savedAt ? `Saved locally at ${savedAt}` : "Local-first workspace. Do not enter real KYC or private data."}</p>
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

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
