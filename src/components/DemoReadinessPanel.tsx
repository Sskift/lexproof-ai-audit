import { useMemo, useState } from "react";
import { CheckCircle2, MonitorCheck, PlayCircle, ServerCog, TerminalSquare, TriangleAlert } from "lucide-react";
import type { DemoScenarioValidationResult } from "../lib/demoScenarioLibrary";
import {
  checkDemoApiPreflight,
  createDemoReadinessReport,
  type DemoApiPreflight,
  type DemoReadinessCheckStatus,
  type DemoReadinessStatus
} from "../lib/demoReadiness";

type DemoReadinessPanelProps = {
  scenarioValidation: DemoScenarioValidationResult;
  scenarioCount: number;
  screenshotRefs: string[];
};

export function DemoReadinessPanel({ scenarioValidation, scenarioCount, screenshotRefs }: DemoReadinessPanelProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiPreflight, setApiPreflight] = useState<DemoApiPreflight>({ status: "not-checked" });
  const [checking, setChecking] = useState(false);
  const report = useMemo(
    () =>
      createDemoReadinessReport({
        scenarioValidation,
        scenarioCount,
        screenshotRefs,
        apiPreflight
      }),
    [apiPreflight, scenarioCount, scenarioValidation, screenshotRefs]
  );

  const checkApi = async () => {
    setChecking(true);

    try {
      setApiPreflight(await checkDemoApiPreflight({ apiBaseUrl }));
    } finally {
      setChecking(false);
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
