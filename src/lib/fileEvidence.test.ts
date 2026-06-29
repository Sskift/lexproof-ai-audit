import { describe, expect, it } from "vitest";
import { createEvidenceItemFromFile, hashLocalFile } from "./fileEvidence";

const modifiedAt = Date.UTC(2026, 5, 29, 8, 0, 0);

describe("hashLocalFile", () => {
  it("creates a stable SHA-256 hash for the same local file bytes", async () => {
    const file = new File(["Launch approval memo v1"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: modifiedAt
    });

    const first = await hashLocalFile(file);
    const second = await hashLocalFile(file);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the file hash when local file bytes change", async () => {
    const original = new File(["Launch approval memo v1"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: modifiedAt
    });
    const changed = new File(["Launch approval memo v2"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: modifiedAt
    });

    await expect(hashLocalFile(changed)).resolves.not.toBe(await hashLocalFile(original));
  });
});

describe("createEvidenceItemFromFile", () => {
  it("turns local file metadata into an evidence item without storing raw file content", async () => {
    const file = new File(["Private launch approval memo body"], "launch-approval.pdf", {
      type: "application/pdf",
      lastModified: modifiedAt
    });

    const item = await createEvidenceItemFromFile(file, {
      owner: "Compliance",
      status: "received"
    });

    expect(item).toMatchObject({
      label: "launch-approval.pdf",
      kind: "Local file metadata",
      source: "local file: launch-approval.pdf",
      status: "received",
      owner: "Compliance"
    });
    expect(item.content).toContain("File SHA-256:");
    expect(item.content).toContain("File name: launch-approval.pdf");
    expect(item.content).toContain("MIME type: application/pdf");
    expect(item.content).toContain("Last modified: 2026-06-29T08:00:00.000Z");
    expect(item.content).not.toContain("Private launch approval memo body");
  });
});
