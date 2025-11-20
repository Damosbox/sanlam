interface EducationExplanationProps {
  monthlyPremium: number;
  deferredYears: number;
  lastChangedParam: "premium" | "years";
}

export const EducationExplanation = ({
  monthlyPremium,
  deferredYears,
  lastChangedParam
}: EducationExplanationProps) => {
  const getMessage = () => {
    if (lastChangedParam === "premium") {
      if (monthlyPremium < 15000) {
        return "Même avec un montant modeste, vous préparez l'avenir de vos enfants progressivement.";
      }
      return "Plus la prime est élevée, plus la rente éducation sera importante pour financer les études.";
    } else {
      if (deferredYears <= 5) {
        return "Une période courte pour un besoin éducatif proche (école primaire).";
      }
      if (deferredYears <= 10) {
        return "Période idéale pour préparer l'entrée au collège ou lycée.";
      }
      return "Une longue période permet de constituer une rente importante pour les études supérieures.";
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-border/50 animate-fade-in">
      <p className="text-sm text-foreground leading-relaxed flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <span className="pt-1">{getMessage()}</span>
      </p>
    </div>
  );
};
