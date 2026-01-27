import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
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

const dynamicVariables = [
  "{{nom}}",
  "{{prenom}}",
  "{{date}}",
  "{{numero_police}}",
  "{{montant}}",
  "{{signature}}",
  "{{adresse}}",
  "{{date_effet}}",
  "{{date_echeance}}",
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

  const handleDeleteDocument = (id: string) => {
    updateField(
      "document_templates",
      documents.filter((d) => d.id !== id)
    );
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
                        handleDeleteDocument(doc.id);
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
              <div className="flex flex-wrap gap-2">
                {dynamicVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant={newDoc.variables?.includes(variable) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sélectionnez les variables qui seront utilisées dans ce document.
              </p>
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
    </>
  );
}
