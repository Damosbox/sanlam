import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Edit, Trash2, Eye, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { SurveyQuestionBuilder } from "./SurveyQuestionBuilder";

interface SurveyQuestion {
  id: string;
  type: "nps" | "rating" | "multiple_choice" | "text";
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyTemplate {
  id: string;
  name: string;
  description: string | null;
  target_audience: "client" | "broker" | "both";
  trigger_event: string;
  questions: SurveyQuestion[];
  is_active: boolean;
  created_at: string;
}

const TRIGGER_EVENTS = [
  { value: "subscription_created", label: "Souscription créée" },
  { value: "claim_closed", label: "Sinistre clôturé" },
  { value: "policy_renewed", label: "Police renouvelée" },
  { value: "quote_sent", label: "Devis envoyé" },
  { value: "monthly_review", label: "Revue mensuelle" },
];

export const AdminSurveyTemplates = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_audience: "client" as "client" | "broker" | "both",
    trigger_event: "subscription_created",
    questions: [] as SurveyQuestion[],
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["survey-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((t) => ({
        ...t,
        questions: (t.questions || []) as unknown as SurveyQuestion[],
      })) as SurveyTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("survey_templates").insert([{
        name: data.name,
        description: data.description || null,
        target_audience: data.target_audience,
        trigger_event: data.trigger_event,
        questions: JSON.parse(JSON.stringify(data.questions)),
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-templates"] });
      toast.success("Modèle créé avec succès");
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("survey_templates")
        .update({
          name: data.name,
          description: data.description || null,
          target_audience: data.target_audience,
          trigger_event: data.trigger_event,
          questions: JSON.parse(JSON.stringify(data.questions)),
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-templates"] });
      toast.success("Modèle mis à jour");
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("survey_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-templates"] });
      toast.success("Modèle supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      target_audience: "client",
      trigger_event: "subscription_created",
      questions: [],
      is_active: true,
    });
    setEditingTemplate(null);
    setIsOpen(false);
  };

  const handleEdit = (template: SurveyTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      target_audience: template.target_audience,
      trigger_event: template.trigger_event,
      questions: template.questions || [],
      is_active: template.is_active,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.trigger_event) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "client":
        return <Users className="w-4 h-4" />;
      case "broker":
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "client":
        return "Clients";
      case "broker":
        return "Intermédiaires";
      case "both":
        return "Tous";
      default:
        return audience;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Modèles d'enquêtes</h3>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingTemplate ? "Modifier le modèle" : "Créer un modèle d'enquête"}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Nom du modèle *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Enquête post-souscription"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'enquête..."
                />
              </div>

              <div className="space-y-2">
                <Label>Audience cible *</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value: "client" | "broker" | "both") =>
                    setFormData({ ...formData, target_audience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Clients uniquement</SelectItem>
                    <SelectItem value="broker">Intermédiaires uniquement</SelectItem>
                    <SelectItem value="both">Clients et intermédiaires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Événement déclencheur *</Label>
                <Select
                  value={formData.trigger_event}
                  onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Questions</Label>
                <SurveyQuestionBuilder
                  questions={formData.questions}
                  onChange={(questions) => setFormData({ ...formData, questions })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingTemplate ? "Mettre à jour" : "Créer"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getAudienceIcon(template.target_audience)}
                  <span>{getAudienceLabel(template.target_audience)}</span>
                </div>
                <span>•</span>
                <span>
                  {TRIGGER_EVENTS.find((e) => e.value === template.trigger_event)?.label ||
                    template.trigger_event}
                </span>
                <span>•</span>
                <span>{template.questions?.length || 0} questions</span>
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Aucun modèle d'enquête créé. Cliquez sur "Nouveau modèle" pour commencer.
          </Card>
        )}
      </div>
    </div>
  );
};
