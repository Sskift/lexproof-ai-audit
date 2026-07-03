import type { DemoScenario } from "../lib/demoScenarioLibrary";

export const DEMO_SCENARIO_BOUNDARY = "Not legal advice. Demo scenarios are synthetic audit preparation paths only.";

export const demoScenarios: DemoScenario[] = [
  {
    id: "yieldpassport-judge-path",
    projectName: "YieldPassport",
    title: "High-risk RWA launch",
    summary:
      "Tokenized private credit, custody, US FinCEN/BSA and EU TFR transfer controls, EU DORA operational resilience, retail exposure, AI review, and manifest handoff.",
    estimatedMinutes: 8,
    recommendedStartTab: "risk",
    judgePath: [
      "Validate model",
      "Add evidence",
      "Run risk audit",
      "Inspect US FinCEN/BSA CVC transfer gaps",
      "Inspect EU TFR Travel Rule transfer gaps",
      "Inspect EU DORA ICT resilience gaps",
      "Download GRC tickets",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Evidence Manifest", "GRC Ticket Export", "Counsel Pack Markdown"],
    focusTags: ["RWA", "US FinCEN/BSA", "EU TFR", "EU DORA", "AI governance", "Evidence vault"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "clauseguard-review-path",
    projectName: "ClauseGuard DAO",
    title: "DAO proposal review",
    summary:
      "DAO governance proposal, US SEC DAO Report source control, US CFTC Ooki DAO derivatives-platform source control, UK DAO scoping source control, multisig evidence, AI event intake, and returned-review recovery.",
    estimatedMinutes: 7,
    recommendedStartTab: "review",
    judgePath: [
      "Open human review",
      "Inspect DAO governance and CFTC derivatives-platform source controls",
      "Return evidence for support",
      "Inspect evidence status",
      "Run secure review journey",
      "Download review timeline"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Human Review Timeline", "Counsel Pack Version"],
    focusTags: ["DAO governance", "US SEC DAO Report", "US CFTC Ooki DAO", "UK Law Commission", "Human review"],
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
    summary:
      "Model-connect governance, AI event intake, US NIST AI RMF / GenAI Profile, EU AI Act, UK ICO source review, human review, and counsel export.",
    estimatedMinutes: 6,
    recommendedStartTab: "model",
    judgePath: [
      "Connect model",
      "Register AI event",
      "Route human review",
      "Inspect US NIST / EU AI Act / UK ICO source review",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Model Intake JSON", "Human Review Timeline", "Counsel Pack Markdown"],
    focusTags: ["AI legal workflow", "US NIST AI RMF", "EU AI Act", "UK ICO", "Model governance", "Counsel handoff"],
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
  },
  {
    id: "swiss-stablecoin-source-path",
    projectName: "Helvetia Stablecoin Review",
    title: "Swiss FINMA stablecoin review",
    summary:
      "Switzerland FINMA ICO token-classification and Guidance 06/2024 stablecoin review with redemption-claim, bank-guarantee, AML, sanctions, transfer-risk, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Swiss FINMA source graph",
      "Review token classification and prospectus evidence gaps",
      "Check stablecoin issuer, bank-guarantee, AML, sanctions, and transfer-risk evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Switzerland", "FINMA", "Stablecoin", "Token classification"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "singapore-dpt-custody-source-path",
    projectName: "HarborKey DPT Custody Review",
    title: "Singapore DPT custody review",
    summary: "Singapore DPT customer-asset safeguards, custody disclosure, reconciliation, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect MAS customer asset safeguards",
      "Review custody segregation evidence gaps",
      "Check custody disclosure and reconciliation evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Singapore", "DPT custody", "Customer assets"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "hong-kong-vatp-custody-source-path",
    projectName: "HarborBridge VATP Custody Review",
    title: "Hong Kong VATP custody review",
    summary: "Hong Kong SFC VATP client-asset custody, associated-entity, wallet governance, reconciliation, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect SFC VATP custody controls",
      "Review associated-entity and client-asset evidence gaps",
      "Check wallet governance and compensation evidence gaps",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Hong Kong", "VATP custody", "SFC"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "hong-kong-stablecoin-issuer-source-path",
    projectName: "HarborMint Stablecoin Issuer Review",
    title: "Hong Kong HKMA stablecoin issuer review",
    summary:
      "Hong Kong HKMA Stablecoins Ordinance issuer licensing, reserve-asset backing, redemption, AML/CFT, user-protection, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect HKMA stablecoin issuer source controls",
      "Review licensing and activity-scope evidence gaps",
      "Check reserve, redemption, AML/CFT, and user-protection evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Hong Kong", "HKMA", "Stablecoin", "AML/CFT"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "japan-crypto-custody-source-path",
    projectName: "SakuraKey Crypto Custody Review",
    title: "Japan crypto custody review",
    summary:
      "Japan FSA crypto-asset exchange custody, user-asset protection, cold-wallet/offline management, reconciliation, leakage-response, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Japan FSA custody controls",
      "Review user-asset protection evidence gaps",
      "Check cold-wallet reconciliation and leakage-response evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Japan", "FSA", "Crypto custody"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "canada-ctp-custody-source-path",
    projectName: "MapleVault CTP Custody Review",
    title: "Canada CTP custody review",
    summary:
      "Canada CSA crypto asset trading platform PRU, client-asset custody and segregation, acceptable third-party custodian, no re-hypothecation, no leverage, VRCA consent, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Canada CSA CTP controls",
      "Review PRU and investor-protection evidence gaps",
      "Check custody segregation, custodian assurance, and no re-hypothecation evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Canada", "CSA", "CTP custody"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "australia-digital-asset-source-path",
    projectName: "SouthernCross Digital Asset Review",
    title: "Australia digital asset review",
    summary:
      "Australia ASIC digital-asset financial services and custody controls plus AUSTRAC virtual asset AML/CTF, CDD, travel-rule, reporting, and recordkeeping counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Australia ASIC/AUSTRAC source graph",
      "Review digital-asset financial services and custody evidence gaps",
      "Check VASP AML/CTF, CDD, reporting, and recordkeeping evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Australia", "ASIC", "AUSTRAC", "VASP AML/CTF"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "korea-vasp-user-protection-source-path",
    projectName: "HanRiver VASP User Protection Review",
    title: "Korea VASP user protection review",
    summary:
      "South Korea FSC Virtual Asset User Protection Act and KoFIU VASP reporting / AML review with deposit custody, cold-wallet, disclosure, CDD/EDD, STR, and reporting evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Korea FSC/KoFIU source graph",
      "Review user-asset protection and custody evidence gaps",
      "Check VASP reporting, AML/CFT, CDD, and STR evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["South Korea", "FSC", "KoFIU", "VASP AML/CFT"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "india-vda-pmla-source-path",
    projectName: "Mumbai VDA PMLA Review",
    title: "India VDA PMLA review",
    summary:
      "India FIU-IND/PMLA VDA service provider review with Reporting Entity registration, AML/CFT/CPF program, KYC/CDD/EDD, STR/monthly reporting, risk assessment, Travel Rule, and record-retention evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect India FIU-IND/PMLA source graph",
      "Review VDA activity-scope and Reporting Entity evidence gaps",
      "Check AML/CFT, CDD/EDD, STR, Travel Rule, and reporting evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["India", "FIU-IND", "PMLA", "VDA AML/CFT"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "uk-cryptoasset-aml-source-path",
    projectName: "Thames Cryptoasset AML Review",
    title: "UK cryptoasset AML review",
    summary:
      "UK FCA/MLRs cryptoasset business review with activity scope, MLR registration, AML/CTF/CPF framework, MLRO, BWRA/CRA, SAR, sanctions, transaction monitoring, Travel Rule, and record-retrieval evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect UK FCA/MLR source graph",
      "Review cryptoasset activity-scope and registration evidence gaps",
      "Check AML/CTF/CPF, SAR, sanctions, transaction monitoring, and Travel Rule evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["United Kingdom", "FCA", "MLRs", "Travel Rule"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "uae-vara-operating-source-path",
    projectName: "Dubai VARA Operating Review",
    title: "UAE VARA operating review",
    summary:
      "Dubai VARA virtual-asset activity-scope, licensing, compliance management, AML/CFT, client virtual asset custody, proof-of-reserves, reconciliation, and local-counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect UAE VARA operating source graph",
      "Review virtual-asset activity-scope and licensing evidence gaps",
      "Check AML/CFT, client virtual asset custody, proof-of-reserves, and reconciliation evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["United Arab Emirates", "VARA", "Compliance", "Client virtual assets"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "germany-micar-custody-source-path",
    projectName: "RhineVault MiCAR Custody Review",
    title: "Germany MiCAR custody review",
    summary:
      "Germany BaFin/MiCAR crypto-asset custody review with CASP authorisation or Article 60 notification assumptions, Article 75 custody policy, client-position, segregation, return-process, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Germany BaFin/MiCAR custody source graph",
      "Review CASP authorisation and Article 60/62 evidence gaps",
      "Check Article 75 custody safeguarding and client-position evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Germany", "BaFin", "MiCAR", "Crypto custody"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "cross-border-marketing-claims-path",
    projectName: "SignalBridge Marketing Review",
    title: "Marketing claims review",
    summary:
      "US FTC, EU MiCA, UK FCA, and VARA 2024 virtual-asset marketing review with creator endorsement, cross-border communication, KOL incentive, risk-warning, recordkeeping, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "counsel",
    judgePath: [
      "Inspect US, EU MiCA, UK, and VARA 2024 marketing source controls",
      "Review promotion approval evidence gaps",
      "Review KOL, incentive, and recordkeeping evidence gaps",
      "Select Marketing Claims counsel pack",
      "Export Marketing Claims counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Marketing Claims Counsel Pack", "Source Pack JSON"],
    focusTags: ["Marketing claims", "US FTC", "EU MiCA", "UK FCA", "VARA 2024 marketing"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  }
];
