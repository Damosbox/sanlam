import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FormFieldLibrary, FieldConfig, FieldType } from "./FormFieldLibrary";
import { FormFieldEditor } from "./FormFieldEditor";
import { FormStep, FormStepEditor } from "./FormStepEditor";
import { Plus, Save, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const PRODUCT_TYPES = [
  { category: "vie", types: ["Épargne", "Retraite", "Études", "Prévoyance"] },
  { category: "non-vie", types: ["Automobile", "Habitation", "Santé", "Voyage", "Entreprise"] },
];

export const AdminFormBuilder = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [category, setCategory] = useState<"vie" | "non-vie">("non-vie");
  const [productType, setProductType] = useState("");
  const [description, setDescription] = useState("");
  const [targetChannels, setTargetChannels] = useState<string[]>(["B2C"]);
  const [steps, setSteps] = useState<FormStep[]>([
    { title: "Informations personnelles", fields: [] }
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { data: templates } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stepsData = steps.reduce((acc, step, idx) => {
        acc[`step${idx + 1}`] = step;
        return acc;
      }, {} as Record<string, FormStep>);

      const formData = {
        name: formName,
        category,
        product_type: productType,
        description,
        target_channels: JSON.parse(JSON.stringify(targetChannels)),
        steps: JSON.parse(JSON.stringify(stepsData)),
        is_active: false,
      };

      if (editingId) {
        const { error } = await supabase
          .from("form_templates")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("form_templates")
          .insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Formulaire enregistré");
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setCategory("non-vie");
    setProductType("");
    setDescription("");
    setTargetChannels(["B2C"]);
    setSteps([{ title: "Informations personnelles", fields: [] }]);
    setSelectedFieldId(null);
    setCurrentStepIndex(0);
  };

  const loadTemplate = (template: any) => {
    setEditingId(template.id);
    setFormName(template.name);
    setCategory(template.category);
    setProductType(template.product_type);
    setDescription(template.description || "");
    setTargetChannels(template.target_channels);
    
    const stepsArray = Object.values(template.steps || {}) as FormStep[];
    setSteps(stepsArray.length > 0 ? stepsArray : [{ title: "Étape 1", fields: [] }]);
    setCurrentStepIndex(0);
  };

  const addField = (type: FieldType) => {
    const newField: FieldConfig = {
      id: `field_${Date.now()}`,
      type,
      label: `Nouveau champ ${type}`,
      required: false,
    };

    if (type === "select" || type === "radio" || type === "checkbox") {
      newField.options = ["Option 1", "Option 2"];
    }

    const newSteps = [...steps];
    newSteps[currentStepIndex].fields.push(newField);
    setSteps(newSteps);
    setSelectedFieldId(newField.id);
  };

  const updateField = (field: FieldConfig) => {
    const newSteps = [...steps];
    const fieldIndex = newSteps[currentStepIndex].fields.findIndex(f => f.id === field.id);
    if (fieldIndex !== -1) {
      newSteps[currentStepIndex].fields[fieldIndex] = field;
      setSteps(newSteps);
    }
  };

  const deleteField = () => {
    if (!selectedFieldId) return;
    const newSteps = [...steps];
    newSteps[currentStepIndex].fields = newSteps[currentStepIndex].fields.filter(
      f => f.id !== selectedFieldId
    );
    setSteps(newSteps);
    setSelectedFieldId(null);
  };

  const addStep = () => {
    if (steps.length >= 3) {
      toast.error("Maximum 3 étapes autorisées");
      return;
    }
    setSteps([...steps, { title: `Étape ${steps.length + 1}`, fields: [] }]);
  };

  const updateStep = (index: number, step: FormStep) => {
    const newSteps = [...steps];
    newSteps[index] = step;
    setSteps(newSteps);
  };

  const selectedField = steps[currentStepIndex]?.fields.find(f => f.id === selectedFieldId) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Générateur de formulaires</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm}>Nouveau</Button>
          <Button onClick={() => saveMutation.mutate()}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {templates && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formulaires existants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => loadTemplate(template)}
                >
                  {template.name} - {template.product_type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration du formulaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom du formulaire</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Assurance Auto Premium"
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={(v: "vie" | "non-vie") => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vie">Assurance Vie</SelectItem>
                  <SelectItem value="non-vie">Assurance Non-Vie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Type de produit</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.find(p => p.category === category)?.types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du formulaire..."
            />
          </div>

          <div>
            <Label>Canaux de distribution</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={targetChannels.includes("B2C")}
                  onCheckedChange={(checked) => {
                    setTargetChannels(checked 
                      ? [...targetChannels, "B2C"]
                      : targetChannels.filter(c => c !== "B2C")
                    );
                  }}
                />
                <Label>B2C</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={targetChannels.includes("B2B")}
                  onCheckedChange={(checked) => {
                    setTargetChannels(checked 
                      ? [...targetChannels, "B2B"]
                      : targetChannels.filter(c => c !== "B2B")
                    );
                  }}
                />
                <Label>B2B</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Champs</CardTitle>
            </CardHeader>
            <CardContent>
              <FormFieldLibrary onAddField={addField} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Étapes du formulaire</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addStep}
                disabled={steps.length >= 3}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={`step-${currentStepIndex}`} onValueChange={(v) => setCurrentStepIndex(parseInt(v.split('-')[1]))}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                  {steps.map((_, idx) => (
                    <TabsTrigger key={idx} value={`step-${idx}`}>
                      Étape {idx + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {steps.map((step, idx) => (
                  <TabsContent key={idx} value={`step-${idx}`}>
                    <FormStepEditor
                      step={step}
                      stepIndex={idx}
                      onUpdateStep={(s) => updateStep(idx, s)}
                      onSelectField={(f) => setSelectedFieldId(f.id)}
                      selectedFieldId={selectedFieldId}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Propriétés</CardTitle>
            </CardHeader>
            <CardContent>
              <FormFieldEditor
                field={selectedField}
                onUpdate={updateField}
                onDelete={deleteField}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
