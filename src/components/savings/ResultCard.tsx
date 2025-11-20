import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface ResultCardProps {
  label: string;
  value: number;
  description: string;
  color: "blue" | "green" | "orange";
}

export const ResultCard = ({ label, value, description, color }: ResultCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 250;
    const steps = 20;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    green: "from-green-500/10 to-green-600/5 border-green-500/20",
    orange: "from-orange-400/10 to-orange-500/5 border-orange-400/20"
  };

  const textColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600"
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${colorClasses[color]} border-2 transition-smooth hover:shadow-elegant`}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`text-4xl md:text-5xl font-bold ${textColorClasses[color]} transition-smooth`}>
          {displayValue.toLocaleString('fr-FR')}
          <span className="text-2xl ml-1">Fcfa</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  );
};
