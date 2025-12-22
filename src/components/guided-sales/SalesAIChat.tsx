import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, MessageSquare, TrendingUp, Bot } from "lucide-react";
import { GuidedSalesState, SelectedProductType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SalesAIChatProps {
  state: GuidedSalesState;
  activeTopic?: string;
  onClearTopic: () => void;
}

type AIMode = "arguments" | "objections" | "competition" | "topic";

const productNames: Record<SelectedProductType, string> = {
  auto: "Assurance Auto CIMA",
  molo_molo: "Épargne Molo Molo",
  pack_obseques: "Pack Obsèques",
};

export const SalesAIChat = ({ state, activeTopic, onClearTopic }: SalesAIChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<AIMode | null>(null);

  const productName = productNames[state.productSelection.selectedProduct];

  const callAI = async (mode: AIMode, topicDescription?: string) => {
    setIsLoading(true);
    setActiveMode(mode);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke("sales-assistant", {
        body: {
          mode,
          productType: state.productSelection.selectedProduct,
          productName,
          premium: state.calculatedPremium.totalAPayer,
          planTier: state.coverage.planTier,
          topicDescription,
          clientName: `${state.clientIdentification.firstName} ${state.clientIdentification.lastName}`.trim() || "le client",
        },
      });

      if (error) throw error;
      setResponse(data.response);
    } catch (err) {
      console.error("AI Error:", err);
      setResponse("Désolé, une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-call when topic is set
  if (activeTopic && !response && !isLoading && activeMode !== "topic") {
    callAI("topic", activeTopic);
  }

  const handleModeClick = (mode: AIMode) => {
    onClearTopic();
    callAI(mode);
  };

  return (
    <div className="space-y-3">
      {/* AI Avatar & Greeting */}
      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Assistant Commercial IA</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {response ? "Voici mes recommandations :" : "Comment puis-je vous aider à conclure cette vente ?"}
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 h-8 text-xs gap-1.5",
            activeMode === "arguments" && "border-primary bg-primary/5"
          )}
          onClick={() => handleModeClick("arguments")}
          disabled={isLoading}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Arguments
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 h-8 text-xs gap-1.5",
            activeMode === "objections" && "border-primary bg-primary/5"
          )}
          onClick={() => handleModeClick("objections")}
          disabled={isLoading}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Objections
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 h-8 text-xs gap-1.5",
            activeMode === "competition" && "border-primary bg-primary/5"
          )}
          onClick={() => handleModeClick("competition")}
          disabled={isLoading}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Concurrence
        </Button>
      </div>

      {/* Response Area */}
      {(isLoading || response) && (
        <div className="bg-muted/50 rounded-lg p-3 min-h-[80px]">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyse en cours...</span>
            </div>
          ) : (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
