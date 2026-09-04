import { AlertTriangle, Inbox, Loader2, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement des données Zô PME…</span>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <div>
          <p className="text-sm font-medium">Données du programme indisponibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            Le service Zô PME n'a pas répondu. Réessayez ou contactez le support interne.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}

export function PermissionDenied({
  roleLabel,
  viewTitle,
  onBack,
}: {
  roleLabel: string;
  viewTitle: string;
  onBack: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Lock className="h-6 w-6 text-destructive" />
        <div>
          <p className="text-sm font-medium">Accès hors périmètre</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            La vue « {viewTitle} » n'est pas accessible au rôle {roleLabel}. Aucune donnée
            n'est chargée pour cette vue.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          Revenir à une vue autorisée
        </Button>
      </CardContent>
    </Card>
  );
}

/** Encadré d'information de périmètre ou de dépendance back-end. */
export function ScopeNote({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "backend";
}) {
  return (
    <div
      className={
        tone === "backend"
          ? "flex items-start gap-2 rounded-lg border border-[hsl(var(--orange))]/30 bg-[hsl(var(--orange))]/5 px-3 py-2"
          : "flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
      }
    >
      <Info
        className={
          tone === "backend"
            ? "h-3.5 w-3.5 text-[hsl(var(--orange))] mt-0.5 shrink-0"
            : "h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0"
        }
      />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

export function InlineSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
}
