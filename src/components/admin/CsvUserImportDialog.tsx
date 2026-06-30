import { useState, useRef } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CsvRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  partnerType?: string;
  password: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

const VALID_ROLES = ["admin", "broker", "customer", "backoffice_crc", "backoffice_conformite"];
const VALID_PARTNER_TYPES = ["agent_mandataire", "courtier", "agent_general", "agent_sanlam", "banquier"];

function validateRow(row: CsvRow, index: number): string | null {
  if (!row.email || !row.email.includes("@")) return `Ligne ${index + 1}: email invalide`;
  if (!row.firstName?.trim()) return `Ligne ${index + 1}: prénom manquant`;
  if (!row.lastName?.trim()) return `Ligne ${index + 1}: nom manquant`;
  if (!VALID_ROLES.includes(row.role)) return `Ligne ${index + 1}: rôle invalide (${row.role})`;
  if (row.role === "broker" && (!row.partnerType || !VALID_PARTNER_TYPES.includes(row.partnerType))) {
    return `Ligne ${index + 1}: type partenaire requis pour le rôle broker`;
  }
  if (!row.password || row.password.length < 6) return `Ligne ${index + 1}: mot de passe < 6 caractères`;
  return null;
}

interface CsvUserImportDialogProps {
  onImportComplete: () => void;
}

export function CsvUserImportDialog({ onImportComplete }: CsvUserImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setRows([]);
    setErrors([]);
    setImporting(false);
    setProgress(0);
    setResults([]);
    setStep("upload");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: CsvRow[] = result.data.map((row: any) => ({
          email: (row.email || "").trim(),
          firstName: (row.firstName || row.first_name || row.prenom || "").trim(),
          lastName: (row.lastName || row.last_name || row.nom || "").trim(),
          role: (row.role || row.rôle || "customer").trim().toLowerCase(),
          partnerType: (row.partnerType || row.partner_type || row.type_partenaire || "").trim().toLowerCase() || undefined,
          password: (row.password || row.mot_de_passe || "").trim(),
        }));

        const validationErrors: string[] = [];
        parsed.forEach((row, i) => {
          const err = validateRow(row, i);
          if (err) validationErrors.push(err);
        });

        setRows(parsed);
        setErrors(validationErrors);
        setStep("preview");
      },
      error: () => {
        toast({ title: "Erreur", description: "Impossible de lire le fichier CSV", variant: "destructive" });
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    setStep("importing");
    setImporting(true);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { data, error } = await supabase.functions.invoke("create-user", {
          body: {
            email: row.email,
            password: row.password,
            firstName: row.firstName,
            lastName: row.lastName,
            role: row.role,
            partnerType: row.role === "broker" ? row.partnerType : null,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        importResults.push({ email: row.email, success: true });
      } catch (err: any) {
        importResults.push({ email: row.email, success: false, error: err.message || "Erreur inconnue" });
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
      setResults([...importResults]);
    }

    setImporting(false);
    setStep("done");
    onImportComplete();

    const successCount = importResults.filter((r) => r.success).length;
    toast({
      title: "Import terminé",
      description: `${successCount}/${importResults.length} utilisateurs créés avec succès`,
    });
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importer CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import d'utilisateurs par CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Colonnes attendues : <code>email</code>, <code>firstName</code>, <code>lastName</code>, <code>role</code>, <code>partnerType</code> (si broker), <code>password</code>
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choisir un fichier CSV
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{rows.length} ligne(s) détectée(s)</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={reset}>Annuler</Button>
                <Button size="sm" onClick={handleImport} disabled={errors.length > 0}>
                  Lancer l'import
                </Button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.length} erreur(s) de validation
                </div>
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{row.email}</TableCell>
                      <TableCell className="text-xs">{row.firstName}</TableCell>
                      <TableCell className="text-xs">{row.lastName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{row.role}</Badge></TableCell>
                      <TableCell className="text-xs">{row.partnerType || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 20 && <p className="text-xs text-muted-foreground p-2 text-center">… et {rows.length - 20} autres lignes</p>}
            </div>
          </div>
        )}

        {(step === "importing" || step === "done") && (
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center">
              {importing ? `Import en cours… ${progress}%` : "Import terminé"}
            </p>

            {step === "done" && (
              <div className="flex gap-4 justify-center">
                <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />{successCount} succès</Badge>
                {failCount > 0 && <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{failCount} échec(s)</Badge>}
              </div>
            )}

            {results.filter((r) => !r.success).length > 0 && (
              <div className="rounded-lg border overflow-x-auto max-h-40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter((r) => !r.success).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{r.email}</TableCell>
                        <TableCell className="text-xs text-destructive">{r.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {step === "done" && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setOpen(false); reset(); }}>Fermer</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
