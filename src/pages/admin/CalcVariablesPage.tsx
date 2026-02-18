import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Save, Variable } from "lucide-react";

const CATEGORIES = [
  { value: "vehicule", label: "Véhicule" },
  { value: "assure", label: "Assuré" },
  { value: "contrat", label: "Contrat" },
  { value: "bien", label: "Bien" },
  { value: "sante", label: "Santé" },
];

const TYPES = [
  { value: "text", label: "Texte" },
  { value: "number", label: "Nombre" },
  { value: "select", label: "Liste" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Oui/Non" },
];

interface CalcVariable {
  id: string;
  code: string;
  label: string;
  type: string;
  options: string[];
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  code: "",
  label: "",
  type: "text",
  options: [] as string[],
  category: "vehicule",
  description: "",
  is_active: true,
};

export default function CalcVariablesPage() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: variables = [], isLoading } = useQuery({
    queryKey: ["calculation-variables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_variables" as never)
        .select("*")
        .order("category")
        .order("code");
      if (error) throw error;
      return (data as unknown as CalcVariable[]) || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        label: form.label,
        type: form.type,
        options: form.type === "select" ? form.options : [],
        category: form.category,
        description: form.description || null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase
          .from("calculation_variables" as never)
          .update(payload as never)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calculation_variables" as never)
          .insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Variable mise à jour" : "Variable créée");
      queryClient.invalidateQueries({ queryKey: ["calculation-variables"] });
      setDrawerOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Erreur");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calculation_variables" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variable supprimée");
      queryClient.invalidateQueries({ queryKey: ["calculation-variables"] });
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (v: CalcVariable) => {
    setEditingId(v.id);
    setForm({
      code: v.code,
      label: v.label,
      type: v.type,
      options: (v.options as string[]) || [],
      category: v.category,
      description: v.description || "",
      is_active: v.is_active,
    });
    setDrawerOpen(true);
  };

  const filtered = filterCategory === "all"
    ? variables
    : variables.filter((v) => v.category === filterCategory);

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Variable className="h-6 w-6" />
            Catalogue de Variables
          </h1>
          <p className="text-muted-foreground">
            Variables réutilisables dans les règles de calcul.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Variable
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label className="text-sm">Catégorie :</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-sm">{v.code}</TableCell>
                <TableCell>{v.label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{v.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{categoryLabel(v.category)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={v.is_active ? "default" : "outline"}>
                    {v.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(v.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune variable trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? "Modifier la variable" : "Nouvelle variable"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Modifiez les propriétés de cette variable."
                : "Créez une variable réutilisable pour les règles de calcul."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  }))
                }
                placeholder="ex: puissance_fiscale"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="ex: Puissance fiscale"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === "select" && (
              <div className="space-y-2">
                <Label>Options (une par ligne)</Label>
                <Textarea
                  value={form.options.join("\n")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      options: e.target.value.split("\n").filter(Boolean),
                    }))
                  }
                  placeholder="essence&#10;diesel&#10;électrique"
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Aide contextuelle..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
            </div>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.code.trim() || !form.label.trim()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingId ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
