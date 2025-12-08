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
import { Shield, AlertTriangle, FileCheck, Save, Loader2 } from "lucide-react";
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
  
  const [formData, setFormData] = useState<Omit<LeadKYCData, "id">>({
    lead_id: leadId,
    is_ppe: false,
    ppe_position: null,
    ppe_country: null,
    ppe_relationship: null,
    aml_verified: false,
    aml_verified_at: null,
    aml_risk_level: null,
    aml_notes: null,
    identity_document_type: null,
    identity_document_number: null,
    identity_expiry_date: null,
    identity_verified: false,
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
    mutationFn: async (data: Omit<LeadKYCData, "id">) => {
      if (kycData?.id) {
        const { error } = await supabase
          .from("lead_kyc_compliance")
          .update({
            ...data,
            aml_verified_at: data.aml_verified && !kycData.aml_verified ? new Date().toISOString() : data.aml_verified_at,
          })
          .eq("id", kycData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_kyc_compliance")
          .insert({
            ...data,
            aml_verified_at: data.aml_verified ? new Date().toISOString() : null,
          });
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

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getComplianceStatus = () => {
    const issues = [];
    if (formData.is_ppe && !formData.ppe_position) issues.push("Position PPE manquante");
    if (!formData.identity_document_type) issues.push("Pièce d'identité manquante");
    if (!formData.aml_verified) issues.push("Vérification AML non effectuée");
    return issues;
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
        {/* PPE Section */}
        <AccordionItem value="ppe" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">PPE - Personne Politiquement Exposée</span>
              {formData.is_ppe && (
                <Badge variant="destructive" className="ml-2 text-xs">PPE</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_ppe" className="text-sm">Cette personne est-elle une PPE ?</Label>
              <Switch
                id="is_ppe"
                checked={formData.is_ppe}
                onCheckedChange={(checked) => updateField("is_ppe", checked)}
              />
            </div>

            {formData.is_ppe && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fonction/Poste</Label>
                  <Input
                    placeholder="Ex: Ministre, Député, Directeur..."
                    value={formData.ppe_position || ""}
                    onChange={(e) => updateField("ppe_position", e.target.value || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pays d'exercice</Label>
                  <Input
                    placeholder="Ex: Côte d'Ivoire"
                    value={formData.ppe_country || ""}
                    onChange={(e) => updateField("ppe_country", e.target.value || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lien de parenté (si proche d'une PPE)</Label>
                  <Input
                    placeholder="Ex: Conjoint, Enfant, Parent..."
                    value={formData.ppe_relationship || ""}
                    onChange={(e) => updateField("ppe_relationship", e.target.value || null)}
                  />
                </div>
              </>
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