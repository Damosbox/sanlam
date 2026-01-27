import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { FormStepEditor, FormStep } from "@/components/admin/FormStepEditor";
import { FormFieldLibrary, FieldConfig, FieldType } from "@/components/admin/FormFieldLibrary";
import { FormFieldEditor } from "@/components/admin/FormFieldEditor";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface FormEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string | null;
  productCategory: string;
  productType: string;
  productName: string;
  onFormSaved?: (formId: string) => void;
}

export function FormEditorDrawer({
  open,
  onOpenChange,
  formId,
  productCategory,
  productType,
  productName,
  onFormSaved,
}: FormEditorDrawerProps) {
  const queryClient = useQueryClient();
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<FormStep[]>([
    { title: "Informations personnelles", fields: [] },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing form data
  useEffect(() => {
    if (open && formId) {
      loadFormData();
    } else if (open && !formId) {
      // New form - set defaults based on product
      setFormName(`Formulaire ${productName}`);
      setDescription("");
      setSteps([{ title: "Informations personnelles", fields: [] }]);
      setCurrentStepIndex(0);
      setSelectedFieldId(null);
    }
  }, [open, formId]);

  const loadFormData = async () => {
    if (!formId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("id", formId)
        .single();

      if (error) throw error;

      setFormName(data.name);
      setDescription(data.description || "");
      const stepsData = data.steps as unknown as Record<string, FormStep>;
      const stepsArray = Object.values(stepsData || {});
      setSteps(stepsArray.length > 0 ? stepsArray : [{ title: "Étape 1", fields: [] }]);
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error("Erreur lors du chargement du formulaire");
    } finally {
      setLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stepsData = steps.reduce((acc, step, idx) => {
        acc[`step${idx + 1}`] = step;
        return acc;
      }, {} as Record<string, FormStep>);

      const formData = {
        name: formName,
        category: productCategory as "vie" | "non-vie",
        product_type: productType,
        description,
        target_channels: ["B2C", "B2B"],
        steps: JSON.parse(JSON.stringify(stepsData)),
        is_active: true,
      };

      if (formId) {
        const { error } = await supabase
          .from("form_templates")
          .update(formData)
          .eq("id", formId);
        if (error) throw error;
        return formId;
      } else {
        const { data, error } = await supabase
          .from("form_templates")
          .insert(formData)
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (savedFormId) => {
      toast.success("Formulaire enregistré");
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      onFormSaved?.(savedFormId);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const addStep = () => {
    setSteps([...steps, { title: `Étape ${steps.length + 1}`, fields: [] }]);
    setCurrentStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (currentStepIndex >= newSteps.length) {
      setCurrentStepIndex(newSteps.length - 1);
    }
  };

  const updateStepTitle = (index: number, title: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], title };
    setSteps(newSteps);
  };

  const addFieldToStep = (fieldType: FieldType) => {
    const newSteps = [...steps];
    const newField: FieldConfig = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: getDefaultLabel(fieldType),
      required: false,
    };
    newSteps[currentStepIndex].fields.push(newField);
    setSteps(newSteps);
    setSelectedFieldId(newField.id);
  };

  const getDefaultLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      text: "Champ texte",
      textarea: "Zone de texte",
      number: "Nombre",
      date: "Date",
      email: "Email",
      phone: "Téléphone",
      select: "Liste déroulante",
      radio: "Choix unique",
      checkbox: "Cases à cocher",
      file: "Fichier",
      currency: "Montant",
    };
    return labels[type] || "Nouveau champ";
  };

  const updateField = (fieldId: string, updates: Partial<FieldConfig>) => {
    const newSteps = steps.map((step) => ({
      ...step,
      fields: step.fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
    setSteps(newSteps);
  };

  const removeField = (fieldId: string) => {
    const newSteps = steps.map((step) => ({
      ...step,
      fields: step.fields.filter((field) => field.id !== fieldId),
    }));
    setSteps(newSteps);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newSteps = [...steps];
    const [removed] = newSteps[currentStepIndex].fields.splice(result.source.index, 1);
    newSteps[currentStepIndex].fields.splice(result.destination.index, 0, removed);
    setSteps(newSteps);
  };

  const selectedField = steps[currentStepIndex]?.fields.find(
    (f) => f.id === selectedFieldId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {formId ? "Modifier le formulaire" : "Créer un formulaire"}
          </SheetTitle>
          <SheetDescription>
            Formulaire de souscription pour {productName}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Form metadata */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nom du formulaire</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Formulaire Auto Premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du formulaire..."
                  rows={2}
                />
              </div>
            </div>

            {/* Steps tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Étapes du formulaire</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une étape
                </Button>
              </div>

              <Tabs
                value={String(currentStepIndex)}
                onValueChange={(v) => setCurrentStepIndex(Number(v))}
              >
                <TabsList className="w-full justify-start overflow-x-auto">
                  {steps.map((step, index) => (
                    <TabsTrigger
                      key={index}
                      value={String(index)}
                      className="flex items-center gap-2"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs">
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[100px]">{step.title}</span>
                      {steps.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(index);
                          }}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {steps.map((step, index) => (
                  <TabsContent key={index} value={String(index)} className="mt-4">
                    <div className="space-y-4">
                      <Input
                        value={step.title}
                        onChange={(e) => updateStepTitle(index, e.target.value)}
                        placeholder="Titre de l'étape"
                        className="font-medium"
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Field library */}
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Bibliothèque de champs
                          </Label>
                          <FormFieldLibrary onAddField={addFieldToStep} />
                        </div>

                        {/* Fields list with drag & drop */}
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Champs de l'étape
                          </Label>
                          <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="fields">
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="min-h-[200px] rounded-md border bg-muted/30 p-2 space-y-2"
                                >
                                  {step.fields.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                      Glissez des champs ici
                                    </p>
                                  ) : (
                                    step.fields.map((field, fieldIndex) => (
                                      <Draggable
                                        key={field.id}
                                        draggableId={field.id}
                                        index={fieldIndex}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`p-2 rounded border bg-background cursor-pointer ${
                                              selectedFieldId === field.id
                                                ? "ring-2 ring-primary"
                                                : ""
                                            }`}
                                            onClick={() => setSelectedFieldId(field.id)}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium">
                                                {field.label}
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeField(field.id);
                                                }}
                                                className="text-muted-foreground hover:text-destructive"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                              {field.type}
                                              {field.required && " • Requis"}
                                            </span>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </div>

                        {/* Field editor */}
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Configuration du champ
                          </Label>
                          {selectedField ? (
                            <FormFieldEditor
                              field={selectedField}
                              onUpdate={(updatedField) =>
                                updateField(selectedField.id, updatedField)
                              }
                              onDelete={() => removeField(selectedField.id)}
                            />
                          ) : (
                            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
                              Sélectionnez un champ pour le configurer
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formName.trim()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer le formulaire
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
