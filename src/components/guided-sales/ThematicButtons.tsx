import { Button } from "@/components/ui/button";
import { SelectedProductType } from "./types";
import { 
  Car, Shield, FileCheck, Globe, 
  PiggyBank, Heart, ArrowDownToLine, Users,
  Flower2, HandCoins, UserCheck
} from "lucide-react";

interface ThematicButtonsProps {
  productType: SelectedProductType;
  onTopicClick: (topic: string, description: string) => void;
}

interface ThematicTopic {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const topicsByProduct: Record<SelectedProductType, ThematicTopic[]> = {
  auto: [
    { id: "sinistre", label: "Sinistre", description: "Procédure de déclaration et délais d'indemnisation", icon: Car },
    { id: "indemnisation", label: "Indemnisation", description: "Calcul des montants et franchise applicable", icon: Shield },
    { id: "bon_remplacement", label: "Bon de remplacement", description: "Véhicule de remplacement pendant réparation", icon: FileCheck },
    { id: "rc_etranger", label: "RC Étranger", description: "Couverture dans les pays de la CEDEAO", icon: Globe },
  ],
  pack_obseques: [
    { id: "capital_garanti", label: "Capital garanti", description: "Montant versé aux bénéficiaires", icon: Flower2 },
    { id: "prise_en_charge", label: "Prise en charge", description: "Services funéraires inclus dans le pack", icon: HandCoins },
    { id: "famille", label: "Famille couverte", description: "Conjoint, enfants et ascendants assurés", icon: UserCheck },
  ],
};

export const ThematicButtons = ({ productType, onTopicClick }: ThematicButtonsProps) => {
  const topics = topicsByProduct[productType] || topicsByProduct.auto;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Questions fréquentes</h4>
      <div className="grid grid-cols-2 gap-2">
        {topics.map((topic) => (
          <Button
            key={topic.id}
            variant="outline"
            size="sm"
            className="h-auto py-2 px-3 flex items-center gap-2 justify-start text-left hover:bg-primary/5 hover:border-primary/30"
            onClick={() => onTopicClick(topic.id, topic.description)}
          >
            <topic.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium">{topic.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
