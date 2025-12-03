import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress = ({ currentStep, totalSteps }: StepProgressProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index + 1 === currentStep 
              ? "w-8 bg-primary" 
              : index + 1 < currentStep 
                ? "w-4 bg-primary/60" 
                : "w-4 bg-muted"
          )}
        />
      ))}
    </div>
  );
};
