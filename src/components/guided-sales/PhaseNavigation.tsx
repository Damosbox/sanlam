import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalesPhase } from "./types";

interface PhaseNavigationProps {
  currentPhase: SalesPhase;
  currentStep: number;
  onPhaseClick: (phase: SalesPhase) => void;
  onPrev?: () => void;
  compact?: boolean;
}

const phases: { id: SalesPhase; name: string; shortName: string }[] = [
  { id: "preparation", name: "Préparation", shortName: "Prépa" },
  { id: "construction", name: "Construction", shortName: "Offre" },
  { id: "souscription", name: "Souscription", shortName: "Souscrip." },
  { id: "finalisation", name: "Finalisation", shortName: "Final" },
];

const phaseOrder: Record<SalesPhase, number> = {
  preparation: 0,
  construction: 1,
  souscription: 2,
  finalisation: 3,
};

export const PhaseNavigation = ({ 
  currentPhase, 
  currentStep,
  onPhaseClick,
  onPrev,
  compact = false 
}: PhaseNavigationProps) => {
  const currentPhaseIndex = phaseOrder[currentPhase];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isCurrent = phase.id === currentPhase;
          const isClickable = index <= currentPhaseIndex;
          
          return (
            <button
              key={phase.id}
              onClick={() => isClickable && onPhaseClick(phase.id)}
              disabled={!isClickable}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isCurrent 
                  ? "w-10 bg-primary" 
                  : isCompleted 
                    ? "w-6 bg-primary/60 hover:bg-primary/80 cursor-pointer" 
                    : "w-6 bg-muted cursor-not-allowed"
              )}
              title={phase.name}
            />
          );
        })}
        <span className="ml-3 text-sm font-medium text-foreground">
          {phases.find(p => p.id === currentPhase)?.name}
        </span>
      </div>
    );
  }

  return (
    <nav aria-label="Progress" className="flex items-center gap-4">
      {onPrev && currentStep > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onPrev}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
      )}
      
      <ol className="flex items-center gap-3">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex;
          const isCurrent = phase.id === currentPhase;
          const isClickable = index <= currentPhaseIndex;
          
          return (
            <li key={phase.id} className="flex items-center">
              <button
                onClick={() => isClickable && onPhaseClick(phase.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isCurrent && "bg-primary text-primary-foreground shadow-md",
                  isCompleted && "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                  !isClickable && "text-muted-foreground cursor-not-allowed opacity-50"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {index + 1}
                  </span>
                )}
                <span className="hidden md:inline">{phase.name}</span>
                <span className="md:hidden">{phase.shortName}</span>
              </button>
              
              {index < phases.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-2 hidden sm:block",
                  isCompleted ? "bg-primary/40" : "bg-muted"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
