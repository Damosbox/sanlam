import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FileText, Share2, FolderOpen, ArrowLeft } from "lucide-react";
import { GuidedSalesState } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IssuanceStepProps {
  state: GuidedSalesState;
  onReset: () => void;
}

export const IssuanceStep = ({ state, onReset }: IssuanceStepProps) => {
  const policyNumber = "POL-2024-CI-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState("");
  const [npsSubmitted, setNpsSubmitted] = useState(false);

  const handleNpsSelect = (score: number) => {
    if (!npsSubmitted) {
      setNpsScore(score);
    }
  };

  const handleSubmitNps = () => {
    if (npsScore !== null) {
      setNpsSubmitted(true);
      toast.success("Merci pour votre avis !");
      // Here you would typically send the NPS data to your backend
      console.log("NPS submitted:", { score: npsScore, comment: npsComment });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white mb-4">
          Police émise
        </Badge>
        <h1 className="text-2xl font-bold text-foreground">Félicitations !</h1>
        <p className="text-muted-foreground mt-1">
          Le contrat a été émis avec succès.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Numéro de police</p>
          <p className="text-2xl font-mono font-bold text-foreground">{policyNumber}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Documents disponibles</h3>
          
          <div className="space-y-3">
            {[
              { name: "Reçu de paiement", type: "PDF" },
              { name: "Conditions Particulières (CP)", type: "PDF" },
              { name: "Attestation d'assurance", type: "PDF" },
              { name: "Conditions générales", type: "PDF" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{doc.name}</span>
                </div>
                <Badge variant="secondary">{doc.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NPS Section */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold mb-2">Votre avis compte !</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sur une échelle de 0 à 10, recommanderiez-vous ce processus de souscription ?
          </p>
          
          <div className="flex justify-center gap-1 sm:gap-2 mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
              <button
                key={score}
                onClick={() => handleNpsSelect(score)}
                disabled={npsSubmitted}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full border text-sm font-medium transition-all",
                  npsScore === score 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "hover:bg-muted",
                  score <= 6 ? "border-red-200 dark:border-red-800" : 
                  score <= 8 ? "border-yellow-200 dark:border-yellow-800" : 
                  "border-green-200 dark:border-green-800",
                  npsSubmitted && "opacity-50 cursor-not-allowed"
                )}
              >
                {score}
              </button>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex justify-between text-xs text-muted-foreground px-2 mb-4">
            <span>Pas du tout probable</span>
            <span>Très probable</span>
          </div>
          
          {/* Optional comment if NPS selected */}
          {npsScore !== null && !npsSubmitted && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <Textarea 
                placeholder="Un commentaire ? (optionnel)"
                value={npsComment}
                onChange={(e) => setNpsComment(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <Button onClick={handleSubmitNps}>
                Envoyer mon avis
              </Button>
            </div>
          )}
          
          {npsSubmitted && (
            <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-300">
              ✓ Merci pour votre retour !
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Partager au client
        </Button>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Espace documents
        </Button>
        <Button variant="secondary" className="gap-2" onClick={onReset}>
          <ArrowLeft className="h-4 w-4" />
          Nouveau devis
        </Button>
      </div>
    </div>
  );
};
