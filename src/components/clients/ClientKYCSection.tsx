import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, AlertTriangle, CheckCircle, FileCheck, Search, Loader2, RefreshCw, ScanLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-kyc", clientId] });
      toast({ title: "KYC enregistré" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    },
  });

  const handleLCBFTScreening = async () => {
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
        const docTypeMap: Record<string, string> = {
          "CNI": "cni",
          "Passeport": "passport",
          "Permis de conduire": "permit",
          "Carte consulaire": "carte_consulaire",
        };
        
        setValue("identity_document_type", docTypeMap[extracted.documentType] || "cni");
        setValue("identity_document_number", extracted.documentNumber || "");
        setValue("identity_expiry_date", extracted.expiryDate || "");
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

  // PPE/AML data from screening (read-only)
  const isPPE = kycData?.is_ppe || false;
  const screeningStatus = kycData?.ppe_screening_status || "pending";
  const screeningDate = kycData?.ppe_screening_date;
  const screeningSource = kycData?.ppe_screening_source;
  const screeningReference = kycData?.ppe_screening_reference;
  const amlRiskLevel = kycData?.aml_risk_level;
  const amlNotes = kycData?.aml_notes;

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>;
  }

  const getKYCStatus = () => {
    if (!identityVerified) return { label: "Incomplet", color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
    if (screeningStatus !== "completed") return { label: "Screening requis", color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
    if (isPPE || amlRiskLevel === "high") return { label: "Risque élevé", color: "bg-red-100 text-red-700", icon: AlertTriangle };
    if (amlRiskLevel === "medium") return { label: "Risque moyen", color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
    return { label: "Conforme", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
  };

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case "high": return <Badge className="bg-red-100 text-red-700">Risque Élevé</Badge>;
      case "medium": return <Badge className="bg-amber-100 text-amber-700">Risque Moyen</Badge>;
      case "low": return <Badge className="bg-emerald-100 text-emerald-700">Risque Faible</Badge>;
      default: return null;
    }
  };

  const status = getKYCStatus();
  const StatusIcon = status.icon;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Hidden file input for OCR */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            <Badge className={`${status.color} gap-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification with OCR */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Vérification d'identité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* Unified LCB-FT Screening (PPE + AML) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Screening LCB-FT
            {screeningStatus === "completed" && (
              <div className="ml-auto flex gap-1">
                {isPPE && <Badge variant="destructive" className="text-xs">PPE</Badge>}
                {getRiskBadge(amlRiskLevel)}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Screening Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {screeningStatus === "completed" 
                ? "Dernier screening effectué" 
                : "Vérification PPE + Anti-blanchiment"}
            </div>
            <Button
              type="button"
              variant={screeningStatus === "completed" ? "outline" : "default"}
              size="sm"
              onClick={handleLCBFTScreening}
              disabled={isScreening}
            >
              {isScreening ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Vérification...
                </>
              ) : screeningStatus === "completed" ? (
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
          {screeningStatus === "completed" && (
            <div className="space-y-3">
              {/* PPE Result */}
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">PPE</span>
                </div>
                {isPPE ? (
                  <div className="space-y-2">
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
                  {getRiskBadge(amlRiskLevel)}
                </div>
                {amlNotes && (
                  <p className="text-sm text-muted-foreground">{amlNotes}</p>
                )}
              </div>
              
              {/* Screening metadata */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                <p>
                  📄 Screening: {screeningDate && format(new Date(screeningDate), "dd/MM/yyyy à HH:mm", { locale: fr })}
                </p>
                <p>Source: {screeningSource} • Réf: {screeningReference}</p>
              </div>
            </div>
          )}

          {screeningStatus !== "completed" && !isScreening && (
            <p className="text-sm text-muted-foreground italic">
              Cliquez sur "Lancer le screening" pour effectuer la vérification PPE et Anti-blanchiment.
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveMutation.isPending ? "Enregistrement..." : "Enregistrer KYC"}
      </Button>
    </form>
  );
};
