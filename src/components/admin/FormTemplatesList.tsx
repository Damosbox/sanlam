import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Edit, Trash2, Copy, Eye } from "lucide-react";

interface FormTemplatesListProps {
  onEdit: (template: any) => void;
}

export const FormTemplatesList = ({ onEdit }: FormTemplatesListProps) => {
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaires créés</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Étapes</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>B2C</TableHead>
              <TableHead>B2B</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant={template.category === "vie" ? "default" : "secondary"}>
                    {template.category === "vie" ? "Vie" : "Non-Vie"}
                  </Badge>
                </TableCell>
                <TableCell>{template.product_type}</TableCell>
                <TableCell>
                  {Object.keys(template.steps || {}).length} étape(s)
                </TableCell>
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
                      onClick={() => onEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateMutation.mutate(template)}
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
