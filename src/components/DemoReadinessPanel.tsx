import { useMemo, useState } from "react";
import { CheckCircle2, Download, MonitorCheck, PlayCircle, ServerCog, TerminalSquare, TriangleAlert } from "lucide-react";
import type { DemoScenario, DemoScenarioValidationResult } from "../lib/demoScenarioLibrary";
import {
  checkDemoApiPreflight,
  createDemoReadinessReport,
  type DemoApiPreflight,
  type DemoReadinessCheckStatus,
  type DemoReadinessStatus
} from "../lib/demoReadiness";
import { createDemoRunbook, downloadDemoRunbookJson, type DemoRunbook } from "../lib/demoRunbook";

type DemoReadinessPanelProps = {
  scenarioValidation: DemoScenarioValidationResult;
  scenarios: DemoScenario[];
  screenshotRefs: string[];
};

export function DemoReadinessPanel({ scenarioValidation, scenarios, screenshotRefs }: DemoReadinessPanelProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiPreflight, setApiPreflight] = useState<DemoApiPreflight>({ status: "not-checked" });
  const [checking, setChecking] = useState(false);
  const [runbook, setRunbook] = useState<DemoRunbook | null>(null);
  const [buildingRunbook, setBuildingRunbook] = useState(false);
  const report = useMemo(
    () =>
      createDemoReadinessReport({
        scenarioValidation,
        scenarioCount: scenarios.length,
        screenshotRefs,
        apiPreflight
      }),
    [apiPreflight, scenarioValidation, scenarios.length, screenshotRefs]
  );

  const checkApi = async () => {
    setChecking(true);

    try {
      setApiPreflight(await checkDemoApiPreflight({ apiBaseUrl }));
    } finally {
      setChecking(false);
    }
  };

  const downloadRunbook = async () => {
    setBuildingRunbook(true);

    try {
      const nextRunbook = await createDemoRunbook({
        readinessReport: report,
        scenarios
      });
      setRunbook(nextRunbook);
      downloadDemoRunbookJson("lexproof-demo-runbook.json", nextRunbook);
    } finally {
      setBuildingRunbook(false);
    }
  };

  return (
    <section className={`demo-readiness-panel ${report.status}`} aria-label="Judge Demo Readiness">
      <div className="demo-readiness-header">
        <div>
          <p className="eyebrow">Judge readiness</p>
          <h3>Judge Demo Readiness</h3>
        </div>
        <span className={`workflow-status ${report.status}`}>{readinessStatusLabel(report.status)}</span>
      </div>
      <p className="section-note">{report.notLegalAdviceBoundary}</p>

      <div className="demo-readiness-grid">
        {report.checks.map((check) => {
          const Icon = iconForCheckStatus(check.status);

          return (
            <article key={check.id} className={`demo-readiness-check ${check.status}`}>
              <header>
                <Icon size={15} aria-hidden="true" />
                <strong>
                  {check.label} {checkStatusLabel(check.status)}
                </strong>
              </header>
              <p>{check.detail}</p>
              <small>{check.recoveryAction}</small>
            </article>
          );
        })}
      </div>

      <div className="demo-readiness-commands" aria-label="Clean clone commands">
        <TerminalSquare size={15} aria-hidden="true" />
        <span>{report.cleanCloneCommands.join(" -> ")}</span>
      </div>

      <div className="demo-readiness-api">
        <div>
          <label className="field-label" htmlFor="demo-api-base-url">
            Demo API base URL
          </label>
          <input
            id="demo-api-base-url"
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            placeholder="/api on same host, or http://127.0.0.1:8787"
          />
        </div>
        <button type="button" className="secondary" disabled={checking} onClick={() => void checkApi()}>
          <ServerCog size={16} aria-hidden="true" />
          {checking ? "Checking Demo API" : "Check Demo API"}
        </button>
      </div>

      <div className="demo-readiness-runbook" aria-label="Demo Runbook Export">
        <div>
          <strong>Demo Runbook JSON</strong>
          <span>
            {runbook
              ? `${shortHash(runbook.runbookHash)} · ${runbook.scenarioCount} scenarios · ${runbook.apiPreflightStatus}`
              : "Clean-clone commands, scenario paths, screenshots, API preflight, limitations, and Not legal advice boundary."}
          </span>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={buildingRunbook || scenarios.length === 0}
          onClick={() => void downloadRunbook()}
        >
          <Download size={16} aria-hidden="true" />
          {buildingRunbook ? "Building Demo Runbook" : "Download Demo Runbook JSON"}
        </button>
      </div>

      {apiPreflight.status === "ready" ? (
        <div className="demo-api-result ready">
          <MonitorCheck size={15} aria-hidden="true" />
          <div>
            <strong>{apiPreflight.version}</strong>
            <span>{apiPreflight.capabilities.join(", ")}</span>
            <small>{apiPreflight.notLegalAdviceBoundary}</small>
          </div>
        </div>
      ) : null}

      {apiPreflight.status === "failed" ? (
        <div className="demo-api-result failed">
          <TriangleAlert size={15} aria-hidden="true" />
          <div>
            <strong>Demo API preflight failed</strong>
            <span>{apiPreflight.error}</span>
            <small>{apiPreflight.recoveryAction}</small>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function readinessStatusLabel(status: DemoReadinessStatus): string {
  if (status === "needs-api") {
    return "needs API";
  }

  return status;
}

function checkStatusLabel(status: DemoReadinessCheckStatus): string {
  if (status === "not-checked") {
    return "not checked";
  }

  return status;
}

function iconForCheckStatus(status: DemoReadinessCheckStatus) {
  if (status === "ready") {
    return CheckCircle2;
  }

  if (status === "not-checked") {
    return PlayCircle;
  }

  return TriangleAlert;
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}
