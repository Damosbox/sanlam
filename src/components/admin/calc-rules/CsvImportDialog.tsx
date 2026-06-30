import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Upload, Bot, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedData {
  name?: string;
  description?: string;
  type?: string;
  usage_category?: string;
  usage_category_label?: string;
  base_formula?: string;
  parameters?: any[];
  formulas?: any[];
  taxes?: any[];
  fees?: any[];
  tables_ref?: any[];
  charges?: any[];
  packages?: any[];
  options?: any[];
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParsedData) => void;
}

export function CsvImportDialog({ open, onOpenChange, onApply }: CsvImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [csvContent, setCsvContent] = useState("");
  const [lineCount, setLineCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [method, setMethod] = useState<string>("");
  const [error, setError] = useState("");

  const reset = () => {
    setFileName("");
    setFileSize(0);
    setCsvContent("");
    setLineCount(0);
    setSectionCount(0);
    setResult(null);
    setWarnings([]);
    setMethod("");
    setError("");
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Veuillez sélectionner un fichier CSV", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setResult(null);
    setWarnings([]);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      setLineCount(lines.length);
      const sections = lines.filter((l) => /^\[([A-Z_]+)\]$/.test(l.trim())).length;
      setSectionCount(sections);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!csvContent) return;
    setParsing(true);
    setError("");
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("parse-calc-rule-csv", {
        body: { csvContent },
      });

      if (fnError) throw new Error(fnError.message || "Erreur d'analyse");
      if (!data?.success) throw new Error(data?.error || "Échec de l'analyse");

      setResult(data.data);
      setWarnings(data.warnings || []);
      setMethod(data.method || "");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse");
    } finally {
      setParsing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    onOpenChange(false);
    reset();
    toast({ title: "Données CSV appliquées avec succès" });
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const countItems = (arr?: any[]) => arr?.length || 0;

  const summaryItems = result
    ? [
        { label: "paramètres", count: countItems(result.parameters) },
        { label: "formules", count: countItems(result.formulas) },
        { label: "taxes", count: countItems(result.taxes) },
        { label: "frais", count: countItems(result.fees) },
        { label: "tables de référence", count: countItems(result.tables_ref) },
        { label: "chargements", count: countItems(result.charges) },
        { label: "packages", count: countItems(result.packages) },
        { label: "options", count: countItems(result.options) },
      ].filter((s) => s.count > 0)
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importer un fichier actuariel
          </DialogTitle>
          <DialogDescription>
            Importez un CSV pour pré-remplir les règles de calcul. L'IA analysera la structure automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file);
            }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Glissez un fichier CSV ici ou <span className="text-primary font-medium">cliquez pour sélectionner</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* File info */}
          {fileName && (
            <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">({(fileSize / 1024).toFixed(1)} Ko)</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reset}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {csvContent && !result && !error && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Aperçu : {lineCount} lignes{sectionCount > 0 ? `, ${sectionCount} sections détectées` : ""}
              </p>
              <Button onClick={handleAnalyze} disabled={parsing} className="w-full">
                {parsing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                {parsing ? "Analyse en cours..." : "Analyser avec l'IA"}
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Résultat de l'analyse</span>
                {method && (
                  <Badge variant="outline" className="text-xs">
                    {method === "deterministic" ? "Parser natif" : "IA"}
                  </Badge>
                )}
              </div>

              {/* General info */}
              {(result.name || result.usage_category) && (
                <div className="bg-muted/50 rounded-md px-3 py-2 text-sm space-y-1">
                  {result.name && <p><span className="text-muted-foreground">Nom :</span> {result.name}</p>}
                  {result.type && <p><span className="text-muted-foreground">Type :</span> {result.type}</p>}
                  {result.usage_category && <p><span className="text-muted-foreground">Catégorie :</span> {result.usage_category} {result.usage_category_label ? `(${result.usage_category_label})` : ""}</p>}
                </div>
              )}

              {/* Section counts */}
              <ul className="text-sm space-y-1">
                {summaryItems.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="text-green-600">•</span>
                    <span>{s.count} {s.label} détecté{s.count > 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ul>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                    {warnings.length} avertissement{warnings.length > 1 ? "s" : ""}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-yellow-600">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={!result}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
