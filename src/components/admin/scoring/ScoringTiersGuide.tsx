import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedalIcon } from "@/components/clients/MedalIcon";
import type { VfNiveau } from "@/lib/scoring/vfV2";

type Tier = {
  niveau: VfNiveau;
  name: string;
  range: string;
  min: number;
  max: number;
  tagline: string;
  perks: string[];
  color: string;
};

const TIERS: Tier[] = [
  {
    niveau: "bronze",
    name: "Bronze",
    range: "0 – 39 / 100",
    min: 0,
    max: 39,
    tagline: "Client en démarrage de relation",
    perks: [
      "Suivi standard et communications commerciales",
      "Aucune remise automatique au renouvellement",
      "Cible prioritaire pour montée en gamme",
    ],
    color: "from-amber-100 to-amber-50 border-amber-200",
  },
  {
    niveau: "argent",
    name: "Argent",
    range: "40 – 64 / 100",
    min: 40,
    max: 64,
    tagline: "Client fidèle, relation établie",
    perks: [
      "Accès aux offres multi-équipement",
      "Bonus de renouvellement jusqu'à 3 %",
      "Notifications prioritaires WhatsApp",
    ],
    color: "from-zinc-100 to-zinc-50 border-zinc-200",
  },
  {
    niveau: "or",
    name: "Or",
    range: "65 – 79 / 100",
    min: 65,
    max: 79,
    tagline: "Client à forte valeur",
    perks: [
      "Bonus de renouvellement jusqu'à 7 %",
      "Traitement sinistre accéléré",
      "Invitations événements partenaires",
    ],
    color: "from-yellow-100 to-yellow-50 border-yellow-200",
  },
  {
    niveau: "platine",
    name: "Platine",
    range: "80 – 100 / 100",
    min: 80,
    max: 100,
    tagline: "Client VIP, ambassadeur",
    perks: [
      "Bonus de renouvellement jusqu'à 12 %",
      "Conseiller dédié et hotline prioritaire",
      "Cadeaux fidélité annuels",
    ],
    color: "from-cyan-100 to-cyan-50 border-cyan-200",
  },
];

export function ScoringTiersGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comment fonctionnent les paliers ?</CardTitle>
          <CardDescription>
            Chaque client reçoit un score sur 100 (moteur VF_v2) basé sur l'ancienneté, la prime
            cumulée, le multi-équipement et la sinistralité. Le score le place automatiquement
            dans l'un des 4 paliers ci-dessous, qui déterminent les avantages au renouvellement
            et le niveau de service associé.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => (
          <Card
            key={t.niveau}
            className={`bg-gradient-to-br ${t.color} border-2`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MedalIcon niveau={t.niveau} size={32} />
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white/70 text-foreground">
                  {t.max - t.min + 1} pts
                </Badge>
              </div>
              <CardDescription className="font-semibold text-foreground/80">
                {t.range}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/80 italic">{t.tagline}</p>
              <ul className="space-y-1.5 text-sm">
                {t.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-foreground/50">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Règles de transition</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Le score est recalculé automatiquement chaque mois via le cron de scoring.</p>
          <p>• Une montée de palier déclenche une notification au client et à son agent.</p>
          <p>• Un override manuel nécessite une justification et la validation d'un superviseur.</p>
          <p>• Le palier reste stable pendant 30 jours après un changement pour éviter les oscillations.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ScoringTiersGuide;