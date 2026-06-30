import type { DemoScenario } from "../lib/demoScenarioLibrary";

export const DEMO_SCENARIO_BOUNDARY = "Not legal advice. Demo scenarios are synthetic audit preparation paths only.";

export const demoScenarios: DemoScenario[] = [
  {
    id: "yieldpassport-judge-path",
    projectName: "YieldPassport",
    title: "High-risk RWA launch",
    summary: "Tokenized private credit, custody, retail exposure, AI review, and manifest handoff.",
    estimatedMinutes: 8,
    recommendedStartTab: "risk",
    judgePath: [
      "Validate model",
      "Add evidence",
      "Run risk audit",
      "Download GRC tickets",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Evidence Manifest", "GRC Ticket Export", "Counsel Pack Markdown"],
    focusTags: ["RWA", "AI governance", "Evidence vault"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "clauseguard-review-path",
    projectName: "ClauseGuard DAO",
    title: "DAO proposal review",
    summary: "Governance proposal review with multisig evidence, AI event intake, and returned-review recovery.",
    estimatedMinutes: 7,
    recommendedStartTab: "review",
    judgePath: [
      "Open human review",
      "Return evidence for support",
      "Inspect evidence status",
      "Run secure review journey",
      "Download review timeline"
    ],
    expectedArtifacts: ["Human Review Timeline", "Evidence Manifest", "Counsel Pack Version"],
    focusTags: ["DAO governance", "Multisig", "Human review"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "openclause-source-path",
    projectName: "OpenClause Atlas",
    title: "Public source education review",
    summary: "Lower-risk public education project focused on official-source lineage and export safety.",
    estimatedMinutes: 5,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Review jurisdiction checklist",
      "Inspect source graph",
      "Confirm export safety",
      "Save counsel pack version"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Counsel Pack Markdown", "Manifest JSON"],
    focusTags: ["Public materials", "Source graph", "Export safety"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  }
];
