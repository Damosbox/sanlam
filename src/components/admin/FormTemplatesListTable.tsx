import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Edit, Trash2, Copy } from "lucide-react";
import { parseFormStructure } from "@/components/admin/form-builder";
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { exportToCsv, csvDate } from "@/lib/export-csv";

interface FormTemplatesListTableProps {
  onEdit: (formId: string) => void;
}

export const FormTemplatesListTable = ({ onEdit }: FormTemplatesListTableProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_desc");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deployments } = useQuery({
    queryKey: ["form-deployments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_deployments")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("form_templates")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast.success("Statut mis à jour");
    },
  });

  const toggleDeploymentMutation = useMutation({
    mutationFn: async ({ 
      templateId, 
      channel, 
      isActive 
    }: { 
      templateId: string; 
      channel: "B2C" | "B2B"; 
      isActive: boolean 
    }) => {
      if (isActive) {
        const { error } = await supabase
          .from("form_deployments")
          .insert({ 
            form_template_id: templateId, 
            channel, 
            is_active: true 
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("form_deployments")
          .delete()
          .eq("form_template_id", templateId)
          .eq("channel", channel);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-deployments"] });
      toast.success("Déploiement mis à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("form_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast.success("Formulaire supprimé");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { id, created_at, updated_at, ...templateData } = template;
      const { error } = await supabase
        .from("form_templates")
        .insert({
          ...templateData,
          name: `${templateData.name} (Copie)`,
          is_active: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      toast.success("Formulaire dupliqué");
    },
  });

  const isDeployed = (templateId: string, channel: "B2C" | "B2B") => {
    return deployments?.some(
      d => d.form_template_id === templateId && d.channel === channel && d.is_active
    ) || false;
  };

  const getStepCount = (template: any) => {
    const structure = parseFormStructure(template.steps);
    const totalSteps = structure.phases.reduce((acc, phase) => acc + phase.steps.length, 0);
    return totalSteps;
  };

  const productTypes = useMemo(
    () => Array.from(new Set((templates ?? []).map((t: any) => t.product_type).filter(Boolean))),
    [templates],
  );

  const templatesList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = (templates ?? []).filter((t: any) => {
      if (productFilter !== "all" && t.product_type !== productFilter) return false;
      if (!q) return true;
      return (t.name ?? "").toLowerCase().includes(q);
    });
    return [...arr].sort((a: any, b: any) => {
      switch (sortBy) {
        case "name_asc": return (a.name ?? "").localeCompare(b.name ?? "");
        case "name_desc": return (b.name ?? "").localeCompare(a.name ?? "");
        case "updated_asc": return +new Date(a.updated_at ?? a.created_at ?? 0) - +new Date(b.updated_at ?? b.created_at ?? 0);
        case "updated_desc":
        default: return +new Date(b.updated_at ?? b.created_at ?? 0) - +new Date(a.updated_at ?? a.created_at ?? 0);
      }
    });
  }, [templates, search, productFilter, sortBy]);

  const handleExport = () => {
    exportToCsv(
      "form-templates",
      ["Nom", "Catégorie", "Type", "Sous-étapes", "Actif", "Mis à jour"],
      templatesList.map((t: any) => [
        t.name ?? "", t.category ?? "", t.product_type ?? "",
        getStepCount(t), t.is_active ? "Oui" : "Non", csvDate(t.updated_at ?? t.created_at),
      ]),
    );
  };

  const { pageItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(
    templatesList,
    { storageKey: "admin-form-templates" },
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Chargement des formulaires...</div>
        </CardContent>
      </Card>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Aucun formulaire créé</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaires créés</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTableToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Rechercher un formulaire..." }}
          filters={[
            {
              id: "product", label: "Produit", value: productFilter, onChange: setProductFilter,
              options: [
                { value: "all", label: "Tous produits" },
                ...productTypes.map((p) => ({ value: p as string, label: p as string })),
              ],
            },
          ]}
          sort={{
            value: sortBy, onChange: setSortBy,
            options: [
              { value: "updated_desc", label: "Mise à jour récente" },
              { value: "updated_asc", label: "Mise à jour ancienne" },
              { value: "name_asc", label: "Nom A→Z" },
              { value: "name_desc", label: "Nom Z→A" },
            ],
          }}
          onExport={handleExport}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sous-étapes</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>B2C</TableHead>
              <TableHead>B2B</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant={template.category === "vie" ? "default" : "secondary"}>
                    {template.category === "vie" ? "Vie" : "Non-Vie"}
                  </Badge>
                </TableCell>
                <TableCell>{template.product_type}</TableCell>
                <TableCell>{getStepCount(template)}</TableCell>
                <TableCell>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: template.id, isActive: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={isDeployed(template.id, "B2C")}
                    onCheckedChange={(checked) =>
                      toggleDeploymentMutation.mutate({
                        templateId: template.id,
                        channel: "B2C",
                        isActive: checked,
                      })
                    }
                    disabled={!template.is_active}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={isDeployed(template.id, "B2B")}
                    onCheckedChange={(checked) =>
                      toggleDeploymentMutation.mutate({
                        templateId: template.id,
                        channel: "B2B",
                        isActive: checked,
                      })
                    }
                    disabled={!template.is_active}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template.id)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateMutation.mutate(template)}
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Supprimer ce formulaire ?")) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            setPage={setPage}
            setPageSize={setPageSize}
            itemLabel="formulaire"
          />
        </div>
      </CardContent>
    </Card>
  );
};
