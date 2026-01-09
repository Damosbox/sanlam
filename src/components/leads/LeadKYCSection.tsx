import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, FileCheck, Save, Loader2, Search, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LeadKYCData {
  id?: string;
  lead_id: string;
  is_ppe: boolean;
  ppe_position: string | null;
  ppe_country: string | null;
  ppe_relationship: string | null;
  ppe_screening_status: string | null;
  ppe_screening_date: string | null;
  ppe_screening_source: string | null;
  ppe_screening_reference: string | null;
  aml_verified: boolean;
  aml_verified_at: string | null;
  aml_risk_level: "low" | "medium" | "high" | null;
  aml_notes: string | null;
  identity_document_type: "cni" | "passport" | "permit" | "other" | null;
  identity_document_number: string | null;
  identity_expiry_date: string | null;
  identity_verified: boolean;
}

interface LeadKYCSectionProps {
  leadId: string;
}

export const LeadKYCSection = ({ leadId }: LeadKYCSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScreening, setIsScreening] = useState(false);
  
  const [formData, setFormData] = useState<Omit<LeadKYCData, "id">>({
    lead_id: leadId,
    is_ppe: false,
    ppe_position: null,
    ppe_country: null,
    ppe_relationship: null,
    ppe_screening_status: null,
    ppe_screening_date: null,
    ppe_screening_source: null,
    ppe_screening_reference: null,
    aml_verified: false,
    aml_verified_at: null,
    aml_risk_level: null,
    aml_notes: null,
    identity_document_type: null,
    identity_document_number: null,
    identity_expiry_date: null,
    identity_verified: false,
  });

  // Fetch lead profile to get name for screening
  const { data: leadProfile } = useQuery({
    queryKey: ["lead-profile", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("first_name, last_name")
        .eq("id", leadId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

  const { data: kycData, isLoading } = useQuery({
    queryKey: ["lead-kyc", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_kyc_compliance")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

  useEffect(() => {
    if (kycData) {
      setFormData({
        lead_id: leadId,
        is_ppe: kycData.is_ppe || false,
        ppe_position: kycData.ppe_position,
        ppe_country: kycData.ppe_country,
        ppe_relationship: kycData.ppe_relationship,
        ppe_screening_status: kycData.ppe_screening_status,
        ppe_screening_date: kycData.ppe_screening_date,
        ppe_screening_source: kycData.ppe_screening_source,
        ppe_screening_reference: kycData.ppe_screening_reference,
        aml_verified: kycData.aml_verified || false,
        aml_verified_at: kycData.aml_verified_at,
        aml_risk_level: kycData.aml_risk_level as LeadKYCData["aml_risk_level"],
        aml_notes: kycData.aml_notes,
        identity_document_type: kycData.identity_document_type as LeadKYCData["identity_document_type"],
        identity_document_number: kycData.identity_document_number,
        identity_expiry_date: kycData.identity_expiry_date,
        identity_verified: kycData.identity_verified || false,
      });
    }
  }, [kycData, leadId]);

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<LeadKYCData, "id" | "is_ppe" | "ppe_position" | "ppe_country" | "ppe_relationship" | "ppe_screening_status" | "ppe_screening_date" | "ppe_screening_source" | "ppe_screening_reference">) => {
      const payload = {
        lead_id: data.lead_id,
        aml_verified: data.aml_verified,
        aml_risk_level: data.aml_risk_level,
        aml_notes: data.aml_notes,
        identity_document_type: data.identity_document_type,
        identity_document_number: data.identity_document_number,
        identity_expiry_date: data.identity_expiry_date,
        identity_verified: data.identity_verified,
        aml_verified_at: data.aml_verified && !kycData?.aml_verified ? new Date().toISOString() : data.aml_verified_at,
      };

      if (kycData?.id) {
        const { error } = await supabase
          .from("lead_kyc_compliance")
          .update(payload)
          .eq("id", kycData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_kyc_compliance")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-kyc", leadId] });
      toast({ title: "KYC sauvegardé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    },
  });

  const handlePPEScreening = async () => {
    if (!leadProfile?.first_name || !leadProfile?.last_name) {
      toast({ 
        title: "Informations manquantes", 
        description: "Le nom du prospect est requis pour le screening",
        variant: "destructive" 
      });
      return;
    }

    setIsScreening(true);
    try {
      const { data, error } = await supabase.functions.invoke("screen-ppe", {
        body: {
          clientId: leadId,
          entityType: "lead",
          firstName: leadProfile.first_name,
          lastName: leadProfile.last_name,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["lead-kyc", leadId] });
      
      toast({ 
        title: "Screening terminé",
        description: data.result.isPPE 
          ? "⚠️ PPE détecté - Vérification requise" 
          : "✓ Aucune PPE détectée"
      });
    } catch (error) {
      console.error("Screening error:", error);
      toast({ 
        title: "Erreur de screening", 
        description: "Impossible de contacter le service de vérification",
        variant: "destructive" 
      });
    } finally {
      setIsScreening(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getComplianceStatus = () => {
    const issues = [];
    if (!formData.identity_document_type) issues.push("Pièce d'identité manquante");
    if (!formData.aml_verified) issues.push("Vérification AML non effectuée");
    if (formData.ppe_screening_status !== "completed") issues.push("Screening PPE non effectué");
    return issues;
  };

  const getRelationshipLabel = (rel: string | null) => {
    switch (rel) {
      case "lui_meme": return "Lui-même";
      case "conjoint": return "Conjoint(e)";
      case "parent": return "Parent";
      case "enfant": return "Enfant";
      case "associe": return "Associé proche";
      default: return rel || "";
    }
  };

  const complianceIssues = getComplianceStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compliance Status */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Statut Compliance</span>
        {complianceIssues.length === 0 ? (
          <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">
            Complet
          </Badge>
        ) : (
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700">
            {complianceIssues.length} point(s) à vérifier
          </Badge>
        )}
      </div>

      {complianceIssues.length > 0 && (
        <div className="text-xs text-amber-600 space-y-1">
          {complianceIssues.map((issue, i) => (
            <div key={i} className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {issue}
            </div>
          ))}
        </div>
      )}

      <Accordion type="multiple" defaultValue={["ppe", "identity"]} className="space-y-2">
        {/* PPE Section - Automatic Screening */}
        <AccordionItem value="ppe" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Screening PPE</span>
              {formData.is_ppe && (
                <Badge variant="destructive" className="ml-2 text-xs">PPE Détecté</Badge>
              )}
              {formData.ppe_screening_status === "completed" && !formData.is_ppe && (
                <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Vérifié</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* Screening Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formData.ppe_screening_status === "completed" 
                  ? "Dernier screening effectué" 
                  : "Lancer une vérification automatique"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePPEScreening}
                disabled={isScreening}
              >
                {isScreening ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Vérification...
                  </>
                ) : formData.ppe_screening_status === "completed" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Relancer
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Lancer le screening
                  </>
                )}
              </Button>
            </div>

            {/* Screening Result */}
            {formData.ppe_screening_status === "completed" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                {formData.is_ppe ? (
                  <div className="space-y-2">
                    <Badge className="bg-amber-100 text-amber-700 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      PPE Détecté
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {formData.ppe_position && (
                        <div>
                          <span className="text-xs text-muted-foreground">Position:</span>
                          <p className="font-medium">{formData.ppe_position}</p>
                        </div>
                      )}
                      {formData.ppe_country && (
                        <div>
                          <span className="text-xs text-muted-foreground">Pays:</span>
                          <p className="font-medium">{formData.ppe_country}</p>
                        </div>
                      )}
                      {formData.ppe_relationship && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground">Relation:</span>
                          <p className="font-medium">{getRelationshipLabel(formData.ppe_relationship)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Aucune PPE détectée</span>
                  </div>
                )}
                
                {/* Screening metadata */}
                <div className="mt-3 pt-2 border-t border-dashed text-xs text-muted-foreground">
                  <p>
                    📄 Screening: {formData.ppe_screening_date && format(new Date(formData.ppe_screening_date), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                  <p>Source: {formData.ppe_screening_source} • Réf: {formData.ppe_screening_reference}</p>
                </div>
              </div>
            )}

            {!formData.ppe_screening_status && !isScreening && (
              <p className="text-sm text-muted-foreground italic">
                Aucun screening PPE effectué. Cliquez sur "Lancer le screening" pour vérifier.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Identity Document Section */}
        <AccordionItem value="identity" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Pièce d'identité</span>
              {formData.identity_verified && (
                <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Vérifié</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Type de document</Label>
              <Select
                value={formData.identity_document_type || ""}
                onValueChange={(value) => updateField("identity_document_type", value as LeadKYCData["identity_document_type"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cni">Carte Nationale d'Identité</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="permit">Permis de conduire</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Numéro</Label>
                <Input
                  placeholder="N° du document"
                  value={formData.identity_document_number || ""}
                  onChange={(e) => updateField("identity_document_number", e.target.value || null)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date d'expiration</Label>
                <Input
                  type="date"
                  value={formData.identity_expiry_date || ""}
                  onChange={(e) => updateField("identity_expiry_date", e.target.value || null)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="identity_verified" className="text-sm">Document vérifié</Label>
              <Switch
                id="identity_verified"
                checked={formData.identity_verified}
                onCheckedChange={(checked) => updateField("identity_verified", checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* AML Section */}
        <AccordionItem value="aml" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AML - Anti-Blanchiment</span>
              {formData.aml_verified && (
                <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Vérifié</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="aml_verified" className="text-sm">Vérification AML effectuée</Label>
              <Switch
                id="aml_verified"
                checked={formData.aml_verified}
                onCheckedChange={(checked) => updateField("aml_verified", checked)}
              />
            </div>

            {formData.aml_verified && formData.aml_verified_at && (
              <p className="text-xs text-muted-foreground">
                Vérifié le {format(new Date(formData.aml_verified_at), "dd MMMM yyyy", { locale: fr })}
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Niveau de risque</Label>
              <Select
                value={formData.aml_risk_level || ""}
                onValueChange={(value) => updateField("aml_risk_level", value as LeadKYCData["aml_risk_level"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Notes AML</Label>
              <Textarea
                placeholder="Observations, commentaires..."
                value={formData.aml_notes || ""}
                onChange={(e) => updateField("aml_notes", e.target.value || null)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button 
        className="w-full" 
        onClick={() => saveMutation.mutate(formData)}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Sauvegarder KYC
      </Button>
    </div>
  );
};
