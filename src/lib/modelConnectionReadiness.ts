import type { RedactionReport } from "./aiReview";
import type { ModelSettings, ModelSettingsValidation } from "./modelProvider";

export type ModelConnectionReadinessStatus = "mock-ready" | "ready" | "needs-config" | "blocked";

export type ModelConnectionReadiness = {
  status: ModelConnectionReadinessStatus;
  headline: string;
  detail: string;
  checklist: string[];
  blockers: string[];
};

export function createModelConnectionReadiness(
  settings: ModelSettings,
  validation: ModelSettingsValidation,
  redactionReport: RedactionReport
): ModelConnectionReadiness {
  if (redactionReport.status === "blocked") {
    return {
      status: "blocked",
      headline: "Model call blocked by Redaction Gate",
      detail: "Sensitive material must be removed before LexProof sends audit-prep summaries to any model.",
      checklist: [
        "Remove private-key-like or secret material before model review.",
        "Recheck the Redaction Gate before running AI Review.",
        "Keep model output limited to audit preparation materials."
      ],
      blockers: ["Redaction Gate blocked this model call."]
    };
  }

  if (!validation.valid) {
    return {
      status: "needs-config",
      headline: "Model connection needs configuration",
      detail: "Complete the model settings before running a live OpenAI-compatible review.",
      checklist: [
        "Enter a session-only endpoint, model name, and API key.",
        "Confirm the payload preview contains no raw KYC, private keys, or personal data.",
        "Register the model purpose and human-review owner in Model Intake."
      ],
      blockers: validation.errors
    };
  }

  const redactionChecklist =
    redactionReport.status === "needs-review"
      ? ["Review redaction warnings before relying on model output."]
      : ["Redaction Gate has no current blockers."];

  if (settings.provider === "mock") {
    return {
      status: "mock-ready",
      headline: "Mock local reviewer ready",
      detail: "The built-in mock reviewer can run without network access or credentials for demos and tests.",
      checklist: [
        "No API key is needed for the mock reviewer.",
        ...redactionChecklist,
        "AI output remains draft audit preparation only."
      ],
      blockers: []
    };
  }

  return {
    status: "ready",
    headline: "OpenAI-compatible model configured",
    detail: "The live provider settings are complete for this browser session. Credentials are not stored in localStorage.",
    checklist: [
      "API key is held in browser state for this session only.",
      ...redactionChecklist,
      "Run receipts will record payload and response hashes without storing credentials."
    ],
    blockers: []
  };
}
