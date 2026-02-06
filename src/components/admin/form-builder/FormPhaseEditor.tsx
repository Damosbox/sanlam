import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Calculator,
  FileSignature,
  FileText,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormStructure, FormPhase, FormSubStep, StepType, createDefaultFormStructure } from "./types";
import { FormSubStepEditor } from "./FormSubStepEditor";
import { FormFieldLibrary, FieldConfig, FieldType } from "../FormFieldLibrary";
import { FormFieldEditor } from "../FormFieldEditor";

interface FormPhaseEditorProps {
  structure: FormStructure;
  onChange: (structure: FormStructure) => void;
}

export function FormPhaseEditor({ structure, onChange }: FormPhaseEditorProps) {
  const [activePhase, setActivePhase] = useState<"cotation" | "souscription">("cotation");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Trouver la phase active
  const currentPhase = structure.phases.find((p) => p.id === activePhase);
  const currentStep = currentPhase?.steps.find((s) => s.id === selectedStepId);
  const currentField = currentStep?.fields?.find((f) => f.id === selectedFieldId);

  // Auto-sélectionner la première étape si aucune n'est sélectionnée
  if (!selectedStepId && currentPhase && currentPhase.steps.length > 0) {
    setSelectedStepId(currentPhase.steps[0].id);
  }

  // Mise à jour d'une phase
  const updatePhase = (phaseId: string, updates: Partial<FormPhase>) => {
    onChange({
      ...structure,
      phases: structure.phases.map((p) =>
        p.id === phaseId ? { ...p, ...updates } : p
      ),
    });
  };

  // Ajouter une sous-étape
  const addSubStep = (phaseId: string, type: StepType) => {
    const phase = structure.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    const newStep: FormSubStep = {
      id: `step_${Date.now()}`,
      title: type === "calculation_rules" ? "Règles de calcul" : "Nouvelle étape",
      type,
      fields: type === "fields" ? [] : undefined,
      calculationRules:
        type === "calculation_rules"
          ? {
              baseFormula: "",
              coefficients: [],
              taxes: [],
              fees: [],
              variables: [],
            }
          : undefined,
    };

    updatePhase(phaseId, { steps: [...phase.steps, newStep] });
    setSelectedStepId(newStep.id);
  };

  // Supprimer une sous-étape
  const removeSubStep = (phaseId: string, stepId: string) => {
    const phase = structure.phases.find((p) => p.id === phaseId);
    if (!phase || phase.steps.length <= 1) return;

    updatePhase(phaseId, {
      steps: phase.steps.filter((s) => s.id !== stepId),
    });

    if (selectedStepId === stepId) {
      setSelectedStepId(phase.steps[0].id !== stepId ? phase.steps[0].id : phase.steps[1]?.id || null);
    }
  };

  // Mettre à jour une sous-étape
  const updateSubStep = (phaseId: string, stepId: string, updates: Partial<FormSubStep>) => {
    const phase = structure.phases.find((p) => p.id === phaseId);
    if (!phase) return;

    updatePhase(phaseId, {
      steps: phase.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    });
  };

  // Ajouter un champ à une étape
  const addFieldToStep = (fieldType: FieldType) => {
    if (!currentPhase || !selectedStepId) return;

    const step = currentPhase.steps.find((s) => s.id === selectedStepId);
    if (!step || step.type !== "fields") return;

    const newField: FieldConfig = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: getDefaultLabel(fieldType),
      required: false,
    };

    if (fieldType === "select" || fieldType === "radio" || fieldType === "checkbox") {
      newField.options = ["Option 1", "Option 2"];
    }

    updateSubStep(activePhase, selectedStepId, {
      fields: [...(step.fields || []), newField],
    });
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

  // Mettre à jour un champ
  const updateField = (updates: Partial<FieldConfig>) => {
    if (!currentPhase || !selectedStepId || !selectedFieldId) return;

    const step = currentPhase.steps.find((s) => s.id === selectedStepId);
    if (!step || !step.fields) return;

    updateSubStep(activePhase, selectedStepId, {
      fields: step.fields.map((f) =>
        f.id === selectedFieldId ? { ...f, ...updates } : f
      ),
    });
  };

  // Supprimer un champ
  const removeField = (fieldId: string) => {
    if (!currentPhase || !selectedStepId) return;

    const step = currentPhase.steps.find((s) => s.id === selectedStepId);
    if (!step || !step.fields) return;

    updateSubStep(activePhase, selectedStepId, {
      fields: step.fields.filter((f) => f.id !== fieldId),
    });

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Collecter les variables disponibles depuis les champs
  const getAvailableVariables = (): string[] => {
    const variables: string[] = [];
    structure.phases.forEach((phase) => {
      phase.steps.forEach((step) => {
        if (step.type === "fields" && step.fields) {
          step.fields.forEach((field) => {
            variables.push(field.id);
          });
        }
      });
    });
    return variables;
  };

  const getPhaseIcon = (phaseId: string) => {
    return phaseId === "cotation" ? (
      <Calculator className="h-4 w-4" />
    ) : (
      <FileSignature className="h-4 w-4" />
    );
  };

  const getStepIcon = (step: FormSubStep) => {
    return step.type === "calculation_rules" ? (
      <Calculator className="h-3.5 w-3.5" />
    ) : (
      <FileText className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[600px]">
      {/* Sidebar - Navigation des phases et étapes */}
      <div className="col-span-3 border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-3 border-b">
          <h3 className="font-semibold text-sm">Structure du formulaire</h3>
        </div>
        <ScrollArea className="h-[calc(100%-48px)]">
          <div className="p-2 space-y-2">
            {structure.phases.map((phase) => (
              <div key={phase.id} className="space-y-1">
                {/* Phase header */}
                <div
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                    activePhase === phase.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setActivePhase(phase.id);
                    if (phase.steps.length > 0) {
                      setSelectedStepId(phase.steps[0].id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getPhaseIcon(phase.id)}
                    <span className="font-medium text-sm">{phase.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {phase.steps.length}
                  </Badge>
                </div>

                {/* Sub-steps */}
                {activePhase === phase.id && (
                  <div className="ml-4 pl-2 border-l space-y-1">
                    {phase.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                          selectedStepId === step.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedStepId(step.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getStepIcon(step)}
                          <span className="text-sm truncate">{step.title}</span>
                        </div>
                        {phase.steps.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 opacity-0 group-hover:opacity-100 ${
                                  selectedStepId === step.id
                                    ? "text-primary-foreground hover:text-primary-foreground"
                                    : ""
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer cette étape ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Tous les champs
                                  de cette étape seront perdus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeSubStep(phase.id, step.id)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}

                    {/* Add step button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Ajouter une sous-étape
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => addSubStep(phase.id, "fields")}>
                          <FileText className="h-4 w-4 mr-2" />
                          Étape avec champs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => addSubStep(phase.id, "calculation_rules")}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Règles de calcul
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Éditeur principal */}
      <div className="col-span-6 border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentPhase && getPhaseIcon(currentPhase.id)}
            <span className="font-semibold text-sm">{currentPhase?.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {currentStep?.title || "Sélectionnez une étape"}
            </span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100%-48px)] p-4">
          {currentStep ? (
            <FormSubStepEditor
              step={currentStep}
              onUpdateStep={(updated) =>
                updateSubStep(activePhase, currentStep.id, updated)
              }
              onSelectField={(field) => setSelectedFieldId(field.id)}
              selectedFieldId={selectedFieldId}
              onRemoveField={removeField}
              availableVariables={getAvailableVariables()}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Sélectionnez une étape à éditer</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Panneau de droite - Bibliothèque ou Éditeur de champ */}
      <div className="col-span-3 space-y-4">
        {/* Bibliothèque de champs (visible si étape de type "fields") */}
        {currentStep?.type === "fields" && (
          <Card className="h-[280px]">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Bibliothèque de champs</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[200px]">
                <FormFieldLibrary onAddField={addFieldToStep} />
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Éditeur de champ */}
        <Card className={currentStep?.type === "fields" ? "h-[300px]" : "h-[580px]"}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className={currentStep?.type === "fields" ? "h-[240px]" : "h-[520px]"}>
              {currentField ? (
                <FormFieldEditor
                  field={currentField}
                  onUpdate={updateField}
                  onDelete={() => removeField(currentField.id)}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  <p>Sélectionnez un champ à configurer</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
