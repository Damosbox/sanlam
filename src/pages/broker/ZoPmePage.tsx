import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PERIOD_OPTIONS, VIEW_LABELS, type ZoPmeView } from "@/data/zoPme";
import { useZoPme } from "@/components/zo-pme/ZoPmeProvider";
import { ViewSwitcher } from "@/components/zo-pme/ViewSwitcher";
import {
  ErrorState,
  LoadingState,
  PermissionDenied,
} from "@/components/zo-pme/shared/states";
import { DirectionView } from "@/components/zo-pme/views/DirectionView";
import { MarketingView } from "@/components/zo-pme/views/MarketingView";
import { SouscriptionView } from "@/components/zo-pme/views/SouscriptionView";
import { MembresView } from "@/components/zo-pme/views/MembresView";
import { CartesView } from "@/components/zo-pme/views/CartesView";
import { PartenairesView } from "@/components/zo-pme/views/PartenairesView";
import { AvantagesView } from "@/components/zo-pme/views/AvantagesView";
import { RapportsView } from "@/components/zo-pme/views/RapportsView";
import { AdministrationView } from "@/components/zo-pme/views/AdministrationView";

const isView = (value: string): value is ZoPmeView => value in VIEW_LABELS;

export default function ZoPmePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState("30d");

  const {
    roleDefinition,
    canSeeView,
    isReadOnly,
    loadState,
    reload,
    simulateError,
  } = useZoPme();

  const raw = searchParams.get("vue") ?? "";
  const requested: ZoPmeView | null = isView(raw) ? raw : null;
  const fallback = roleDefinition.views[0];
  const vue: ZoPmeView = requested ?? fallback;
  const allowed = canSeeView(vue);
  const labels = VIEW_LABELS[vue];

  // Une URL sans vue explicite retombe sur la première vue autorisée du rôle.
  useEffect(() => {
    if (!requested) {
      navigate(`/b2b/zo-pme?vue=${fallback}`, { replace: true });
    }
  }, [requested, fallback, navigate]);

  const renderView = () => {
    switch (vue) {
      case "pilotage":
        return <DirectionView period={period} />;
      case "animation":
        return <MarketingView />;
      case "souscription":
        return <SouscriptionView />;
      case "membres":
        return <MembresView />;
      case "cartes":
        return <CartesView />;
      case "partenaires":
        return <PartenairesView />;
      case "avantages":
        return <AvantagesView />;
      case "rapports":
        return <RapportsView period={period} />;
      case "administration":
        return <AdministrationView />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Espace Zô PME
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{labels.subtitle}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px]">
              Rôle : {roleDefinition.label}
            </Badge>
            {isReadOnly && (
              <Badge variant="outline" className="text-[10px]">
                Lecture seule
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ViewSwitcher />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[170px] h-9" aria-label="Période analysée">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          {loadState === "ready" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={simulateError}
              title="Simuler une indisponibilité du service Zô PME"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Simuler une panne
            </Button>
          )}
        </div>
      </div>

      {!allowed ? (
        <PermissionDenied
          roleLabel={roleDefinition.label}
          viewTitle={labels.title}
          onBack={() => navigate(`/b2b/zo-pme?vue=${fallback}`)}
        />
      ) : loadState === "loading" ? (
        <LoadingState />
      ) : loadState === "error" ? (
        <ErrorState onRetry={reload} />
      ) : (
        renderView()
      )}
    </div>
  );
}
