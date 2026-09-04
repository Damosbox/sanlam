import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BENEFITS,
  CAMPAIGNS,
  CARDS,
  CARD_STATUS_LABELS,
  CARD_STATUS_SLA,
  EVENTS,
  PARTNERS,
  PMES,
  ROLE_DEFINITIONS,
  SUBSCRIPTION_FILES,
  type Benefit,
  type Campaign,
  type CampaignStatus,
  type CardStatus,
  type FileStage,
  type CardProof,
  type Partner,
  type Pme,
  type PmeContact,
  type PmeLifecycle,
  type Tier,
  type PublicationStatus,
  type SubscriptionFile,
  type ZoCard,
  type ZoEvent,
  type ZoPmePermission,
  type ZoPmeRole,
  type ZoPmeView,
} from "@/data/zoPme";
import { COMMERCIAL_COURANT, LIFECYCLE_LABELS, genererMatricule } from "@/data/zoPme/members";
import { PUBLICATION_LABELS } from "@/data/zoPme/benefits";
import { STAGE_LABELS } from "@/data/zoPme/subscriptions";
import { CAMPAIGN_LABELS } from "@/data/zoPme/marketing";

export interface ActivityEntry {
  id: string;
  date: string;
  acteur: string;
  cible: string;
  action: string;
  motif?: string;
}

export type LoadState = "loading" | "error" | "ready";

interface ZoPmeContextValue {
  /* Rôle & droits */
  role: ZoPmeRole;
  setRole: (role: ZoPmeRole) => void;
  roleDefinition: typeof ROLE_DEFINITIONS[ZoPmeRole];
  can: (permission: ZoPmePermission) => boolean;
  canSeeView: (view: ZoPmeView) => boolean;
  isReadOnly: boolean;

  /* État de chargement simulé du module */
  loadState: LoadState;
  reload: () => void;
  simulateError: () => void;

  /* Données */
  /** Toutes les PME du programme. */
  pmes: Pme[];
  /** PME visibles selon le périmètre du rôle (le Commercial ne voit que son portefeuille). */
  visiblePmes: Pme[];
  /** Périmètre commercial actif, s'il y a restriction. */
  perimetre: string | null;
  partners: Partner[];
  cards: ZoCard[];
  benefits: Benefit[];
  files: SubscriptionFile[];
  campaigns: Campaign[];
  events: ZoEvent[];
  activity: ActivityEntry[];

  /* Actions */
  createPme: (input: NewPmeInput) => Pme;
  setPmeTier: (pmeId: string, palier: Tier, motif: string) => void;
  issueCard: (pmeId: string, input: IssueCardInput) => string;
  updateCardIssuance: (
    reference: string,
    patch: Partial<Pick<ZoCard, "etatDigital" | "etatImpression" | "preuveEnvoi" | "courrierBienvenue">>,
    action: string
  ) => void;
  createBenefit: (input: BenefitInput) => void;
  updateBenefit: (benefitId: string, input: BenefitInput) => void;
  retireBenefit: (benefitId: string, motif: string) => void;
  createPartner: (input: PartnerInput) => void;
  updatePartner: (partnerId: string, input: PartnerInput) => void;
  renewConvention: (partnerId: string, debut: string, fin: string, motif: string) => void;
  createCampaign: (input: CampaignInput) => void;
  moveCard: (reference: string, next: CardStatus, motif?: string) => void;
  setCardPriority: (reference: string, priority: ZoCard["priorite"]) => void;
  setPmeLifecycle: (pmeId: string, next: PmeLifecycle, motif?: string) => void;
  setBenefitPublication: (benefitId: string, next: PublicationStatus, motif?: string) => void;
  decideFile: (reference: string, decision: "valider" | "complement", motif: string) => void;
  setCampaignStatus: (campaignId: string, next: CampaignStatus) => void;
  toggleEventRegistration: (eventId: string, delta: number) => void;
}

export interface NewPmeInput {
  raisonSociale: string;
  secteur: string;
  ville: string;
  intermediaire: string;
  produitsSouscrits: string[];
  responsable: { prenom: string; nom: string; fonction: string; email: string; telephone: string };
}

export interface IssueCardInput {
  porteur: string;
  motifEmission: string;
  version: string;
}

