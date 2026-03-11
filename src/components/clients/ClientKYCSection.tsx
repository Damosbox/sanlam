import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, AlertTriangle, CheckCircle, FileCheck, Loader2, ScanLine, Ban } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PermissionGate } from "@/components/PermissionGate";

interface ClientKYCSectionProps {
  clientId: string;
}

interface KYCFormData {
  identity_verified: boolean;
  identity_document_type: string;
  identity_document_number: string;
  identity_expiry_date: string;
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
  screening_blocked: boolean | null;
  updated_at: string;
}

export const ClientKYCSection = ({ clientId }: ClientKYCSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    },
  });

  useEffect(() => {
    if (kycData) {
      reset({
        identity_verified: kycData.identity_verified || false,
        identity_document_type: kycData.identity_document_type || "",
        identity_document_number: kycData.identity_document_number || "",
        identity_expiry_date: kycData.identity_expiry_date || "",
      });
    }
  }, [kycData, reset]);

  // Auto-trigger screening after KYC save if identity is verified
  const triggerAutoScreening = async () => {
    if (!clientProfile?.first_name || !clientProfile?.last_name) return;
    
    try {
      await supabase.functions.invoke("screen-ppe", {
        body: {
          clientId,
          entityType: "client",
          firstName: clientProfile.first_name,
          lastName: clientProfile.last_name,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
    } catch (error) {
      console.error("Auto-screening error:", error);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: KYCFormData) => {
      const payload = {
        client_id: clientId,
        ...formData,
        identity_expiry_date: formData.identity_expiry_date || null,
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
    onSuccess: (_data, formData) => {
      queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
      toast({ title: "KYC enregistré" });
      
      // Auto-trigger screening if identity is verified with valid document
      if (formData.identity_verified && formData.identity_document_type && formData.identity_document_number) {
        triggerAutoScreening();
      }
    },
    onError: () => {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    },
  });

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOCRProcessing(true);
    try {
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
        const docTypeMap: Record<string, string> = {
          "CNI": "cni",
          "Passeport": "passport",
          "Permis de conduire": "permit",
          "Carte consulaire": "carte_consulaire",
        };
        
        setValue("identity_document_type", docTypeMap[extracted.documentType] || "cni");
        setValue("identity_document_number", extracted.documentNumber || "");
        setValue("identity_expiry_date", extracted.expiryDate || "");
        // Ne PAS auto-activer identity_verified — réservé compliance
        setValue("identity_verified", true);

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

  const onSubmit = (data: KYCFormData) => {
    saveMutation.mutate(data);
  };

  const identityVerified = watch("identity_verified");

  const screeningStatus = kycData?.ppe_screening_status || "pending";
  const screeningBlocked = kycData?.screening_blocked || false;

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>;
  }

  // Traffic light status for agents
  const getTrafficLight = () => {
    if (screeningStatus === "in_progress") {
      return { color: "bg-amber-100 text-amber-700", label: "Screening en cours", icon: Loader2 };
    }
    if (screeningStatus !== "completed") {
      return { color: "bg-amber-100 text-amber-700", label: "En attente de vérification", icon: AlertTriangle };
    }
    if (screeningBlocked) {
      return { color: "bg-red-100 text-red-700", label: "Blocage compliance", icon: Ban };
    }
    return { color: "bg-emerald-100 text-emerald-700", label: "Conforme", icon: CheckCircle };
  };

  const trafficLight = getTrafficLight();
  const TrafficIcon = trafficLight.icon;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Hidden file input for OCR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleOCRUpload}
      />

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
            <Badge className={`${trafficLight.color} gap-1`}>
              <TrafficIcon className={`h-3.5 w-3.5 ${screeningStatus === "in_progress" ? "animate-spin" : ""}`} />
              {trafficLight.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Blocking message */}
      {screeningBlocked && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertDescription>
            SanlamAllianz reviendra vers le client afin de compléter la transaction ou mettre à jour des informations sur sa fiche.
          </AlertDescription>
        </Alert>
      )}

      {/* Identity Verification with OCR */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Vérification d'identité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

          <PermissionGate 
            permission="kyc.trigger_screening"
            fallback={
              <div className="flex items-center justify-between">
                <Label className="text-sm">Identité vérifiée</Label>
                <Badge className={identityVerified ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                  {identityVerified ? "Oui" : "Non"}
                </Badge>
              </div>
            }
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm">Identité vérifiée</Label>
              <Switch
                checked={identityVerified}
                onCheckedChange={(v) => setValue("identity_verified", v)}
              />
            </div>
          </PermissionGate>

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

      {/* Screening LCB-FT - Traffic light only for agents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Screening LCB-FT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Traffic light badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {screeningStatus === "completed" 
                ? `Vérifié le ${kycData?.ppe_screening_date ? format(new Date(kycData.ppe_screening_date), "dd/MM/yyyy", { locale: fr }) : ""}`
                : "Le screening se lance automatiquement après validation de l'identité"}
            </span>
            <Badge className={`${trafficLight.color} gap-1`}>
              <TrafficIcon className={`h-3.5 w-3.5 ${screeningStatus === "in_progress" ? "animate-spin" : ""}`} />
              {trafficLight.label}
            </Badge>
          </div>

          {/* Manual trigger - only for compliance/admin */}
          <PermissionGate permission="kyc.trigger_screening">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!clientProfile?.first_name || !clientProfile?.last_name) return;
                await supabase.functions.invoke("screen-ppe", {
                  body: {
                    clientId,
                    entityType: "client",
                    firstName: clientProfile.first_name,
                    lastName: clientProfile.last_name,
                  },
                });
                queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
                toast({ title: "Screening relancé" });
              }}
            >
              Relancer le screening
            </Button>
          </PermissionGate>

          {/* Detailed results - only for compliance/admin */}
          <PermissionGate permission="kyc.view_results">
            {screeningStatus === "completed" && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Détails (réservé compliance)</p>
                
                {/* PPE Result */}
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">PPE</span>
                  </div>
                  {kycData?.is_ppe ? (
                    <div className="space-y-2">
                      <Badge className="bg-amber-100 text-amber-700 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        PPE Détecté
                      </Badge>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        {kycData.ppe_position && (
                          <div>
                            <span className="text-xs text-muted-foreground">Position:</span>
                            <p className="font-medium">{kycData.ppe_position}</p>
                          </div>
                        )}
                        {kycData.ppe_country && (
                          <div>
                            <span className="text-xs text-muted-foreground">Pays:</span>
                            <p className="font-medium">{kycData.ppe_country}</p>
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
                    {kycData?.aml_risk_level === "high" && <Badge className="bg-red-100 text-red-700">Risque Élevé</Badge>}
                    {kycData?.aml_risk_level === "medium" && <Badge className="bg-amber-100 text-amber-700">Risque Moyen</Badge>}
                    {kycData?.aml_risk_level === "low" && <Badge className="bg-emerald-100 text-emerald-700">Risque Faible</Badge>}
                  </div>
                  {kycData?.aml_notes && (
                    <p className="text-sm text-muted-foreground">{kycData.aml_notes}</p>
                  )}
                </div>
                
                {/* Screening metadata */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p>📄 Screening: {kycData?.ppe_screening_date && format(new Date(kycData.ppe_screening_date), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                  <p>Source: {kycData?.ppe_screening_source} • Réf: {kycData?.ppe_screening_reference}</p>
                </div>
              </div>
            )}
          </PermissionGate>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer KYC"}
      </Button>
    </form>
  );
};
