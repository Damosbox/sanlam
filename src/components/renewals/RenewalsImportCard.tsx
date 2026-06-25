import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPTED = [".xlsx", ".xls"];
const MAX_MB = 10;

export function RenewalsImportCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);

  const validate = (f: File) => {
    const ok = ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!ok) {
      toast.error("Format non supporté. Utilisez .xlsx ou .xls");
      return false;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_MB} Mo)`);
      return false;
    }
    return true;
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (validate(f)) setFile(f);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      ["Police", "Client", "Téléphone", "Produit", "Agence", "Échéance", "Prime FCFA"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Renouvellements");
    XLSX.writeFile(wb, "modele_renouvellements.xlsx");
    toast.success("Modèle téléchargé");
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      toast.success(`Import simulé — ${rows.length} ligne(s) détectée(s)`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast.error("Lecture du fichier impossible");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Importer des renouvellements</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Chargez le fichier Excel produit par le système cœur d'assurance (.xlsx ou .xls).
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger le modèle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "w-full border-2 border-dashed rounded-lg px-4 py-5 sm:px-6 sm:py-10 text-center transition-colors",
            "hover:bg-muted/40",
            dragOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <Upload className="h-6 w-6 sm:h-7 sm:w-7 mx-auto mb-1.5 sm:mb-2 text-muted-foreground" />
          <p className="text-sm text-foreground">
            {file ? file.name : "Glissez ou cliquez pour sélectionner"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .xlsx, .xls · max {MAX_MB} Mo
          </p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          className="w-full"
          disabled={!file || importing}
          onClick={handleImport}
        >
          {importing ? "Import en cours…" : "Lancer l'import"}
        </Button>
      </CardContent>
    </Card>
  );
}