import { useEffect, useState } from "react";

interface DynamicExplanationProps {
  monthlyPremium: number;
  years: number;
  lastChangedParam: "premium" | "years";
}

export const DynamicExplanation = ({ monthlyPremium, years, lastChangedParam }: DynamicExplanationProps) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let newMessage = "";

    if (lastChangedParam === "premium") {
      if (monthlyPremium < 15000) {
        newMessage = "Même avec un petit montant, votre épargne progresse régulièrement.";
      } else {
        newMessage = "Plus la prime est élevée, plus votre capital final augmente.";
      }
    } else if (lastChangedParam === "years") {
      newMessage = "Une durée plus longue permet aux intérêts de se développer davantage.";
    }

    setMessage(newMessage);
  }, [monthlyPremium, years, lastChangedParam]);

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in">
      <p className="text-sm text-foreground leading-relaxed">
        💡 {message}
      </p>
    </div>
  );
};
