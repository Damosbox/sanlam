import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MessageSquare, CheckCircle, Search, Plus, Download, ChevronDown, RotateCcw } from "lucide-react";
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
import { ProductSelector, ProductType, PRODUCTS } from "@/components/broker/dashboard/ProductSelector";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

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

type StatusFilter = "all" | "Submitted" | "Reviewed" | "Approved" | "Rejected" | "Closed";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "Submitted", label: "Soumis" },
  { value: "Reviewed", label: "Examiné" },
  { value: "Approved", label: "Approuvé" },
  { value: "Rejected", label: "Rejeté" },
  { value: "Closed", label: "Clôturé" },
];

export const BrokerClaimsTable = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  // Filtered claims
  const filteredClaims = useMemo(() => {
    let result = claims;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(claim =>
        claim.profiles?.display_name?.toLowerCase().includes(query) ||
        claim.profiles?.email?.toLowerCase().includes(query) ||
        claim.policy_id?.toLowerCase().includes(query) ||
        claim.claim_type?.toLowerCase().includes(query) ||
        claim.description?.toLowerCase().includes(query)
      );
    }

    // Product filter
    if (selectedProduct !== "all") {
      result = result.filter(claim => claim.claim_type?.toLowerCase() === selectedProduct);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(claim => claim.status === statusFilter);
    }

    return result;
  }, [claims, searchQuery, selectedProduct, statusFilter]);

  const hasActiveFilters = searchQuery !== "" || selectedProduct !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedProduct("all");
    setStatusFilter("all");
  };

  // Export functions
  const exportToExcel = () => {
    const data = filteredClaims.map(claim => ({
      Client: claim.profiles?.display_name || "N/A",
      Email: claim.profiles?.email || "",
      Téléphone: claim.profiles?.phone || "",
      Type: claim.claim_type,
      Police: claim.policy_id,
      "Date incident": claim.incident_date ? new Date(claim.incident_date).toLocaleDateString() : "N/A",
      "Date déclaration": new Date(claim.created_at).toLocaleDateString(),
      Statut: claim.status,
      Estimation: claim.cost_estimation || "",
      "Confiance IA": claim.ai_confidence ? `${(claim.ai_confidence * 100).toFixed(0)}%` : "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sinistres");
    XLSX.writeFile(wb, "sinistres.xlsx");
    toast({ title: "Export Excel réussi" });
  };

  const exportToCSV = () => {
    const data = filteredClaims.map(claim => ({
      Client: claim.profiles?.display_name || "N/A",
      Email: claim.profiles?.email || "",
      Téléphone: claim.profiles?.phone || "",
      Type: claim.claim_type,
      Police: claim.policy_id,
      "Date incident": claim.incident_date ? new Date(claim.incident_date).toLocaleDateString() : "N/A",
      "Date déclaration": new Date(claim.created_at).toLocaleDateString(),
      Statut: claim.status,
      Estimation: claim.cost_estimation || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sinistres.csv";
    link.click();
    toast({ title: "Export CSV réussi" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste des Sinistres", 14, 20);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString()}`, 14, 28);

    let y = 40;
    doc.setFontSize(8);
    
    // Headers
    doc.setFont("helvetica", "bold");
    doc.text("Client", 14, y);
    doc.text("Type", 60, y);
    doc.text("Police", 90, y);
    doc.text("Date", 130, y);
    doc.text("Statut", 160, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");

    filteredClaims.slice(0, 40).forEach(claim => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text((claim.profiles?.display_name || "N/A").substring(0, 25), 14, y);
      doc.text(claim.claim_type?.substring(0, 15) || "", 60, y);
      doc.text(claim.policy_id?.substring(0, 20) || "", 90, y);
      doc.text(claim.incident_date ? new Date(claim.incident_date).toLocaleDateString() : "N/A", 130, y);
      doc.text(claim.status, 160, y);
      y += 5;
    });

    doc.save("sinistres.pdf");
    toast({ title: "Export PDF réussi" });
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

      const { error: claimError } = await supabase
        .from("claims")
        .update({ 
          status: "Reviewed",
          broker_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedClaim.id);

      if (claimError) throw claimError;

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
      Closed: "outline",
    };

    const labels: Record<string, string> = {
      Draft: "Brouillon",
      Submitted: "Soumis",
      Reviewed: "Examiné",
      Approved: "Approuvé",
      Rejected: "Rejeté",
      Closed: "Clôturé",
    };

    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
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
      {/* Toolbar */}
      <div className="space-y-4 mb-4">
        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, n° police, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  Exporter en CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  Exporter en Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  Exporter en PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate("/b2b/claims/new")} className="gap-2 h-8 sm:h-9 px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau sinistre</span>
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <ProductSelector
            value={selectedProduct}
            onChange={setSelectedProduct}
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Counter + Reset */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredClaims.length === claims.length ? (
              <span>{claims.length} sinistre{claims.length > 1 ? "s" : ""}</span>
            ) : (
              <span>
                <span className="font-medium text-foreground">{filteredClaims.length}</span> sur {claims.length} sinistre{claims.length > 1 ? "s" : ""}
              </span>
            )}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Client</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              {selectedProduct !== "all" && (
                <TableHead className="min-w-[100px] hidden sm:table-cell">
                  {selectedProduct === "auto" ? "Immatriculation" : selectedProduct === "obseques" ? "N° Bénéficiaire" : "Référence"}
                </TableHead>
              )}
              <TableHead className="min-w-[100px] hidden sm:table-cell">Police</TableHead>
              <TableHead className="min-w-[90px]">Incident</TableHead>
              <TableHead className="min-w-[90px] hidden md:table-cell">Déclaration</TableHead>
              <TableHead className="min-w-[80px] hidden sm:table-cell">Confiance IA</TableHead>
              <TableHead className="min-w-[80px]">Statut</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedProduct !== "all" ? 9 : 8} className="text-center text-muted-foreground py-8">
                  {hasActiveFilters ? "Aucun sinistre ne correspond aux filtres" : "Aucun sinistre"}
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {claim.profiles?.display_name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                        {claim.profiles?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{claim.claim_type}</TableCell>
                  {selectedProduct !== "all" && (
                    <TableCell className="hidden sm:table-cell text-sm">
                      {(() => {
                        const ocr = claim.ocr_data as Record<string, any> | null;
                        if (!ocr) return "—";
                         switch (selectedProduct) {
                           case "auto": return ocr.immatriculation || ocr.license_plate || "—";
                           case "obseques": return ocr.beneficiary_number || ocr.beneficiaire || "—";
                           default: return ocr.reference || "—";
                         }
                      })()}
                    </TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell text-sm">{claim.policy_id}</TableCell>
                  <TableCell className="text-sm">
                    {claim.incident_date
                      ? new Date(claim.incident_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{getConfidenceBadge(claim.ai_confidence)}</TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0 hidden sm:flex"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      {claim.status === "Submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[hsl(var(--bright-green))] h-8 w-8 p-0"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <p className="text-sm font-medium text-muted-foreground">Date déclaration</p>
                  <p className="text-base">
                    {new Date(selectedClaim.created_at).toLocaleDateString()}
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
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-base">{selectedClaim.profiles?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{selectedClaim.profiles?.email || "N/A"}</p>
                </div>
              </div>
              
              {selectedClaim.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-base">{selectedClaim.description}</p>
                </div>
              )}

              {selectedClaim.photos && selectedClaim.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pièces jointes</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedClaim.photos.map((photo, idx) => (
                      <img 
                        key={idx} 
                        src={photo} 
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border"
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
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes du courtier</p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-base">{selectedClaim.broker_notes}</p>
                  </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
