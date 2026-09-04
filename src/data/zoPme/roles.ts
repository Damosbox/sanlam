/** Rôles et droits mock du module Zô PME (à porter sur user_roles + RLS côté back-end). */

export type ZoPmeRole =
  | "direction"
  | "marketing"
  | "souscription"
  | "commercial"
  | "admin_zo_pme";

export type ZoPmeView =
  | "pilotage"
  | "membres"
  | "cartes"
  | "partenaires"
  | "avantages"
  | "animation"
  | "souscription"
  | "rapports"
  | "administration";

export type ZoPmePermission =
  | "members.create"
  | "members.tier"
  | "cards.issue"
  | "benefits.manage"
  | "partners.manage"
  | "files.create"
  | "cards.move"
  | "cards.priority"
  | "cards.block"
  | "members.update"
  | "benefits.publish"
  | "partners.update"
  | "campaigns.manage"
  | "events.manage"
  | "files.decide"
  | "reports.export"
  | "admin.roles"
  | "view.switch";

export interface ZoPmeRoleDefinition {
  key: ZoPmeRole;
  label: string;
  description: string;
  lectureSeule: boolean;
  views: ZoPmeView[];
  permissions: ZoPmePermission[];
}

export const ALL_PERMISSIONS: ZoPmePermission[] = [
  "members.create",
  "members.tier",
  "cards.issue",
  "benefits.manage",
  "partners.manage",
  "files.create",
  "cards.move",
  "cards.priority",
  "cards.block",
  "members.update",
  "benefits.publish",
  "partners.update",
  "campaigns.manage",
  "events.manage",
  "files.decide",
  "reports.export",
  "admin.roles",
  "view.switch",
];

export const PERMISSION_LABELS: Record<ZoPmePermission, string> = {
  "members.create": "Créer une PME membre",
  "members.tier": "Modifier manuellement le palier de fidélité",
  "cards.issue": "Émettre une carte pour une PME",
  "benefits.manage": "Créer, modifier ou retirer un avantage",
  "partners.manage": "Créer un partenaire et renouveler sa convention",
  "files.create": "Créer un nouveau dossier de souscription",
  "cards.move": "Faire avancer une carte dans le cycle",
  "cards.priority": "Modifier la priorité d'une carte",
  "cards.block": "Bloquer / débloquer une carte",
  "members.update": "Modifier le cycle de vie d'une PME",
  "benefits.publish": "Publier / suspendre un avantage",
  "partners.update": "Mettre à jour un partenaire ou sa convention",
  "campaigns.manage": "Créer et piloter les campagnes",
  "events.manage": "Gérer les événements",
  "files.decide": "Valider un dossier ou demander un complément",
  "reports.export": "Générer les rapports et exports",
  "admin.roles": "Administrer la matrice de droits",
  "view.switch": "Changer de vue métier",
};

export const VIEW_LABELS: Record<ZoPmeView, { title: string; subtitle: string }> = {
  pilotage: {
    title: "Cockpit Direction",
    subtitle: "Indicateurs, tendances, fidélité, alertes et performance partenaires",
  },
  membres: {
    title: "Membres (PME)",
    subtitle: "Annuaire des PME adhérentes, matricules, cycle de vie et contacts rattachés",
  },
  cartes: {
    title: "Cartes",
    subtitle: "Cycle des cartes sur 10 statuts, priorités et alertes SLA",
  },
  partenaires: {
    title: "Partenaires",
    subtitle: "Fiches partenaires, conventions et volumes d'usage",
  },
  avantages: {
    title: "Avantages",
    subtitle: "Catalogue, règles d'éligibilité par palier et publication",
  },
  animation: {
    title: "Marketing & animation",
    subtitle: "Kanban des cartes, campagnes, communication et événements",
  },
  souscription: {
    title: "Souscription",
    subtitle: "Dossiers en trois étapes, checklist conformité et journal de décision",
  },
  rapports: {
    title: "Rapports",
    subtitle: "Restitutions et exports par périmètre",
  },
  administration: {
    title: "Administration des droits",
    subtitle: "Matrice des rôles Zô PME et périmètres d'action",
  },
};

export const ROLE_DEFINITIONS: Record<ZoPmeRole, ZoPmeRoleDefinition> = {
  direction: {
    key: "direction",
    label: "Direction",
    description: "Pilotage consolidé en lecture seule, sans action opérationnelle.",
    lectureSeule: true,
    views: ["pilotage", "membres", "cartes", "partenaires", "avantages", "rapports"],
    permissions: ["reports.export"],
  },
  marketing: {
    key: "marketing",
    label: "Marketing / Animation",
    description:
      "Gestion complète métier : membres, statuts, cartes, avantages, partenaires, campagnes et événements.",
    lectureSeule: false,
    views: ["animation", "cartes", "avantages", "partenaires", "membres"],
    permissions: [
      "members.create",
      "members.update",
      "members.tier",
      "cards.issue",
      "cards.move",
      "cards.priority",
      "cards.block",
      "benefits.publish",
      "benefits.manage",
      "partners.update",
      "partners.manage",
      "campaigns.manage",
      "events.manage",
    ],
  },
  souscription: {
    key: "souscription",
    label: "Souscription",
    description: "Contrôle de conformité, validation des dossiers et cycle de vie des PME.",
    lectureSeule: false,
    views: ["souscription", "membres", "cartes"],
    permissions: ["files.decide", "members.update", "cards.move"],
  },
  commercial: {
    key: "commercial",
    label: "Commercial",
    description:
      "Crée les PME et les dossiers de son portefeuille, consulte son périmètre et le catalogue.",
    lectureSeule: false,
    views: ["membres", "avantages", "cartes", "souscription"],
    permissions: ["members.create", "files.create"],
  },
  admin_zo_pme: {
    key: "admin_zo_pme",
    label: "Admin Zô PME",
    description: "Accès complet, administration des droits et changement de vue métier.",
    lectureSeule: false,
    views: [
      "pilotage",
      "animation",
      "souscription",
      "membres",
      "cartes",
      "partenaires",
      "avantages",
      "rapports",
      "administration",
    ],
    permissions: ALL_PERMISSIONS,
  },
};

export const ROLE_ORDER: ZoPmeRole[] = [
  "direction",
  "marketing",
  "souscription",
  "commercial",
  "admin_zo_pme",
];
