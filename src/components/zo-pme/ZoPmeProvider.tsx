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
  PMES,
  ROLE_DEFINITIONS,
  SUBSCRIPTION_FILES,
  type Benefit,
  type Campaign,
  type CampaignStatus,
  type CardStatus,
  type FileStage,
  type Pme,
  type PmeLifecycle,
  type PublicationStatus,
  type SubscriptionFile,
  type ZoCard,
  type ZoEvent,
  type ZoPmePermission,
  type ZoPmeRole,
  type ZoPmeView,
} from "@/data/zoPme";
import { LIFECYCLE_LABELS } from "@/data/zoPme/members";
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
  pmes: Pme[];
  cards: ZoCard[];
  benefits: Benefit[];
  files: SubscriptionFile[];
  campaigns: Campaign[];
  events: ZoEvent[];
  activity: ActivityEntry[];

  /* Actions */
  moveCard: (reference: string, next: CardStatus, motif?: string) => void;
  setCardPriority: (reference: string, priority: ZoCard["priorite"]) => void;
  setPmeLifecycle: (pmeId: string, next: PmeLifecycle, motif?: string) => void;
  setBenefitPublication: (benefitId: string, next: PublicationStatus, motif?: string) => void;
  decideFile: (reference: string, decision: "valider" | "complement", motif: string) => void;
  setCampaignStatus: (campaignId: string, next: CampaignStatus) => void;
  toggleEventRegistration: (eventId: string, delta: number) => void;
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
      cards,
      benefits,
      files,
      campaigns,
      events,
      activity,
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
      cards,
      benefits,
      files,
      campaigns,
      events,
      activity,
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
