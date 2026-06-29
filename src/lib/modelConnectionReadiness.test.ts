import { describe, expect, it } from "vitest";
import { createRedactionReport } from "./aiReview";
import { createModelConnectionReadiness } from "./modelConnectionReadiness";
import { validateModelSettings, type ModelSettings } from "./modelProvider";
import type { EvidenceItem } from "./projectModel";

describe("createModelConnectionReadiness", () => {
  it("treats mock settings as ready without credentials", () => {
    const settings: ModelSettings = { provider: "mock", model: "lexproof-mock" };
    const readiness = createModelConnectionReadiness(settings, validateModelSettings(settings), createRedactionReport([]));

    expect(readiness.status).toBe("mock-ready");
    expect(readiness.headline).toBe("Mock local reviewer ready");
    expect(readiness.checklist).toContain("No API key is needed for the mock reviewer.");
  });

  it("returns required configuration errors for incomplete OpenAI-compatible settings", () => {
    const settings: ModelSettings = { provider: "openai-compatible", model: "", baseUrl: "", apiKey: "" };
    const readiness = createModelConnectionReadiness(settings, validateModelSettings(settings), createRedactionReport([]));

    expect(readiness.status).toBe("needs-config");
    expect(readiness.headline).toBe("Model connection needs configuration");
    expect(readiness.blockers).toEqual([
      "Base URL is required for OpenAI-compatible providers.",
      "Model name is required.",
      "API key is required for live model calls."
    ]);
  });

  it("blocks model calls when the redaction gate finds private-key-like evidence", () => {
    const settings: ModelSettings = {
      provider: "openai-compatible",
      model: "legal-review-model",
      baseUrl: "https://models.example.com/v1",
      apiKey: "sk-test"
    };
    const evidence: EvidenceItem = {
      id: "evidence-1",
      label: "Signer secret note",
      kind: "Markdown",
      content: `private key 0x${"a".repeat(64)}`,
      status: "received",
      owner: "Compliance"
    };
    const readiness = createModelConnectionReadiness(
      settings,
      validateModelSettings(settings),
      createRedactionReport([evidence])
    );

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("Redaction Gate blocked this model call.");
    expect(readiness.checklist).toContain("Remove private-key-like or secret material before model review.");
  });
});
