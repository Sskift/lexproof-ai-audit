import { describe, expect, it } from "vitest";
import { analyzeAuditProfile } from "./auditEngine";
import { createEvidenceItemsFromTemplate } from "./evidenceTemplates";
import { createJurisdictionPacks } from "./jurisdictionPacks";
import type { ProjectProfile } from "./projectModel";

const project: ProjectProfile = {
  id: "jurisdiction-pack-project",
  projectName: "Global Launch Desk",
  entityType: "Startup issuer",
  jurisdictions: [
    "United States",
    "European Union",
    "United Kingdom",
    "Singapore",
    "Hong Kong",
    "Japan",
    "Canada",
    "Australia",
    "South Korea",
    "India",
    "Thailand",
    "ID",
    "Malaysia",
    "PH",
    "ZA",
    "Switzerland",
    "Germany",
    "United Arab Emirates",
    "Brazil"
  ],
  assetModel: "Tokenized private credit note with yield",
  userType: "Retail and accredited investors",
  custodyModel: "Platform controls omnibus wallet",
  dataSensitivity: "KYC metadata and wallet transaction history",
  aiUsage: "AI flags missing approvals with source lineage",
  blockchainUse: "Simulated evidence anchor",
  operatingStage: "Planned public launch",
  evidenceItems: [
    {
      id: "us-approval",
      label: "US launch approval memo",
      kind: "Markdown",
      content: "Disclosure approval, offering memo, eligibility review, and go-live signoff.",
      status: "verified",
      owner: "Counsel"
    },
    {
      id: "thailand-register",
      label: "Thailand digital asset custody and AML/CDD register",
      kind: "Register",
      content:
        "Thailand digital asset business scope, digital asset exchange, broker, dealer, custodial wallet provider, SEC license route, client asset records, daily reconciliation, transfer approval, client asset use prohibition, AMLO, CDD EDD, beneficial ownership, high-risk customer, internal control, training, reporting owner, no raw KYC.",
      status: "verified",
      owner: "Compliance"
    },
    {
      id: "indonesia-register",
      label: "Indonesia OJK digital financial asset trading and whitelist register",
      kind: "Register",
      content:
        "Indonesia digital financial asset trading, Indonesia crypto asset trading, OJK, PAKD, CPAKD, whitelist, SPRINT licensing route, licensed registered operator, official app and website channels, consumer protection, POJK 27, POJK 23, SEOJK 20, product registration, instrument registration, daily report, monthly report, business plan, main parties, competence, compliance assessment, governance, integrity, no raw KYC.",
      status: "verified",
      owner: "Compliance"
    },
    {
      id: "malaysia-register",
      label: "Malaysia digital asset exchange custody and AML/CFT register",
      kind: "Register",
      content:
        "Malaysia digital asset exchange, digital broker, RMO-DAX, DAX operator, Digital Asset Custodian, DAC registration route, IEO assumptions, SC Malaysia regulated-player source mapping, official app and website channels, tradeable asset, Shariah review assumptions, custody safeguarding, Bank Negara Malaysia, BNM digital currency exchanger, reporting institution, AML CFT, customer identification, CDD EDD, beneficial ownership, STR, compliance officer, recordkeeping, transparency, no raw KYC.",
      status: "verified",
      owner: "Compliance"
    },
    {
      id: "philippines-register",
      label: "Philippines BSP VASP custody and AML/CFT risk-management register",
      kind: "Register",
      content:
        "Philippines VASP, Philippine VASP, Bangko Sentral, BSP, Certificate of Authority, money service business, virtual asset service provider, crypto asset service provider, CASP, VA exchange, VA transfer, VA custodian, safekeeping, wallet security, retail access, Philippines AML CFT, BSP AML, risk assessment, due diligence, EDD, proof of registration, adverse media, FATF Recommendation 16, payment transparency, transaction monitoring, suspicious transaction report, STR, recordkeeping, staff training, no raw KYC.",
      source: "regulatory control: control-ph-bsp-vasp-casp-risk-management-aml",
      status: "verified",
      owner: "Compliance"
    },
    {
      id: "south-africa-register",
      label: "South Africa CASP licensing and Travel Rule RMCP register",
      kind: "Register",
      content:
        "South Africa CASP, South African CASP, ZA CASP, FSCA, crypto asset financial product, FAIS, FSP licence, financial services provider, advice, intermediary services, investment management, business model, operational ability, fit and proper owner, Financial Intelligence Centre, FIC Directive 9, Travel Rule, ordering crypto asset service provider, intermediary crypto asset service provider, recipient crypto asset service provider, originator beneficiary metadata handling, counterparty CASP due diligence, secure transmission, incomplete transfer suspend return workflow, unhosted wallet policy, Risk Management and Compliance Programme, RMCP, recordkeeping, no raw KYC.",
      source: "regulatory control: control-za-fsca-fic-casp-licensing-travel-rule",
      status: "verified",
      owner: "Compliance"
    }
  ]
};

