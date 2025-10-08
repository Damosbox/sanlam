import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, FileText, Camera } from "lucide-react";

export const ClaimOCR = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process OCR
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('ocr-claim', {
        body: { imageBase64: base64, documentType: 'claim' }
      });

      if (error) throw error;

      setExtractedData(data);
      toast({
        title: "Document analysé",
        description: "Les informations ont été extraites avec succès",
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Déclaration de sinistre OCR</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Photographiez vos documents et laissez l'IA extraire les informations
        </p>

        <div className="space-y-4">
          <div>
            <Label>Document du sinistre</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Charger une photo
                </>
              )}
            </Button>
          </div>

          {previewUrl && (
            <div className="border rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Preview" className="w-full h-auto" />
            </div>
          )}
        </div>
      </Card>

      {extractedData && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Informations extraites</h3>
          </div>
          <div className="space-y-3 text-sm">
            {extractedData.claimDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Date du sinistre:</span>
                <span className="font-medium">{extractedData.claimDate}</span>
              </div>
            )}
            {extractedData.claimType && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{extractedData.claimType}</span>
              </div>
            )}
            {extractedData.location && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Lieu:</span>
                <span className="font-medium">{extractedData.location}</span>
              </div>
            )}
            {extractedData.estimatedAmount && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Montant estimé:</span>
                <span className="font-medium">{extractedData.estimatedAmount}</span>
              </div>
            )}
            {extractedData.description && (
              <div className="mt-4">
                <span className="text-muted-foreground block mb-2">Description:</span>
                <p className="bg-muted/50 p-3 rounded-lg">{extractedData.description}</p>
              </div>
            )}
            {extractedData.extractedText && (
              <div className="mt-4">
                <span className="text-muted-foreground block mb-2">Texte complet:</span>
                <p className="bg-muted/50 p-3 rounded-lg text-xs">{extractedData.extractedText}</p>
              </div>
            )}
          </div>
          <Button className="w-full mt-4">Confirmer et soumettre</Button>
        </Card>
      )}
    </div>
  );
};
