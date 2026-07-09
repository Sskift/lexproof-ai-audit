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
        })
      ])
    );
    expect(JSON.stringify(usPack)).not.toMatch(/\braw KYC\b|wallet secrets|customer records|personal data|legal conclusion/i);
    expect(JSON.stringify(usPack)).not.toMatch(/\bcompliant\b|\bnon-compliant\b/i);
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
