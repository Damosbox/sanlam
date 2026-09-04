import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Check, Minus, ShieldCheck } from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_DEFINITIONS,
  ROLE_ORDER,
  PRODUITS_REFERENTIEL,
  VIEW_LABELS,
  type ZoPmeView,
} from "@/data/zoPme";
import { ScopeNote } from "../shared/states";
import { useZoPme } from "../ZoPmeProvider";
import { cn } from "@/lib/utils";

const ALL_VIEWS = Object.keys(VIEW_LABELS) as ZoPmeView[];

export function AdministrationView() {
  const { role } = useZoPme();

  return (
    <div className="space-y-4 sm:space-y-6">
      <ScopeNote tone="backend">
        Matrice de droits mock : la persistance des rôles Zô PME et leur application côté données
        (RLS) restent une dépendance back-end. Aucune modification n'est enregistrée ici.
      </ScopeNote>

      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Référentiel produit à valider
          </CardTitle>
          <CardDescription>
            Décision métier ouverte — aucune liste complémentaire ni grille de commissions n'est
            créée dans la plateforme tant que l'arbitrage n'est pas rendu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Le cadrage mentionne 17 produits, le fichier produit actuel en liste{" "}
            {PRODUITS_REFERENTIEL.length}.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRODUITS_REFERENTIEL.map((prod) => (
              <Badge key={prod} variant="outline" className="text-[10px] px-1.5 py-0">
                {prod}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Conséquence : production, commissions et rattachement des campagnes aux produits
            restent bloqués côté back-end jusqu'à la validation du référentiel.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Rôles du programme
          </CardTitle>
          <CardDescription>
            Rôle actif dans cette session : {ROLE_DEFINITIONS[role].label}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {ROLE_ORDER.map((r) => {
            const def = ROLE_DEFINITIONS[r];
            return (
              <div
                key={r}
                className={cn(
                  "rounded-lg border border-border p-4 space-y-2",
                  r === role && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{def.label}</p>
                  {def.lectureSeule ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Lecture seule
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Actions autorisées
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{def.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {def.views.map((v) => (
                    <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0">
                      {VIEW_LABELS[v].title}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accès aux vues</CardTitle>
          <CardDescription>
            Une vue non cochée est inaccessible, y compris par saisie directe de l'URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Vue</TableHead>
                  {ROLE_ORDER.map((r) => (
                    <TableHead key={r} className="text-center text-xs whitespace-nowrap">
                      {ROLE_DEFINITIONS[r].label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_VIEWS.map((v) => (
                  <TableRow key={v}>
                    <TableCell className="text-sm font-medium">{VIEW_LABELS[v].title}</TableCell>
                    {ROLE_ORDER.map((r) => (
                      <TableCell key={r} className="text-center">
                        {ROLE_DEFINITIONS[r].views.includes(v) ? (
                          <Check className="h-4 w-4 text-[hsl(var(--success))] mx-auto" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions autorisées</CardTitle>
          <CardDescription>
            Chaque action est vérifiée à l'affichage du bouton et au moment de la confirmation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Action</TableHead>
                  {ROLE_ORDER.map((r) => (
                    <TableHead key={r} className="text-center text-xs whitespace-nowrap">
                      {ROLE_DEFINITIONS[r].label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map((p) => (
                  <TableRow key={p}>
                    <TableCell>
                      <p className="text-sm font-medium">{PERMISSION_LABELS[p]}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p}</p>
                    </TableCell>
                    {ROLE_ORDER.map((r) => (
                      <TableCell key={r} className="text-center">
                        {ROLE_DEFINITIONS[r].permissions.includes(p) ? (
                          <Check className="h-4 w-4 text-[hsl(var(--success))] mx-auto" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
