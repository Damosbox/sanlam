import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Download, 
  FileText, 
  FileCheck, 
  Car, 
  FileSpreadsheet,
  Loader2,
  FolderDown
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import JSZip from "jszip";

interface PolicyDocumentsDownloadProps {
  subscriptionId: string;
  policyNumber: string;
}

const documentTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  attestation: { label: "Attestation d'assurance", icon: FileCheck, color: "text-emerald-600" },
  conditions_generales: { label: "Conditions générales", icon: FileText, color: "text-blue-600" },
  carte_verte: { label: "Carte verte", icon: Car, color: "text-green-600" },
  facture: { label: "Facture", icon: FileSpreadsheet, color: "text-amber-600" },
  avenant: { label: "Avenant", icon: FileText, color: "text-purple-600" },
  certificat: { label: "Certificat", icon: FileCheck, color: "text-indigo-600" },
};

export const PolicyDocumentsDownload = ({ 
  subscriptionId, 
  policyNumber 
}: PolicyDocumentsDownloadProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["policy-documents", subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_documents")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDownload = async (doc: any) => {
    setDownloadingId(doc.id);
    try {
      if (doc.file_url) {
        // Download from storage
        const { data, error } = await supabase.storage
          .from("policy-documents")
          .download(doc.file_url);
        
        if (error) throw error;
        
        const url = URL.createObjectURL(data);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.document_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Document téléchargé");
      } else {
        toast.error("Fichier non disponible");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0) return;
    
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      for (const doc of documents) {
        if (doc.file_url) {
          const { data, error } = await supabase.storage
            .from("policy-documents")
            .download(doc.file_url);
          
          if (!error && data) {
            zip.file(doc.document_name, data);
          }
        }
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documents_${policyNumber}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Tous les documents téléchargés");
    } catch (error) {
      console.error("Error downloading all documents:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>Aucun document disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {documents.length} document{documents.length > 1 ? "s" : ""}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="gap-1.5 text-xs"
        >
          {downloadingAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FolderDown className="h-3.5 w-3.5" />
          )}
          Tout télécharger
        </Button>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const config = documentTypeConfig[doc.document_type] || {
            label: doc.document_type,
            icon: FileText,
            color: "text-muted-foreground"
          };
          const DocIcon = config.icon;

          return (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`${config.color}`}>
                  <DocIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {config.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {doc.generated_at && format(new Date(doc.generated_at), "dd MMM yyyy", { locale: fr })}
                    {doc.file_size && (
                      <span className="ml-2">
                        ({(doc.file_size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="shrink-0"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
