import { useState, useEffect, useRef } from "react";
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
import { Shield, AlertTriangle, FileCheck, Save, Loader2, Search, RefreshCw, CheckCircle, Camera, ScanLine } from "lucide-react";
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
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    mutationFn: async (data: Partial<LeadKYCData>) => {
      const payload = {
        lead_id: leadId,
        identity_document_type: data.identity_document_type,
        identity_document_number: data.identity_document_number,
        identity_expiry_date: data.identity_expiry_date,
        identity_verified: data.identity_verified,
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

  const handleLCBFTScreening = async () => {
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
      
      const result = data.result;
      const riskLabel = result.amlRiskLevel === 'high' ? 'Élevé' : result.amlRiskLevel === 'medium' ? 'Moyen' : 'Faible';
      
      toast({ 
        title: "Screening LCB-FT terminé",
        description: result.isPPE 
          ? `⚠️ PPE détecté • Risque AML: ${riskLabel}` 
          : `✓ Pas de PPE • Risque AML: ${riskLabel}`
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

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOCRProcessing(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("ocr-identity", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data.extracted) {
        const extracted = data.extracted;
        
        // Map document type
        const docTypeMap: Record<string, LeadKYCData["identity_document_type"]> = {
          "CNI": "cni",
          "Passeport": "passport",
          "Permis de conduire": "permit",
        };
        
        setFormData(prev => ({
          ...prev,
          identity_document_type: docTypeMap[extracted.documentType] || "other",
          identity_document_number: extracted.documentNumber || prev.identity_document_number,
          identity_expiry_date: extracted.expiryDate || prev.identity_expiry_date,
          identity_verified: true,
        }));

        toast({ 
          title: "Document analysé",
          description: `${extracted.firstName} ${extracted.lastName} - ${extracted.documentType}`
        });
      } else {
        toast({ 
          title: "Extraction incomplète",
          description: "Certaines informations n'ont pas pu être extraites",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({ 
        title: "Erreur OCR", 
        description: "Impossible d'analyser le document",
        variant: "destructive" 
      });
    } finally {
      setIsOCRProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getComplianceStatus = () => {
    const issues = [];
    if (!formData.identity_document_type) issues.push("Pièce d'identité manquante");
    if (formData.ppe_screening_status !== "completed") issues.push("Screening LCB-FT non effectué");
    return issues;
  };

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case "high": return <Badge className="bg-red-100 text-red-700">Risque Élevé</Badge>;
      case "medium": return <Badge className="bg-amber-100 text-amber-700">Risque Moyen</Badge>;
      case "low": return <Badge className="bg-emerald-100 text-emerald-700">Risque Faible</Badge>;
      default: return null;
    }
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
      {/* Hidden file input for OCR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOCRUpload}
      />

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

      <Accordion type="multiple" defaultValue={["identity", "lcbft"]} className="space-y-2">
        {/* Identity Document Section with OCR */}
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
            {/* OCR Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isOCRProcessing}
            >
              {isOCRProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4 mr-2" />
                  Scanner une pièce d'identité (OCR)
                </>
              )}
            </Button>

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

        {/* Unified LCB-FT Screening (PPE + AML) */}
        <AccordionItem value="lcbft" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Screening LCB-FT</span>
              {formData.ppe_screening_status === "completed" && (
                <>
                  {formData.is_ppe && (
                    <Badge variant="destructive" className="ml-2 text-xs">PPE</Badge>
                  )}
                  {getRiskBadge(formData.aml_risk_level)}
                </>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* Screening Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formData.ppe_screening_status === "completed" 
                  ? "Dernier screening effectué" 
                  : "Vérification PPE + Anti-blanchiment"}
              </div>
              <Button
                type="button"
                variant={formData.ppe_screening_status === "completed" ? "outline" : "default"}
                size="sm"
                onClick={handleLCBFTScreening}
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
              <div className="space-y-3">
                {/* PPE Result */}
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">PPE</span>
                  </div>
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
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Aucune PPE détectée</span>
                    </div>
                  )}
                </div>

                {/* AML Result */}
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase">Anti-Blanchiment</span>
                    </div>
                    {getRiskBadge(formData.aml_risk_level)}
                  </div>
                  {formData.aml_notes && (
                    <p className="text-sm text-muted-foreground">{formData.aml_notes}</p>
                  )}
                </div>
                
                {/* Screening metadata */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p>
                    📄 Screening: {formData.ppe_screening_date && format(new Date(formData.ppe_screening_date), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                  <p>Source: {formData.ppe_screening_source} • Réf: {formData.ppe_screening_reference}</p>
                </div>
              </div>
            )}

            {!formData.ppe_screening_status && !isScreening && (
              <p className="text-sm text-muted-foreground italic">
                Cliquez sur "Lancer le screening" pour effectuer la vérification PPE et Anti-blanchiment.
              </p>
            )}
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
