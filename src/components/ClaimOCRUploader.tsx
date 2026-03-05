import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera } from "lucide-react";
import { CameraUploadButton } from "@/components/ui/CameraUploadButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedData {
  policy_number?: string;
  date?: string;
  type?: string;
  damage?: string;
  vehicle_plate?: string;
  location?: string;
  estimated_cost?: number;
  full_text?: string;
}

interface ClaimOCRUploaderProps {
  onDataExtracted: (data: ExtractedData) => void;
  claimType: "Auto" | "Habitation" | "Santé";
}

export const ClaimOCRUploader = ({ onDataExtracted, claimType }: ClaimOCRUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Return the full data URL (data:image/jpeg;base64,XXXXX)
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64Image = await fileToBase64(file);
      
      console.log('Sending OCR request for:', claimType);

      const { data, error } = await supabase.functions.invoke('ocr-claim', {
        body: { 
          imageBase64: base64Image,
          documentType: claimType
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data) {
        console.log('OCR data received:', data);
        toast.success("Document analysé avec succès");
        onDataExtracted(data);
      } else {
        throw new Error("Aucune donnée reçue");
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de l'analyse du document"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Scanner le document
        </CardTitle>
        <CardDescription>
          Prenez une photo ou uploadez votre constat, carte grise, facture ou devis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing ? (
          <div className="flex items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Analyse en cours...</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">JPG, PNG ou PDF (max 20MB)</p>
            <CameraUploadButton
              id="ocr-upload"
              accept="image/*,application/pdf"
              onFileSelected={(file) => {
                const dt = new DataTransfer();
                dt.items.add(file);
                const input = document.createElement("input");
                input.type = "file";
                Object.defineProperty(input, "files", { value: dt.files });
                handleFileChange({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>);
              }}
              disabled={isProcessing}
              uploadLabel="Uploader"
              cameraLabel="Scanner"
            />
          </>
        )}

        {previewUrl && (
          <div className="rounded-lg overflow-hidden border">
            <img 
              src={previewUrl} 
              alt="Document preview" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};