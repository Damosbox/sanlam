import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";

interface ProductCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: "activated" | "warm" | "success" | "info" | "accent";
  features: string[];
  onSubscribe?: () => void;
  customButtonText?: string;
}

export const ProductCard = ({ 
  title, 
  description, 
  icon: Icon, 
  gradient = "activated",
  features,
  onSubscribe,
  customButtonText
}: ProductCardProps) => {
  const gradientClass = {
    activated: "gradient-activated",
    warm: "gradient-warm",
    success: "gradient-success",
    info: "bg-primary",
    accent: "bg-accent"
  }[gradient];

  return (
    <Card className="group relative overflow-hidden transition-smooth hover:shadow-strong">
      <div className="p-8">
        <div className={`w-16 h-16 rounded-2xl ${gradientClass} flex items-center justify-center mb-6 transition-smooth group-hover:scale-110`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
        
        <ul className="space-y-2 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          size="lg" 
          className="w-full group/btn transition-base"
          onClick={onSubscribe}
        >
          {customButtonText || "Souscrire"}
          <ArrowRight className="ml-2 w-4 h-4 transition-base group-hover/btn:translate-x-1" />
        </Button>
      </div>
      
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl transition-smooth group-hover:scale-150" />
    </Card>
  );
};