describe("createJurisdictionPacks", () => {
  it("creates deeper jurisdiction packs with policy controls and local-counsel routing", () => {
    const audit = analyzeAuditProfile(project);
    const packs = createJurisdictionPacks(project, audit);

    expect(packs.map((pack) => pack.jurisdiction)).toEqual(
      expect.arrayContaining([
        "United States",
        "European Union",
        "United Kingdom",
        "Singapore",
        "Hong Kong",
        "Japan",
        "Canada",
        "Australia",
        "South Korea",
        "India",
        "Thailand",
        "Indonesia",
        "Malaysia",
        "Philippines",
        "South Africa",
        "Switzerland",
        "Germany",
        "United Arab Emirates",
        "Brazil"
      ])
    );

    const usPack = packs.find((pack) => pack.jurisdiction === "United States");
    expect(usPack).toMatchObject({
      packVersion: "lexproof-jurisdiction-pack-v1",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel",
        trigger: "Yield-bearing or investment-like asset"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-offering-disclosure-control",
          title: "Offering and disclosure control",
          status: "evidence-ready",
          evidenceLabels: ["US launch approval memo"]
        }),
        expect.objectContaining({
          id: "us-sec-cftc-crypto-asset-classification-control",
          title: "SEC/CFTC crypto-asset classification and offering-analysis control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-reg-d-accredited-investor-verification-control",
          title: "Regulation D eligibility and accredited-investor verification control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-ftc-endorsement-advertising-control",
          title: "FTC advertising claims and endorsement disclosure control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-sec-investment-adviser-marketing-rule-control",
          title: "SEC investment adviser marketing advertisement and promoter control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-ofac-virtual-currency-sanctions-control",
          title: "OFAC virtual-currency sanctions screening and blocked-property control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-fincen-cvc-msb-bsa-transfer-control",
          title: "FinCEN CVC MSB and BSA transfer-recordkeeping control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-nydfs-bitlicense-custody-customer-protection-control",
          title: "NYDFS BitLicense and custody customer-protection control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-genius-payment-stablecoin-issuer-control",
          title: "GENIUS Act payment stablecoin issuer control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-custody-control",
          title: "Custody and wallet authority control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-aba-formal-opinion-512-legal-ai-control",
          title: "ABA Formal Opinion 512 legal AI professional-responsibility control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-nist-ai-rmf-governance-control",
          title: "NIST AI RMF governance and GenAI provenance control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-nyc-local-law-144-aedt-employment-decision-control",
          title: "NYC Local Law 144 AEDT scope, bias-audit, and notice control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-california-ccpa-admt-consumer-rights-control",
          title: "California CCPA ADMT scope, risk-assessment, and consumer-rights control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-colorado-sb26-189-admt-consequential-decision-control",
          title: "Colorado SB26-189 ADMT scope, notice, and human-review control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-sec-dao-governance-token-control",
          title: "SEC DAO Report governance-token and participant-role control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "us-cftc-dao-derivatives-platform-control",
          title: "DAO derivatives-platform and FCM/BSA control",
          status: "needs-evidence"
        })
      ])
    );

    const euPack = packs.find((pack) => pack.jurisdiction === "European Union");
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-title-ii-white-paper-control",
          title: "MiCA Title II white paper and public-communication control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-mica-marketing-communications-control",
          title: "MiCA marketing communications and white-paper consistency control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-mica-decentralised-casp-perimeter-control",
          title: "MiCA decentralised DAO and CASP perimeter control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-mica-article-75-casp-custody-control",
          title: "MiCA Article 75 CASP custody and administration control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-dora-ict-operational-resilience-control",
          title: "DORA ICT operational resilience control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-tfr-crypto-asset-transfer-information-control",
          title: "TFR crypto-asset transfer information control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-dlt-pilot-market-infrastructure-control",
          title: "DLT Pilot market-infrastructure perimeter control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-mica-art-emt-stablecoin-issuer-control",
          title: "MiCA ART/EMT stablecoin issuer control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-data-minimization-control",
          title: "Data minimization and model-call control"
        }),
        expect.objectContaining({
          id: "eu-ai-act-ai-literacy-governance-control",
          title: "AI Act AI-literacy and human-oversight governance control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-ai-act-high-risk-provider-quality-documentation-control",
          title: "AI Act high-risk provider QMS and technical-documentation control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-ai-act-article-50-transparency-disclosure-control",
          title: "AI Act Article 50 transparency and AI-output labelling control",
          status: "needs-evidence"
        }),
        expect.objectContaining({
          id: "eu-ai-act-justice-adr-perimeter-control",
          title: "AI Act justice/ADR perimeter and fundamental-rights control",
          status: "needs-evidence"
        })
      ])
    );

    const ukPack = packs.find((pack) => pack.jurisdiction === "United Kingdom");
    expect(ukPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      }
    });
    expect(ukPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Financial promotion and approval control",
        "FCA cryptoasset financial promotions approval and retail-access control",
        "Custody operational resilience control",
        "FCA MLR registration and cryptoasset activity-scope control",
        "UK cryptoasset AML, SAR, sanctions, and Travel Rule control",
        "Law Commission DAO structure and asset-control scoping control",
        "ICO AI data-protection and reviewer-decision governance control",
        "UK qualifying stablecoin issuer control"
      ])
    );

    const singaporePack = packs.find((pack) => pack.jurisdiction === "Singapore");
    expect(singaporePack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Singapore fintech / digital asset / AI governance counsel"
      }
    });
    expect(singaporePack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Product scope and launch-intake control",
        "MAS PSN02 DPT AML/CFT and model-handoff control",
        "MAS PS-G03 DPT customer-asset safeguard control",
        "IMDA / AI Verify agentic AI governance and human-approval control"
      ])
    );

    const hongKongPack = packs.find((pack) => pack.jurisdiction === "Hong Kong");
    expect(hongKongPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset / stablecoin / SFC products counsel"
      }
    });
    expect(hongKongPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "VATP client asset custody control",
        "Wallet governance and compensation arrangement control",
        "SFC tokenised product authorisation and secondary-trading control",
        "HKMA stablecoin issuer licensing, reserve, and AML/CFT control"
      ])
    );

    const japanPack = packs.find((pack) => pack.jurisdiction === "Japan");
    expect(japanPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Japan crypto-asset exchange / custody counsel"
      }
    });
    expect(japanPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "FSA registration and user-asset protection control",
        "Cold-wallet, reconciliation, and leakage-response control"
      ])
    );

    const canadaPack = packs.find((pack) => pack.jurisdiction === "Canada");
    expect(canadaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Canada crypto asset trading platform counsel"
      }
    });
    expect(canadaPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "CSA registration and PRU investor-protection control",
        "Client-asset custody, segregation, and custodian assurance control"
      ])
    );

    const australiaPack = packs.find((pack) => pack.jurisdiction === "Australia");
    expect(australiaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Australia digital assets / AML-CTF counsel"
      }
    });
    expect(australiaPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "ASIC digital-asset financial services and custody control",
        "AUSTRAC VASP AML/CTF, CDD, and recordkeeping control"
      ])
    );

    const koreaPack = packs.find((pack) => pack.jurisdiction === "South Korea");
    expect(koreaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "South Korea virtual asset / AML counsel"
      }
    });
    expect(koreaPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "FSC user-asset protection and custody control",
        "KoFIU VASP reporting, AML/CFT, CDD, and STR control"
      ])
    );

    const indiaPack = packs.find((pack) => pack.jurisdiction === "India");
    expect(indiaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "India VDA / PMLA AML counsel"
      }
    });
    expect(indiaPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "FIU-IND Reporting Entity registration and activity-scope control",
        "India VDA AML/CFT reporting, CDD/EDD, STR, and Travel Rule control"
      ])
    );

    const thailandPack = packs.find((pack) => pack.jurisdiction === "Thailand");
    expect(thailandPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Thailand digital asset / AML counsel"
      }
    });
    expect(thailandPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "SEC digital asset business license and client-asset custody control",
          status: "evidence-ready",
          evidenceLabels: ["Thailand digital asset custody and AML/CDD register"]
        }),
        expect.objectContaining({
          title: "AMLO AML/CDD and high-risk customer control",
          status: "evidence-ready",
          evidenceLabels: ["Thailand digital asset custody and AML/CDD register"]
        })
      ])
    );

    const indonesiaPack = packs.find((pack) => pack.jurisdiction === "Indonesia");
    expect(indonesiaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Indonesia digital financial asset / crypto regulatory counsel"
      }
    });
    expect(indonesiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "OJK digital financial asset trading licensing and whitelist control",
          status: "evidence-ready",
          evidenceLabels: ["Indonesia OJK digital financial asset trading and whitelist register"]
        }),
        expect.objectContaining({
          title: "OJK product, reporting, governance, and main-party control",
          status: "evidence-ready",
          evidenceLabels: ["Indonesia OJK digital financial asset trading and whitelist register"]
        })
      ])
    );

    const malaysiaPack = packs.find((pack) => pack.jurisdiction === "Malaysia");
    expect(malaysiaPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Malaysia digital asset / AML counsel"
      }
    });
    expect(malaysiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "SC DAX/DAC registration, trading, and custody control",
          status: "evidence-ready",
          evidenceLabels: ["Malaysia digital asset exchange custody and AML/CFT register"]
        }),
        expect.objectContaining({
          title: "BNM digital currency AML/CFT reporting-institution control",
          status: "evidence-ready",
          evidenceLabels: ["Malaysia digital asset exchange custody and AML/CFT register"]
        })
      ])
    );

    const philippinesPack = packs.find((pack) => pack.jurisdiction === "Philippines");
    expect(philippinesPack).toMatchObject({
      jurisdiction: "Philippines",
      localCounselRoute: {
        recommendedRole: "Philippines virtual asset / AML counsel"
      }
    });
    expect(philippinesPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "BSP VASP registration, activity, and custody-scope control",
          status: "evidence-ready",
          evidenceLabels: expect.arrayContaining(["Philippines BSP VASP custody and AML/CFT risk-management register"])
        }),
        expect.objectContaining({
          title: "BSP AML/CFT due-diligence, monitoring, and STR control",
          status: "evidence-ready",
          evidenceLabels: expect.arrayContaining(["Philippines BSP VASP custody and AML/CFT risk-management register"])
        })
      ])
    );

    const southAfricaPack = packs.find((pack) => pack.jurisdiction === "South Africa");
    expect(southAfricaPack).toMatchObject({
      jurisdiction: "South Africa",
      localCounselRoute: {
        recommendedRole: "South Africa financial services / AML counsel"
      }
    });
    expect(southAfricaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "FSCA CASP/FSP licensing and activity-scope control",
          status: "evidence-ready",
          evidenceLabels: expect.arrayContaining(["South Africa CASP licensing and Travel Rule RMCP register"])
        }),
        expect.objectContaining({
          title: "FIC Travel Rule, RMCP, and transfer-control evidence",
          status: "evidence-ready",
          evidenceLabels: expect.arrayContaining(["South Africa CASP licensing and Travel Rule RMCP register"])
        })
      ])
    );

    const switzerlandPack = packs.find((pack) => pack.jurisdiction === "Switzerland");
    expect(switzerlandPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Swiss DLT / financial services counsel"
      }
    });
    expect(switzerlandPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Token classification and prospectus-intake control",
        "Stablecoin issuer and bank-guarantee perimeter control",
        "Stablecoin AML, sanctions, and transfer-risk control",
        "Foundation, custody, and banking perimeter control"
      ])
    );

    const germanyPack = packs.find((pack) => pack.jurisdiction === "Germany");
    expect(germanyPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Germany BaFin / MiCAR crypto custody counsel"
      }
    });
    expect(germanyPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "BaFin MiCAR CASP authorisation and notification control",
        "MiCAR custody safeguarding and client-position control"
      ])
    );

    const uaePack = packs.find((pack) => pack.jurisdiction === "United Arab Emirates");
    expect(uaePack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "UAE virtual-assets / financial regulatory counsel"
      }
    });
    expect(uaePack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Virtual asset activity scope control",
        "Marketing approval and audience-control control",
        "VARA 2024 marketing approval, KOL, and recordkeeping control",
        "KOL, incentive, and marketing recordkeeping control",
        "Marketing, custody, and cross-border access control"
      ])
    );

    const brazilPack = packs.find((pack) => pack.jurisdiction === "Brazil");
    expect(brazilPack).toMatchObject({
      jurisdiction: "Brazil",
      localCounselRoute: {
        recommendedRole: "Brazil virtual-assets / capital markets counsel"
      }
    });
    expect(brazilPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Virtual asset service authorization and AML/CFT control",
        "Crypto-security classification and disclosure control"
      ])
    );
    expect(brazilPack?.source).toBe("LexProof jurisdiction pack v1 for audit preparation. Not legal advice.");
    expect(JSON.stringify(packs)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Brazil BCB and CVM controls ready from verified source evidence only", () => {
    const brazilEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter(
        (item) =>
          item.source?.includes("control-br-bcb-virtual-asset-service-framework") ||
          item.source?.includes("control-br-cvm-crypto-asset-securities-guidance")
      )
      .map((item, index) => ({
        ...item,
        id: `br-source-evidence-${index + 1}`,
        status: "verified" as const
      }));

    const brazilBcbEvidenceLabels = [
      "Custody and signer control runbook",
      "Wallet sanctions screening and escalation controls"
    ];
    const brazilCvmEvidenceLabels = ["RWA disclosure assumptions memo", "Investor eligibility review"];
    expect(brazilEvidence.map((item) => item.label)).toEqual([
      "RWA disclosure assumptions memo",
      "Custody and signer control runbook",
      "Investor eligibility review",
      "Wallet sanctions screening and escalation controls"
    ]);

    const brazilProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-br-bcb-cvm-ready",
      projectName: "Sao Paulo VASP Source Review",
      jurisdictions: ["Brazil"],
      entityType: "Brazil virtual asset service provider and token issuer preparing BCB and CVM evidence",
      assetModel:
        "Brazil tokenized private credit note with virtual asset service activity, authorization assumptions, crypto security classification, public offering, distribution, investment expectation, disclosure, yield, and public launch readiness",
      userType: "Brazil retail users, qualified investors, compliance reviewers, and Brazil local counsel",
      custodyModel:
        "Platform maintains metadata-only wallet authority, transfer approval, AML/CFT, sanctions, transaction-monitoring, disclosure, and investor-communication records without wallet secret handling",
      dataSensitivity:
        "KYC metadata status summaries, sanctions-screening status, wallet-risk summaries, investor-communication status, and no raw KYC, customer records, credentials, wallet secrets, private cryptographic material, or personal data",
      aiUsage: "AI drafts Brazil BCB and CVM evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Brazil source evidence metadata",
      operatingStage: "Pre-launch Brazil BCB and CVM review before local counsel signoff",
      evidenceItems: brazilEvidence
    };
    const audit = analyzeAuditProfile(brazilProject);
    const [brazilPack] = createJurisdictionPacks(brazilProject, audit);

    expect(brazilPack).toMatchObject({
      jurisdiction: "Brazil",
      localCounselRoute: {
        recommendedRole: "Brazil virtual-assets / capital markets counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(brazilPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "br-vasp-authorization-aml-control",
          title: "Virtual asset service authorization and AML/CFT control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: brazilBcbEvidenceLabels
        }),
        expect.objectContaining({
          id: "br-crypto-security-disclosure-control",
          title: "Crypto-security classification and disclosure control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: brazilCvmEvidenceLabels
        })
      ])
    );
    const serializedBrazilPack = JSON.stringify(brazilPack);
    expect(serializedBrazilPack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(serializedBrazilPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US Regulation D eligibility control ready from verified RWA template evidence only", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-rwa-reg-d-template-${index + 1}`,
      status: "verified" as const
    }));
    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-reg-d-ready",
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [usPack] = createJurisdictionPacks(rwaProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-reg-d-accredited-investor-verification-control",
          title: "Regulation D eligibility and accredited-investor verification control",
          owner: "Counsel",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["Investor eligibility review"]
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|identity files|personal financial records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US SEC/CFTC crypto-asset classification control ready from verified RWA classification evidence only", () => {
    const classificationEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-us-sec-cftc-crypto-asset-interpretation"))
      .map((item, index) => ({
        ...item,
        id: `us-sec-cftc-classification-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(classificationEvidence.map((item) => item.label)).toEqual([
      "RWA disclosure assumptions memo",
      "Investor eligibility review"
    ]);

    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-sec-cftc-classification-ready",
      projectName: "US RWA Classification Review",
      jurisdictions: ["United States"],
      entityType: "Tokenized RWA issuer preparing SEC/CFTC classification evidence",
      assetModel:
        "Tokenized private-credit note with token rights, issuer promise, investment expectation, staking/yield, yield assumptions, redemption language, public distribution, registration or exemption assumptions, and risk-factor coverage",
      userType: "US retail investors, accredited investors, issuer reviewers, and US securities / commodities counsel",
      custodyModel: "No custody in this slice; offering and classification records are metadata-only",
      dataSensitivity: "Investor eligibility summaries and no raw identity files or personal financial records",
      aiUsage: "AI drafts US SEC/CFTC classification evidence requests for human review",
      blockchainUse: "Simulated hash receipt for classification evidence metadata",
      operatingStage: "Pre-launch US crypto-asset classification and offering-analysis review before counsel signoff",
      evidenceItems: classificationEvidence
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [usPack] = createJurisdictionPacks(rwaProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-sec-cftc-crypto-asset-classification-control",
          title: "SEC/CFTC crypto-asset classification and offering-analysis control",
          owner: "Counsel",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["RWA disclosure assumptions memo", "Investor eligibility review"]
        }),
        expect.objectContaining({
          id: "us-reg-d-accredited-investor-verification-control",
          status: "evidence-ready",
          evidenceLabels: ["Investor eligibility review"]
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|identity files|personal financial records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US OFAC virtual-currency sanctions control ready from verified RWA wallet-screening evidence only", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-rwa-ofac-template-${index + 1}`,
      status: "verified" as const
    }));
    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-ofac-ready",
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [usPack] = createJurisdictionPacks(rwaProject, audit);

    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-ofac-virtual-currency-sanctions-control",
          title: "OFAC virtual-currency sanctions screening and blocked-property control",
          owner: "Compliance",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["Wallet sanctions screening and escalation controls"]
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US FinCEN CVC MSB and BSA transfer control ready from verified RWA transfer evidence only", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-rwa-fincen-template-${index + 1}`,
      status: "verified" as const
    }));
    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-fincen-ready",
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [usPack] = createJurisdictionPacks(rwaProject, audit);

    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-fincen-cvc-msb-bsa-transfer-control",
          title: "FinCEN CVC MSB and BSA transfer-recordkeeping control",
          owner: "Compliance",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["US FinCEN CVC MSB and BSA transfer control register"]
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|full wallet histories|wallet secrets|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US NYDFS BitLicense and custody customer-protection control ready from verified RWA custody evidence only", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `us-rwa-nydfs-template-${index + 1}`,
      status: "verified" as const
    }));
    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-nydfs-ready",
      jurisdictions: ["United States"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [usPack] = createJurisdictionPacks(rwaProject, audit);

    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-nydfs-bitlicense-custody-customer-protection-control",
          title: "NYDFS BitLicense and custody customer-protection control",
          owner: "Compliance",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["New York NYDFS BitLicense and custody customer-protection register"]
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US GENIUS Act payment stablecoin issuer control ready from verified stablecoin registers only", () => {
    const geniusEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-us-genius-payment-stablecoin-issuer-regime"))
      .map((item, index) => ({
        ...item,
        id: `us-genius-stablecoin-register-${index + 1}`,
        status: "verified" as const
      }));

    expect(geniusEvidence.map((item) => item.label)).toEqual([
      "US GENIUS Act permitted issuer and reserve register",
      "US GENIUS Act BSA AML and sanctions program register"
    ]);

    const stablecoinProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-genius-ready",
      jurisdictions: ["United States"],
      evidenceItems: geniusEvidence
    };
    const audit = analyzeAuditProfile(stablecoinProject);
    const [usPack] = createJurisdictionPacks(stablecoinProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-genius-payment-stablecoin-issuer-control",
          title: "GENIUS Act payment stablecoin issuer control",
          owner: "Compliance",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: [
            "US GENIUS Act permitted issuer and reserve register",
            "US GENIUS Act BSA AML and sanctions program register"
          ]
        }),
        expect.objectContaining({
          id: "us-fincen-cvc-msb-bsa-transfer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US FTC advertising and endorsement control ready from verified marketing evidence only", () => {
    const ftcEvidence = createEvidenceItemsFromTemplate("marketing-claims-review")
      .filter((item) => item.source?.includes("control-us-ftc-endorsement-advertising-guides"))
      .map((item, index) => ({
        ...item,
        id: `us-ftc-marketing-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(ftcEvidence.map((item) => item.label)).toEqual([
      "Claims substantiation and risk disclosure register",
      "Creator endorsement and material connection log"
    ]);

    const marketingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-ftc-marketing-ready",
      jurisdictions: ["United States"],
      evidenceItems: ftcEvidence
    };
    const audit = analyzeAuditProfile(marketingProject);
    const [usPack] = createJurisdictionPacks(marketingProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-ftc-endorsement-advertising-control",
          title: "FTC advertising claims and endorsement disclosure control",
          owner: "Compliance",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: [
            "Claims substantiation and risk disclosure register",
            "Creator endorsement and material connection log"
          ]
        }),
        expect.objectContaining({
          id: "us-genius-payment-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-sec-investment-adviser-marketing-rule-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US SEC investment adviser marketing control ready from verified adviser evidence only", () => {
    const adviserMarketingEvidence = createEvidenceItemsFromTemplate("marketing-claims-review")
      .filter((item) => item.source?.includes("control-us-sec-investment-adviser-marketing-rule"))
      .map((item, index) => ({
        ...item,
        id: `us-sec-adviser-marketing-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(adviserMarketingEvidence.map((item) => item.label)).toEqual([
      "Investment adviser advertisement and promoter review file",
      "Investment adviser performance presentation support file"
    ]);

    const adviserProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-sec-adviser-marketing-ready",
      projectName: "AdviserSignal Campaign Review",
      jurisdictions: ["United States"],
      entityType: "SEC-registered investment adviser marketing team",
      assetModel:
        "Planned public launch of investment advisory services and private fund investor communication campaign with testimonial, endorsement, third-party rating, and performance results review questions",
      userType: "Retail advisory prospects, prospective advisory clients, private fund investors, and US investment adviser counsel",
      custodyModel: "No custody; campaign archive stores metadata-only advertisement and review records",
      dataSensitivity: "Audience-segment summaries, Form ADV reporting metadata, and books-and-records owner only; no raw investor records",
      aiUsage: "AI drafts adviser marketing evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved advertisement archive metadata",
      operatingStage: "Planned public investment adviser marketing campaign before US counsel review",
      evidenceItems: adviserMarketingEvidence
    };
    const audit = analyzeAuditProfile(adviserProject);
    const [usPack] = createJurisdictionPacks(adviserProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-sec-investment-adviser-marketing-rule-control",
          title: "SEC investment adviser marketing advertisement and promoter control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Investment adviser advertisement and promoter review file",
            "Investment adviser performance presentation support file"
          ]
        }),
        expect.objectContaining({
          id: "us-ftc-endorsement-advertising-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-genius-payment-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US SEC DAO Report governance control ready from verified DAO evidence only", () => {
    const daoEvidence = createEvidenceItemsFromTemplate("dao-governance-multisig")
      .filter((item) => item.source?.includes("control-us-sec-dao-report-governance-token-review"))
      .map((item, index) => ({
        ...item,
        id: `us-sec-dao-governance-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(daoEvidence.map((item) => item.label)).toEqual([
      "Governance proposal record",
      "Multisig signer authority matrix",
      "Vote and execution receipt",
      "Contributor agreement summary"
    ]);

    const daoProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-sec-dao-ready",
      projectName: "ClauseGuard DAO",
      jurisdictions: ["United States"],
      entityType: "DAO foundation governance committee preparing SEC DAO Report evidence",
      assetModel:
        "DAO governance-token proposal with participant-role, project-funding, contributor-authority, secondary-transfer, voting, multisig, execution-control, and emergency-authority evidence",
      userType: "DAO token holders, protocol contributors, multisig signers, and US DAO counsel",
      custodyModel: "DAO treasury execution is documented as metadata-only signer and proposal records",
      dataSensitivity: "Governance records, contributor summary metadata, and no raw customer records",
      aiUsage: "AI drafts DAO governance evidence requests for human review",
      blockchainUse: "Simulated hash receipt for proposal and execution metadata",
      operatingStage: "Pre-execution DAO governance review before counsel signoff",
      evidenceItems: daoEvidence
    };
    const audit = analyzeAuditProfile(daoProject);
    const [usPack] = createJurisdictionPacks(daoProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-sec-dao-governance-token-control",
          title: "SEC DAO Report governance-token and participant-role control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Governance proposal record",
            "Multisig signer authority matrix",
            "Vote and execution receipt",
            "Contributor agreement summary"
          ]
        })
      ])
    );
    expect(usPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["us-cftc-dao-derivatives-platform-control", "us-sec-investment-adviser-marketing-rule-control"])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US CFTC Ooki DAO derivatives control ready from verified DAO derivatives evidence only", () => {
    const cftcRegister = createEvidenceItemsFromTemplate("dao-governance-multisig").find(
      (item) => item.label === "DAO derivatives platform boundary and BSA/CIP review register"
    );

    expect(cftcRegister).toBeDefined();

    const daoProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-cftc-ooki-dao-ready",
      projectName: "Ooki Boundary DAO Review",
      jurisdictions: ["United States"],
      entityType: "DAO protocol governance committee preparing CFTC derivatives-platform evidence",
      assetModel:
        "DAO protocol review with leveraged retail commodity, margined retail commodity, DeFi trading platform, FCM activity, commodity interest, control-transfer, and proposal-execution assumptions",
      userType: "US retail users, DAO governance members, compliance reviewers, and commodities counsel",
      custodyModel: "No custody in this slice; governance execution is metadata-only",
      dataSensitivity: "BSA CIP boundary summaries, customer-identification-program assumptions, and no raw customer records",
      aiUsage: "AI drafts DAO derivatives evidence requests for human review",
      blockchainUse: "Simulated hash receipt for proposal execution metadata",
      operatingStage: "Pre-execution CFTC DAO boundary review before counsel signoff",
      evidenceItems: [
        {
          ...cftcRegister!,
          id: "us-cftc-ooki-dao-register-1",
          status: "verified" as const
        }
      ]
    };
    const audit = analyzeAuditProfile(daoProject);
    const [usPack] = createJurisdictionPacks(daoProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-cftc-dao-derivatives-platform-control",
          title: "DAO derivatives-platform and FCM/BSA control",
          owner: "Counsel",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: ["DAO derivatives platform boundary and BSA/CIP review register"]
        }),
        expect.objectContaining({
          id: "us-sec-dao-governance-token-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU MiCA decentralised DAO CASP perimeter control ready from verified DAO perimeter evidence only", () => {
    const micaRegister = createEvidenceItemsFromTemplate("dao-governance-multisig").find(
      (item) => item.label === "EU MiCA decentralisation and CASP perimeter register"
    );

    expect(micaRegister).toBeDefined();

    const daoProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-mica-dao-perimeter-ready",
      projectName: "EU DAO Perimeter Review",
      jurisdictions: ["European Union"],
      entityType: "DAO protocol governance committee preparing EU MiCA perimeter evidence",
      assetModel:
        "DAO protocol with MiCA decentralisation claims, fully decentralised service assumptions, crypto-asset service perimeter, CASP perimeter, custody service exclusions, trading service exclusions, exchange service exclusions, and advice service exclusions",
      userType: "EU users, protocol operators, governance voters, marketing owner, responsible owner, and EU MiCA counsel",
      custodyModel: "No custody in this slice; admin-key and front-end-control assumptions are metadata-only",
      dataSensitivity: "EU user-access summaries and no raw customer records or personal data",
      aiUsage: "AI drafts EU MiCA DAO perimeter evidence requests for human review",
      blockchainUse: "Simulated hash receipt for protocol-upgrade and governance-vote metadata",
      operatingStage: "Pre-execution EU MiCA DAO perimeter review before counsel signoff",
      evidenceItems: [
        {
          ...micaRegister!,
          id: "eu-mica-dao-perimeter-register-1",
          status: "verified" as const
        }
      ]
    };
    const audit = analyzeAuditProfile(daoProject);
    const [euPack] = createJurisdictionPacks(daoProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-decentralised-casp-perimeter-control",
          title: "MiCA decentralised DAO and CASP perimeter control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["EU MiCA decentralisation and CASP perimeter register"]
        }),
        expect.objectContaining({
          id: "eu-mica-title-ii-white-paper-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-dlt-pilot-market-infrastructure-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UK Law Commission DAO scoping control ready from verified DAO governance evidence only", () => {
    const ukDaoEvidence = createEvidenceItemsFromTemplate("dao-governance-multisig")
      .filter((item) => item.source?.includes("control-uk-law-commission-dao-scoping-paper"))
      .map((item, index) => ({
        ...item,
        id: `uk-law-commission-dao-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(ukDaoEvidence.map((item) => item.label)).toEqual([
      "Governance proposal record",
      "Multisig signer authority matrix",
      "Vote and execution receipt",
      "Contributor agreement summary"
    ]);

    const daoProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uk-law-commission-dao-ready",
      projectName: "UK DAO Scoping Review",
      jurisdictions: ["United Kingdom"],
      entityType: "DAO foundation governance committee preparing UK Law Commission scoping evidence",
      assetModel:
        "DAO governance proposal with participant-role, contributor, foundation, legal-characterisation, governance-rule, asset-control, voting, multisig signer, execution receipt, and emergency-authority evidence",
      userType: "DAO participants, protocol contributors, multisig signers, foundation operators, and UK DAO counsel",
      custodyModel: "DAO treasury asset-control and execution authority are documented as metadata-only governance records",
      dataSensitivity: "Contributor agreement summaries and no raw customer records or personal records",
      aiUsage: "AI drafts UK DAO scoping evidence requests for human review",
      blockchainUse: "Simulated hash receipt for governance proposal and execution metadata",
      operatingStage: "Pre-execution UK DAO structure and asset-control review before counsel signoff",
      evidenceItems: ukDaoEvidence
    };
    const audit = analyzeAuditProfile(daoProject);
    const [ukPack] = createJurisdictionPacks(daoProject, audit);

    expect(ukPack).toMatchObject({
      jurisdiction: "United Kingdom",
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uk-law-commission-dao-scoping-control",
          title: "Law Commission DAO structure and asset-control scoping control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Governance proposal record",
            "Multisig signer authority matrix",
            "Vote and execution receipt",
            "Contributor agreement summary"
          ]
        }),
        expect.objectContaining({
          id: "uk-ico-ai-data-protection-governance-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(ukPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(ukPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US ABA Formal Opinion 512 legal AI control ready from verified AI workflow evidence only", () => {
    const abaEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-us-aba-formal-opinion-512-generative-ai-law-practice"))
      .map((item, index) => ({
        ...item,
        id: `us-aba-legal-ai-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(abaEvidence.map((item) => item.label)).toEqual([
      "AI system use policy",
      "Human review approval log",
      "US legal AI ethics and professional responsibility register"
    ]);

    const aiProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-aba-legal-ai-ready",
      projectName: "LexAssist Evidence Desk",
      jurisdictions: ["United States"],
      entityType: "Legal AI evidence review workspace",
      assetModel: "No token sale; AI-assisted legal matter intake and evidence review workflow",
      userType: "US legal operations team, supervising counsel, and compliance reviewers",
      custodyModel: "No custody; model workflow cannot approve wallet transfers or hold client assets",
      dataSensitivity: "Client information summaries, confidentiality-control metadata, and reviewer notes only; no confidential matter text",
      aiUsage: "AI drafts legal and compliance issue-spotting notes for human review",
      blockchainUse: "Simulated hash receipt for approved model governance metadata",
      operatingStage: "Planned public legal AI workflow review before counsel reliance",
      evidenceItems: abaEvidence
    };
    const audit = analyzeAuditProfile(aiProject);
    const [usPack] = createJurisdictionPacks(aiProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-aba-formal-opinion-512-legal-ai-control",
          title: "ABA Formal Opinion 512 legal AI professional-responsibility control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "AI system use policy",
            "Human review approval log",
            "US legal AI ethics and professional responsibility register"
          ]
        }),
        expect.objectContaining({
          id: "us-sec-investment-adviser-marketing-rule-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US NIST AI RMF control ready from verified AI workflow evidence only", () => {
    const nistEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-us-nist-ai-rmf-governance"))
      .map((item, index) => ({
        ...item,
        id: `us-nist-ai-rmf-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(nistEvidence.map((item) => item.label)).toEqual([
      "AI system use policy",
      "NIST GenAI output review and provenance register"
    ]);

    const aiProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-nist-ai-rmf-ready",
      projectName: "LexAssist Evidence Desk",
      jurisdictions: ["United States"],
      entityType: "AI governance and model-risk review workspace",
      assetModel: "No token sale; AI-assisted legal matter intake and evidence review workflow",
      userType: "US legal operations team, supervising counsel, and compliance reviewers",
      custodyModel: "No custody; model workflow cannot approve wallet transfers or hold client assets",
      dataSensitivity: "Model-risk summaries, source provenance metadata, and reviewer notes only; no confidential matter text",
      aiUsage: "AI drafts legal and compliance issue-spotting notes for human review",
      blockchainUse: "Simulated hash receipt for approved model governance metadata",
      operatingStage: "Planned public AI governance workflow review before counsel reliance",
      evidenceItems: nistEvidence
    };
    const audit = analyzeAuditProfile(aiProject);
    const [usPack] = createJurisdictionPacks(aiProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-nist-ai-rmf-governance-control",
          title: "NIST AI RMF governance and GenAI provenance control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["AI system use policy", "NIST GenAI output review and provenance register"]
        }),
        expect.objectContaining({
          id: "us-sec-investment-adviser-marketing-rule-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US NYC Local Law 144 AEDT control ready from verified AI workflow evidence only", () => {
    const nycAedtEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-us-nyc-local-law-144-aedt-employment-decision-governance"))
      .map((item, index) => ({
        ...item,
        id: `us-nyc-aedt-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(nycAedtEvidence.map((item) => item.label)).toEqual([
      "NYC AEDT scope and bias audit register",
      "NYC AEDT notice and data retention request register"
    ]);

    const nycAedtProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-nyc-aedt-ready",
      projectName: "LexAssist NYC AEDT Review",
      jurisdictions: ["United States"],
      entityType: "AI employment workflow deployer preparing NYC AEDT evidence",
      assetModel:
        "AI-assisted hiring and promotion workflow with AEDT scope, independent bias audit, public summary, notice, accommodation or alternative-process routing, and retention request handling",
      userType: "NYC candidates or employees, HR reviewers, compliance reviewers, and local counsel",
      custodyModel: "No asset safekeeping; NYC AEDT evidence is metadata-only",
      dataSensitivity:
        "AEDT source metadata, selection-rate and impact-ratio summaries, and no raw applicant or employee records",
      aiUsage: "AI drafts hiring or promotion screening evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved NYC AEDT metadata",
      operatingStage: "Pre-launch NYC AEDT review before local counsel signoff",
      evidenceItems: nycAedtEvidence
    };
    const audit = analyzeAuditProfile(nycAedtProject);
    const [usPack] = createJurisdictionPacks(nycAedtProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-nyc-local-law-144-aedt-employment-decision-control",
          title: "NYC Local Law 144 AEDT scope, bias-audit, and notice control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "NYC AEDT scope and bias audit register",
            "NYC AEDT notice and data retention request register"
          ]
        }),
        expect.objectContaining({
          id: "us-aba-formal-opinion-512-legal-ai-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-nist-ai-rmf-governance-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US California CCPA ADMT control ready from verified AI workflow evidence only", () => {
    const californiaAdmtEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-us-california-ccpa-admt-consumer-rights-governance"))
      .map((item, index) => ({
        ...item,
        id: `us-california-ccpa-admt-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(californiaAdmtEvidence.map((item) => item.label)).toEqual([
      "California CCPA ADMT scope and risk assessment register",
      "California CCPA ADMT access and opt-out workflow register"
    ]);

    const californiaAdmtProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-california-ccpa-admt-ready",
      projectName: "LexAssist California ADMT Review",
      jurisdictions: ["United States"],
      entityType: "AI decision workflow deployer preparing California CCPA ADMT evidence",
      assetModel:
        "AI-assisted significant-decision workflow with ADMT scope, risk assessment, access, opt-out, secure request handling, and human-involvement documentation",
      userType: "California consumers, compliance reviewers, privacy reviewers, and local counsel",
      custodyModel: "No asset safekeeping; California ADMT evidence is metadata-only",
      dataSensitivity:
        "ADMT source metadata, personal information category summaries, risk-assessment ownership, and no raw personal data",
      aiUsage: "AI drafts California ADMT scoping and consumer-rights evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved California ADMT metadata",
      operatingStage: "Pre-launch California ADMT review before local counsel signoff",
      evidenceItems: californiaAdmtEvidence
    };
    const audit = analyzeAuditProfile(californiaAdmtProject);
    const [usPack] = createJurisdictionPacks(californiaAdmtProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-california-ccpa-admt-consumer-rights-control",
          title: "California CCPA ADMT scope, risk-assessment, and consumer-rights control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "California CCPA ADMT scope and risk assessment register",
            "California CCPA ADMT access and opt-out workflow register"
          ]
        }),
        expect.objectContaining({
          id: "us-aba-formal-opinion-512-legal-ai-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-nist-ai-rmf-governance-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-nyc-local-law-144-aedt-employment-decision-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the US Colorado SB26-189 ADMT control ready from verified AI workflow evidence only", () => {
    const coloradoAdmtEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-us-colorado-admt-consequential-decision-governance"))
      .map((item, index) => ({
        ...item,
        id: `us-colorado-admt-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(coloradoAdmtEvidence.map((item) => item.label)).toEqual([
      "Colorado ADMT scope and developer documentation register",
      "Colorado ADMT notice and meaningful human review register"
    ]);

    const coloradoAdmtProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-us-colorado-admt-ready",
      projectName: "LexAssist Colorado ADMT Review",
      jurisdictions: ["United States"],
      entityType: "AI consequential-decision workflow deployer preparing Colorado ADMT evidence",
      assetModel:
        "AI-assisted consequential-decision workflow with Colorado ADMT scope, developer documentation, consumer notice, adverse-outcome explanation, correction workflow, meaningful human review, and record-retention handling",
      userType: "Colorado consumers, compliance reviewers, product reviewers, and local counsel",
      custodyModel: "No asset safekeeping; Colorado ADMT evidence is metadata-only",
      dataSensitivity:
        "ADMT source metadata, training-data category summaries, review instructions, retention-owner notes, and no raw personal data",
      aiUsage: "AI drafts Colorado ADMT scoping and human-review evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved Colorado ADMT metadata",
      operatingStage: "Pre-launch Colorado ADMT review before local counsel signoff",
      evidenceItems: coloradoAdmtEvidence
    };
    const audit = analyzeAuditProfile(coloradoAdmtProject);
    const [usPack] = createJurisdictionPacks(coloradoAdmtProject, audit);

    expect(usPack).toMatchObject({
      jurisdiction: "United States",
      localCounselRoute: {
        recommendedRole: "US securities / fintech counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(usPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "us-colorado-sb26-189-admt-consequential-decision-control",
          title: "Colorado SB26-189 ADMT scope, notice, and human-review control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Colorado ADMT scope and developer documentation register",
            "Colorado ADMT notice and meaningful human review register"
          ]
        }),
        expect.objectContaining({
          id: "us-aba-formal-opinion-512-legal-ai-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-nist-ai-rmf-governance-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-nyc-local-law-144-aedt-employment-decision-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "us-california-ccpa-admt-consumer-rights-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU MiCA marketing communications control ready from verified marketing evidence only", () => {
    const euMarketingEvidence = createEvidenceItemsFromTemplate("marketing-claims-review")
      .filter((item) => item.source?.includes("control-eu-mica-marketing-communications"))
      .map((item, index) => ({
        ...item,
        id: `eu-mica-marketing-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(euMarketingEvidence.map((item) => item.label)).toEqual(["EU MiCA marketing communication review pack"]);

    const marketingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-mica-marketing-ready",
      jurisdictions: ["European Union"],
      evidenceItems: euMarketingEvidence
    };
    const audit = analyzeAuditProfile(marketingProject);
    const [euPack] = createJurisdictionPacks(marketingProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-marketing-communications-control",
          title: "MiCA marketing communications and white-paper consistency control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["EU MiCA marketing communication review pack"]
        }),
        expect.objectContaining({
          id: "eu-mica-article-75-casp-custody-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-mica-art-emt-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU AI Act AI-literacy governance control ready from verified AI workflow evidence only", () => {
    const aiLiteracyEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-eu-ai-act-ai-literacy-governance"))
      .map((item, index) => ({
        ...item,
        id: `eu-ai-act-ai-literacy-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(aiLiteracyEvidence.map((item) => item.label)).toEqual([
      "AI system use policy",
      "Human review approval log",
      "Source lineage register"
    ]);

    const aiLiteracyProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-ai-act-ai-literacy-ready",
      projectName: "LexAssist AI Literacy Review",
      jurisdictions: ["European Union"],
      entityType: "AI legal workflow deployer preparing AI-literacy governance evidence",
      assetModel:
        "AI-assisted legal workflow with AI literacy, permitted model use, source lineage, risk-control handling, reviewer authority, and human oversight",
      userType: "EU compliance reviewers, legal operations reviewers, and local counsel",
      custodyModel: "No asset safekeeping; AI-literacy evidence is metadata-only",
      dataSensitivity: "Source-lineage metadata, human-review notes, and no raw matter text or client identifiers",
      aiUsage: "AI drafts source-linked audit preparation questions for human review",
      blockchainUse: "Simulated hash receipt for approved AI-literacy governance metadata",
      operatingStage: "Pre-launch AI-literacy and human-oversight review before local counsel signoff",
      evidenceItems: aiLiteracyEvidence
    };
    const audit = analyzeAuditProfile(aiLiteracyProject);
    const [euPack] = createJurisdictionPacks(aiLiteracyProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-ai-act-ai-literacy-governance-control",
          title: "AI Act AI-literacy and human-oversight governance control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["AI system use policy", "Human review approval log", "Source lineage register"]
        }),
        expect.objectContaining({
          id: "eu-ai-act-high-risk-provider-quality-documentation-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-ai-act-article-50-transparency-disclosure-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-ai-act-justice-adr-perimeter-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(euPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["eu-mica-marketing-communications-control", "eu-mica-art-emt-stablecoin-issuer-control"])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU AI Act high-risk provider control ready from verified AI workflow evidence only", () => {
    const providerEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-eu-ai-act-high-risk-provider-quality-documentation"))
      .map((item, index) => ({
        ...item,
        id: `eu-ai-act-provider-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(providerEvidence.map((item) => item.label)).toEqual([
      "EU AI Act provider QMS and risk-management register",
      "EU AI Act technical documentation and data-governance register"
    ]);

    const providerProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-ai-act-provider-ready",
      projectName: "EuroModel Provider Dossier",
      jurisdictions: ["European Union"],
      entityType: "High-risk AI provider preparing a provider conformity file",
      assetModel:
        "High-risk AI provider quality management system, risk management system, technical documentation, data governance, record-keeping logs, instructions for use, and provider conformity file review",
      userType: "EU deployer compliance reviewers and local counsel",
      custodyModel: "No asset safekeeping; AI provider evidence is metadata-only",
      dataSensitivity: "Training data governance summaries, validation data metadata, and personal data exclusion notes only",
      aiUsage: "AI drafts provider quality dossier evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved provider quality metadata",
      operatingStage: "Pre-market provider quality-system review before local counsel signoff",
      evidenceItems: providerEvidence
    };
    const audit = analyzeAuditProfile(providerProject);
    const [euPack] = createJurisdictionPacks(providerProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-ai-act-high-risk-provider-quality-documentation-control",
          title: "AI Act high-risk provider QMS and technical-documentation control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "EU AI Act provider QMS and risk-management register",
            "EU AI Act technical documentation and data-governance register"
          ]
        }),
        expect.objectContaining({
          id: "eu-dora-ict-operational-resilience-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-tfr-crypto-asset-transfer-information-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(euPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["eu-mica-marketing-communications-control", "eu-mica-art-emt-stablecoin-issuer-control"])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU AI Act Article 50 transparency control ready from verified AI workflow evidence only", () => {
    const article50Evidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-eu-ai-act-article-50-transparency-disclosure"))
      .map((item, index) => ({
        ...item,
        id: `eu-ai-act-article-50-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(article50Evidence.map((item) => item.label)).toEqual([
      "EU AI Act Article 50 user disclosure register",
      "EU AI Act AI-generated output labelling register"
    ]);

    const transparencyProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-ai-act-article-50-ready",
      projectName: "LexAssist Article 50 Review",
      jurisdictions: ["European Union"],
      entityType: "AI workflow deployer preparing Article 50 transparency evidence",
      assetModel:
        "AI-assisted user interaction workflow with natural person notice, AI-generated output labelling, first interaction timing, detectable marking, and editorial-control review",
      userType: "EU users, compliance reviewers, and local counsel",
      custodyModel: "No asset safekeeping; AI transparency evidence is metadata-only",
      dataSensitivity: "Disclosure wording summaries, output-labelling metadata, and no raw matter text or client identifiers",
      aiUsage: "AI drafts Article 50 transparency evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved AI transparency metadata",
      operatingStage: "Pre-launch AI disclosure review before local counsel signoff",
      evidenceItems: article50Evidence
    };
    const audit = analyzeAuditProfile(transparencyProject);
    const [euPack] = createJurisdictionPacks(transparencyProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-ai-act-article-50-transparency-disclosure-control",
          title: "AI Act Article 50 transparency and AI-output labelling control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "EU AI Act Article 50 user disclosure register",
            "EU AI Act AI-generated output labelling register"
          ]
        }),
        expect.objectContaining({
          id: "eu-ai-act-high-risk-provider-quality-documentation-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(euPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["eu-mica-marketing-communications-control", "eu-mica-art-emt-stablecoin-issuer-control"])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU AI Act justice and ADR perimeter control ready from verified AI workflow evidence only", () => {
    const justiceEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-eu-ai-act-administration-justice-adr-perimeter"))
      .map((item, index) => ({
        ...item,
        id: `eu-ai-act-justice-adr-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(justiceEvidence.map((item) => item.label)).toEqual([
      "EU AI Act justice and ADR perimeter memo",
      "EU AI Act high-risk oversight and fundamental-rights register"
    ]);

    const justiceProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-ai-act-justice-ready",
      projectName: "LexAssist Justice Perimeter Review",
      jurisdictions: ["European Union"],
      entityType: "AI legal workflow deployer preparing justice and ADR perimeter evidence",
      assetModel:
        "AI-assisted legal research workflow with justice and ADR perimeter, judicial authority assumptions, high-risk oversight, deployer instructions, logging, monitoring, and fundamental-rights review routing",
      userType: "EU legal operations reviewers, compliance reviewers, and local counsel",
      custodyModel: "No asset safekeeping; justice perimeter evidence is metadata-only",
      dataSensitivity: "Matter summary metadata, input-data relevance notes, and no raw matter text or client identifiers",
      aiUsage: "AI drafts justice and ADR perimeter evidence requests for human review",
      blockchainUse: "Simulated hash receipt for approved justice perimeter metadata",
      operatingStage: "Pre-launch justice and ADR perimeter review before local counsel signoff",
      evidenceItems: justiceEvidence
    };
    const audit = analyzeAuditProfile(justiceProject);
    const [euPack] = createJurisdictionPacks(justiceProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-ai-act-justice-adr-perimeter-control",
          title: "AI Act justice/ADR perimeter and fundamental-rights control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "EU AI Act justice and ADR perimeter memo",
            "EU AI Act high-risk oversight and fundamental-rights register"
          ]
        }),
        expect.objectContaining({
          id: "eu-ai-act-article-50-transparency-disclosure-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-ai-act-high-risk-provider-quality-documentation-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(euPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["eu-mica-marketing-communications-control", "eu-mica-art-emt-stablecoin-issuer-control"])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UK FCA financial promotions control ready from verified marketing evidence only", () => {
    const ukPromotionEvidence = createEvidenceItemsFromTemplate("marketing-claims-review")
      .filter((item) => item.source?.includes("control-uk-fca-crypto-financial-promotions"))
      .map((item, index) => ({
        ...item,
        id: `uk-fca-promotion-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(ukPromotionEvidence.map((item) => item.label)).toEqual(["UK financial promotion approval pack"]);

    const marketingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uk-fca-marketing-ready",
      jurisdictions: ["United Kingdom"],
      evidenceItems: ukPromotionEvidence
    };
    const audit = analyzeAuditProfile(marketingProject);
    const [ukPack] = createJurisdictionPacks(marketingProject, audit);

    expect(ukPack).toMatchObject({
      jurisdiction: "United Kingdom",
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uk-promotion-approval-control",
          title: "Financial promotion and approval control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UK financial promotion approval pack"]
        }),
        expect.objectContaining({
          id: "uk-fca-crypto-financial-promotions-control",
          title: "FCA cryptoasset financial promotions approval and retail-access control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UK financial promotion approval pack"]
        }),
        expect.objectContaining({
          id: "uk-operational-resilience-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "uk-cryptoasset-aml-travel-rule-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(ukPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(ukPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UK ICO AI data-protection governance control ready from verified AI workflow evidence only", () => {
    const ukIcoEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-uk-ico-ai-data-protection-governance"))
      .map((item, index) => ({
        ...item,
        id: `uk-ico-ai-data-protection-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(ukIcoEvidence.map((item) => item.label)).toEqual([
      "Human review approval log",
      "Source lineage register",
      "Model payload redaction checklist"
    ]);

    const ukAiProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uk-ico-ai-ready",
      projectName: "LexAssist UK AI Data Protection Review",
      jurisdictions: ["United Kingdom"],
      entityType: "AI legal workflow deployer preparing UK ICO data-protection evidence",
      assetModel:
        "AI-assisted legal workflow with model-payload redaction, source lineage, explainability notes, reviewer decision logs, and data-protection boundary evidence",
      userType: "UK legal operations reviewers, data protection reviewers, and local counsel",
      custodyModel: "No asset safekeeping; UK AI data-protection evidence is metadata-only",
      dataSensitivity: "Model payload metadata, redaction notes, source-lineage records, and no raw matter text or client identifiers",
      aiUsage: "AI drafts source-linked audit preparation questions for human review and reviewer decision logging",
      blockchainUse: "Simulated hash receipt for approved UK AI data-protection metadata",
      operatingStage: "Pre-launch UK AI data-protection review before local counsel signoff",
      evidenceItems: ukIcoEvidence
    };
    const audit = analyzeAuditProfile(ukAiProject);
    const [ukPack] = createJurisdictionPacks(ukAiProject, audit);

    expect(ukPack).toMatchObject({
      jurisdiction: "United Kingdom",
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uk-ico-ai-data-protection-governance-control",
          title: "ICO AI data-protection and reviewer-decision governance control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Human review approval log", "Source lineage register", "Model payload redaction checklist"]
        }),
        expect.objectContaining({
          id: "uk-qualifying-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(ukPack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["uk-fca-crypto-financial-promotions-control"])
    );
    expect(JSON.stringify(ukPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(ukPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Singapore IMDA agentic AI governance control ready from verified AI workflow evidence only", () => {
    const singaporeAgenticEvidence = createEvidenceItemsFromTemplate("ai-compliance-workflow")
      .filter((item) => item.source?.includes("control-sg-imda-agentic-ai-governance"))
      .map((item, index) => ({
        ...item,
        id: `sg-imda-agentic-ai-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(singaporeAgenticEvidence.map((item) => item.label)).toEqual([
      "Singapore agentic AI action-space and approval register",
      "Singapore AI Verify logging and user-responsibility register"
    ]);

    const singaporeAiProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-sg-imda-agentic-ai-ready",
      projectName: "LexAssist Singapore Agentic AI Review",
      jurisdictions: ["Singapore"],
      entityType: "Agentic AI legal workflow deployer preparing Singapore AI governance evidence",
      assetModel:
        "Agentic AI workflow with action-space, tool permissions, access controls, autonomy-level, human approval checkpoints, logging, monitoring, and AI Verify documentary evidence",
      userType: "Singapore legal operations reviewers, AI governance reviewers, and local counsel",
      custodyModel: "No asset safekeeping; Singapore agentic AI evidence is metadata-only",
      dataSensitivity: "Agent action metadata, tool-call summaries, approval checkpoints, and no raw matter text or client identifiers",
      aiUsage: "AI agent drafts source-linked audit preparation tasks with tool-call monitoring and human approval checkpoints",
      blockchainUse: "Simulated hash receipt for approved Singapore agentic AI metadata",
      operatingStage: "Pre-launch Singapore agentic AI governance review before local counsel signoff",
      evidenceItems: singaporeAgenticEvidence
    };
    const audit = analyzeAuditProfile(singaporeAiProject);
    const [singaporePack] = createJurisdictionPacks(singaporeAiProject, audit);

    expect(singaporePack).toMatchObject({
      jurisdiction: "Singapore",
      localCounselRoute: {
        recommendedRole: "Singapore fintech / digital asset / AI governance counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(singaporePack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sg-imda-agentic-ai-governance-control",
          title: "IMDA / AI Verify agentic AI governance and human-approval control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Singapore agentic AI action-space and approval register",
            "Singapore AI Verify logging and user-responsibility register"
          ]
        }),
        expect.objectContaining({
          id: "sg-mas-psn02-dpt-aml-cft-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(singaporePack?.controls.map((control) => control.id)).not.toEqual(
      expect.arrayContaining(["sg-product-scope-launch-control"])
    );
    expect(JSON.stringify(singaporePack)).not.toMatch(
      /\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i
    );
    expect(JSON.stringify(singaporePack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Singapore MAS DPT custody and AML/CFT controls ready from verified DPT evidence only", () => {
    const dptEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter(
        (item) =>
          item.source?.includes("control-sg-mas-psn02-dpt-aml-cft") ||
          item.source?.includes("control-sg-mas-dpt-customer-asset-safeguards")
      )
      .map((item, index) => ({
        ...item,
        id: `sg-dpt-custody-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(dptEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Singapore DPT CDD and model handoff register"
    ]);

    const singaporeDptProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-sg-dpt-custody-ready",
      projectName: "HarborKey DPT Custody Review",
      jurisdictions: ["Singapore"],
      entityType: "Digital payment token service provider preparing MAS DPT custody evidence",
      assetModel:
        "Digital payment token custody and transfer service with customer assets, MAS PSN02 AML/CFT, MAS PS-G03 customer-asset safeguards, segregation, custody disclosure, reconciliation, and transfer-control evidence",
      userType: "Singapore DPT customers, compliance reviewers, custody operators, and Singapore fintech counsel",
      custodyModel:
        "Platform wallet authority with signer quorum, withdrawal approval, emergency pause, incident response, and customer asset return metadata",
      dataSensitivity:
        "CDD summaries, sanctions and transaction-monitoring metadata, wallet-history boundary notes, and no raw KYC, customer records, or wallet secrets",
      aiUsage: "AI drafts DPT AML/CFT and custody evidence requests after redaction and model-payload boundary review",
      blockchainUse: "Simulated hash receipt for MAS DPT custody evidence metadata",
      operatingStage: "Pre-launch Singapore DPT custody and AML/CFT review before local counsel signoff",
      evidenceItems: dptEvidence
    };
    const audit = analyzeAuditProfile(singaporeDptProject);
    const [singaporePack] = createJurisdictionPacks(singaporeDptProject, audit);

    expect(singaporePack).toMatchObject({
      jurisdiction: "Singapore",
      localCounselRoute: {
        recommendedRole: "Singapore fintech / digital asset / AI governance counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(singaporePack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sg-mas-psn02-dpt-aml-cft-control",
          title: "MAS PSN02 DPT AML/CFT and model-handoff control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Singapore DPT CDD and model handoff register"]
        }),
        expect.objectContaining({
          id: "sg-mas-dpt-customer-asset-safeguards-control",
          title: "MAS PS-G03 DPT customer-asset safeguard control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Custody and signer control runbook"]
        }),
        expect.objectContaining({
          id: "sg-imda-agentic-ai-governance-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(singaporePack)).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|legal conclusion/i
    );
    expect(JSON.stringify(singaporePack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Hong Kong SFC VATP custody controls ready from verified VATP custody evidence only", () => {
    const vatpEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-hk-sfc-vatp-client-asset-custody"))
      .map((item, index) => ({
        ...item,
        id: `hk-vatp-custody-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(vatpEvidence.map((item) => item.label)).toEqual(["Custody and signer control runbook"]);

    const hongKongVatpProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-hk-vatp-custody-ready",
      projectName: "HarborKey Hong Kong VATP Custody Review",
      jurisdictions: ["Hong Kong"],
      entityType: "Virtual asset trading platform operator preparing Hong Kong VATP custody evidence",
      assetModel:
        "VATP custody workflow with client virtual assets, associated-entity trust holding, wallet segregation, cold storage, reconciliation, monitoring, and compensation-arrangement evidence",
      userType: "Hong Kong retail users, VATP custody operators, compliance reviewers, and local counsel",
      custodyModel:
        "Platform wallet authority with signer quorum, withdrawal approval, cold-storage and key-control review, emergency pause, incident response, and client asset return metadata",
      dataSensitivity:
        "Custody-control metadata, wallet-governance summaries, reconciliation evidence, and no raw KYC, wallet secrets, customer records, or personal data",
      aiUsage: "AI drafts Hong Kong VATP custody evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for VATP custody evidence metadata",
      operatingStage: "Pre-launch Hong Kong VATP custody review before local counsel signoff",
      evidenceItems: vatpEvidence
    };
    const audit = analyzeAuditProfile(hongKongVatpProject);
    const [hongKongPack] = createJurisdictionPacks(hongKongVatpProject, audit);

    expect(hongKongPack).toMatchObject({
      jurisdiction: "Hong Kong",
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset / stablecoin / SFC products counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(hongKongPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hk-vatp-client-asset-custody-control",
          title: "VATP client asset custody control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Custody and signer control runbook"]
        }),
        expect.objectContaining({
          id: "hk-vatp-wallet-compensation-control",
          title: "Wallet governance and compensation arrangement control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Custody and signer control runbook"]
        }),
        expect.objectContaining({
          id: "hk-hkma-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(hongKongPack)).not.toMatch(
      /\braw KYC\b|wallet secrets|private key|customer records|personal data|legal conclusion/i
    );
    expect(JSON.stringify(hongKongPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Hong Kong HKMA stablecoin issuer control ready from verified reserve and AML evidence only", () => {
    const hkmaStablecoinEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-hk-hkma-stablecoin-issuer-regime"))
      .map((item, index) => ({
        ...item,
        id: `hk-hkma-stablecoin-evidence-${index + 1}`,
        status: "verified" as const
      }));

    const hkmaStablecoinEvidenceLabels = [
      "Hong Kong HKMA stablecoin issuer licensing and scope register",
      "Hong Kong HKMA stablecoin reserve, redemption, and AML/CFT register"
    ];
    expect(hkmaStablecoinEvidence.map((item) => item.label)).toEqual(hkmaStablecoinEvidenceLabels);

    const hongKongStablecoinProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-hk-hkma-stablecoin-ready",
      projectName: "HarborDollar HKMA Stablecoin Review",
      jurisdictions: ["Hong Kong"],
      entityType: "Fiat-referenced stablecoin issuer preparing HKMA licensing and reserve evidence",
      assetModel:
        "Hong Kong fiat-referenced stablecoin issuer with specified stablecoin issuance, regulated stablecoin activity, HKMA licence application, reserve assets, full backing, redemption, attestation, AML CFT, and public launch readiness",
      userType: "Hong Kong retail users, treasury partners, compliance reviewers, and Hong Kong local counsel",
      custodyModel:
        "Platform maintains metadata-only reserve-safekeeping, qualified-custodian, attestation, redemption, AML/CFT, blockchain-analytics, and suspicious-transaction status records without wallet secret handling",
      dataSensitivity:
        "CDD status summaries, ML/TF risk status, reserve attestation metadata, transaction-monitoring summaries, and no raw KYC, credentials, wallet secrets, customer records, private cryptographic material, or personal data",
      aiUsage: "AI drafts Hong Kong HKMA stablecoin evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Hong Kong HKMA stablecoin evidence metadata",
      operatingStage: "Pre-application Hong Kong HKMA stablecoin review before local counsel signoff",
      evidenceItems: hkmaStablecoinEvidence
    };
    const audit = analyzeAuditProfile(hongKongStablecoinProject);
    const [hongKongPack] = createJurisdictionPacks(hongKongStablecoinProject, audit);

    expect(hongKongPack).toMatchObject({
      jurisdiction: "Hong Kong",
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset / stablecoin / SFC products counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(hongKongPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hk-hkma-stablecoin-issuer-control",
          title: "HKMA stablecoin issuer licensing, reserve, and AML/CFT control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: hkmaStablecoinEvidenceLabels
        }),
        expect.objectContaining({
          id: "hk-vatp-client-asset-custody-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "hk-sfc-tokenised-product-secondary-trading-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    const serializedHongKongPack = JSON.stringify(hongKongPack);
    expect(serializedHongKongPack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(serializedHongKongPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Hong Kong SFC tokenised product control ready from verified tokenisation evidence only", () => {
    const tokenisedProductEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-hk-sfc-tokenised-investment-products-secondary-trading"))
      .map((item, index) => ({
        ...item,
        id: `hk-tokenised-product-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(tokenisedProductEvidence.map((item) => item.label)).toEqual([
      "Hong Kong SFC tokenised product authorisation and consultation register",
      "Hong Kong SFC tokenisation ownership and smart-contract control register",
      "Hong Kong SFC secondary trading fair-pricing and liquidity register"
    ]);

    const hongKongTokenisedProductProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-hk-tokenised-product-ready",
      projectName: "HarborYield SFC Tokenised Product Review",
      jurisdictions: ["Hong Kong"],
      entityType: "SFC-authorised investment product provider preparing tokenisation and secondary-trading evidence",
      assetModel:
        "Tokenised SFC-authorised investment product with primary subscription and redemption, token-holder ownership records, smart-contract integrity, price-deviation alert, indicative NAV, market-maker and liquidity assumptions, and secondary trading readiness",
      userType: "Hong Kong retail and professional investors, regulated distributors, product provider reviewers, and local counsel",
      custodyModel:
        "Product provider remains responsible for tokenisation arrangement and ownership recordkeeping; trading-channel records are metadata-only in the review path",
      dataSensitivity:
        "Investor onboarding status summaries, token-holder ownership metadata, trading-interface test results, risk-disclosure acknowledgements, and no raw investor records, wallet secrets, credentials, or personal data",
      aiUsage: "AI drafts Hong Kong SFC tokenised product evidence summaries for human review",
      blockchainUse: "Simulated manifest anchor for metadata-only tokenised product counsel handoff",
      operatingStage: "Pre-launch SFC tokenisation and secondary-trading review before public reliance",
      evidenceItems: tokenisedProductEvidence
    };
    const audit = analyzeAuditProfile(hongKongTokenisedProductProject);
    const [hongKongPack] = createJurisdictionPacks(hongKongTokenisedProductProject, audit);

    expect(hongKongPack).toMatchObject({
      jurisdiction: "Hong Kong",
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset / stablecoin / SFC products counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(hongKongPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hk-sfc-tokenised-product-secondary-trading-control",
          title: "SFC tokenised product authorisation and secondary-trading control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Hong Kong SFC tokenised product authorisation and consultation register",
            "Hong Kong SFC tokenisation ownership and smart-contract control register",
            "Hong Kong SFC secondary trading fair-pricing and liquidity register"
          ]
        }),
        expect.objectContaining({
          id: "hk-vatp-client-asset-custody-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "hk-hkma-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(hongKongPack)).not.toMatch(
      /\braw KYC\b|raw investor records|wallet secrets|private key|customer records|personal data|legal conclusion/i
    );
    expect(JSON.stringify(hongKongPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Japan FSA crypto custody controls ready from verified FSA custody evidence only", () => {
    const japanCustodyEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-jp-fsa-crypto-asset-custody-user-protection"))
      .map((item, index) => ({
        ...item,
        id: `jp-fsa-custody-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(japanCustodyEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Japan crypto-asset custody and leakage response register"
    ]);

    const japanCustodyProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-jp-fsa-custody-ready",
      projectName: "SakuraKey FSA Crypto Custody Review",
      jurisdictions: ["Japan"],
      entityType: "Crypto-asset exchange service provider preparing FSA custody and user-protection evidence",
      assetModel:
        "Crypto-asset exchange custody workflow with user asset protection, segregated wallet handling, cold wallet and offline environment controls, daily reconciliation, leakage response, and separate management audit evidence",
      userType: "Japan retail customers, custody operators, compliance reviewers, and local counsel",
      custodyModel:
        "Platform manages customer crypto assets with segregated custody, cold-wallet/offline management, withdrawal approvals, reconciliation, and leakage-response metadata",
      dataSensitivity:
        "Custody-control metadata, user-asset protection summaries, leakage-response evidence, and no raw KYC, wallet secrets, customer records, or personal data",
      aiUsage: "AI drafts Japan FSA custody evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Japan custody evidence metadata",
      operatingStage: "Pre-launch Japan crypto custody review before local counsel signoff",
      evidenceItems: japanCustodyEvidence
    };
    const audit = analyzeAuditProfile(japanCustodyProject);
    const [japanPack] = createJurisdictionPacks(japanCustodyProject, audit);

    expect(japanPack).toMatchObject({
      jurisdiction: "Japan",
      localCounselRoute: {
        recommendedRole: "Japan crypto-asset exchange / custody counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(japanPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "jp-fsa-registration-user-asset-control",
          title: "FSA registration and user-asset protection control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Japan crypto-asset custody and leakage response register"
          ]
        }),
        expect.objectContaining({
          id: "jp-cold-wallet-leakage-response-control",
          title: "Cold-wallet, reconciliation, and leakage-response control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Japan crypto-asset custody and leakage response register"
          ]
        })
      ])
    );
    expect(JSON.stringify(japanPack)).not.toMatch(
      /\braw KYC\b|wallet secrets|private key|customer records|personal data|legal conclusion/i
    );
    expect(JSON.stringify(japanPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Canada CSA CTP custody controls ready from verified PRU custody evidence only", () => {
    const canadaCustodyEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-ca-csa-ctp-pru-custody-investor-protection"))
      .map((item, index) => ({
        ...item,
        id: `ca-csa-custody-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(canadaCustodyEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Canada CTP PRU custody and investor-protection register"
    ]);

    const canadaCustodyProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-ca-csa-custody-ready",
      projectName: "MapleTrust Canada CTP Custody Review",
      jurisdictions: ["Canada"],
      entityType: "Crypto asset trading platform preparing CSA PRU and custody evidence",
      assetModel:
        "Canada CTP custody workflow with pre-registration undertaking, Canadian client access, no leverage, VRCA consent, client-asset segregation, acceptable third-party custodian assurance, no re-hypothecation, and insurance risk-mitigation evidence",
      userType: "Canadian clients, custody operators, compliance reviewers, and Canada local counsel",
      custodyModel:
        "Platform holds Canadian client crypto assets through segregated custody, acceptable third-party custodian controls, trust-account metadata, withdrawal approvals, reconciliation, and no re-hypothecation controls",
      dataSensitivity:
        "Custody-control metadata, PRU summaries, custodian assurance evidence, and no raw KYC, raw client records, wallet secrets, customer records, or personal data",
      aiUsage: "AI drafts Canada CSA CTP custody evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Canada custody evidence metadata",
      operatingStage: "Pre-launch Canada CTP custody and PRU review before local counsel signoff",
      evidenceItems: canadaCustodyEvidence
    };
    const audit = analyzeAuditProfile(canadaCustodyProject);
    const [canadaPack] = createJurisdictionPacks(canadaCustodyProject, audit);

    expect(canadaPack).toMatchObject({
      jurisdiction: "Canada",
      localCounselRoute: {
        recommendedRole: "Canada crypto asset trading platform counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(canadaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ca-csa-registration-pru-control",
          title: "CSA registration and PRU investor-protection control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Canada CTP PRU custody and investor-protection register"
          ]
        }),
        expect.objectContaining({
          id: "ca-client-asset-custody-segregation-control",
          title: "Client-asset custody, segregation, and custodian assurance control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Canada CTP PRU custody and investor-protection register"
          ]
        })
      ])
    );
    expect(JSON.stringify(canadaPack)).not.toMatch(
      /\braw KYC\b|raw client records|wallet secrets|private key|customer records|personal data|legal conclusion/i
    );
    expect(JSON.stringify(canadaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Australia ASIC/AUSTRAC digital asset controls ready from verified digital asset evidence only", () => {
    const australiaDigitalAssetEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-au-asic-austrac-digital-asset-financial-services"))
      .map((item, index) => ({
        ...item,
        id: `au-asic-austrac-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(australiaDigitalAssetEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Australia digital asset financial services and VASP AML register"
    ]);

    const australiaDigitalAssetProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-au-asic-austrac-ready",
      projectName: "SouthernCross Digital Asset Review",
      jurisdictions: ["Australia"],
      entityType: "Digital asset platform preparing ASIC and AUSTRAC evidence",
      assetModel:
        "Australia digital asset financial product assumptions, AFS licence handoff, dealing, market making, custodial depository service, custody controls, VASP AML/CTF, CDD, travel rule, reporting, and recordkeeping evidence",
      userType: "Australian retail users, wholesale investors, compliance reviewers, and Australia local counsel",
      custodyModel:
        "Platform controls client digital assets through custody runbooks, cold storage, signer approvals, client-asset separation, independent audit, and wallet-control metadata",
      dataSensitivity:
        "CDD status summaries, wallet-risk metadata, transaction-monitoring summaries, and no raw KYC, wallet secrets, raw customer records, or personal data",
      aiUsage: "AI drafts Australia digital asset evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Australia digital asset evidence metadata",
      operatingStage: "Pre-launch Australia digital asset and AML/CTF review before local counsel signoff",
      evidenceItems: australiaDigitalAssetEvidence
    };
    const audit = analyzeAuditProfile(australiaDigitalAssetProject);
    const [australiaPack] = createJurisdictionPacks(australiaDigitalAssetProject, audit);

    expect(australiaPack).toMatchObject({
      jurisdiction: "Australia",
      localCounselRoute: {
        recommendedRole: "Australia digital assets / AML-CTF counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(australiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "au-asic-financial-services-custody-control",
          title: "ASIC digital-asset financial services and custody control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Australia digital asset financial services and VASP AML register"
          ]
        }),
        expect.objectContaining({
          id: "au-austrac-vasp-aml-ctf-control",
          title: "AUSTRAC VASP AML/CTF, CDD, and recordkeeping control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Australia digital asset financial services and VASP AML register"
          ]
        })
      ])
    );
    expect(JSON.stringify(australiaPack)).not.toMatch(
      /\braw KYC\b|raw customer records|wallet secrets|private key|customer records|personal data|legal conclusion/i
    );
    expect(JSON.stringify(australiaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the South Korea FSC/KoFIU VASP controls ready from verified VASP evidence only", () => {
    const koreaVaspEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-kr-fsc-kofiu-vasp-user-protection-aml"))
      .map((item, index) => ({
        ...item,
        id: `kr-fsc-kofiu-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(koreaVaspEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Korea VASP user protection and AML reporting register"
    ]);

    const koreaVaspProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-kr-fsc-kofiu-ready",
      projectName: "Seoul VASP User Protection Review",
      jurisdictions: ["South Korea"],
      entityType: "VASP preparing FSC user-protection and KoFIU AML evidence",
      assetModel:
        "South Korea VASP registration, user deposits at banks, virtual-asset segregation, cold-wallet controls, insurance reserve, abnormal transaction monitoring, KoFIU reporting, and AML/CFT evidence",
      userType: "Korean retail users, custody operators, compliance reviewers, and South Korea local counsel",
      custodyModel:
        "Platform controls user virtual assets through separate wallet records, 80 percent cold-wallet handling, signer approvals, insurance or reserve metadata, and incident response runbooks",
      dataSensitivity:
        "CDD status summaries, wallet-risk metadata, STR escalation summaries, and no raw KYC, customer records, identity files, wallet secrets, or personal data",
      aiUsage: "AI drafts South Korea VASP evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for South Korea VASP evidence metadata",
      operatingStage: "Pre-launch South Korea VASP custody and AML review before local counsel signoff",
      evidenceItems: koreaVaspEvidence
    };
    const audit = analyzeAuditProfile(koreaVaspProject);
    const [koreaPack] = createJurisdictionPacks(koreaVaspProject, audit);

    expect(koreaPack).toMatchObject({
      jurisdiction: "South Korea",
      localCounselRoute: {
        recommendedRole: "South Korea virtual asset / AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(koreaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "kr-fsc-user-asset-protection-custody-control",
          title: "FSC user-asset protection and custody control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Korea VASP user protection and AML reporting register"
          ]
        }),
        expect.objectContaining({
          id: "kr-kofiu-vasp-reporting-aml-control",
          title: "KoFIU VASP reporting, AML/CFT, CDD, and STR control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Korea VASP user protection and AML reporting register"
          ]
        })
      ])
    );
    expect(JSON.stringify(koreaPack)).not.toMatch(
      /\braw KYC\b|customer records|identity files|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(koreaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the India FIU-IND/PMLA VDA controls ready from verified VDA evidence only", () => {
    const indiaVdaEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-in-fiu-pmla-vda-aml-cft"))
      .map((item, index) => ({
        ...item,
        id: `in-fiu-pmla-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(indiaVdaEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "India VDA SP FIU-IND registration and AML reporting register"
    ]);

    const indiaVdaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-in-fiu-pmla-ready",
      projectName: "Mumbai VDA PMLA Review",
      jurisdictions: ["India"],
      entityType: "Virtual digital asset service provider preparing FIU-IND Reporting Entity evidence",
      assetModel:
        "India VDA exchange, transfer, safekeeping, issuer offer-sale financial services, Reporting Entity registration, AML/CFT/CPF program, STR, and Travel Rule evidence",
      userType: "Indian retail users, compliance reviewers, and India local counsel",
      custodyModel:
        "Platform holds user VDA balances through hosted wallet controls, transfer approvals, signer runbooks, custody boundary metadata, and incident escalation placeholders",
      dataSensitivity:
        "CDD status summaries, wallet-risk metadata, STR escalation summaries, and no raw KYC, PAN, Aadhaar, OVDs, wallet secrets, customer records, or personal data",
      aiUsage: "AI drafts India VDA AML/CFT evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for India VDA evidence metadata",
      operatingStage: "Pre-launch India VDA AML/CFT review before local counsel signoff",
      evidenceItems: indiaVdaEvidence
    };
    const audit = analyzeAuditProfile(indiaVdaProject);
    const [indiaPack] = createJurisdictionPacks(indiaVdaProject, audit);

    expect(indiaPack).toMatchObject({
      jurisdiction: "India",
      localCounselRoute: {
        recommendedRole: "India VDA / PMLA AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(indiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "in-fiu-registration-activity-scope-control",
          title: "FIU-IND Reporting Entity registration and activity-scope control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "India VDA SP FIU-IND registration and AML reporting register"
          ]
        }),
        expect.objectContaining({
          id: "in-vda-aml-reporting-cdd-str-control",
          title: "India VDA AML/CFT reporting, CDD/EDD, STR, and Travel Rule control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "India VDA SP FIU-IND registration and AML reporting register"
          ]
        })
      ])
    );
    expect(JSON.stringify(indiaPack)).not.toMatch(
      /\braw KYC\b|PAN|Aadhaar|OVDs|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(indiaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Thailand SEC/AMLO digital asset controls ready from verified custody evidence only", () => {
    const thailandCustodyEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-th-sec-digital-asset-business-custody-aml"))
      .map((item, index) => ({
        ...item,
        id: `th-sec-amlo-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(thailandCustodyEvidence.map((item) => item.label)).toEqual([
      "Custody and signer control runbook",
      "Thailand digital asset custody and AML/CDD register"
    ]);

    const thailandCustodyProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-th-sec-amlo-ready",
      projectName: "Bangkok Digital Asset Custody Review",
      jurisdictions: ["Thailand"],
      entityType: "Digital asset business operator preparing SEC and AMLO evidence",
      assetModel:
        "Thailand digital asset exchange, broker, dealer, custodial wallet provider, SEC license route, client asset custody, transfer approvals, daily reconciliation, and AML/CDD evidence",
      userType: "Thai retail users, compliance reviewers, and Thailand local counsel",
      custodyModel:
        "Platform holds client digital assets through wallet authority controls, signer quorum, withdrawal approvals, transfer approval, client asset records, and daily reconciliation placeholders",
      dataSensitivity:
        "CDD status summaries, beneficial-owner status metadata, high-risk customer metadata, and no raw KYC, wallet secrets, credentials, customer records, or personal data",
      aiUsage: "AI drafts Thailand SEC custody and AMLO AML/CDD evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Thailand digital asset evidence metadata",
      operatingStage: "Pre-launch Thailand SEC and AMLO review before local counsel signoff",
      evidenceItems: thailandCustodyEvidence
    };
    const audit = analyzeAuditProfile(thailandCustodyProject);
    const [thailandPack] = createJurisdictionPacks(thailandCustodyProject, audit);

    expect(thailandPack).toMatchObject({
      jurisdiction: "Thailand",
      localCounselRoute: {
        recommendedRole: "Thailand digital asset / AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(thailandPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "th-sec-digital-asset-business-custody-control",
          title: "SEC digital asset business license and client-asset custody control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Thailand digital asset custody and AML/CDD register"
          ]
        }),
        expect.objectContaining({
          id: "th-amlo-aml-cdd-high-risk-control",
          title: "AMLO AML/CDD and high-risk customer control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "Custody and signer control runbook",
            "Thailand digital asset custody and AML/CDD register"
          ]
        })
      ])
    );
    expect(JSON.stringify(thailandPack)).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(thailandPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Indonesia OJK digital financial asset controls ready from verified trading evidence only", () => {
    const indonesiaTradingEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-id-ojk-digital-financial-asset-crypto-trading"))
      .map((item, index) => ({
        ...item,
        id: `id-ojk-trading-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(indonesiaTradingEvidence.map((item) => item.label)).toEqual([
      "Indonesia OJK digital financial asset trading and whitelist register"
    ]);

    const indonesiaTradingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-id-ojk-ready",
      projectName: "Jakarta Crypto Trading Review",
      jurisdictions: ["Indonesia"],
      entityType: "Indonesia digital financial asset and crypto asset trading operator preparing OJK evidence",
      assetModel:
        "Indonesia digital financial asset trading platform with crypto asset trading, PAKD and CPAKD whitelist review, SPRINT licensing route, product registration, instrument registration, daily report, monthly report, and business-plan evidence",
      userType: "Indonesian retail users, compliance reviewers, and Indonesia local counsel",
      custodyModel:
        "Platform maintains metadata-only trading, official app and website channel, consumer-protection, and product governance records without wallet secret handling",
      dataSensitivity:
        "Licensed-operator status, product registration metadata, reporting-owner metadata, and no raw KYC, wallet secrets, credentials, customer records, or personal data",
      aiUsage: "AI drafts Indonesia OJK trading, whitelist, governance, and reporting evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Indonesia OJK trading evidence metadata",
      operatingStage: "Pre-launch Indonesia OJK review before local counsel signoff",
      evidenceItems: indonesiaTradingEvidence
    };
    const audit = analyzeAuditProfile(indonesiaTradingProject);
    const [indonesiaPack] = createJurisdictionPacks(indonesiaTradingProject, audit);

    expect(indonesiaPack).toMatchObject({
      jurisdiction: "Indonesia",
      localCounselRoute: {
        recommendedRole: "Indonesia digital financial asset / crypto regulatory counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(indonesiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "id-ojk-dfa-crypto-licensing-whitelist-control",
          title: "OJK digital financial asset trading licensing and whitelist control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Indonesia OJK digital financial asset trading and whitelist register"]
        }),
        expect.objectContaining({
          id: "id-ojk-dfa-governance-reporting-control",
          title: "OJK product, reporting, governance, and main-party control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Indonesia OJK digital financial asset trading and whitelist register"]
        })
      ])
    );
    expect(JSON.stringify(indonesiaPack)).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(indonesiaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Malaysia SC/BNM digital asset controls ready from verified exchange evidence only", () => {
    const malaysiaExchangeEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) =>
        item.source?.includes("control-my-sc-bnm-digital-asset-exchange-custody-aml")
      )
      .map((item, index) => ({
        ...item,
        id: `my-sc-bnm-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(malaysiaExchangeEvidence.map((item) => item.label)).toEqual([
      "Malaysia digital asset exchange custody and AML/CFT register"
    ]);

    const malaysiaExchangeProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-my-sc-bnm-ready",
      projectName: "Kuala Lumpur Digital Asset Exchange Review",
      jurisdictions: ["Malaysia"],
      entityType: "Malaysia digital asset exchange operator preparing SC and BNM evidence",
      assetModel:
        "Malaysia digital asset exchange with RMO-DAX, digital broker, Digital Asset Custodian, DAC registration route, IEO assumptions, tradeable asset and Shariah review assumptions, official app and website channels, and custody safeguarding evidence",
      userType: "Malaysian retail users, compliance reviewers, and Malaysia local counsel",
      custodyModel:
        "Platform maintains metadata-only custody safeguarding, wallet authority, reporting-institution, official-channel, and transparency records without wallet secret handling",
      dataSensitivity:
        "Customer identification status summaries, CDD/EDD status metadata, beneficial-owner status metadata, reporting-owner metadata, and no raw KYC, wallet secrets, credentials, customer records, or personal data",
      aiUsage:
        "AI drafts Malaysia SC DAX/DAC and BNM AML/CFT evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Malaysia digital asset evidence metadata",
      operatingStage: "Pre-launch Malaysia SC and BNM review before local counsel signoff",
      evidenceItems: malaysiaExchangeEvidence
    };
    const audit = analyzeAuditProfile(malaysiaExchangeProject);
    const [malaysiaPack] = createJurisdictionPacks(malaysiaExchangeProject, audit);

    expect(malaysiaPack).toMatchObject({
      jurisdiction: "Malaysia",
      localCounselRoute: {
        recommendedRole: "Malaysia digital asset / AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(malaysiaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "my-sc-dax-dac-registration-custody-control",
          title: "SC DAX/DAC registration, trading, and custody control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Malaysia digital asset exchange custody and AML/CFT register"]
        }),
        expect.objectContaining({
          id: "my-bnm-aml-cft-reporting-control",
          title: "BNM digital currency AML/CFT reporting-institution control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Malaysia digital asset exchange custody and AML/CFT register"]
        })
      ])
    );
    expect(JSON.stringify(malaysiaPack)).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(malaysiaPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Philippines BSP VASP controls ready from verified custody evidence only", () => {
    const philippinesVaspEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-ph-bsp-vasp-casp-risk-management-aml"))
      .map((item, index) => ({
        ...item,
        id: `ph-bsp-vasp-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(philippinesVaspEvidence.map((item) => item.label)).toEqual([
      "Philippines BSP VASP custody and AML/CFT risk-management register"
    ]);

    const philippinesVaspProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-ph-bsp-ready",
      projectName: "Manila VASP Custody Review",
      jurisdictions: ["Philippines"],
      entityType: "Philippines VASP/CASP operator preparing BSP evidence",
      assetModel:
        "Philippines VASP custody workflow with BSP Certificate of Authority, money service business route, virtual asset service provider, CASP counterparty, VA exchange, VA transfer, VA custodian, safekeeping, wallet security, offshore VASP, and retail access evidence",
      userType: "Philippine retail users, compliance reviewers, and Philippines local counsel",
      custodyModel:
        "Platform maintains metadata-only VA custodian, safekeeping, wallet security, transfer-control, and counterparty records without wallet secret handling",
      dataSensitivity:
        "Due diligence status summaries, EDD status metadata, adverse-media review status, payment transparency status, transaction-monitoring status, and no raw KYC, wallet secrets, credentials, customer records, or personal data",
      aiUsage:
        "AI drafts Philippines BSP VASP/CASP and AML/CFT evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Philippines VASP evidence metadata",
      operatingStage: "Pre-launch Philippines BSP review before local counsel signoff",
      evidenceItems: philippinesVaspEvidence
    };
    const audit = analyzeAuditProfile(philippinesVaspProject);
    const [philippinesPack] = createJurisdictionPacks(philippinesVaspProject, audit);

    expect(philippinesPack).toMatchObject({
      jurisdiction: "Philippines",
      localCounselRoute: {
        recommendedRole: "Philippines virtual asset / AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(philippinesPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ph-bsp-vasp-registration-custody-control",
          title: "BSP VASP registration, activity, and custody-scope control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Philippines BSP VASP custody and AML/CFT risk-management register"]
        }),
        expect.objectContaining({
          id: "ph-bsp-aml-cft-monitoring-control",
          title: "BSP AML/CFT due-diligence, monitoring, and STR control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Philippines BSP VASP custody and AML/CFT risk-management register"]
        })
      ])
    );
    expect(JSON.stringify(philippinesPack)).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(JSON.stringify(philippinesPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the South Africa FSCA/FIC CASP controls ready from verified Travel Rule evidence only", () => {
    const southAfricaCaspEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) =>
        item.source?.includes("control-za-fsca-fic-casp-licensing-travel-rule")
      )
      .map((item, index) => ({
        ...item,
        id: `za-fsca-fic-casp-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(southAfricaCaspEvidence.map((item) => item.label)).toEqual([
      "South Africa CASP licensing and Travel Rule RMCP register"
    ]);

    const southAfricaCaspProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-za-fsca-fic-ready",
      projectName: "Johannesburg CASP Travel Rule Review",
      jurisdictions: ["South Africa"],
      entityType: "South Africa CASP/FSP operator preparing FSCA and FIC evidence",
      assetModel:
        "South Africa CASP workflow with crypto asset financial product, FAIS, FSP licence route, financial services provider, advice, intermediary services, investment management, business model, operational ability, and fit-and-proper owner evidence",
      userType: "South African retail users, compliance reviewers, and South Africa local counsel",
      custodyModel:
        "Platform maintains metadata-only ordering CASP, intermediary CASP, recipient CASP, counterparty due-diligence, secure-transmission, incomplete-transfer, unhosted-wallet, RMCP, and recordkeeping records without wallet secret handling",
      dataSensitivity:
        "Originator and beneficiary metadata status summaries, counterparty due-diligence status, transfer-control status, RMCP status, and no raw KYC, wallet secrets, credentials, customer records, originator data, beneficiary data, or personal data",
      aiUsage:
        "AI drafts South Africa FSCA CASP/FSP and FIC Travel Rule evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for South Africa CASP evidence metadata",
      operatingStage: "Pre-launch South Africa FSCA and FIC review before local counsel signoff",
      evidenceItems: southAfricaCaspEvidence
    };
    const audit = analyzeAuditProfile(southAfricaCaspProject);
    const [southAfricaPack] = createJurisdictionPacks(southAfricaCaspProject, audit);

    expect(southAfricaPack).toMatchObject({
      jurisdiction: "South Africa",
      localCounselRoute: {
        recommendedRole: "South Africa financial services / AML counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(southAfricaPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "za-fsca-casp-fsp-licensing-control",
          title: "FSCA CASP/FSP licensing and activity-scope control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["South Africa CASP licensing and Travel Rule RMCP register"]
        }),
        expect.objectContaining({
          id: "za-fic-travel-rule-rmcp-control",
          title: "FIC Travel Rule, RMCP, and transfer-control evidence",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["South Africa CASP licensing and Travel Rule RMCP register"]
        })
      ])
    );
    const serializedSouthAfricaPack = JSON.stringify(southAfricaPack);
    expect(serializedSouthAfricaPack).toMatch(/no raw kyc/i);
    expect(serializedSouthAfricaPack).not.toMatch(
      /customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(serializedSouthAfricaPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Swiss FINMA token and stablecoin controls ready from verified source evidence only", () => {
    const swissFinmaEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter(
        (item) =>
          item.source?.includes("control-ch-finma-ico-token-classification") ||
          item.source?.includes("control-ch-finma-stablecoin-guidance-06-2024")
      )
      .map((item, index) => ({
        ...item,
        id: `ch-finma-evidence-${index + 1}`,
        status: "verified" as const
      }));

    const swissTokenClassificationLabels = [
      "Swiss token classification memo",
      "Swiss offering, prospectus, and governance evidence"
    ];
    const swissStablecoinLabels = [
      "Swiss stablecoin issuer and bank guarantee perimeter memo",
      "Swiss stablecoin AML and sanctions transfer-risk register"
    ];
    const swissFoundationCustodyLabels = [
      "Swiss offering, prospectus, and governance evidence",
      "Swiss stablecoin issuer and bank guarantee perimeter memo"
    ];
    expect(swissFinmaEvidence.map((item) => item.label)).toEqual([
      ...swissTokenClassificationLabels,
      ...swissStablecoinLabels
    ]);

    const swissFinmaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-ch-finma-stablecoin-ready",
      projectName: "Zurich FINMA Stablecoin Review",
      jurisdictions: ["Switzerland"],
      entityType: "Swiss stablecoin issuer preparing FINMA token and stablecoin evidence",
      assetModel:
        "Swiss CHF-referenced stablecoin pilot with token classification, payment token, utility token, asset token, hybrid token, fundraising assumptions, prospectus intake, holder redemption claim, reserve assets, bank guarantee, banking-law perimeter, collective-investment perimeter, yield, and public launch readiness",
      userType: "Swiss qualified and retail users, treasury partners, compliance reviewers, and Swiss local counsel",
      custodyModel:
        "Platform maintains metadata-only reserve, bank-guarantee, holder-redemption, transfer-risk, transaction-monitoring, and blocked-transfer records without wallet secret handling",
      dataSensitivity:
        "Holder-identification status summaries, transfer-risk status, sanctions status, reserve-owner status, and no raw KYC, customer records, credentials, wallet secrets, private cryptographic material, or personal data",
      aiUsage: "AI drafts Swiss FINMA token and stablecoin evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Swiss FINMA evidence metadata",
      operatingStage: "Pre-launch Swiss FINMA stablecoin review before local counsel signoff",
      evidenceItems: swissFinmaEvidence
    };
    const audit = analyzeAuditProfile(swissFinmaProject);
    const [swissPack] = createJurisdictionPacks(swissFinmaProject, audit);

    expect(swissPack).toMatchObject({
      jurisdiction: "Switzerland",
      localCounselRoute: {
        recommendedRole: "Swiss DLT / financial services counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(swissPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ch-token-classification-control",
          title: "Token classification and prospectus-intake control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: swissTokenClassificationLabels
        }),
        expect.objectContaining({
          id: "ch-stablecoin-issuer-guarantee-perimeter-control",
          title: "Stablecoin issuer and bank-guarantee perimeter control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: swissStablecoinLabels
        }),
        expect.objectContaining({
          id: "ch-stablecoin-aml-sanctions-transfer-risk-control",
          title: "Stablecoin AML, sanctions, and transfer-risk control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: swissStablecoinLabels
        }),
        expect.objectContaining({
          id: "ch-foundation-custody-control",
          title: "Foundation, custody, and banking perimeter control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: swissFoundationCustodyLabels
        })
      ])
    );
    const serializedSwissPack = JSON.stringify(swissPack);
    expect(serializedSwissPack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|personal data|legal conclusion/i
    );
    expect(serializedSwissPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UK FCA cryptoasset AML controls ready from verified Travel Rule evidence only", () => {
    const ukCryptoassetAmlEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) =>
        item.source?.includes("control-uk-fca-cryptoasset-aml-registration-travel-rule")
      )
      .map((item, index) => ({
        ...item,
        id: `uk-fca-cryptoasset-aml-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(ukCryptoassetAmlEvidence.map((item) => item.label)).toEqual([
      "UK FCA cryptoasset AML registration and Travel Rule register"
    ]);

    const ukCryptoassetAmlProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uk-fca-aml-ready",
      projectName: "London Cryptoasset AML Review",
      jurisdictions: ["United Kingdom"],
      entityType: "UK cryptoasset business preparing FCA MLR registration and Travel Rule evidence",
      assetModel:
        "UK cryptoasset exchange provider and custodian wallet provider workflow with FCA MLR registration, business plan, ownership control structure, MLRO, BWRA CRA, AML/CTF/CPF framework, sanctions, blockchain analytics, transaction monitoring, SAR escalation, Travel Rule data flow, third-party tool configuration, and record retrieval evidence",
      userType: "UK retail users, compliance reviewers, and UK local counsel",
      custodyModel:
        "Platform maintains metadata-only custodian-wallet, originator-beneficiary data-flow, Travel Rule, sanctions, transaction-monitoring, SAR-escalation, and record-retrieval records without wallet secret handling",
      dataSensitivity:
        "CDD/EDD status summaries, customer risk assessment status, originator-beneficiary data-flow status, sanctions status, blockchain analytics status, and no raw KYC, wallet secrets, credentials, customer records, private cryptographic material, or personal data",
      aiUsage:
        "AI drafts UK FCA MLR registration and cryptoasset AML/Travel Rule evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for UK cryptoasset AML evidence metadata",
      operatingStage: "Pre-launch UK FCA AML review before local counsel signoff",
      evidenceItems: ukCryptoassetAmlEvidence
    };
    const audit = analyzeAuditProfile(ukCryptoassetAmlProject);
    const [ukPack] = createJurisdictionPacks(ukCryptoassetAmlProject, audit);

    expect(ukPack).toMatchObject({
      jurisdiction: "United Kingdom",
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uk-fca-mlr-registration-activity-scope-control",
          title: "FCA MLR registration and cryptoasset activity-scope control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UK FCA cryptoasset AML registration and Travel Rule register"]
        }),
        expect.objectContaining({
          id: "uk-cryptoasset-aml-travel-rule-control",
          title: "UK cryptoasset AML, SAR, sanctions, and Travel Rule control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UK FCA cryptoasset AML registration and Travel Rule register"]
        })
      ])
    );
    const serializedUkPack = JSON.stringify(ukPack);
    expect(serializedUkPack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|private key|legal conclusion/i
    );
    expect(serializedUkPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the Germany BaFin MiCAR custody controls ready from verified authorisation evidence only", () => {
    const germanyMicarEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) =>
        item.source?.includes("control-de-bafin-micar-casp-custody-authorisation")
      )
      .map((item, index) => ({
        ...item,
        id: `de-bafin-micar-evidence-${index + 1}`,
        status: "verified" as const
      }));

    const germanyMicarEvidenceLabels = [
      "Custody and signer control runbook",
      "Germany BaFin MiCAR CASP custody and Article 60/62 register"
    ];
    expect(germanyMicarEvidence.map((item) => item.label)).toEqual(germanyMicarEvidenceLabels);

    const germanyMicarProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-de-bafin-micar-ready",
      projectName: "Frankfurt MiCAR Custody Review",
      jurisdictions: ["Germany"],
      entityType: "Germany CASP custody operator preparing BaFin MiCAR evidence",
      assetModel:
        "Germany MiCAR CASP custody workflow with service scope, Article 60 notification, Article 62 application assumptions, home Member State, German client access, Article 75 custody policy, client register, position statement, segregation, return crypto assets, means of access, and client crypto assets evidence",
      userType: "German retail users, compliance reviewers, and German local counsel",
      custodyModel:
        "Platform maintains metadata-only custody-policy, client-position, segregation, return-process, means-of-access, and client-crypto-asset records without wallet secret handling",
      dataSensitivity:
        "Client-position status summaries, means-of-access handling status, custody safeguarding status, private-key exclusion status, and no raw KYC, wallet secrets, credentials, customer records, private cryptographic material, or personal data",
      aiUsage:
        "AI drafts Germany BaFin MiCAR authorisation and custody safeguarding evidence requests after redaction and human review",
      blockchainUse: "Simulated hash receipt for Germany MiCAR custody evidence metadata",
      operatingStage: "Pre-launch Germany BaFin MiCAR review before local counsel signoff",
      evidenceItems: germanyMicarEvidence
    };
    const audit = analyzeAuditProfile(germanyMicarProject);
    const [germanyPack] = createJurisdictionPacks(germanyMicarProject, audit);

    expect(germanyPack).toMatchObject({
      jurisdiction: "Germany",
      localCounselRoute: {
        recommendedRole: "Germany BaFin / MiCAR crypto custody counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(germanyPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "de-bafin-micar-casp-authorisation-control",
          title: "BaFin MiCAR CASP authorisation and notification control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: germanyMicarEvidenceLabels
        }),
        expect.objectContaining({
          id: "de-bafin-custody-safeguarding-control",
          title: "MiCAR custody safeguarding and client-position control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: germanyMicarEvidenceLabels
        })
      ])
    );
    const serializedGermanyPack = JSON.stringify(germanyPack);
    expect(serializedGermanyPack).toMatch(/private cryptographic keys/i);
    expect(serializedGermanyPack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|personal data|legal conclusion/i
    );
    expect(serializedGermanyPack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UAE VARA operating controls ready from verified activity-scope and risk evidence only", () => {
    const varaOperatingEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter(
        (item) =>
          item.source?.includes("control-uae-vara-va-regulations-activity-scope") ||
          item.source?.includes("control-uae-vara-compliance-risk-management")
      )
      .map((item, index) => ({
        ...item,
        id: `uae-vara-operating-evidence-${index + 1}`,
        status: "verified" as const
      }));

    const varaOperatingEvidenceLabels = [
      "Custody and signer control runbook",
      "Wallet sanctions screening and escalation controls"
    ];
    expect(varaOperatingEvidence.map((item) => item.label)).toEqual(varaOperatingEvidenceLabels);
    expect(JSON.stringify(varaOperatingEvidence)).not.toContain("control-uae-vara-marketing-regulations-2024");

    const varaOperatingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uae-vara-operating-ready",
      projectName: "Dubai VARA Operating Review",
      jurisdictions: ["United Arab Emirates"],
      entityType: "Virtual asset service provider operations team",
      assetModel:
        "Dubai virtual asset issuance, exchange, transfer, custody service, activity-scope, licensing assumptions, yield, and public launch readiness",
      userType: "UAE institutional treasury partners, compliance reviewers, operations owners, and local counsel",
      custodyModel:
        "Platform safeguards client virtual assets through hosted wallet controls, reconciliation, withdrawal approvals, and proof-of-reserves placeholders",
      dataSensitivity:
        "CDD status summaries, wallet-risk metadata, transaction-monitoring summaries, customer records excluded, no raw KYC, no wallet secrets, and no personal data",
      aiUsage: "AI drafts audit-prep evidence summaries for human review and UAE counsel routing",
      blockchainUse: "Simulated evidence anchor for metadata-only VARA counsel handoff",
      operatingStage: "Pre-production UAE VARA operating review before local counsel signoff and public launch",
      evidenceItems: varaOperatingEvidence
    };
    const audit = analyzeAuditProfile(varaOperatingProject);
    const [uaePack] = createJurisdictionPacks(varaOperatingProject, audit);

    expect(uaePack).toMatchObject({
      jurisdiction: "United Arab Emirates",
      localCounselRoute: {
        recommendedRole: "UAE virtual-assets / financial regulatory counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(uaePack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uae-virtual-asset-scope-control",
          title: "Virtual asset activity scope control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Custody and signer control runbook"]
        }),
        expect.objectContaining({
          id: "uae-marketing-custody-access-control",
          title: "Marketing, custody, and cross-border access control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: varaOperatingEvidenceLabels
        }),
        expect.objectContaining({
          id: "uae-vara-2024-marketing-regulations-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    const serializedUaePack = JSON.stringify(uaePack);
    expect(serializedUaePack).not.toMatch(
      /\braw KYC\b|customer records|wallet secrets|personal data|legal conclusion/i
    );
    expect(serializedUaePack).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UAE VARA 2024 marketing regulations control ready from verified marketing evidence only", () => {
    const varaMarketingEvidence = createEvidenceItemsFromTemplate("marketing-claims-review")
      .filter((item) => item.source?.includes("control-uae-vara-marketing-regulations-2024"))
      .map((item, index) => ({
        ...item,
        id: `uae-vara-marketing-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(varaMarketingEvidence.map((item) => item.label)).toEqual([
      "UAE VARA approval and risk-warning archive",
      "UAE KOL incentive and recordkeeping log"
    ]);

    const marketingProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uae-vara-marketing-ready",
      jurisdictions: ["United Arab Emirates"],
      evidenceItems: varaMarketingEvidence
    };
    const audit = analyzeAuditProfile(marketingProject);
    const [uaePack] = createJurisdictionPacks(marketingProject, audit);

    expect(uaePack).toMatchObject({
      jurisdiction: "United Arab Emirates",
      localCounselRoute: {
        recommendedRole: "UAE virtual-assets / financial regulatory counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(uaePack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uae-vara-2024-marketing-regulations-control",
          title: "VARA 2024 marketing approval, KOL, and recordkeeping control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: [
            "UAE VARA approval and risk-warning archive",
            "UAE KOL incentive and recordkeeping log"
          ]
        }),
        expect.objectContaining({
          id: "uae-marketing-approval-audience-control",
          title: "Marketing approval and audience-control control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UAE VARA approval and risk-warning archive"]
        }),
        expect.objectContaining({
          id: "uae-kol-incentive-recordkeeping-control",
          title: "KOL, incentive, and marketing recordkeeping control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["UAE KOL incentive and recordkeeping log"]
        }),
        expect.objectContaining({
          id: "uae-marketing-custody-access-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(uaePack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(uaePack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU MiCA Article 75 CASP custody control ready from verified RWA custody runbook evidence only", () => {
    const evidenceItems = createEvidenceItemsFromTemplate("tokenized-yield-rwa").map((item, index) => ({
      ...item,
      id: `eu-rwa-mica-custody-template-${index + 1}`,
      status: "verified" as const
    }));
    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-mica-custody-ready",
      jurisdictions: ["European Union"],
      evidenceItems
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [euPack] = createJurisdictionPacks(rwaProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-article-75-casp-custody-control",
          title: "MiCA Article 75 CASP custody and administration control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["Custody and signer control runbook"]
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU DORA ICT operational resilience control ready from verified RWA resilience-register evidence only", () => {
    const doraRegister = createEvidenceItemsFromTemplate("tokenized-yield-rwa").find(
      (item) => item.label === "EU DORA ICT resilience register"
    );

    expect(doraRegister).toBeDefined();

    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-dora-ict-ready",
      jurisdictions: ["European Union"],
      evidenceItems: [
        {
          ...doraRegister!,
          id: "eu-rwa-dora-ict-register-1",
          status: "verified" as const
        }
      ]
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [euPack] = createJurisdictionPacks(rwaProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-dora-ict-operational-resilience-control",
          title: "DORA ICT operational resilience control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["EU DORA ICT resilience register"]
        }),
        expect.objectContaining({
          id: "eu-mica-article-75-casp-custody-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU TFR transfer-information control ready from verified RWA Travel Rule evidence only", () => {
    const tfrRegister = createEvidenceItemsFromTemplate("tokenized-yield-rwa").find(
      (item) => item.label === "EU TFR Travel Rule transfer information register"
    );

    expect(tfrRegister).toBeDefined();

    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-tfr-transfer-ready",
      jurisdictions: ["European Union"],
      evidenceItems: [
        {
          ...tfrRegister!,
          id: "eu-rwa-tfr-transfer-register-1",
          status: "verified" as const
        }
      ]
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [euPack] = createJurisdictionPacks(rwaProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-tfr-crypto-asset-transfer-information-control",
          title: "TFR crypto-asset transfer information control",
          owner: "Compliance",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["EU TFR Travel Rule transfer information register"]
        }),
        expect.objectContaining({
          id: "eu-dora-ict-operational-resilience-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU MiCA Title II white-paper control ready from verified source-linked RWA evidence only", () => {
    const micaTitleIiEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-eu-mica-title-ii-white-paper"))
      .map((item, index) => ({
        ...item,
        id: `eu-mica-title-ii-evidence-${index + 1}`,
        status: "verified" as const
      }));

    expect(micaTitleIiEvidence.map((item) => item.label)).toEqual(["RWA disclosure assumptions memo", "Evidence anchor procedure"]);

    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-mica-title-ii-ready",
      projectName: "EuroLaunch MiCA White Paper Review",
      jurisdictions: ["European Union"],
      assetModel:
        "EU crypto-asset public launch with MiCA Title II white paper, public communication, risk disclosure, management approval, source-lineage, and manifest provenance evidence",
      userType: "EU retail users, counsel reviewers, and compliance reviewers",
      custodyModel: "No custody in this slice; white-paper evidence is metadata-only",
      dataSensitivity: "Disclosure provenance metadata, reviewer-owner notes, and no raw customer records",
      blockchainUse: "Simulated hash receipt for approved white-paper metadata",
      operatingStage: "Pre-launch EU MiCA Title II review before local counsel signoff",
      evidenceItems: micaTitleIiEvidence
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [euPack] = createJurisdictionPacks(rwaProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-title-ii-white-paper-control",
          title: "MiCA Title II white paper and public-communication control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["RWA disclosure assumptions memo", "Evidence anchor procedure"]
        }),
        expect.objectContaining({
          id: "eu-mica-marketing-communications-control",
          status: "needs-evidence",
          evidenceLabels: []
        }),
        expect.objectContaining({
          id: "eu-mica-art-emt-stablecoin-issuer-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU DLT Pilot perimeter control ready from verified RWA market-infrastructure evidence only", () => {
    const dltRegister = createEvidenceItemsFromTemplate("tokenized-yield-rwa").find(
      (item) => item.label === "EU DLT Pilot Regime market infrastructure perimeter register"
    );

    expect(dltRegister).toBeDefined();

    const rwaProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-dlt-pilot-ready",
      jurisdictions: ["European Union"],
      evidenceItems: [
        {
          ...dltRegister!,
          id: "eu-rwa-dlt-pilot-register-1",
          status: "verified" as const
        }
      ]
    };
    const audit = analyzeAuditProfile(rwaProject);
    const [euPack] = createJurisdictionPacks(rwaProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-dlt-pilot-market-infrastructure-control",
          title: "DLT Pilot market-infrastructure perimeter control",
          owner: "Counsel",
          priority: "P1",
          status: "evidence-ready",
          evidenceLabels: ["EU DLT Pilot Regime market infrastructure perimeter register"]
        }),
        expect.objectContaining({
          id: "eu-tfr-crypto-asset-transfer-information-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the EU MiCA ART/EMT stablecoin issuer control ready from verified stablecoin registers only", () => {
    const stablecoinEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-eu-mica-art-emt-stablecoin-issuer-regime"))
      .map((item, index) => ({
        ...item,
        id: `eu-mica-stablecoin-register-${index + 1}`,
        status: "verified" as const
      }));

    expect(stablecoinEvidence.map((item) => item.label)).toEqual([
      "EU MiCA ART EMT issuer authorisation and white paper register",
      "EU MiCA stablecoin reserve redemption and recovery register"
    ]);

    const stablecoinProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-eu-mica-stablecoin-ready",
      jurisdictions: ["European Union"],
      evidenceItems: stablecoinEvidence
    };
    const audit = analyzeAuditProfile(stablecoinProject);
    const [euPack] = createJurisdictionPacks(stablecoinProject, audit);

    expect(euPack).toMatchObject({
      jurisdiction: "European Union",
      localCounselRoute: {
        recommendedRole: "EU crypto-asset / data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(euPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eu-mica-art-emt-stablecoin-issuer-control",
          title: "MiCA ART/EMT stablecoin issuer control",
          owner: "Counsel",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: [
            "EU MiCA ART EMT issuer authorisation and white paper register",
            "EU MiCA stablecoin reserve redemption and recovery register"
          ]
        }),
        expect.objectContaining({
          id: "eu-dlt-pilot-market-infrastructure-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(euPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(euPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });

  it("marks the UK qualifying stablecoin issuer control ready from verified stablecoin registers only", () => {
    const stablecoinEvidence = createEvidenceItemsFromTemplate("tokenized-yield-rwa")
      .filter((item) => item.source?.includes("control-uk-fca-qualifying-stablecoin-issuer-regime"))
      .map((item, index) => ({
        ...item,
        id: `uk-stablecoin-register-${index + 1}`,
        status: "verified" as const
      }));

    expect(stablecoinEvidence.map((item) => item.label)).toEqual([
      "UK qualifying stablecoin issuer permission and disclosure register",
      "UK qualifying stablecoin backing safeguarding and redemption register"
    ]);

    const stablecoinProject: ProjectProfile = {
      ...project,
      id: "jurisdiction-pack-uk-stablecoin-ready",
      jurisdictions: ["United Kingdom"],
      evidenceItems: stablecoinEvidence
    };
    const audit = analyzeAuditProfile(stablecoinProject);
    const [ukPack] = createJurisdictionPacks(stablecoinProject, audit);

    expect(ukPack).toMatchObject({
      jurisdiction: "United Kingdom",
      localCounselRoute: {
        recommendedRole: "UK financial promotion / crypto / AI data protection counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "uk-qualifying-stablecoin-issuer-control",
          title: "UK qualifying stablecoin issuer control",
          owner: "Counsel",
          priority: "P0",
          status: "evidence-ready",
          evidenceLabels: [
            "UK qualifying stablecoin issuer permission and disclosure register",
            "UK qualifying stablecoin backing safeguarding and redemption register"
          ]
        }),
        expect.objectContaining({
          id: "uk-cryptoasset-aml-travel-rule-control",
          status: "needs-evidence",
          evidenceLabels: []
        })
      ])
    );
    expect(JSON.stringify(ukPack)).not.toMatch(/\braw KYC\b|wallet secrets|private key|customer records|legal conclusion/i);
    expect(JSON.stringify(ukPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
