import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, Calculator, FileText } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { FormSubStep, CalculationRules } from "./types";
import { FieldConfig, FieldType } from "../FormFieldLibrary";
import { CalculationRulesEditor } from "./CalculationRulesEditor";

interface FormSubStepEditorProps {
  step: FormSubStep;
  onUpdateStep: (step: FormSubStep) => void;
  onSelectField: (field: FieldConfig) => void;
  selectedFieldId: string | null;
  onRemoveField: (fieldId: string) => void;
  availableVariables?: string[];
}

export function FormSubStepEditor({
  step,
  onUpdateStep,
  onSelectField,
  selectedFieldId,
  onRemoveField,
  availableVariables = [],
}: FormSubStepEditorProps) {
  // Mise à jour du titre
  const updateTitle = (title: string) => {
    onUpdateStep({ ...step, title });
  };

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

        <CalculationRulesEditor
          rules={
            step.calculationRules || {
              baseFormula: "",
              coefficients: [],
              taxes: [],
              fees: [],
              variables: [],
            }
          }
          onChange={updateCalculationRules}
          availableVariables={availableVariables}
        />
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
        {(!step.fields || step.fields.length === 0) ? (
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
                  {step.fields.map((field, index) => (
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
