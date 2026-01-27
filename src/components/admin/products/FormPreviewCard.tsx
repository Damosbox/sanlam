import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Type, Calendar, Hash, Mail, Phone, List, CheckSquare, Upload, DollarSign } from "lucide-react";

interface FieldConfig {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

interface FormStep {
  title: string;
  fields: FieldConfig[];
}

interface FormPreviewCardProps {
  formName: string;
  steps: Record<string, FormStep> | FormStep[];
  category?: string;
  productType?: string;
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  textarea: <FileText className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  phone: <Phone className="h-3 w-3" />,
  select: <List className="h-3 w-3" />,
  radio: <List className="h-3 w-3" />,
  checkbox: <CheckSquare className="h-3 w-3" />,
  file: <Upload className="h-3 w-3" />,
  currency: <DollarSign className="h-3 w-3" />,
};

export function FormPreviewCard({ formName, steps, category, productType }: FormPreviewCardProps) {
  // Normalize steps to array format
  const stepsArray: FormStep[] = Array.isArray(steps) 
    ? steps 
    : Object.values(steps || {});

  const totalFields = stepsArray.reduce((acc, step) => acc + (step.fields?.length || 0), 0);

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{formName}</CardTitle>
          <div className="flex gap-2">
            {category && (
              <Badge variant="outline" className="text-xs">
                {category === "vie" ? "Vie" : "Non-Vie"}
              </Badge>
            )}
            {productType && (
              <Badge variant="secondary" className="text-xs">
                {productType}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {stepsArray.length} étape{stepsArray.length > 1 ? "s" : ""} • {totalFields} champ{totalFields > 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stepsArray.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune étape configurée</p>
        ) : (
          stepsArray.map((step, stepIndex) => (
            <div key={stepIndex} className="rounded-md border bg-background p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {stepIndex + 1}
                </span>
                {step.title || `Étape ${stepIndex + 1}`}
              </h4>
              {step.fields && step.fields.length > 0 ? (
                <ul className="space-y-1">
                  {step.fields.slice(0, 5).map((field, fieldIndex) => (
                    <li key={field.id || fieldIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-muted-foreground/60">
                        {fieldTypeIcons[field.type] || <Type className="h-3 w-3" />}
                      </span>
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </li>
                  ))}
                  {step.fields.length > 5 && (
                    <li className="text-xs text-muted-foreground italic">
                      + {step.fields.length - 5} autres champs
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">Aucun champ</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
