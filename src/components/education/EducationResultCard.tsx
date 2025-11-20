import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface EducationResultCardProps {
  label: string;
  value: number;
  description: string;
  color: "blue" | "green" | "orange" | "purple";
}

const colorClasses = {
  blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
  green: "from-green-500/10 to-green-600/5 border-green-500/20",
  orange: "from-orange-500/10 to-orange-600/5 border-orange-500/20",
  purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20"
};

const textColorClasses = {
  blue: "text-blue-600",
  green: "text-green-600",
  orange: "text-orange-600",
  purple: "text-purple-600"
};

export const EducationResultCard = ({
  label,
  value,
  description,
  color
}: EducationResultCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className={`p-6 bg-gradient-to-br ${colorClasses[color]} border transition-smooth hover:scale-[1.02]`}>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <p className={`text-3xl md:text-4xl font-bold ${textColorClasses[color]} mb-3`}>
        {displayValue.toLocaleString('fr-FR')} Fcfa
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
};
