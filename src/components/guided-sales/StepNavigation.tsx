import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  currentStep: number; // 0-indexed
  totalSteps: number;
  stepNames: string[];
  onStepClick: (step: number) => void;
  onPrev?: () => void;
  compact?: boolean;
}

export const StepNavigation = ({ 
  currentStep, 
  totalSteps, 
  stepNames, 
  onStepClick,
  onPrev,
  compact = false 
}: StepNavigationProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;
          
          return (
            <button
              key={index}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isCurrent 
                  ? "w-8 bg-primary" 
                  : isCompleted 
                    ? "w-4 bg-primary/60 hover:bg-primary/80 cursor-pointer" 
                    : "w-4 bg-muted cursor-not-allowed"
              )}
              title={stepNames[index]}
            />
          );
        })}
        <span className="ml-2 text-sm text-muted-foreground">
          {stepNames[currentStep]}
        </span>
      </div>
    );
  }

  return (
    <nav aria-label="Progress" className="flex items-center gap-3">
      {onPrev && currentStep > 0 && currentStep < totalSteps - 1 && (
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
      <ol className="flex items-center gap-2">
        {stepNames.map((name, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;
          
          return (
            <li key={name} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer",
                  !isClickable && "text-muted-foreground cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    isCurrent ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {index + 1}
                  </span>
                )}
                <span className="hidden xl:inline">{name}</span>
              </button>
              
              {index < stepNames.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 mx-1",
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