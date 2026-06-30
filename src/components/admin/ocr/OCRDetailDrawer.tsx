import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OCRAuthenticityBadge } from "./OCRAuthenticityBadge";
import { Check, X, FileImage, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OCRScan {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  document_type: string;
  document_image_url: string | null;
  extracted_data: Record<string, unknown>;
  confidence_score: number;
  authenticity_status: string;
  authenticity_score: number;
  authenticity_details: Record<string, unknown>;
  agent_name: string | null;
  review_status: string;
  review_notes: string | null;
}

interface Props {
  scan: OCRScan | null;
  open: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export function OCRDetailDrawer({ scan, open, onClose, onReviewed }: Props) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNotes(scan?.review_notes || "");
  }, [scan]);

  if (!scan) return null;

  const handleReview = async (decision: "validated" | "rejected") => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("ocr_scan_results")
        .update({
          review_status: decision,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq("id", scan.id);
      if (error) throw error;

      // If rejected, block KYC on the related entity
      if (decision === "rejected") {
        if (scan.entity_type === "client") {
          await supabase
            .from("client_kyc_compliance")
            .update({ screening_blocked: true })
            .eq("client_id", scan.entity_id);
        } else {
          await supabase
            .from("lead_kyc_compliance")
            .update({ screening_blocked: true })
            .eq("lead_id", scan.entity_id);
        }

        await supabase.from("audit_logs").insert({
          action: "ocr_scan_rejected",
          resource_type: "ocr_scan_results",
          resource_id: scan.id,
          user_id: user?.id,
          new_values: { entity_type: scan.entity_type, entity_id: scan.entity_id, notes },
        });
      }

      toast.success(decision === "validated" ? "Scan validé" : "Scan rejeté — KYC bloqué");
      onReviewed();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la révision");
    } finally {
      setSubmitting(false);
    }
  };

  const data = scan.extracted_data as Record<string, unknown>;
  const details = scan.authenticity_details as Record<string, unknown>;
  const anomalies = (details?.anomaliesDetected as string[]) || [];
  const securityFeatures = (details?.securityFeatures as string[]) || [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Détail du scan OCR</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(scan.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
                <p className="font-medium">{scan.entity_name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {scan.entity_type === "client" ? "Client" : "Prospect"} · scanné par {scan.agent_name || "—"}
                </p>
              </div>
              <OCRAuthenticityBadge status={scan.authenticity_status} score={scan.authenticity_score} />
            </div>

            <Separator />

            {/* Document preview */}
            <div>
              <h3 className="font-medium text-sm mb-2">Document scanné</h3>
              <div className="rounded-lg border bg-muted/30 aspect-video flex items-center justify-center">
                {scan.document_image_url ? (
                  <img src={scan.document_image_url} alt="Document" className="max-h-full rounded" />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Image non conservée</p>
                    <p className="text-xs">Type : {scan.document_type}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <h3 className="font-medium text-sm mb-2">Score de confiance d'extraction</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${
                      scan.confidence_score >= 90 ? "bg-green-500" :
                      scan.confidence_score >= 70 ? "bg-orange-500" : "bg-red-500"
                    }`}
                    style={{ width: `${scan.confidence_score}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-medium">{Math.round(scan.confidence_score)}%</span>
              </div>
            </div>

            {/* Extracted fields */}
            <div>
              <h3 className="font-medium text-sm mb-2">Champs extraits</h3>
              <div className="space-y-2 rounded-lg border p-3 bg-muted/20">
                {Object.entries(data).filter(([k]) => !["confidence", "authenticityStatus", "authenticityScore", "authenticityDetails"].includes(k)).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <span className="font-medium text-right">{String(val ?? "—")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Authenticity details */}
            <div>
              <h3 className="font-medium text-sm mb-2">Analyse d'authenticité</h3>
              <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
                {details?.imageQuality && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Qualité image</span>
                    <Badge variant="outline">{String(details.imageQuality)}</Badge>
                  </div>
                )}
                {typeof details?.mrzValid === "boolean" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MRZ valide</span>
                    <Badge variant={details.mrzValid ? "default" : "destructive"}>
                      {details.mrzValid ? "Oui" : "Non"}
                    </Badge>
                  </div>
                )}
                {anomalies.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      Anomalies détectées
                    </p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {anomalies.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {securityFeatures.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Éléments de sécurité</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {securityFeatures.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {details?.notes && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2">{String(details.notes)}</p>
                )}
              </div>
            </div>

            {/* Review notes */}
            <div>
              <h3 className="font-medium text-sm mb-2">Note de conformité</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter une note (optionnel)…"
                rows={3}
                disabled={scan.review_status !== "pending"}
              />
            </div>

            {scan.review_status !== "pending" && (
              <div className="text-sm text-muted-foreground italic">
                Déjà révisé : <strong>{scan.review_status === "validated" ? "Validé" : "Rejeté"}</strong>
              </div>
            )}
          </div>
        </ScrollArea>

        {scan.review_status === "pending" && (
          <div className="border-t pt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
              onClick={() => handleReview("rejected")}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-2" />
              Rejeter & bloquer KYC
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleReview("validated")}
              disabled={submitting}
            >
              <Check className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}