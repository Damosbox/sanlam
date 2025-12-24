import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, ArrowRight, Bot, MessageSquare, TrendingUp, Loader2, HelpCircle } from "lucide-react";
import { GuidedSalesState, PlanTier } from "./types";
import { formatFCFA } from "@/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MobileCoverageStickyBarProps {
  state: GuidedSalesState;
  totalPrice: number;
  periodicityLabel: string;
  onNext: () => void;
  plans: { tier: PlanTier; name: string; price: number; coverages: { name: string; included: boolean }[] }[];
  onPlanSelect: (tier: PlanTier) => void;
}

type AIMode = "arguments" | "objections" | "competition";

const faqQuestions = [
  { id: "sinistre", label: "Sinistre", question: "Comment déclarer un sinistre ?" },
  { id: "indemnisation", label: "Indemnisation", question: "Quels sont les délais d'indemnisation ?" },
  { id: "resiliation", label: "Résiliation", question: "Comment résilier le contrat ?" },
  { id: "franchise", label: "Franchise", question: "Qu'est-ce que la franchise ?" },
];

export const MobileCoverageStickyBar = ({
  state,
  totalPrice,
  periodicityLabel,
  onNext,
}: MobileCoverageStickyBarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<AIMode | null>(null);

  const callAI = async (mode: AIMode, topicDescription?: string) => {
    setIsLoading(true);
    setActiveMode(mode);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke("sales-assistant", {
        body: {
          mode,
          productType: state.productSelection.selectedProduct,
          productName: "Assurance Auto CIMA",
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

  const handleFaqClick = (question: string) => {
    callAI("arguments", question);
  };

  return (
    <>
      {/* Sticky Bottom Bar - Visible on mobile and tablet, hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-primary truncate">
              {formatFCFA(totalPrice)}
              <span className="text-sm font-normal text-muted-foreground">{periodicityLabel}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden xs:inline">Aide IA</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-5">
                    <SheetHeader className="text-left">
                      <SheetTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        Assistant Commercial IA
                      </SheetTitle>
                    </SheetHeader>

                    {/* AI Mode Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 h-10 text-xs gap-1.5",
                          activeMode === "arguments" && "border-primary bg-primary/5"
                        )}
                        onClick={() => callAI("arguments")}
                        disabled={isLoading}
                      >
                        <Lightbulb className="h-4 w-4" />
                        Arguments
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 h-10 text-xs gap-1.5",
                          activeMode === "objections" && "border-primary bg-primary/5"
                        )}
                        onClick={() => callAI("objections")}
                        disabled={isLoading}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Objections
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 h-10 text-xs gap-1.5",
                          activeMode === "competition" && "border-primary bg-primary/5"
                        )}
                        onClick={() => callAI("competition")}
                        disabled={isLoading}
                      >
                        <TrendingUp className="h-4 w-4" />
                        Concurrence
                      </Button>
                    </div>

                    {/* AI Response */}
                    {(isLoading || response) && (
                      <div className="bg-muted/50 rounded-lg p-4 min-h-[100px]">
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

                    {/* FAQ Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        Questions fréquentes
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                        {faqQuestions.map((faq) => (
                          <Button
                            key={faq.id}
                            variant="secondary"
                            size="sm"
                            className="shrink-0 h-8 text-xs"
                            onClick={() => handleFaqClick(faq.question)}
                            disabled={isLoading}
                          >
                            {faq.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Continue Button */}
                    <Button 
                      className="w-full h-12 text-base gap-2" 
                      onClick={() => {
                        setSheetOpen(false);
                        onNext();
                      }}
                    >
                      Continuer vers la vérification
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button onClick={onNext} className="gap-1.5 h-9">
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for sticky bar on mobile */}
      <div className="h-20 sm:hidden" />
    </>
  );
};
