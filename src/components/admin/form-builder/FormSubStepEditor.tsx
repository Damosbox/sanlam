import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, Calculator, FileText, Lock, ExternalLink, ChevronDown, ChevronRight, FileSearch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [ocrGroupsOpen, setOcrGroupsOpen] = useState<Record<string, boolean>>({});

  const updateTitle = (title: string) => {
    onUpdateStep({ ...step, title });
  };

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

  const updateCalculationRules = (rules: CalculationRules) => {
    onUpdateStep({ ...step, calculationRules: rules });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !step.fields) return;
    const fields = [...step.fields];
    const [removed] = fields.splice(result.source.index, 1);
    fields.splice(result.destination.index, 0, removed);
    onUpdateStep({ ...step, fields });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (!step.fields) return;
    const fields = [...step.fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
    onUpdateStep({ ...step, fields });
  };

  // Calculation rules step
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

  // Separate regular fields from OCR fields
  const allFields = step.fields || [];
  const regularFields = allFields.filter((f) => f.sourceType !== "ocr");
  const ocrFields = allFields.filter((f) => f.sourceType === "ocr");

  // Group OCR fields by their parent file field
  const ocrGroups: { parentField: FieldConfig | null; fields: FieldConfig[] }[] = [];
  if (ocrFields.length > 0) {
    // Find file fields with ocrConfig in regular fields
    const fileFields = regularFields.filter((f) => f.type === "file" && f.isOcr && f.ocrConfig);
    
    if (fileFields.length > 0) {
      for (const fileField of fileFields) {
        const docType = fileField.ocrConfig?.documentType;
        const mappedKeys = (fileField.ocrConfig?.mappings || []).map((m) => m.ocrKey);
        const groupFields = ocrFields.filter(
          (f) => f.ocrDataKey && mappedKeys.includes(f.ocrDataKey)
        );
        if (groupFields.length > 0) {
          ocrGroups.push({ parentField: fileField, fields: groupFields });
        }
      }
      // Any remaining OCR fields not matched to a parent
      const groupedIds = new Set(ocrGroups.flatMap((g) => g.fields.map((f) => f.id)));
      const ungrouped = ocrFields.filter((f) => !groupedIds.has(f.id));
      if (ungrouped.length > 0) {
        ocrGroups.push({ parentField: null, fields: ungrouped });
      }
    } else {
      ocrGroups.push({ parentField: null, fields: ocrFields });
    }
  }

  const toggleOcrGroup = (key: string) => {
    setOcrGroupsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderFieldCard = (field: FieldConfig, index: number, isDraggable: boolean) => {
    if (isDraggable) {
      return (
        <Draggable key={field.id} draggableId={field.id} index={index}>
          {(provided, snapshot) => (
            <Card
              ref={provided.innerRef}
              {...provided.draggableProps}
              className={`transition-shadow ${
                selectedFieldId === field.id ? "ring-2 ring-primary" : ""
              } ${snapshot.isDragging ? "shadow-lg" : ""}`}
              onClick={() => onSelectField(field)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{field.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {field.type}{field.required && " • Requis"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </Draggable>
      );
    }

    // Non-draggable OCR field card (inside collapsible)
    return (
      <Card
        key={field.id}
        className={`transition-shadow ${selectedFieldId === field.id ? "ring-2 ring-primary" : ""}`}
        onClick={() => onSelectField(field)}
      >
        <CardContent className="p-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">{field.label}</p>
            <p className="text-[11px] text-muted-foreground">{field.type}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  };

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
                    <p className="text-xs text-muted-foreground">{field.type} • Requis</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">Calcul</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {allFields.length === 0 && lockedFields.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">
              Glissez des champs depuis la bibliothèque ou cliquez sur un type
            </p>
          </div>
        ) : (
          <>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId={`step-${step.id}`}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {regularFields.map((field, index) => renderFieldCard(field, index, true))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* OCR grouped fields in collapsibles */}
            {ocrGroups.map((group, gi) => {
              const groupKey = group.parentField?.id || `ocr-group-${gi}`;
              const isOpen = ocrGroupsOpen[groupKey] ?? false;
              const docType = group.parentField?.ocrConfig?.documentType || "OCR";
              const parentLabel = group.parentField?.label || "Document OCR";

              return (
                <Collapsible
                  key={groupKey}
                  open={isOpen}
                  onOpenChange={() => toggleOcrGroup(groupKey)}
                  className="mt-3"
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-muted/60 hover:bg-muted transition-colors text-left">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <FileSearch className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">
                        {parentLabel}
                      </span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {docType}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {group.fields.length} champs
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 pt-2 space-y-1.5">
                    {group.fields.map((field, fi) => renderFieldCard(field, fi, false))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
