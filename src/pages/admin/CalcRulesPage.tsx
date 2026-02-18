import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, Copy, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CalcRuleEditor } from "@/components/admin/calc-rules/CalcRuleEditor";
import type { CalcRule } from "@/components/admin/calc-rules/types";

const emptyRule: Omit<CalcRule, "id" | "created_at" | "updated_at"> = {
  name: "",
  description: "",
  type: "non-vie",
  usage_category: "",
  usage_category_label: "",
  parameters: [],
  formulas: [],
  rules: {},
  taxes: [],
  fees: [],
  tables_ref: [],
  base_formula: "",
  is_active: true,
  created_by: null,
};

export default function CalcRulesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CalcRule | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["calculation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CalcRule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (rule: Partial<CalcRule> & { id?: string }) => {
      const payload: Record<string, unknown> = {
        name: rule.name,
        description: rule.description,
        type: rule.type,
        usage_category: rule.usage_category,
        usage_category_label: rule.usage_category_label,
        parameters: JSON.parse(JSON.stringify(rule.parameters || [])),
        formulas: JSON.parse(JSON.stringify(rule.formulas || [])),
        rules: JSON.parse(JSON.stringify(rule.rules || {})),
        taxes: JSON.parse(JSON.stringify(rule.taxes || [])),
        fees: JSON.parse(JSON.stringify(rule.fees || [])),
        tables_ref: JSON.parse(JSON.stringify(rule.tables_ref || [])),
        base_formula: rule.base_formula,
        is_active: rule.is_active,
      };
      if (rule.id) {
        const { error } = await supabase.from("calculation_rules").update(payload as any).eq("id", rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("calculation_rules").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculation-rules"] });
      toast({ title: "Règle sauvegardée" });
      setEditorOpen(false);
      setEditingRule(null);
    },
    onError: () => toast({ title: "Erreur de sauvegarde", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calculation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculation-rules"] });
      toast({ title: "Règle supprimée" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("calculation_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calculation-rules"] }),
  });

  const handleDuplicate = (rule: CalcRule) => {
    setEditingRule({
      ...rule,
      id: undefined as any,
      name: `${rule.name} (copie)`,
    });
    setEditorOpen(true);
  };

  const filtered = rules.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.usage_category.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Règles de Calcul</h1>
          <p className="text-muted-foreground">Gérez les règles actuarielles par catégorie d'usage</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setEditorOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="vie">Vie</SelectItem>
            <SelectItem value="non-vie">Non-Vie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Catégorie d'usage</TableHead>
              <TableHead>Paramètres</TableHead>
              <TableHead>Formules</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune règle trouvée</TableCell></TableRow>
            ) : (
              filtered.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant={rule.type === "vie" ? "default" : "secondary"}>
                      {rule.type === "vie" ? "Vie" : "Non-Vie"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{rule.usage_category}</span>
                    {rule.usage_category_label && (
                      <span className="text-muted-foreground text-xs ml-2">({rule.usage_category_label})</span>
                    )}
                  </TableCell>
                  <TableCell>{(rule.parameters as any[])?.length || 0}</TableCell>
                  <TableCell>{(rule.formulas as any[])?.length || 0}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: rule.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setEditorOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(rule)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingRule?.id ? "Modifier la règle" : "Nouvelle règle de calcul"}</SheetTitle>
          </SheetHeader>
          <CalcRuleEditor
            rule={editingRule}
            onSave={(data) => saveMutation.mutate(data)}
            isSaving={saveMutation.isPending}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
