import type { DemoScenario } from "../lib/demoScenarioLibrary";

export const DEMO_SCENARIO_BOUNDARY = "Not legal advice. Demo scenarios are synthetic audit preparation paths only.";

export const demoScenarios: DemoScenario[] = [
  {
    id: "yieldpassport-judge-path",
    projectName: "YieldPassport",
    title: "High-risk RWA launch",
    summary:
      "Tokenized private credit, New York resident access, custody, NYDFS BitLicense/custody review, US FinCEN/BSA, EU DLT Pilot, EU TFR transfer controls, EU DORA operational resilience, retail exposure, AI review, and manifest handoff.",
    estimatedMinutes: 8,
    recommendedStartTab: "risk",
    judgePath: [
      "Validate model",
      "Add evidence",
      "Run risk audit",
      "Inspect NYDFS BitLicense and custody customer-protection gaps",
      "Inspect US FinCEN/BSA CVC transfer gaps",
      "Inspect EU DLT Pilot market infrastructure perimeter gaps",
      "Inspect EU TFR Travel Rule transfer gaps",
      "Inspect EU DORA ICT resilience gaps",
      "Download GRC tickets",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Evidence Manifest", "GRC Ticket Export", "Counsel Pack Markdown"],
    focusTags: ["RWA", "NYDFS BitLicense", "US FinCEN/BSA", "EU DLT Pilot", "EU TFR", "EU DORA", "AI governance", "Evidence vault"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "clauseguard-review-path",
    projectName: "ClauseGuard DAO",
    title: "DAO proposal review",
    summary:
      "DAO governance proposal, US SEC DAO Report source control, US CFTC Ooki DAO derivatives-platform source control, EU MiCA decentralisation/CASP perimeter source control, UK DAO scoping source control, multisig evidence, AI event intake, and returned-review recovery.",
    estimatedMinutes: 7,
    recommendedStartTab: "review",
    judgePath: [
      "Open human review",
      "Inspect DAO governance, CFTC derivatives-platform, EU MiCA DAO perimeter, and UK DAO source controls",
      "Return evidence for support",
      "Inspect evidence status",
      "Run secure review journey",
      "Download review timeline"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Human Review Timeline", "Counsel Pack Version"],
    focusTags: ["DAO governance", "US SEC DAO Report", "US CFTC Ooki DAO", "EU MiCA DAO perimeter", "UK Law Commission", "Human review"],
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
      "Model-connect governance, AI event intake, ABA Formal Opinion 512 professional-responsibility review, US NIST AI RMF / GenAI Profile, EU AI Act, UK ICO source review, human review, and counsel export.",
    estimatedMinutes: 6,
    recommendedStartTab: "model",
    judgePath: [
      "Connect model",
      "Register AI event",
      "Route human review",
      "Inspect ABA Formal Opinion 512 / US NIST / EU AI Act / UK ICO source review",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Model Intake JSON", "Human Review Timeline", "Counsel Pack Markdown"],
    focusTags: ["AI legal workflow", "ABA Formal Opinion 512", "US NIST AI RMF", "EU AI Act", "UK ICO", "Model governance", "Counsel handoff"],
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
    id: "us-genius-stablecoin-source-path",
    projectName: "LibertyDollar Stablecoin Review",
    title: "US GENIUS Act stablecoin review",
    summary:
      "US payment stablecoin issuer review for GENIUS Act permitted-issuer route, reserve, redemption, monthly disclosure, BSA/AML, sanctions, custody, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect US GENIUS Act stablecoin source controls",
      "Review permitted-issuer, reserve, redemption, and disclosure evidence gaps",
      "Check BSA/AML, sanctions, custody, and no-raw-KYC evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["United States", "GENIUS Act", "Stablecoin", "BSA/AML", "Sanctions"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "eu-mica-stablecoin-issuer-source-path",
    projectName: "EuroMint MiCA Stablecoin Review",
    title: "EU MiCA ART/EMT stablecoin review",
    summary:
      "EU MiCA asset-referenced token and e-money token issuer review for classification, authorisation or notification route, white paper, reserve, redemption, recovery, custody, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect EU MiCA ART/EMT stablecoin source controls",
      "Review issuer authorisation, white paper, and public-offer evidence gaps",
      "Check reserve, redemption, recovery, custody, and no-raw-customer-record evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["European Union", "MiCA", "ART", "EMT", "Stablecoin"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "uk-stablecoin-issuer-source-path",
    projectName: "SterlingMint Stablecoin Review",
    title: "UK qualifying stablecoin issuer review",
    summary:
      "UK qualifying stablecoin issuer review for UKQS issuer route, admission or distribution scope, disclosures, backing assets, safeguarding, redemption, recordkeeping, systemic-transition, and counsel handoff evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect UK qualifying stablecoin issuer source controls",
      "Review issuer permission, admission, and disclosure evidence gaps",
      "Check backing, safeguarding, redemption, systemic-transition, and no-raw-customer-record evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["United Kingdom", "FCA", "Bank of England", "Stablecoin"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "singapore-dpt-custody-source-path",
    projectName: "HarborKey DPT Custody Review",
    title: "Singapore DPT custody review",
    summary:
      "Singapore DPT PSN02 AML/CFT, customer-asset safeguards, custody disclosure, reconciliation, data-redaction, and counsel handoff review.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect MAS PSN02 AML/CFT and PS-G03 customer asset safeguards",
      "Review AML/CFT, CDD, sanctions, and data-redaction handoff evidence gaps",
      "Check custody disclosure and reconciliation evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Singapore", "DPT custody", "MAS PSN02", "AML/CFT", "Customer assets"],
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
    id: "thailand-digital-asset-custody-source-path",
    projectName: "Bangkok Digital Asset Custody Review",
    title: "Thailand digital asset custody review",
    summary:
      "Thailand SEC digital asset business license/custody review and AMLO AML/CDD review with client-asset records, transfer approvals, reconciliation, beneficial-owner, and high-risk customer evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Thailand SEC and AMLO source graph",
      "Review digital asset business license and custody evidence gaps",
      "Check AML/CDD, beneficial-owner, high-risk customer, and internal-control evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Thailand", "SEC", "AMLO", "Digital asset custody"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "indonesia-ojk-crypto-trading-source-path",
    projectName: "Jakarta OJK Crypto Trading Review",
    title: "Indonesia OJK crypto trading review",
    summary:
      "Indonesia OJK digital financial asset and crypto asset trading review with PAKD/CPAKD status, SPRINT licensing, whitelist, product/instrument registration, reporting, governance, and consumer-protection evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Indonesia OJK source graph",
      "Review digital financial asset licensing and whitelist evidence gaps",
      "Check product registration, reporting, governance, and main-party competence evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Indonesia", "OJK", "Crypto asset trading", "Consumer protection"],
    notLegalAdviceBoundary: DEMO_SCENARIO_BOUNDARY
  },
  {
    id: "malaysia-digital-asset-exchange-source-path",
    projectName: "Kuala Lumpur Digital Asset Exchange Review",
    title: "Malaysia digital asset exchange review",
    summary:
      "Malaysia SC Digital Assets and BNM AML/CFT digital-currency review with RMO-DAX, digital broker, Digital Asset Custodian, tradeable-asset, reporting-institution, STR, recordkeeping, and no-raw-KYC evidence gaps.",
    estimatedMinutes: 6,
    recommendedStartTab: "jurisdiction",
    judgePath: [
      "Inspect Malaysia SC and BNM source graph",
      "Review DAX, digital broker, DAC, and custody evidence gaps",
      "Check AML/CFT reporting-institution, STR, recordkeeping, and no-raw-KYC evidence",
      "Export counsel pack"
    ],
    expectedArtifacts: ["Regulatory Source Graph", "Regulatory Source Pack", "Counsel Pack Markdown"],
    focusTags: ["Malaysia", "SC Malaysia", "BNM", "Digital asset exchange"],
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
