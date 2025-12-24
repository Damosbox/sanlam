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
  molo_molo: [
    { id: "epargne", label: "Épargne projetée", description: "Simulation du capital accumulé à terme", icon: PiggyBank },
    { id: "capital_deces", label: "Capital décès", description: "Garanties en cas de décès du souscripteur", icon: Heart },
    { id: "rachat", label: "Rachat anticipé", description: "Conditions et pénalités de sortie avant terme", icon: ArrowDownToLine },
    { id: "beneficiaires", label: "Bénéficiaires", description: "Désignation et modification des bénéficiaires", icon: Users },
  ],
  pack_obseques: [
    { id: "capital_garanti", label: "Capital garanti", description: "Montant versé aux bénéficiaires", icon: Flower2 },
    { id: "prise_en_charge", label: "Prise en charge", description: "Services funéraires inclus dans le pack", icon: HandCoins },
    { id: "famille", label: "Famille couverte", description: "Conjoint, enfants et ascendants assurés", icon: UserCheck },
  ],
  mrh: [
    { id: "incendie", label: "Incendie", description: "Couverture et indemnisation en cas d'incendie", icon: Shield },
    { id: "vol", label: "Vol", description: "Conditions de prise en charge du vol", icon: Shield },
    { id: "degats_eaux", label: "Dégâts des eaux", description: "Dommages liés aux fuites et inondations", icon: Shield },
    { id: "rc_familiale", label: "RC Familiale", description: "Responsabilité civile vie privée", icon: Users },
  ],
  assistance_voyage: [
    { id: "frais_medicaux", label: "Frais médicaux", description: "Prise en charge des soins à l'étranger", icon: Heart },
    { id: "rapatriement", label: "Rapatriement", description: "Conditions de rapatriement sanitaire", icon: Globe },
    { id: "bagages", label: "Bagages", description: "Indemnisation en cas de perte ou vol", icon: Shield },
    { id: "annulation", label: "Annulation", description: "Remboursement en cas d'annulation de voyage", icon: FileCheck },
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
