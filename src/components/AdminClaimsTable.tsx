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
import { CheckCircle, XCircle, Eye, DollarSign, UserPlus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  assigned_broker_id: string | null;
  description: string | null;
  ai_confidence: number | null;
  photos: string[] | null;
  ocr_data: any;
  broker_notes: string | null;
  reviewed_at: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

interface Broker {
  id: string;
  display_name: string | null;
  email: string | null;
}

export const AdminClaimsTable = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [costEstimation, setCostEstimation] = useState("");
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
    fetchBrokers();
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

  const fetchBrokers = async () => {
    try {
      // Get all users with broker or admin role
      const { data: brokerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["broker", "admin"]);

      if (rolesError) throw rolesError;

      const brokerIds = brokerRoles?.map(r => r.user_id) || [];

      if (brokerIds.length === 0) {
        setBrokers([]);
        return;
      }

      // Fetch broker profiles
      const { data: brokerProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", brokerIds);

      if (profilesError) throw profilesError;

      setBrokers(brokerProfiles || []);
    } catch (error) {
      console.error("Error fetching brokers:", error);
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

  const assignBroker = async (claimId: string, brokerId: string | null) => {
    try {
      const { error } = await supabase
        .from("claims")
        .update({ assigned_broker_id: brokerId })
        .eq("id", claimId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: brokerId ? "Courtier assigné" : "Assignation supprimée",
      });
      
      fetchClaims();
    } catch (error) {
      console.error("Error assigning broker:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le courtier",
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

  const getBrokerBadge = (claim: Claim) => {
    if (!claim.assigned_broker_id) {
      return <Badge variant="outline" className="text-orange-500 border-orange-500">Non assigné</Badge>;
    }
    const broker = brokers.find(b => b.id === claim.assigned_broker_id);
    return broker?.display_name || broker?.email || "Courtier assigné";
  };

  const filteredClaims = filterUnassigned 
    ? claims.filter(c => !c.assigned_broker_id) 
    : claims;

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <Button
          variant={filterUnassigned ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterUnassigned(!filterUnassigned)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {filterUnassigned ? "Afficher tous" : "Non assignés uniquement"}
        </Button>
        {filterUnassigned && (
          <span className="text-sm text-muted-foreground">
            {filteredClaims.length} sinistre(s) non assigné(s)
          </span>
        )}
      </div>
      
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Police</TableHead>
              <TableHead>Date incident</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Courtier</TableHead>
              <TableHead>Estimation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClaims.map((claim) => (
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
                  <div className="flex items-center gap-2">
                    {!claim.assigned_broker_id && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        Non assigné
                      </Badge>
                    )}
                    <Select
                      value={claim.assigned_broker_id || "unassigned"}
                      onValueChange={(value) =>
                        assignBroker(claim.id, value === "unassigned" ? null : value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Non assigné" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non assigné</SelectItem>
                        {brokers.map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.display_name || broker.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
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
                        setShowDetailDialog(true);
                      }}
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClaim(claim);
                        setCostEstimation(claim.cost_estimation?.toString() || "");
                        setShowCostDialog(true);
                      }}
                      title="Modifier estimation"
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    {claim.status !== "Approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[hsl(var(--bright-green))]"
                        onClick={() => updateClaimStatus(claim.id, "Approved")}
                        title="Approuver"
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
                        title="Rejeter"
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

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du sinistre #{selectedClaim?.policy_id}</DialogTitle>
            <DialogDescription>
              Informations complètes sur le sinistre
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-base font-medium">{selectedClaim.profiles?.display_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.profiles?.email}</p>
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
                  <p className="text-base font-semibold">
                    {selectedClaim.ai_confidence
                      ? `${(selectedClaim.ai_confidence * 100).toFixed(0)}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-base">{selectedClaim.profiles?.phone || "N/A"}</p>
                </div>
                {selectedClaim.reviewed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Examiné le</p>
                    <p className="text-base">
                      {new Date(selectedClaim.reviewed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedClaim.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-base bg-muted p-3 rounded">{selectedClaim.description}</p>
                </div>
              )}

              {selectedClaim.photos && selectedClaim.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pièces jointes ({selectedClaim.photos.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedClaim.photos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedClaim.ocr_data && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Analyse OCR du document</p>
                  <div className="bg-muted p-4 rounded space-y-2">
                    {typeof selectedClaim.ocr_data === 'object' ? (
                      Object.entries(selectedClaim.ocr_data).map(([key, value]) => (
                        <div key={key} className="border-b border-border pb-2 last:border-0">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <p>{String(selectedClaim.ocr_data)}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedClaim.broker_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notes du courtier
                  </p>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded">
                    <p className="text-base whitespace-pre-wrap">{selectedClaim.broker_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
