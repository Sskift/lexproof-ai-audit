import { Clock3, PackageCheck, PlayCircle, Route } from "lucide-react";
import type { DemoScenario } from "../lib/demoScenarioLibrary";

type DemoScenarioLibraryProps = {
  scenarios: DemoScenario[];
  activeProjectName: string;
  onStartScenario: (scenarioId: string) => void;
};

export function DemoScenarioLibrary({ scenarios, activeProjectName, onStartScenario }: DemoScenarioLibraryProps) {
  if (scenarios.length === 0) {
    return null;
  }

  return (
    <section className="demo-scenario-library" aria-label="Demo Scenario Library">
      <div className="demo-scenario-header">
        <div>
          <p className="eyebrow">Judge path</p>
          <h2>Demo Scenario Library</h2>
        </div>
        <Route size={18} aria-hidden="true" />
      </div>
      <p className="demo-scenario-boundary">{scenarios[0].notLegalAdviceBoundary}</p>

      <div className="demo-scenario-list">
        {scenarios.map((scenario) => {
          const isActive = scenario.projectName === activeProjectName;

          return (
            <article className={`demo-scenario-card${isActive ? " active" : ""}`} key={scenario.id}>
              <header>
                <div>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.summary}</p>
                </div>
                <span className="demo-scenario-time">
                  <Clock3 size={14} aria-hidden="true" />
                  {scenario.estimatedMinutes} min
                </span>
              </header>

              <div className="demo-scenario-tags">
                {scenario.focusTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="demo-scenario-meta">
                <Route size={14} aria-hidden="true" />
                <span>{scenario.judgePath.join(" -> ")}</span>
              </div>

              <div className="demo-scenario-meta">
                <PackageCheck size={14} aria-hidden="true" />
                <span>{scenario.expectedArtifacts.join(", ")}</span>
              </div>

              <button type="button" onClick={() => onStartScenario(scenario.id)} aria-pressed={isActive}>
                <PlayCircle size={16} aria-hidden="true" />
                Start {scenario.title}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
