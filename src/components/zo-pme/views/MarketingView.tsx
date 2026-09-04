import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_LABELS,
  CAMPAIGN_STYLES,
  CAMPAIGN_TRANSITIONS,
  CARD_STATUS_LABELS,
  CARD_TRANSITIONS,
  KANBAN_STAGES,
  PRIORITY_ORDER,
  isSlaBreached,
  type CampaignStatus,
  type CardStatus,
} from "@/data/zoPme";
import { SEVERITY_LABELS } from "@/data/zoPme/direction";
import { KpiCard } from "../shared/KpiCard";
import { SeverityBadge, SlaBadge, TierBadge } from "../shared/badges";
import { EmptyState, ScopeNote } from "../shared/states";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { useZoPme } from "../ZoPmeProvider";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Megaphone,
  MessageCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function MarketingView() {
  const navigate = useNavigate();
  const {
    cards,
    pmes,
    campaigns,
    events,
    can,
    moveCard,
    setCampaignStatus,
    toggleEventRegistration,
  } = useZoPme();

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pendingMove, setPendingMove] = useState<{ ref: string; next: CardStatus } | null>(null);

  const pmeById = useMemo(() => new Map(pmes.map((p) => [p.id, p])), [pmes]);

  const kanban = useMemo(
    () =>
      KANBAN_STAGES.map((stage) => ({
        stage,
        items: cards
          .filter(
            (c) =>
              c.statut === stage &&
              (priorityFilter === "all" || c.priorite === priorityFilter)
          )
          .sort(
            (a, b) =>
              Number(isSlaBreached(b)) - Number(isSlaBreached(a)) ||
              PRIORITY_ORDER.indexOf(a.priorite) - PRIORITY_ORDER.indexOf(b.priorite)
          ),
      })),
    [cards, priorityFilter]
  );

  const breaches = cards.filter(isSlaBreached);
  const whatsappCampaigns = campaigns.filter((c) => c.canal === "WhatsApp");

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote>
        Cockpit Marketing / Animation : production des cartes, catalogue et animation du programme.
        Les décisions de conformité restent du ressort de la Souscription.
      </ScopeNote>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cartes en file"
          value={String(cards.filter((c) => KANBAN_STAGES.includes(c.statut)).length)}
          icon={CreditCard}
        />
        <KpiCard
          label="SLA dépassés"
          value={String(breaches.length)}
          trend={breaches.length ? "priorité de traitement" : "file saine"}
          trendDirection={breaches.length ? "down" : "up"}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Campagnes actives"
          value={String(campaigns.filter((c) => c.statut === "programmee").length)}
          icon={Megaphone}
        />
        <KpiCard
          label="Inscrits événements"
          value={String(events.reduce((s, e) => s + e.inscrits, 0))}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base">Kanban des cartes</CardTitle>
            <CardDescription>
              File de production sur les 7 étapes actives du cycle — SLA dépassés en tête
            </CardDescription>
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-[170px]" aria-label="Filtrer par priorité">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              {PRIORITY_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {SEVERITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {kanban.map(({ stage, items }) => (
              <div key={stage} className="min-w-[220px] flex-1 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-xs font-semibold">{CARD_STATUS_LABELS[stage]}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    File vide
                  </p>
                ) : (
                  items.map((c) => {
                    const next = CARD_TRANSITIONS[c.statut].find((t) => t !== "bloquee");
                    return (
                      <div
                        key={c.reference}
                        className={cn(
                          "rounded-lg border border-border bg-card p-3 space-y-2",
                          isSlaBreached(c) && "border-destructive/40"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-mono font-medium">{c.reference}</p>
                          <SeverityBadge severity={c.priorite} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {pmeById.get(c.pmeId)?.raisonSociale} · {c.porteur}
                        </p>
                        <SlaBadge card={c} />
                        {can("cards.move") && next && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => setPendingMove({ ref: c.reference, next })}
                          >
                            Passer à {CARD_STATUS_LABELS[next]}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
          {!can("cards.move") && (
            <ScopeNote>
              Lecture seule sur la file de production : votre rôle ne peut pas faire avancer une
              carte.
            </ScopeNote>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Priorités de cartes</CardTitle>
          <CardDescription>
            Cartes hors SLA à traiter avant toute nouvelle mise en production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {breaches.length === 0 ? (
            <EmptyState
              title="Aucun dépassement de SLA"
              description="Toutes les cartes en file respectent leur délai cible."
            />
          ) : (
            <ul className="space-y-2">
              {breaches.map((c) => (
                <li
                  key={c.reference}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium font-mono">{c.reference}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {pmeById.get(c.pmeId)?.raisonSociale} ·{" "}
                      {CARD_STATUS_LABELS[c.statut]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SlaBadge card={c} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/b2b/zo-pme?vue=cartes")}
                    >
                      Ouvrir le suivi
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Campagnes
            </CardTitle>
            <CardDescription>Ciblage par palier de fidélité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((c) => {
              const transitions = can("campaigns.manage")
                ? CAMPAIGN_TRANSITIONS[c.statut]
                : [];
              return (
                <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.canal} · {c.audience} PME · {c.date}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", CAMPAIGN_STYLES[c.statut])}
                    >
                      {CAMPAIGN_LABELS[c.statut]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.ciblePaliers.map((t) => (
                      <TierBadge key={t} tier={t} />
                    ))}
                  </div>
                  {c.statut === "envoyee" && (
                    <p className="text-xs text-muted-foreground">
                      {c.envoyes} envoyés · {c.lus} lus · {c.clics} clics
                    </p>
                  )}
                  {transitions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {transitions.map((t) => (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setCampaignStatus(c.id, t as CampaignStatus);
                            toast.success(
                              `${c.nom} — ${CAMPAIGN_LABELS[t as CampaignStatus]}`
                            );
                          }}
                        >
                          {CAMPAIGN_LABELS[t as CampaignStatus]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Communication WhatsApp
              </CardTitle>
              <CardDescription>
                {whatsappCampaigns.length} campagne(s) sur le canal WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {whatsappCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.audience} destinataires · {CAMPAIGN_LABELS[c.statut]}
                    </p>
                  </div>
                  {c.statut === "envoyee" ? (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">
                        {Math.round((c.lus / Math.max(1, c.envoyes)) * 100)} % lus
                      </p>
                      <Progress
                        value={(c.lus / Math.max(1, c.envoyes)) * 100}
                        className="h-1.5 w-20 mt-1"
                      />
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      En attente d'envoi
                    </Badge>
                  )}
                </div>
              ))}
              <ScopeNote tone="backend">
                L'envoi effectif WhatsApp / SMS / e-mail dépend du connecteur de messagerie :
                aucune diffusion n'est déclenchée depuis cette interface.
              </ScopeNote>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Événements à venir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{e.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.date} · {e.ville}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {e.inscrits}/{e.capacite}
                    </Badge>
                  </div>
                  <Progress value={(e.inscrits / e.capacite) * 100} className="h-1.5" />
                  {can("events.manage") && e.statut !== "cloture" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={e.inscrits >= e.capacite}
                        onClick={() => {
                          toggleEventRegistration(e.id, 1);
                          toast.success(`Place réservée — ${e.nom}`);
                        }}
                      >
                        Réserver une place
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={e.inscrits === 0}
                        onClick={() => {
                          toggleEventRegistration(e.id, -1);
                          toast.success(`Place libérée — ${e.nom}`);
                        }}
                      >
                        Libérer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmActionDialog
        open={!!pendingMove}
        onOpenChange={(o) => !o && setPendingMove(null)}
        title="Faire avancer la carte"
        description={
          pendingMove
            ? `La carte ${pendingMove.ref} passera au statut « ${CARD_STATUS_LABELS[pendingMove.next]} ».`
            : ""
        }
        confirmLabel="Confirmer"
        reason="optional"
        onConfirm={(motif) => {
          if (pendingMove) {
            moveCard(pendingMove.ref, pendingMove.next, motif);
            toast.success(
              `${pendingMove.ref} → ${CARD_STATUS_LABELS[pendingMove.next]}`
            );
          }
          setPendingMove(null);
        }}
      />
    </div>
  );
}
