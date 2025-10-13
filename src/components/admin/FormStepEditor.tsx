import { useState } from "react";
import { FieldConfig, FieldType } from "./FormFieldLibrary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, MoveVertical } from "lucide-react";

export interface FormStep {
  title: string;
  fields: FieldConfig[];
}

interface FormStepEditorProps {
  step: FormStep;
  stepIndex: number;
  onUpdateStep: (step: FormStep) => void;
  onSelectField: (field: FieldConfig) => void;
  selectedFieldId: string | null;
}

export const FormStepEditor = ({
  step,
  stepIndex,
  onUpdateStep,
  onSelectField,
  selectedFieldId
}: FormStepEditorProps) => {
  const moveField = (index: number, direction: "up" | "down") => {
    const fields = [...step.fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
    onUpdateStep({ ...step, fields });
  };

  const deleteField = (index: number) => {
    const fields = step.fields.filter((_, i) => i !== index);
    onUpdateStep({ ...step, fields });
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          value={step.title}
          onChange={(e) => onUpdateStep({ ...step, title: e.target.value })}
          placeholder={`Étape ${stepIndex + 1}`}
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2 min-h-[200px] p-4 rounded-lg border-2 border-dashed border-border">
        {step.fields.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Glissez des champs ici ou cliquez sur un type de champ</p>
          </div>
        )}
        
        {step.fields.map((field, index) => (
          <Card
            key={field.id}
            className={`transition-shadow cursor-pointer ${
              selectedFieldId === field.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectField(field)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex flex-col gap-1">
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
                  disabled={index === step.fields.length - 1}
                >
                  ↓
                </Button>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{field.label}</p>
                <p className="text-xs text-muted-foreground">
                  {field.type} {field.required && "• Requis"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteField(index);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
