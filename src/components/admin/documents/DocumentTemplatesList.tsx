import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocumentTemplateEditor } from "./DocumentTemplateEditor";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string;
  content: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  contrat: "Contrat",
  attestation: "Attestation",
  avenant: "Avenant",
  autre: "Autre",
};

export function DocumentTemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les templates", variant: "destructive" });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (data: { name: string; description: string; category: string; type: string; content: string; is_active: boolean }) => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("document_templates")
          .update({ name: data.name, description: data.description, category: data.category, type: data.type, content: data.content, is_active: data.is_active })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Template mis à jour" });
      } else {
        const { error } = await supabase
          .from("document_templates")
          .insert({ name: data.name, description: data.description, category: data.category, type: data.type, content: data.content, is_active: data.is_active });
        if (error) throw error;
        toast({ title: "Template créé" });
      }
      setEditing(null);
      setCreating(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce template ?")) return;
    const { error } = await supabase.from("document_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template supprimé" });
      fetchTemplates();
    }
  };

  if (creating || editing) {
    return (
      <DocumentTemplateEditor
        initialData={editing ? { id: editing.id, name: editing.name, description: editing.description || "", category: editing.category || "autre", type: editing.type, content: editing.content || "", is_active: editing.is_active ?? true } : undefined}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(false); }}
        saving={saving}
      />
    );
  }

  const filtered = filterCategory === "all" ? templates : templates.filter((t) => (t.category || t.type) === filterCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Toutes catégories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Aucun template trouvé</div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABELS[t.category || t.type] || t.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Actif" : "Inactif"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString("fr-FR") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