export interface BenefitInput {
  libelle: string;
  categorie: string;
  secteur: string;
  partnerIds: string[];
  valeur: string;
  description: string;
  conditions: string;
  dateDebut: string;
  dateFin: string;
  paliersEligibles: Tier[];
}

export interface PartnerInput {
  nom: string;
  type: string;
  categorie: string;
  categories: string[];
  ville: string;
  responsableInterne: string;
  contact: { nom: string; email: string; telephone: string };
  contactSupport: { nom: string; email: string; telephone: string };
  accord: { type: string; debut: string; fin: string; contreparties: string; clauses: string };
  tauxRemise: number;
  ciblage: { produits: string; segment: string; zone: string };
  kpiCible: number;
  kpiRealise: number;
  risque: "critique" | "eleve" | "moyen" | "faible";
  planB: string;
}

export interface CampaignInput {
  nom: string;
  canal: Campaign["canal"];
  objectif: string;
  budget: number;
  date: string;
  statut: CampaignStatus;
  ciblePaliers: Tier[];
}

const ZoPmeContext = createContext<ZoPmeContextValue | null>(null);

const now = () =>
  new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

let seq = 0;
const nextId = () => `AC-${Date.now()}-${seq++}`;

export function ZoPmeProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<ZoPmeRole>("admin_zo_pme");
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const [pmes, setPmes] = useState<Pme[]>(PMES);
  const [partners, setPartners] = useState<Partner[]>(PARTNERS);
  const [cards, setCards] = useState<ZoCard[]>(CARDS);
  const [benefits, setBenefits] = useState<Benefit[]>(BENEFITS);
  const [files, setFiles] = useState<SubscriptionFile[]>(SUBSCRIPTION_FILES);
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [events, setEvents] = useState<ZoEvent[]>(EVENTS);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (loadState !== "loading") return;
    const timer = window.setTimeout(() => setLoadState("ready"), 450);
    return () => window.clearTimeout(timer);
  }, [loadState]);

  const roleDefinition = ROLE_DEFINITIONS[role];
  const acteur = roleDefinition.label;

  const log = useCallback(
    (cible: string, action: string, motif?: string) => {
      setActivity((prev) => [
        { id: nextId(), date: now(), acteur, cible, action, motif },
        ...prev,
      ]);
    },
    [acteur]
  );

  const can = useCallback(
    (permission: ZoPmePermission) => roleDefinition.permissions.includes(permission),
    [roleDefinition]
  );

  const canSeeView = useCallback(
    (view: ZoPmeView) => roleDefinition.views.includes(view),
    [roleDefinition]
  );

  /** Le Commercial ne voit que le portefeuille dont il est l'intermédiaire. */
  const perimetre = role === "commercial" ? COMMERCIAL_COURANT : null;
  const visiblePmes = useMemo(
    () => (perimetre ? pmes.filter((p) => p.intermediaire === perimetre) : pmes),
    [perimetre, pmes]
  );

  const createPme = useCallback(
    (input: NewPmeInput) => {
      const index = pmes.length + 1;
      const id = `PME-${2000 + index}`;
      const contact: PmeContact = {
        id: `${id}-C1`,
        nom: `${input.responsable.prenom} ${input.responsable.nom}`.trim(),
        fonction: input.responsable.fonction,
        role: "directeur",
        email: input.responsable.email,
        telephone: input.responsable.telephone,
        principal: true,
      };
      const today = new Date().toLocaleDateString("fr-FR");
      const pme: Pme = {
        id,
        matricule: genererMatricule(index),
        raisonSociale: input.raisonSociale,
        secteur: input.secteur,
        ville: input.ville,
        effectif: 0,
        cycleVie: "adhesion_en_cours",
        fidelite: { score: 0, palier: "Bronze", pointsPeriode: 0, depuis: today },
        rfm: { recence: 0, frequence: 0, montant: 0, segment: "Non segmenté", disponible: false },
        contacts: [contact],
        cartesRefs: [],
        adhesionLe: today,
        derniereActivite: today,
        conformiteComplete: false,
        intermediaire: input.intermediaire,
        produitsSouscrits: input.produitsSouscrits,
      };
      setPmes((prev) => [pme, ...prev]);
      log(
        pme.matricule,
        `PME créée : ${pme.raisonSociale} — responsable ${contact.nom}`
      );
      return pme;
    },
    [log, pmes.length]
  );

  const setPmeTier = useCallback(
    (pmeId: string, palier: Tier, motif: string) => {
      setPmes((prev) =>
        prev.map((p) =>
          p.id === pmeId
            ? {
                ...p,
                fidelite: {
                  ...p.fidelite,
                  palier,
                  depuis: new Date().toLocaleDateString("fr-FR"),
                },
              }
            : p
        )
      );
      log(pmeId, `Palier de fidélité forcé à ${palier}`, motif);
    },
    [log]
  );

  const issueCard = useCallback(
    (pmeId: string, input: IssueCardInput) => {
      const reference = `ZC-${5000 + cards.length + 1}`;
      const today = new Date().toLocaleDateString("fr-FR");
      const card: ZoCard = {
        reference,
        pmeId,
        porteur: input.porteur,
        statut: "demandee",
        priorite: "moyen",
        slaCibleHeures: CARD_STATUS_SLA.demandee,
        slaEcouleHeures: 0,
        demandeeLe: today,
        motifEmission: input.motifEmission,
        version: input.version,
        etatDigital: "non_genere",
        etatImpression: "non_lancee",
        preuveEnvoi: null,
        courrierBienvenue: { envoye: false },
        historique: [
          {
            date: now(),
            acteur,
            action: `Carte émise (${input.motifEmission}, ${input.version})`,
          },
        ],
      };
      setCards((prev) => [card, ...prev]);
      setPmes((prev) =>
        prev.map((p) =>
          p.id === pmeId ? { ...p, cartesRefs: [...p.cartesRefs, reference] } : p
        )
      );
      log(reference, `Carte émise — ${input.motifEmission} (${input.version})`);
      return reference;
    },
    [acteur, cards.length, log]
  );

  const updateCardIssuance = useCallback(
    (
      reference: string,
      patch: Partial<
        Pick<ZoCard, "etatDigital" | "etatImpression" | "preuveEnvoi" | "courrierBienvenue">
      >,
      action: string
    ) => {
      setCards((prev) =>
        prev.map((c) =>
          c.reference === reference
            ? {
                ...c,
                ...patch,
                historique: [...c.historique, { date: now(), acteur, action }],
              }
            : c
        )
      );
      log(reference, action);
    },
    [acteur, log]
  );

  const createBenefit = useCallback(
    (input: BenefitInput) => {
      const id = `AV-${String(benefits.length + 1).padStart(2, "0")}-N`;
      setBenefits((prev) => [
        {
          id,
          libelle: input.libelle,
          partnerId: input.partnerIds[0] ?? "",
          partnerIds: input.partnerIds,
          categorie: input.categorie,
          secteur: input.secteur,
          valeur: input.valeur,
          description: input.description,
          conditions: input.conditions,
          dateDebut: input.dateDebut,
          dateFin: input.dateFin,
          paliersEligibles: input.paliersEligibles,
          regles: input.conditions ? [input.conditions] : [],
          publication: "brouillon",
          usagesPeriode: 0,
        },
        ...prev,
      ]);
      log(id, `Avantage créé : ${input.libelle}`);
    },
    [benefits.length, log]
  );

  const updateBenefit = useCallback(
    (benefitId: string, input: BenefitInput) => {
      setBenefits((prev) =>
        prev.map((b) =>
          b.id === benefitId
            ? {
                ...b,
                libelle: input.libelle,
                partnerId: input.partnerIds[0] ?? b.partnerId,
                partnerIds: input.partnerIds,
                categorie: input.categorie,
                secteur: input.secteur,
                valeur: input.valeur,
                description: input.description,
                conditions: input.conditions,
                dateDebut: input.dateDebut,
                dateFin: input.dateFin,
                paliersEligibles: input.paliersEligibles,
                regles: input.conditions ? [input.conditions] : b.regles,
              }
            : b
        )
      );
      log(benefitId, `Avantage modifié : ${input.libelle}`);
    },
    [log]
  );

  const retireBenefit = useCallback(
    (benefitId: string, motif: string) => {
      const cible = benefits.find((b) => b.id === benefitId);
      setBenefits((prev) => prev.filter((b) => b.id !== benefitId));
      log(benefitId, `Avantage retiré du catalogue : ${cible?.libelle ?? benefitId}`, motif);
    },
    [benefits, log]
  );

  const partnerFromInput = (id: string, input: PartnerInput, base?: Partner): Partner => ({
    id,
    nom: input.nom,
    categorie: input.categorie,
    ville: input.ville,
    actif: base?.actif ?? true,
    contact: input.contact,
    convention: {
      reference: base?.convention.reference ?? `CV-${new Date().getFullYear()}-${id.slice(-3)}`,
      debut: input.accord.debut,
      fin: input.accord.fin,
      statut: base?.convention.statut ?? "active",
      tauxRemise: input.tauxRemise,
    },
    usagesPeriode: base?.usagesPeriode ?? 0,
    volumePeriode: base?.volumePeriode ?? 0,
    slaTraitement: base?.slaTraitement ?? "48 h",
    type: input.type,
    categories: input.categories,
    responsableInterne: input.responsableInterne,
    contactSupport: input.contactSupport,
    accord: {
      type: input.accord.type,
      contreparties: input.accord.contreparties,
      clauses: input.accord.clauses,
    },
    ciblage: input.ciblage,
    kpiCible: input.kpiCible,
    kpiRealise: input.kpiRealise,
    risque: input.risque,
    planB: input.planB,
    historiqueConvention: base?.historiqueConvention ?? [],
  });

  const createPartner = useCallback(
    (input: PartnerInput) => {
      const id = `PT-${String(partners.length + 1).padStart(2, "0")}-N`;
      setPartners((prev) => [partnerFromInput(id, input), ...prev]);
      log(id, `Partenaire créé : ${input.nom}`);
    },
    [log, partners.length]
  );

  const updatePartner = useCallback(
    (partnerId: string, input: PartnerInput) => {
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? partnerFromInput(partnerId, input, p) : p))
      );
      log(partnerId, `Partenaire modifié : ${input.nom}`);
    },
    [log]
  );

  const renewConvention = useCallback(
    (partnerId: string, debut: string, fin: string, motif: string) => {
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partnerId
            ? {
                ...p,
                convention: { ...p.convention, debut, fin, statut: "active" },
                historiqueConvention: [
                  ...(p.historiqueConvention ?? []),
                  {
                    date: now(),
                    acteur,
                    action: `Convention renouvelée du ${debut} au ${fin}`,
                    motif,
                  },
                ],
              }
            : p
        )
      );
      log(partnerId, `Convention renouvelée (${debut} → ${fin})`, motif);
    },
    [acteur, log]
  );

  const createCampaign = useCallback(
    (input: CampaignInput) => {
      const id = `CP-${String(campaigns.length + 1).padStart(2, "0")}-N`;
      setCampaigns((prev) => [
        {
          id,
          nom: input.nom,
          canal: input.canal,
          ciblePaliers: input.ciblePaliers,
          audience: 0,
          statut: input.statut,
          date: input.date,
          envoyes: 0,
          lus: 0,
          clics: 0,
          objectif: input.objectif,
          budget: input.budget,
        },
        ...prev,
      ]);
      log(id, `Campagne créée : ${input.nom} (${input.canal})`);
    },
    [campaigns.length, log]
  );

  const moveCard = useCallback(
    (reference: string, next: CardStatus, motif?: string) => {
      setCards((prev) =>
        prev.map((c) =>
          c.reference === reference
            ? {
                ...c,
                statut: next,
                slaCibleHeures: CARD_STATUS_SLA[next],
                slaEcouleHeures: 0,
                historique: [
                  ...c.historique,
                  {
                    date: now(),
                    acteur,
                    action: `Passée à ${CARD_STATUS_LABELS[next]}`,
                    motif,
                  },
                ],
              }
            : c
        )
      );
      log(reference, `Carte → ${CARD_STATUS_LABELS[next]}`, motif);
    },
    [acteur, log]
  );

  const setCardPriority = useCallback(
    (reference: string, priority: ZoCard["priorite"]) => {
      setCards((prev) =>
        prev.map((c) =>
          c.reference === reference
            ? {
                ...c,
                priorite: priority,
                historique: [
                  ...c.historique,
                  { date: now(), acteur, action: `Priorité définie à ${priority}` },
                ],
              }
            : c
        )
      );
      log(reference, `Priorité → ${priority}`);
    },
    [acteur, log]
  );

  const setPmeLifecycle = useCallback(
    (pmeId: string, next: PmeLifecycle, motif?: string) => {
      setPmes((prev) => prev.map((p) => (p.id === pmeId ? { ...p, cycleVie: next } : p)));
      log(pmeId, `Cycle de vie → ${LIFECYCLE_LABELS[next]}`, motif);
    },
    [log]
  );

  const setBenefitPublication = useCallback(
    (benefitId: string, next: PublicationStatus, motif?: string) => {
      setBenefits((prev) =>
        prev.map((b) => (b.id === benefitId ? { ...b, publication: next } : b))
      );
      log(benefitId, `Avantage → ${PUBLICATION_LABELS[next]}`, motif);
    },
    [log]
  );

  const decideFile = useCallback(
    (reference: string, decision: "valider" | "complement", motif: string) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.reference !== reference) return f;
          const nextStage: FileStage =
            decision === "valider"
              ? f.etape === "a_controler"
                ? "conforme"
                : "active"
              : "a_controler";
          const action =
            decision === "valider"
              ? `Dossier → ${STAGE_LABELS[nextStage]}`
              : "Complément demandé";
          return {
            ...f,
            etape: nextStage,
            journal: [...f.journal, { date: now(), acteur, action, motif }],
          };
        })
      );
      log(
        reference,
        decision === "valider" ? "Dossier validé" : "Complément demandé",
        motif
      );
    },
    [acteur, log]
  );

  const setCampaignStatus = useCallback(
    (campaignId: string, next: CampaignStatus) => {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, statut: next } : c))
      );
      log(campaignId, `Campagne → ${CAMPAIGN_LABELS[next]}`);
    },
    [log]
  );

  const toggleEventRegistration = useCallback(
    (eventId: string, delta: number) => {
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e;
          const inscrits = Math.max(0, Math.min(e.capacite, e.inscrits + delta));
          return {
            ...e,
            inscrits,
            statut: inscrits >= e.capacite ? "complet" : e.statut === "cloture" ? "cloture" : "ouvert",
          };
        })
      );
      log(eventId, delta > 0 ? "Place réservée" : "Place libérée");
    },
    [log]
  );

  const value = useMemo<ZoPmeContextValue>(
    () => ({
      role,
      setRole,
      roleDefinition,
      can,
      canSeeView,
      isReadOnly: roleDefinition.lectureSeule,
      loadState,
      reload: () => setLoadState("loading"),
      simulateError: () => setLoadState("error"),
      pmes,
      visiblePmes,
      perimetre,
      partners,
      cards,
      benefits,
      files,
      campaigns,
      events,
      activity,
      createPme,
      setPmeTier,
      issueCard,
      updateCardIssuance,
      createBenefit,
      updateBenefit,
      retireBenefit,
      createPartner,
      updatePartner,
      renewConvention,
      createCampaign,
      moveCard,
      setCardPriority,
      setPmeLifecycle,
      setBenefitPublication,
      decideFile,
      setCampaignStatus,
      toggleEventRegistration,
    }),
    [
      role,
      roleDefinition,
      can,
      canSeeView,
      loadState,
      pmes,
      visiblePmes,
      perimetre,
      partners,
      cards,
      benefits,
      files,
      campaigns,
      events,
      activity,
      createPme,
      setPmeTier,
      issueCard,
      updateCardIssuance,
      createBenefit,
      updateBenefit,
      retireBenefit,
      createPartner,
      updatePartner,
      renewConvention,
      createCampaign,
      moveCard,
      setCardPriority,
      setPmeLifecycle,
      setBenefitPublication,
      decideFile,
      setCampaignStatus,
      toggleEventRegistration,
    ]
  );

  return <ZoPmeContext.Provider value={value}>{children}</ZoPmeContext.Provider>;
}

export function useZoPme() {
  const ctx = useContext(ZoPmeContext);
  if (!ctx) throw new Error("useZoPme doit être utilisé dans ZoPmeProvider");
  return ctx;
}
