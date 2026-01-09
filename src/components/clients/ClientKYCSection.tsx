import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, AlertTriangle, CheckCircle, FileCheck, Search, Loader2, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientKYCSectionProps {
  clientId: string;
}

interface KYCFormData {
  identity_verified: boolean;
  identity_document_type: string;
  identity_document_number: string;
  identity_expiry_date: string;
  aml_verified: boolean;
  aml_risk_level: string;
  aml_notes: string;
}

interface KYCData {
  id: string;
  client_id: string;
  identity_verified: boolean | null;
  identity_document_type: string | null;
  identity_document_number: string | null;
  identity_expiry_date: string | null;
  is_ppe: boolean | null;
  ppe_position: string | null;
  ppe_country: string | null;
  ppe_relationship: string | null;
  ppe_screening_status: string | null;
  ppe_screening_date: string | null;
  ppe_screening_source: string | null;
  ppe_screening_reference: string | null;
  aml_verified: boolean | null;
  aml_risk_level: string | null;
  aml_notes: string | null;
  updated_at: string;
}

export const ClientKYCSection = ({ clientId }: ClientKYCSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScreening, setIsScreening] = useState(false);

  // Fetch client profile to get name for screening
  const { data: clientProfile } = useQuery({
    queryKey: ["client-profile", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: kycData, isLoading } = useQuery({
    queryKey: ["client-kyc", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_kyc_compliance")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return data as KYCData | null;
    },
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<KYCFormData>({
    defaultValues: {
      identity_verified: false,
      identity_document_type: "",
      identity_document_number: "",
      identity_expiry_date: "",
      aml_verified: false,
      aml_risk_level: "",
      aml_notes: "",
    },
  });

  useEffect(() => {
    if (kycData) {
      reset({
        identity_verified: kycData.identity_verified || false,
        identity_document_type: kycData.identity_document_type || "",
        identity_document_number: kycData.identity_document_number || "",
        identity_expiry_date: kycData.identity_expiry_date || "",
        aml_verified: kycData.aml_verified || false,
        aml_risk_level: kycData.aml_risk_level || "",
        aml_notes: kycData.aml_notes || "",
      });
    }
  }, [kycData, reset]);

  const saveMutation = useMutation({
    mutationFn: async (formData: KYCFormData) => {
      const payload = {
        client_id: clientId,
        ...formData,
        identity_expiry_date: formData.identity_expiry_date || null,
        aml_verified_at: formData.aml_verified ? new Date().toISOString() : null,
      };

      if (kycData) {
        const { error } = await supabase
          .from("client_kyc_compliance")
          .update(payload)
          .eq("client_id", clientId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_kyc_compliance")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
      toast({ title: "KYC enregistré" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    },
  });

  const handlePPEScreening = async () => {
    if (!clientProfile?.first_name || !clientProfile?.last_name) {
      toast({ 
        title: "Informations manquantes", 
        description: "Le nom du client est requis pour le screening",
        variant: "destructive" 
      });
      return;
    }

    setIsScreening(true);
    try {
      const { data, error } = await supabase.functions.invoke("screen-ppe", {
        body: {
          clientId,
          entityType: "client",
          firstName: clientProfile.first_name,
          lastName: clientProfile.last_name,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
      
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

  const onSubmit = (data: KYCFormData) => {
    saveMutation.mutate(data);
  };

  const identityVerified = watch("identity_verified");
  const amlVerified = watch("aml_verified");
  const amlRiskLevel = watch("aml_risk_level");

  // PPE data from screening (read-only)
  const isPPE = kycData?.is_ppe || false;
  const screeningStatus = kycData?.ppe_screening_status || "pending";
  const screeningDate = kycData?.ppe_screening_date;
  const screeningSource = kycData?.ppe_screening_source;
  const screeningReference = kycData?.ppe_screening_reference;

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>;
  }

  const getKYCStatus = () => {
    if (!identityVerified) return { label: "Incomplet", color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
    if (isPPE && !amlVerified) return { label: "Attention PPE", color: "bg-red-100 text-red-700", icon: AlertTriangle };
    if (amlRiskLevel === "high") return { label: "Risque élevé", color: "bg-red-100 text-red-700", icon: AlertTriangle };
    return { label: "Conforme", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
  };

  const status = getKYCStatus();
  const StatusIcon = status.icon;

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* KYC Status Summary */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Statut KYC</p>
                <p className="text-xs text-muted-foreground">
                  {kycData?.updated_at 
                    ? `Mis à jour le ${format(new Date(kycData.updated_at), "dd MMM yyyy", { locale: fr })}`
                    : "Non renseigné"}
                </p>
              </div>
            </div>
            <Badge className={`${status.color} gap-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Vérification d'identité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Identité vérifiée</Label>
            <Switch
              checked={identityVerified}
              onCheckedChange={(v) => setValue("identity_verified", v)}
            />
          </div>

          <div>
            <Label className="text-xs">Type de document</Label>
            <Select 
              value={watch("identity_document_type")} 
              onValueChange={(v) => setValue("identity_document_type", v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cni">Carte Nationale d'Identité</SelectItem>
                <SelectItem value="passport">Passeport</SelectItem>
                <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
                <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Numéro du document</Label>
            <Input className="h-8 text-sm" {...register("identity_document_number")} />
          </div>

          <div>
            <Label className="text-xs">Date d'expiration</Label>
            <Input type="date" className="h-8" {...register("identity_expiry_date")} />
          </div>
        </CardContent>
      </Card>

      {/* Conformité LCB-FT (PPE screening + AML) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Conformité LCB-FT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PPE Screening Section */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Screening PPE
                </span>
              </div>
              
              {/* Screening button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePPEScreening}
                disabled={isScreening}
                className="h-7 text-xs"
              >
                {isScreening ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Vérification...
                  </>
                ) : screeningStatus === "completed" ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Relancer
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Lancer le screening
                  </>
                )}
              </Button>
            </div>
            
            {/* Screening status display */}
            {screeningStatus === "pending" && !isScreening && (
              <div className="text-sm text-muted-foreground italic">
                Aucun screening effectué
              </div>
            )}

            {screeningStatus === "completed" && (
              <div className="space-y-2">
                {isPPE ? (
                  <>
                    <Badge className="bg-amber-100 text-amber-700 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      PPE Détecté
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {kycData?.ppe_position && (
                        <div>
                          <span className="text-xs text-muted-foreground">Position:</span>
                          <p className="font-medium">{kycData.ppe_position}</p>
                        </div>
                      )}
                      {kycData?.ppe_country && (
                        <div>
                          <span className="text-xs text-muted-foreground">Pays:</span>
                          <p className="font-medium">{kycData.ppe_country}</p>
                        </div>
                      )}
                      {kycData?.ppe_relationship && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground">Relation:</span>
                          <p className="font-medium">{getRelationshipLabel(kycData.ppe_relationship)}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Aucune PPE détectée</span>
                  </div>
                )}
                
                {/* Screening metadata */}
                <div className="mt-3 pt-2 border-t border-dashed text-xs text-muted-foreground">
                  <p>
                    📄 Screening effectué le {screeningDate && format(new Date(screeningDate), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                  <p>Source: {screeningSource} • Réf: {screeningReference}</p>
                </div>
              </div>
            )}
          </div>

          {/* AML Verification - Editable */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Vérification LCB-FT effectuée</Label>
              <Switch
                checked={amlVerified}
                onCheckedChange={(v) => setValue("aml_verified", v)}
              />
            </div>

            <div>
              <Label className="text-xs">Niveau de risque</Label>
              <Select 
                value={amlRiskLevel} 
                onValueChange={(v) => setValue("aml_risk_level", v)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Évaluer le risque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Notes / Observations</Label>
              <Textarea 
                className="text-sm resize-none" 
                rows={3}
                placeholder="Observations sur la vérification..."
                {...register("aml_notes")} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer KYC"}
      </Button>
    </form>
  );
};
