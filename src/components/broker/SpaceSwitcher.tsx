import { useNavigate } from "react-router-dom";
import { Sparkles, Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export type SpaceKey = "courtier" | "zo-pme";

const SPACES: { key: SpaceKey; title: string; subtitle: string; url: string }[] = [
  { key: "courtier", title: "Espace Courtier", subtitle: "Sanlam Allianz", url: "/b2b/dashboard" },
  { key: "zo-pme", title: "Espace Zô PME", subtitle: "Programme PME", url: "/b2b/zo-pme" },
];

interface SpaceSwitcherProps {
  current: SpaceKey;
  /** "dark" = posé sur un en-tête foncé (bleu Allianz), "light" = surface claire. */
  tone?: "light" | "dark";
}

export function SpaceSwitcher({ current, tone = "light" }: SpaceSwitcherProps) {
  const dark = tone === "dark";
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const active = SPACES.find((s) => s.key === current) ?? SPACES[0];

  const go = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Changer d'espace"
        className={cn(
          "flex items-center gap-3 w-full rounded-lg p-1 text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dark
            ? "hover:bg-white/10 text-white"
            : "hover:bg-primary/5",
          collapsed && "justify-center"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            dark ? "bg-white/15" : "bg-primary/10"
          )}
        >
          <Sparkles className={cn("h-4 w-4", dark ? "text-white" : "text-primary")} />
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <h2
                className={cn(
                  "font-semibold text-sm truncate",
                  dark ? "text-white" : "text-foreground"
                )}
              >
                {active.title}
              </h2>
              <p
                className={cn(
                  "text-xs truncate",
                  dark ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {active.subtitle}
              </p>
            </div>
            <ChevronsUpDown
              className={cn(
                "h-4 w-4 shrink-0",
                dark ? "text-white/70" : "text-muted-foreground"
              )}
            />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Espaces</DropdownMenuLabel>
        {SPACES.map((space) => (
          <DropdownMenuItem
            key={space.key}
            onSelect={() => go(space.url)}
            className="gap-2 cursor-pointer"
          >
            {space.key === "zo-pme" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="flex-1 truncate">{space.title}</span>
            {space.key === current && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
