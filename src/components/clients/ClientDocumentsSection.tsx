import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ClientDocumentsSectionProps {
  clientId: string;
}

const documentTypes = [
  { value: "cni", label: "Carte Nationale d'Identité" },
  { value: "passport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "carte_grise", label: "Carte grise" },
  { value: "attestation_assurance", label: "Attestation d'assurance" },
  { value: "justificatif_domicile", label: "Justificatif de domicile" },
  { value: "rib", label: "RIB" },
  { value: "bulletin_salaire", label: "Bulletin de salaire" },
  { value: "contrat_travail", label: "Contrat de travail" },
  { value: "autre", label: "Autre document" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  verified: { label: "Vérifié", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expiré", color: "bg-gray-100 text-gray-700", icon: AlertTriangle },
};

export const ClientDocumentsSection = ({ clientId }: ClientDocumentsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedType) throw new Error("Fichier et type requis");
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("client-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          client_id: clientId,
          broker_id: userData.user.id,
          document_type: selectedType,
          document_name: selectedFile.name,
          file_url: urlData.publicUrl,
          file_size: selectedFile.size,
          expiry_date: expiryDate || null,
          status: "pending",
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      setSelectedFile(null);
      setSelectedType("");
      setExpiryDate("");
      toast({ title: "Document uploadé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur lors de l'upload", description: String(error), variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      toast({ title: "Document supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("client_documents")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: userData.user?.id,
        })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-documents", clientId] });
      toast({ title: "Document vérifié" });
    },
  });

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((d) => d.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Ajouter un document
          </h4>
          
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Type de document</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Fichier</Label>
              <Input
                type="file"
                className="h-9 text-sm"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            <div>
              <Label className="text-xs">Date d'expiration (optionnel)</Label>
              <Input
                type="date"
                className="h-9"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={!selectedFile || !selectedType || isUploading}
            >
              {isUploading ? "Upload en cours..." : "Uploader"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Documents ({documents.length})</h4>
        
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun document</p>
          </div>
        ) : (
          documents.map((doc: any) => {
            const statusConf = statusConfig[doc.status] || statusConfig.pending;
            const StatusIcon = statusConf.icon;
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
            
            return (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">{getDocumentTypeLabel(doc.document_type)}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`${isExpired ? statusConfig.expired.color : statusConf.color} text-xs gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {isExpired ? "Expiré" : statusConf.label}
                          </Badge>
                          {doc.expiry_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Exp: {format(new Date(doc.expiry_date), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {doc.file_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {doc.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600"
                          onClick={() => verifyMutation.mutate(doc.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
