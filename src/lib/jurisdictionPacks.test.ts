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
          id: "eu-disclosure-provenance-control",
          title: "Crypto-asset disclosure provenance control"
        }),
        expect.objectContaining({
          id: "eu-mica-marketing-communications-control",
          title: "MiCA marketing communications and white-paper consistency control",
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
        recommendedRole: "UK financial promotion / crypto counsel"
      }
    });
    expect(ukPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "Financial promotion and approval control",
        "FCA cryptoasset financial promotions approval and retail-access control",
        "Custody operational resilience control",
        "FCA MLR registration and cryptoasset activity-scope control",
        "UK cryptoasset AML, SAR, sanctions, and Travel Rule control",
        "UK qualifying stablecoin issuer control"
      ])
    );

    const singaporePack = packs.find((pack) => pack.jurisdiction === "Singapore");
    expect(singaporePack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Singapore fintech / digital asset counsel"
      }
    });
    expect(singaporePack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining(["Product scope and launch-intake control", "Custody, AML, and data handoff control"])
    );

    const hongKongPack = packs.find((pack) => pack.jurisdiction === "Hong Kong");
    expect(hongKongPack).toMatchObject({
      localCounselRoute: {
        recommendedRole: "Hong Kong virtual asset trading platform counsel"
      }
    });
    expect(hongKongPack?.controls.map((control) => control.title)).toEqual(
      expect.arrayContaining([
        "VATP client asset custody control",
        "Wallet governance and compensation arrangement control",
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
        recommendedRole: "UK financial promotion / crypto counsel"
      },
      notLegalAdviceBoundary: "Not legal advice. Jurisdiction packs are audit preparation routing aids only."
    });
    expect(ukPack?.controls).toEqual(
      expect.arrayContaining([
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
        recommendedRole: "UK financial promotion / crypto counsel"
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
    expect(JSON.stringify(ukPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(ukPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
  });
});
