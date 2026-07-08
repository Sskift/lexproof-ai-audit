import { describe, expect, it } from "vitest";
import { createApiPreflightReport, exportApiPreflightJson, listApiPreflightRouteFamilies } from "./apiPreflight";

describe("api preflight report", () => {
  it("creates a stable report hash across generatedAt changes", async () => {
    const first = await createApiPreflightReport({ generatedAt: "2026-07-01T00:00:00.000Z" });
    const second = await createApiPreflightReport({ generatedAt: "2026-07-04T00:00:00.000Z" });

    expect(first.reportHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.reportHash).toBe(second.reportHash);
    expect(first.generatedAt).not.toBe(second.generatedAt);
    expect(first.externalSideEffectsAllowed).toBe(false);
    expect(first.notLegalAdviceBoundary).toContain("Not legal advice");
  });

  it("changes the report hash when a safe route family contract changes", async () => {
    const routeFamilies = listApiPreflightRouteFamilies();
    const baseline = await createApiPreflightReport({ routeFamilies });
    const changed = await createApiPreflightReport({
      routeFamilies: routeFamilies.map((route) =>
        route.id === "evidence-vault-manifest"
          ? { ...route, responseContract: "EvidenceVaultManifestV2" }
          : route
      )
    });

    expect(changed.reportHash).not.toBe(baseline.reportHash);
  });

  it("redacts unsafe free text while preserving metadata-only boundaries", async () => {
    const report = await createApiPreflightReport({
      generatedAt: "2026-07-01T00:00:00.000Z",
      capabilities: [
        {
          id: "model-connect",
          status: "ready sk-live-abcdef1234567890abcdef1234567890",
          summary: "Do not accept private key 0x1111111111111111111111111111111111111111111111111111111111111111 or raw KYC."
        }
      ],
      limitations: ["API preflight must not include bearer token abcdefghijklmnopqrstuvwxyz or final legal decision text."]
    });
    const exported = exportApiPreflightJson(report);

    expect(exported).toContain("[redacted-api-key]");
    expect(exported).toContain("[redacted-private-key]");
    expect(exported).toContain("[redacted-raw-kyc]");
    expect(exported).not.toContain("sk-live");
    expect(exported).not.toContain("0x1111111111111111111111111111111111111111111111111111111111111111");
    expect(exported).toContain("Not legal advice");
    expect(report.routeFamilyCount).toBe(16);
    expect(report.implementedRouteCount).toBeGreaterThan(20);
  });
});
