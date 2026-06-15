export type ApprovalSource = "renewal" | "subscription";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApprovalType = "reduction" | "bonus" | "malus";

export interface ApprovalRequest {
  id: string;
  source: ApprovalSource;
  requesterName: string;
  clientName: string;
  productName: string;
  type: ApprovalType;
  impactFcfa: number;
  vehicleValueFcfa: number;
  requestedAt: string; // ISO
  status: ApprovalStatus;
  decidedBy?: string;
  decisionReason?: string;
  decidedAt?: string;
}

export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: "APR-001",
    source: "subscription",
    requesterName: "Kouassi Adama",
    clientName: "SARL Ivoire Trans",
    productName: "Auto - Tierce Complète",
    type: "reduction",
    impactFcfa: 450000,
    vehicleValueFcfa: 82000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: "pending",
  },
  {
    id: "APR-002",
    source: "subscription",
    requesterName: "Diallo Aminata",
    clientName: "Yao Konan",
    productName: "Auto - Tierce Collision",
    type: "reduction",
    impactFcfa: 220000,
    vehicleValueFcfa: 78000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: "pending",
  },
  {
    id: "APR-003",
    source: "subscription",
    requesterName: "Bamba Issouf",
    clientName: "GIE Cacao Plus",
    productName: "Auto - Tiers Étendu",
    type: "reduction",
    impactFcfa: 180000,
    vehicleValueFcfa: 95000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "approved",
    decidedBy: "Konaté Marie (Admin)",
    decisionReason: "Client stratégique, dérogation accordée",
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: "APR-004",
    source: "subscription",
    requesterName: "Touré Salif",
    clientName: "Mme Adjoua Brou",
    productName: "Auto - Tierce Complète",
    type: "reduction",
    impactFcfa: 310000,
    vehicleValueFcfa: 88000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: "rejected",
    decidedBy: "Konaté Marie (Admin)",
    decisionReason: "Réduction excessive sans justification commerciale suffisante",
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "APR-005",
    source: "renewal",
    requesterName: "Kouassi Adama",
    clientName: "Ouattara Seydou",
    productName: "Auto - Tierce Complète",
    type: "malus",
    impactFcfa: 280000,
    vehicleValueFcfa: 92000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    status: "pending",
  },
  {
    id: "APR-006",
    source: "renewal",
    requesterName: "Diallo Aminata",
    clientName: "ETS Sika & Frères",
    productName: "Auto - Tierce Collision",
    type: "bonus",
    impactFcfa: 195000,
    vehicleValueFcfa: 81000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "pending",
  },
  {
    id: "APR-007",
    source: "renewal",
    requesterName: "Bamba Issouf",
    clientName: "Coulibaly N'Golo",
    productName: "Auto - Tiers Simple",
    type: "bonus",
    impactFcfa: 90000,
    vehicleValueFcfa: 76000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    status: "approved",
    decidedBy: "Yao Pierre (Admin)",
    decisionReason: "Sinistralité 0 sur 3 ans, bonus justifié",
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "APR-008",
    source: "renewal",
    requesterName: "Touré Salif",
    clientName: "SCI Akwaba",
    productName: "Auto - Tierce Complète",
    type: "malus",
    impactFcfa: 420000,
    vehicleValueFcfa: 110000000,
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    status: "rejected",
    decidedBy: "Yao Pierre (Admin)",
    decisionReason: "Malus disproportionné par rapport au profil de risque",
    decidedAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
];