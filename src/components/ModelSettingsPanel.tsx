import { Settings2 } from "lucide-react";
import type { ModelSettings, ModelSettingsValidation } from "../lib/modelProvider";

type ModelSettingsPanelProps = {
  settings: ModelSettings;
  validation: ModelSettingsValidation;
  onChange: (settings: ModelSettings) => void;
};

export function ModelSettingsPanel({ settings, validation, onChange }: ModelSettingsPanelProps) {
  const update = (updates: Partial<ModelSettings>) => onChange({ ...settings, ...updates });

  return (
    <section className="model-settings">
      <div className="panel-title compact-title">
        <Settings2 size={17} aria-hidden="true" />
        <h3>Model Settings</h3>
      </div>

      <div className="settings-grid">
        <div>
          <label className="field-label" htmlFor="model-provider">
            Provider
          </label>
          <select
            id="model-provider"
            value={settings.provider}
            onChange={(event) =>
              update({
                provider: event.target.value as ModelSettings["provider"],
                model: event.target.value === "mock" ? "lexproof-mock" : settings.model
              })
            }
          >
            <option value="mock">Mock local reviewer</option>
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="model-name">
            Model name
          </label>
          <input id="model-name" value={settings.model} onChange={(event) => update({ model: event.target.value })} />
        </div>

        {settings.provider === "openai-compatible" ? (
          <>
            <div>
              <label className="field-label" htmlFor="model-base-url">
                Base URL
              </label>
              <input
                id="model-base-url"
                value={settings.baseUrl ?? ""}
                onChange={(event) => update({ baseUrl: event.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="model-api-key">
                API key
              </label>
              <input
                id="model-api-key"
                value={settings.apiKey ?? ""}
                onChange={(event) => update({ apiKey: event.target.value })}
                placeholder="Stored in memory for this browser session"
                type="password"
              />
            </div>
          </>
        ) : null}
      </div>

      {validation.errors.length > 0 ? (
        <ul className="validation-list">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <p className="save-state">Model calls use audit-prep summaries. Do not send raw KYC, private keys, or personal data.</p>
    </section>
  );
}
