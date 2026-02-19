import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, Calculator, FileText, Lock, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { FormSubStep, CalculationRules } from "./types";
import { FieldConfig, FieldType } from "../FormFieldLibrary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormSubStepEditorProps {
  step: FormSubStep;
  onUpdateStep: (step: FormSubStep) => void;
  onSelectField: (field: FieldConfig) => void;
  selectedFieldId: string | null;
  onRemoveField: (fieldId: string) => void;
  availableVariables?: string[];
  lockedFields?: FieldConfig[];
}

export function FormSubStepEditor({
  step,
  onUpdateStep,
  onSelectField,
  selectedFieldId,
  onRemoveField,
  availableVariables = [],
  lockedFields = [],
}: FormSubStepEditorProps) {
  const navigate = useNavigate();

  // Mise à jour du titre
  const updateTitle = (title: string) => {
    onUpdateStep({ ...step, title });
  };

  // Fetch calc rules for linking
  const { data: calcRules = [] } = useQuery({
    queryKey: ["calculation-rules-for-form"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_rules")
        .select("id, name, type, usage_category")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Mise à jour des règles de calcul
  const updateCalculationRules = (rules: CalculationRules) => {
    onUpdateStep({ ...step, calculationRules: rules });
  };

  // Gestion du drag & drop pour les champs
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !step.fields) return;

    const fields = [...step.fields];
    const [removed] = fields.splice(result.source.index, 1);
    fields.splice(result.destination.index, 0, removed);
    onUpdateStep({ ...step, fields });
  };

  // Déplacer un champ
  const moveField = (index: number, direction: "up" | "down") => {
    if (!step.fields) return;
    const fields = [...step.fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
    onUpdateStep({ ...step, fields });
  };

  // Rendu pour le type "calculation_rules"
  if (step.type === "calculation_rules") {
    const linkedRuleId = (step.calculationRules as any)?.linkedRuleId || null;
    const linkedRule = calcRules.find((r) => r.id === linkedRuleId);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            Règles de calcul
          </Badge>
          <Input
            value={step.title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Titre de l'étape"
            className="font-medium flex-1"
          />
        </div>

        {calcRules.length === 0 ? (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Aucune règle de calcul n'est disponible. Vous devez d'abord en créer une.
              <Button
                variant="link"
                className="px-1 text-amber-800 underline"
                onClick={() => navigate("/admin/calc-rules")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Aller aux règles de calcul
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Règle de calcul liée</label>
              <Select
                value={linkedRuleId || "__none__"}
                onValueChange={(value) => {
                  updateCalculationRules({
                    ...(step.calculationRules || { baseFormula: "", coefficients: [], taxes: [], fees: [], variables: [] }),
                    linkedRuleId: value === "__none__" ? null : value,
                  } as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une règle..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune règle</SelectItem>
                  {calcRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name} ({rule.usage_category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {linkedRule && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Règle :</strong> {linkedRule.name}</p>
                <p><strong>Type :</strong> {linkedRule.type}</p>
                <p><strong>Catégorie :</strong> {linkedRule.usage_category}</p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/calc-rules")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Gérer les règles de calcul
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Rendu pour le type "fields"
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Champs
        </Badge>
        <Input
          value={step.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Titre de l'étape"
          className="font-medium flex-1"
        />
      </div>

      <div className="min-h-[200px] rounded-lg border-2 border-dashed border-border p-4">
        {/* Locked fields from calc rules */}
        {lockedFields.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-primary flex items-center gap-1">
              <Lock className="h-3 w-3" /> Champs de la règle de calcul
            </p>
            {lockedFields.map((field) => (
              <Card
                key={field.id}
                className={`border-l-4 border-l-primary/60 bg-primary/5 cursor-pointer ${
                  selectedFieldId === field.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onSelectField(field)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="h-4 w-4 text-primary/60 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Ce champ provient de la règle de calcul et ne peut pas être modifié
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{field.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.type} • Requis
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">Calcul</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(!step.fields || step.fields.length === 0) && lockedFields.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">
              Glissez des champs depuis la bibliothèque ou cliquez sur un type
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`step-${step.id}`}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {(step.fields || []).map((field, index) => (
                    <Draggable
                      key={field.id}
                      draggableId={field.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-shadow ${
                            selectedFieldId === field.id
                              ? "ring-2 ring-primary"
                              : ""
                          } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                          onClick={() => onSelectField(field)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveField(index, "up");
                                }}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveField(index, "down");
                                }}
                                disabled={index === (step.fields?.length || 0) - 1}
                              >
                                ↓
                              </Button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {field.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {field.type}
                                {field.required && " • Requis"}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveField(field.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
