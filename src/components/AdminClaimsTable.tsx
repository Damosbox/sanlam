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
import { CheckCircle, XCircle, Eye, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export const AdminClaimsTable = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [costEstimation, setCostEstimation] = useState("");
  const [showCostDialog, setShowCostDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const claimsWithProfiles = await Promise.all(
        (data || []).map(async (claim) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, email")
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

  const updateClaimStatus = async (
    claimId: string,
    status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Reviewed" | "Closed"
  ) => {
    try {
      const { error } = await supabase
        .from("claims")
        .update({ status })
        .eq("id", claimId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Sinistre ${status === "Approved" ? "approuvé" : "rejeté"}`,
      });
      
      fetchClaims();
    } catch (error) {
      console.error("Error updating claim:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le sinistre",
        variant: "destructive",
      });
    }
  };

  const updateCostEstimation = async () => {
    if (!selectedClaim || !costEstimation) return;

    try {
      const { error } = await supabase
        .from("claims")
        .update({ cost_estimation: parseFloat(costEstimation) })
        .eq("id", selectedClaim.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Estimation de coût mise à jour",
      });
      
      setShowCostDialog(false);
      setCostEstimation("");
      setSelectedClaim(null);
      fetchClaims();
    } catch (error) {
      console.error("Error updating cost:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le coût",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Draft: "outline",
      Submitted: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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
              <TableHead>Utilisateur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Police</TableHead>
              <TableHead>Date incident</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Estimation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
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
                <TableCell>{getStatusBadge(claim.status)}</TableCell>
                <TableCell>
                  {claim.cost_estimation
                    ? `${claim.cost_estimation.toLocaleString()} FCFA`
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setCostEstimation(claim.cost_estimation?.toString() || "");
                        setShowCostDialog(true);
                      }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    {claim.status !== "Approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[hsl(var(--bright-green))]"
                        onClick={() => updateClaimStatus(claim.id, "Approved")}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {claim.status !== "Rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[hsl(var(--red))]"
                        onClick={() => updateClaimStatus(claim.id, "Rejected")}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'estimation de coût</DialogTitle>
            <DialogDescription>
              Mettre à jour l'estimation pour le sinistre {selectedClaim?.policy_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cost">Montant (FCFA)</Label>
              <Input
                id="cost"
                type="number"
                value={costEstimation}
                onChange={(e) => setCostEstimation(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCostDialog(false)}>
              Annuler
            </Button>
            <Button onClick={updateCostEstimation}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
