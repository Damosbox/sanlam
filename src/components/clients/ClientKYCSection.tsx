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
import { Save, Shield, AlertTriangle, CheckCircle, FileCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
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
  is_ppe: boolean;
  ppe_position: string;
  ppe_country: string;
  ppe_relationship: string;
  aml_verified: boolean;
  aml_risk_level: string;
  aml_notes: string;
}

export const ClientKYCSection = ({ clientId }: ClientKYCSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kycData, isLoading } = useQuery({
    queryKey: ["client-kyc", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_kyc_compliance")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<KYCFormData>({
    defaultValues: {
      identity_verified: false,
      identity_document_type: "",
      identity_document_number: "",
      identity_expiry_date: "",
      is_ppe: false,
      ppe_position: "",
      ppe_country: "",
      ppe_relationship: "",
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
        is_ppe: kycData.is_ppe || false,
        ppe_position: kycData.ppe_position || "",
        ppe_country: kycData.ppe_country || "",
        ppe_relationship: kycData.ppe_relationship || "",
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

  const onSubmit = (data: KYCFormData) => {
    saveMutation.mutate(data);
  };

  const identityVerified = watch("identity_verified");
  const isPPE = watch("is_ppe");
  const amlVerified = watch("aml_verified");
  const amlRiskLevel = watch("aml_risk_level");

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

      {/* PPE Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Personne Politiquement Exposée (PPE)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Est une PPE ou proche de PPE</Label>
            <Switch
              checked={isPPE}
              onCheckedChange={(v) => setValue("is_ppe", v)}
            />
          </div>

          {isPPE && (
            <>
              <div>
                <Label className="text-xs">Position/Fonction</Label>
                <Input 
                  className="h-8 text-sm" 
                  placeholder="Ex: Ministre, Député, etc."
                  {...register("ppe_position")} 
                />
              </div>

              <div>
                <Label className="text-xs">Pays</Label>
                <Input 
                  className="h-8 text-sm" 
                  placeholder="Pays de la fonction"
                  {...register("ppe_country")} 
                />
              </div>

              <div>
                <Label className="text-xs">Relation (si proche)</Label>
                <Select 
                  value={watch("ppe_relationship")} 
                  onValueChange={(v) => setValue("ppe_relationship", v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lui_meme">Lui-même</SelectItem>
                    <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="enfant">Enfant</SelectItem>
                    <SelectItem value="associe">Associé proche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AML Verification */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Lutte Anti-Blanchiment (LCB-FT)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer KYC"}
      </Button>
    </form>
  );
};
