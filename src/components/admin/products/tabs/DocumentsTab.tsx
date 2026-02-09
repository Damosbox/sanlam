import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductFormData } from "../ProductForm";

interface DocumentsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

const documentTypes = [
  { value: "conditions_generales", label: "Conditions générales" },
  { value: "attestation", label: "Attestation" },
  { value: "fiche_produit", label: "Fiche produit" },
  { value: "certificat", label: "Certificat" },
  { value: "autre", label: "Autre" },
];

const dynamicVariables: { code: string; description: string }[] = [
  { code: "{{nom}}", description: "Nom de famille du souscripteur" },
  { code: "{{prenom}}", description: "Prénom du souscripteur" },
  { code: "{{date}}", description: "Date de génération du document" },
  { code: "{{numero_police}}", description: "Numéro de police attribué" },
  { code: "{{montant}}", description: "Montant de la prime calculée" },
  { code: "{{signature}}", description: "Emplacement de la signature électronique" },
  { code: "{{adresse}}", description: "Adresse postale du souscripteur" },
  { code: "{{date_effet}}", description: "Date de début de couverture" },
  { code: "{{date_echeance}}", description: "Date de fin / échéance du contrat" },
];

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  variables: string[];
}

export function DocumentsTab({ formData, updateField }: DocumentsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentTemplate | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState<Partial<DocumentTemplate>>({
    name: "",
    type: "conditions_generales",
    variables: [],
  });

  const documents = (formData.document_templates || []) as DocumentTemplate[];

  const handleSaveDocument = () => {
    if (!newDoc.name) return;

    const doc: DocumentTemplate = {
      id: editingDoc?.id || crypto.randomUUID(),
      name: newDoc.name,
      type: newDoc.type || "autre",
      variables: newDoc.variables || [],
    };

    let updatedDocs: DocumentTemplate[];
    if (editingDoc) {
      updatedDocs = documents.map((d) => (d.id === editingDoc.id ? doc : d));
    } else {
      updatedDocs = [...documents, doc];
    }

    updateField("document_templates", updatedDocs);
    setIsDialogOpen(false);
    setEditingDoc(null);
    setNewDoc({ name: "", type: "conditions_generales", variables: [] });
  };

  const handleConfirmDelete = () => {
    if (!deletingDocId) return;
    updateField(
      "document_templates",
      documents.filter((d) => d.id !== deletingDocId)
    );
    setDeletingDocId(null);
  };

  const openEditDialog = (doc: DocumentTemplate) => {
    setEditingDoc(doc);
    setNewDoc(doc);
    setIsDialogOpen(true);
  };

  const toggleVariable = (variable: string) => {
    const variables = newDoc.variables || [];
    if (variables.includes(variable)) {
      setNewDoc({ ...newDoc, variables: variables.filter((v) => v !== variable) });
    } else {
      setNewDoc({ ...newDoc, variables: [...variables, variable] });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents du produit</CardTitle>
              <CardDescription>
                Configurez les templates de documents associés à ce produit.
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun document configuré. Ajoutez votre premier template.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => openEditDialog(doc)}
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {documentTypes.find((t) => t.value === doc.type)?.label || doc.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{doc.variables?.length || 0} variables</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingDocId(doc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc_name">Nom du document</Label>
              <Input
                id="doc_name"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                placeholder="Ex: Conditions générales Auto"
              />
            </div>

            <div className="space-y-2">
              <Label>Type de document</Label>
              <Select
                value={newDoc.type}
                onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Variables dynamiques</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sélectionnez les variables qui seront remplacées automatiquement lors de la génération du document.
              </p>
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {dynamicVariables.map((variable) => (
                    <Tooltip key={variable.code}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={newDoc.variables?.includes(variable.code) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleVariable(variable.code)}
                        >
                          {variable.code}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{variable.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDocument}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingDocId} onOpenChange={() => setDeletingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce template de document sera supprimé de la configuration du produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
