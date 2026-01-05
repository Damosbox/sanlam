import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Clock, RefreshCw, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

interface SurveyRule {
  id: string;
  survey_template_id: string;
  name: string;
  trigger_delay_hours: number;
  reminder_delays: number[];
  max_reminders: number;
  channels: string[];
  is_active: boolean;
  created_at: string;
  survey_templates?: {
    name: string;
  };
}

const DELAY_OPTIONS = [
  { value: 1, label: "1 heure" },
  { value: 2, label: "2 heures" },
  { value: 24, label: "1 jour (J+1)" },
  { value: 48, label: "2 jours (J+2)" },
  { value: 72, label: "3 jours (J+3)" },
  { value: 168, label: "1 semaine" },
];

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "whatsapp", label: "WhatsApp", icon: Phone },
];

export const AdminSurveyRules = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SurveyRule | null>(null);
  const [formData, setFormData] = useState({
    survey_template_id: "",
    name: "",
    trigger_delay_hours: 1,
    reminder_delays: [24, 72] as number[],
    max_reminders: 2,
    channels: ["email"] as string[],
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ["survey-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_templates")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["survey-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_rules")
        .select("*, survey_templates(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SurveyRule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("survey_rules").insert({
        survey_template_id: data.survey_template_id,
        name: data.name,
        trigger_delay_hours: data.trigger_delay_hours,
        reminder_delays: data.reminder_delays,
        max_reminders: data.max_reminders,
        channels: data.channels,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-rules"] });
      toast.success("Règle créée avec succès");
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("survey_rules")
        .update({
          survey_template_id: data.survey_template_id,
          name: data.name,
          trigger_delay_hours: data.trigger_delay_hours,
          reminder_delays: data.reminder_delays,
          max_reminders: data.max_reminders,
          channels: data.channels,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-rules"] });
      toast.success("Règle mise à jour");
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("survey_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-rules"] });
      toast.success("Règle supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const resetForm = () => {
    setFormData({
      survey_template_id: "",
      name: "",
      trigger_delay_hours: 1,
      reminder_delays: [24, 72],
      max_reminders: 2,
      channels: ["email"],
      is_active: true,
    });
    setEditingRule(null);
    setIsOpen(false);
  };

  const handleEdit = (rule: SurveyRule) => {
    setEditingRule(rule);
    setFormData({
      survey_template_id: rule.survey_template_id,
      name: rule.name,
      trigger_delay_hours: rule.trigger_delay_hours,
      reminder_delays: rule.reminder_delays || [24, 72],
      max_reminders: rule.max_reminders,
      channels: rule.channels || ["email"],
      is_active: rule.is_active,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.survey_template_id) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleChannel = (channel: string) => {
    if (formData.channels.includes(channel)) {
      setFormData({
        ...formData,
        channels: formData.channels.filter((c) => c !== channel),
      });
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel],
      });
    }
  };

  const toggleReminderDelay = (delay: number) => {
    if (formData.reminder_delays.includes(delay)) {
      setFormData({
        ...formData,
        reminder_delays: formData.reminder_delays.filter((d) => d !== delay),
      });
    } else {
      setFormData({
        ...formData,
        reminder_delays: [...formData.reminder_delays, delay].sort((a, b) => a - b),
      });
    }
  };

  const formatDelay = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    return `J+${Math.floor(hours / 24)}`;
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Règles de déclenchement</h3>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle règle
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingRule ? "Modifier la règle" : "Créer une règle de déclenchement"}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Nom de la règle *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Envoi 1h après souscription"
                />
              </div>

              <div className="space-y-2">
                <Label>Modèle d'enquête *</Label>
                <Select
                  value={formData.survey_template_id}
                  onValueChange={(value) => setFormData({ ...formData, survey_template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Délai d'envoi initial</Label>
                <Select
                  value={formData.trigger_delay_hours.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trigger_delay_hours: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELAY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Délais de relance</Label>
                <div className="flex flex-wrap gap-2">
                  {DELAY_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`delay-${option.value}`}
                        checked={formData.reminder_delays.includes(option.value)}
                        onCheckedChange={() => toggleReminderDelay(option.value)}
                      />
                      <label htmlFor={`delay-${option.value}`} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre max de relances</Label>
                <Select
                  value={formData.max_reminders.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, max_reminders: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 0 ? "(pas de relance)" : num === 1 ? "relance" : "relances"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canaux d'envoi</Label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.value}`}
                        checked={formData.channels.includes(channel.value)}
                        onCheckedChange={() => toggleChannel(channel.value)}
                      />
                      <label
                        htmlFor={`channel-${channel.value}`}
                        className="text-sm flex items-center gap-1"
                      >
                        <channel.icon className="w-4 h-4" />
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
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
                  {editingRule ? "Mettre à jour" : "Créer"}
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
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {rule.survey_templates?.name}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Envoi: {formatDelay(rule.trigger_delay_hours)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    Relances: {rule.reminder_delays?.map(formatDelay).join(", ") || "Aucune"}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {rule.channels?.map((channel) => {
                    const ch = CHANNELS.find((c) => c.value === channel);
                    return ch ? <ch.icon key={channel} className="w-4 h-4" /> : null;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules?.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Aucune règle configurée. Créez d'abord un modèle d'enquête, puis ajoutez une règle.
          </Card>
        )}
      </div>
    </div>
  );
};
