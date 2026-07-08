import { describe, expect, it } from "vitest";
import {
  parseCounselPackExportRecord,
  parseStoredCounselPackExportRecords,
  sanitizeCounselPackExportRecord
} from "./counselPackExportRecords";
import type { CounselPackExportRecord } from "./phase2Types";

const record: CounselPackExportRecord = {
  recordVersion: "lexproof-counsel-pack-export-record-v1",
  id: "export-valid",
  workspaceId: "workspace-export",
  exportType: "counsel-pack",
  format: "markdown",
  version: 2,
  projectName: "YieldPassport",
  title: "YieldPassport Counsel Pack v2",
  artifactName: "yieldpassport-counsel-pack-v2.md",
  manifestHash: "a".repeat(64),
  artifactHash: "b".repeat(64),
  artifactSize: 4096,
  riskLevel: "critical",
  reviewSummary: {
    total: 7,
    reviewed: 1,
    readyForCounsel: 2,
    needsEvidence: 3,
    blocked: 1,
    open: 6
  },
  sourceCount: 2,
  sourcePackHash: "c".repeat(64),
  sourceReviewStatus: "review-due",
  jurisdictionReadinessDigest: {
    digestHash: "d".repeat(64),
    status: "needs-evidence",
    handoffAllowed: false,
    jurisdictionCount: 2,
    readyForCounselCount: 0,
    needsEvidenceCount: 2,
    needsSourceReviewCount: 0,
    metadataMissingCount: 0,
    openEvidenceRequestCount: 8,
    sourceFreshnessBlockerCount: 1,
    dueSoonSourceCount: 0,
    notLegalAdviceBoundary:
      "Not legal advice. Counsel Pack export jurisdiction readiness metadata is audit preparation workflow metadata only."
  },
  createdBy: "Compliance",
  status: "ready",
  createdAt: "2026-06-30T08:30:00.000Z",
  notLegalAdviceBoundary: "Not legal advice. Counsel Pack export records are audit preparation metadata only."
};

describe("Counsel Pack export record recovery", () => {
  it("sanitizes stored export records and drops unknown raw payload fields", () => {
    const restored = parseStoredCounselPackExportRecords(
      JSON.stringify([
        {
          ...record,
          projectName: "YieldPassport apiKey=supersecretvalue legal conclusion",
          title: "Legal opinion after raw_KYC passport A1234567 review",
          createdBy: "ana@example.com",
          rawMarkdown: "# Raw Markdown must not survive"
        }
      ])
    );

    expect(restored).toHaveLength(1);
    expect(restored[0]?.projectName).toContain("[redacted-secret]");
    expect(restored[0]?.projectName).toContain("[redacted-legal-conclusion]");
    expect(JSON.stringify(restored[0])).not.toContain("supersecretvalue");
    expect(JSON.stringify(restored[0])).not.toContain("apiKey");
    expect(JSON.stringify(restored[0])).not.toContain("Legal opinion");
    expect(JSON.stringify(restored[0])).not.toContain("legal conclusion");
    expect(JSON.stringify(restored[0])).not.toContain("raw_KYC");
    expect(JSON.stringify(restored[0])).not.toContain("A1234567");
    expect(JSON.stringify(restored[0])).not.toContain("ana@example.com");
    expect(restored[0]).not.toHaveProperty("rawMarkdown");
    expect(restored[0]?.title).toContain("[redacted-legal-conclusion]");
    expect(restored[0]?.title).toContain("[redacted-raw-kyc]");
    expect(restored[0]?.title).toContain("[redacted-passport-id]");
  });

  it("rejects malformed export records and invalid workflow fields", () => {
    expect(
      parseStoredCounselPackExportRecords(
        JSON.stringify([
          record,
          { ...record, id: "bad-boundary", notLegalAdviceBoundary: "Legal advice approved." },
          { ...record, id: "bad-hash", artifactHash: "not-a-hash" },
          { ...record, id: "bad-format", format: "docx" },
          { ...record, id: "bad-risk", riskLevel: "urgent" },
          { ...record, id: "bad-status", status: "archived" },
          { ...record, id: "bad-created", createdAt: "June 30, 2026" },
          {
            ...record,
            id: "bad-digest",
            jurisdictionReadinessDigest: {
              ...record.jurisdictionReadinessDigest,
              status: "approved"
            }
          }
        ])
      )
    ).toEqual([record]);
    expect(parseStoredCounselPackExportRecords("{not-json")).toEqual([]);
  });

  it("validates single server export responses before accepting them", () => {
    expect(parseCounselPackExportRecord(record)).toEqual(record);
    expect(parseCounselPackExportRecord({ ...record, sourceReviewStatus: "stale" })).toBeNull();
  });

  it("sanitizes local export record mutations without changing the non-advice boundary", () => {
    const sanitized = sanitizeCounselPackExportRecord({
      ...record,
      title: "Compliance decision after raw_KYC passport A1234567 review",
      createdBy: "Reviewer apiKey=supersecretvalue private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    });

    expect(sanitized.title).toContain("[redacted-legal-conclusion]");
    expect(sanitized.title).toContain("[redacted-raw-kyc]");
    expect(sanitized.title).toContain("[redacted-passport-id]");
    expect(sanitized.createdBy).toContain("[redacted-secret]");
    expect(sanitized.createdBy).toContain("[redacted-private-key]");
    expect(sanitized.createdBy).not.toContain("supersecretvalue");
    expect(sanitized.createdBy).not.toContain("apiKey");
    expect(sanitized.createdBy).not.toContain("0x1234567890abcdef");
    expect(sanitized.notLegalAdviceBoundary).toBe("Not legal advice. Counsel Pack export records are audit preparation metadata only.");
  });
});
