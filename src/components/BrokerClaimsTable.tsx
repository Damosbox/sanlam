import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Claim {
  id: string;
  user_id: string;
  claim_type: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Reviewed" | "Closed";
  cost_estimation: number | null;
  incident_date: string | null;
  created_at: string;
  policy_id: string;
  description: string | null;
  ai_confidence: number | null;
  profiles: {
    display_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export const BrokerClaimsTable = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Non authentifié",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .eq("assigned_broker_id", user.id)
        .in("status", ["Submitted", "Reviewed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const claimsWithProfiles = await Promise.all(
        (data || []).map(async (claim) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, email, phone")
            .eq("id", claim.user_id)
            .single();

          return {
            ...claim,
            profiles: profile,
          };
        })
      );

      setClaims(claimsWithProfiles);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sinistres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewNotes("");
    setShowReviewDialog(true);
    setShowDetailDialog(false);
  };

  const submitReview = async () => {
    if (!selectedClaim) return;
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Mettre à jour le statut du sinistre
      const { error: claimError } = await supabase
        .from("claims")
        .update({ status: "Reviewed" })
        .eq("id", selectedClaim.id);

      if (claimError) throw claimError;

      // Créer une notification pour les admins (vous pouvez créer une table notifications plus tard)
      // Pour l'instant, on log juste dans la console
      console.log("Notification admin:", {
        claim_id: selectedClaim.id,
        broker_id: user.id,
        notes: reviewNotes,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Succès",
        description: "Sinistre examiné et remonté au support",
      });
      
      setShowReviewDialog(false);
      setReviewNotes("");
      fetchClaims();
    } catch (error) {
      console.error("Error updating claim:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le sinistre comme examiné",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Draft: "outline",
      Submitted: "secondary",
      Reviewed: "default",
      Approved: "default",
      Rejected: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    
    const color = confidence > 0.8 
      ? "text-[hsl(var(--bright-green))]" 
      : confidence > 0.6 
      ? "text-[hsl(var(--yellow))]" 
      : "text-[hsl(var(--orange))]";

    return (
      <span className={`text-sm font-medium ${color}`}>
        {(confidence * 100).toFixed(0)}%
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Police</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Confiance IA</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucun sinistre à examiner
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {claim.profiles?.display_name || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {claim.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{claim.claim_type}</TableCell>
                  <TableCell>{claim.policy_id}</TableCell>
                  <TableCell>
                    {claim.incident_date
                      ? new Date(claim.incident_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{getConfidenceBadge(claim.ai_confidence)}</TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      {claim.status === "Submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[hsl(var(--bright-green))]"
                          onClick={() => openReviewDialog(claim)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du sinistre</DialogTitle>
            <DialogDescription>
              Police #{selectedClaim?.policy_id}
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-base font-medium">
                    {selectedClaim.profiles?.display_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-base capitalize">{selectedClaim.claim_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date incident</p>
                  <p className="text-base">
                    {selectedClaim.incident_date
                      ? new Date(selectedClaim.incident_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimation</p>
                  <p className="text-base font-semibold">
                    {selectedClaim.cost_estimation
                      ? `${selectedClaim.cost_estimation.toLocaleString()} FCFA`
                      : "Non estimé"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confiance IA</p>
                  <p className="text-base">
                    {selectedClaim.ai_confidence
                      ? `${(selectedClaim.ai_confidence * 100).toFixed(0)}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p className="text-base">{selectedClaim.profiles?.phone || "N/A"}</p>
                </div>
              </div>
              
              {selectedClaim.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-base">{selectedClaim.description}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedClaim.status === "Submitted" && (
                  <Button 
                    onClick={() => openReviewDialog(selectedClaim)}
                    className="flex-1"
                  >
                    Marquer comme examiné
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  Contacter le client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Examen du sinistre</DialogTitle>
            <DialogDescription>
              Ajoutez vos observations avant de remonter au support
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="review-notes">Notes d'examen</Label>
              <Textarea
                id="review-notes"
                placeholder="Décrivez votre examen, vos recommandations, les points à vérifier..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={6}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Ces notes seront transmises au support administratif pour traitement.
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={submitReview}
                disabled={submitting || !reviewNotes.trim()}
                className="flex-1"
              >
                {submitting ? "Envoi..." : "Envoyer au support"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                disabled={submitting}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
