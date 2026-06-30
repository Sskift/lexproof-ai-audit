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
  },
  {
    id: "lexassist-ai-workflow-path",
    projectName: "LexAssist Evidence Desk",
    title: "AI legal workflow review",
    summary: "Model-connect governance, AI event intake, source review, human review, and counsel export.",
    estimatedMinutes: 6,
    recommendedStartTab: "model",
    judgePath: [
      "Connect model",
      "Register AI event",
      "Route human review",
      "Inspect source review",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Model Intake JSON", "Human Review Timeline", "Counsel Pack Markdown"],
    focusTags: ["AI legal workflow", "Model governance", "Counsel handoff"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "brazil-vasp-source-path",
    projectName: "Brazil VASP Launch Review",
    title: "Brazil VASP source review",
    summary: "Brazil virtual asset service, CVM crypto-security, AML/CFT, custody, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Brazil source graph",
      "Review VASP authorization evidence gaps",
      "Check crypto-security disclosure gaps",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Brazil", "VASP", "Source graph"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  }
];
