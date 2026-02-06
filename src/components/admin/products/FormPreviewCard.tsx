import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Type, Calendar, Hash, Mail, Phone, List, CheckSquare, Upload, DollarSign, Calculator, FileSignature } from "lucide-react";
import type { FormStructure, FormPhase, FormSubStep } from "@/components/admin/form-builder/types";
import { parseFormStructure } from "@/components/admin/form-builder/types";

interface FormPreviewCardProps {
  formName: string;
  steps: unknown; // Accept any format (old or new)
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

const phaseIcons: Record<string, React.ReactNode> = {
  cotation: <Calculator className="h-4 w-4" />,
  souscription: <FileSignature className="h-4 w-4" />,
};

export function FormPreviewCard({ formName, steps, category, productType }: FormPreviewCardProps) {
  // Parse structure (supports both old and new format)
  const structure: FormStructure = parseFormStructure(steps);

  // Count total fields and rules
  const totalFields = structure.phases.reduce((acc, phase) => {
    return acc + phase.steps.filter(s => s.type === "fields").reduce((sum, s) => sum + (s.fields?.length || 0), 0);
  }, 0);
  const totalRules = structure.phases.reduce((acc, phase) => {
    return acc + phase.steps.filter(s => s.type === "calculation_rules").length;
  }, 0);

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
          {structure.phases.length} phase{structure.phases.length > 1 ? "s" : ""} • {totalFields} champ{totalFields > 1 ? "s" : ""} • {totalRules} règle{totalRules > 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {structure.phases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune phase configurée</p>
        ) : (
          structure.phases.map((phase) => (
            <div key={phase.id} className="rounded-lg border bg-background p-4">
              {/* Phase header */}
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                <span className="text-lg">{phaseIcons[phase.id]}</span>
                {phase.name}
              </h4>

              {/* Sub-steps */}
              <div className="space-y-2">
                {phase.steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic ml-6">Aucune sous-étape</p>
                ) : (
                  phase.steps.map((substep, substepIndex) => (
                    <div key={substep.id} className="ml-6 pb-2 border-l border-muted pl-4">
                      {/* Calculation Rules Sub-step */}
                      {substep.type === "calculation_rules" && (
                        <div>
                          <h5 className="text-xs font-medium flex items-center gap-2">
                            <span>📐</span>
                            <span>{substep.title}</span>
                          </h5>
                          {substep.calculationRules && (
                            <div className="text-xs text-muted-foreground mt-1 ml-6 space-y-1">
                              {substep.calculationRules.baseFormula && (
                                <div className="text-[11px] font-mono">
                                  <span className="text-muted-foreground/70">Formule:</span> {substep.calculationRules.baseFormula}
                                </div>
                              )}
                              {substep.calculationRules.coefficients.length > 0 && (
                                <div className="text-[11px]">
                                  Coefficients: {substep.calculationRules.coefficients.length}
                                </div>
                              )}
                              {substep.calculationRules.taxes.length > 0 && (
                                <div className="text-[11px]">
                                  Taxes: {substep.calculationRules.taxes.length}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fields Sub-step */}
                      {substep.type === "fields" && (
                        <div>
                          <h5 className="text-xs font-medium flex items-center gap-2">
                            <span>📋</span>
                            <span>{substep.title}</span>
                            {substep.fields && substep.fields.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] ml-auto">
                                {substep.fields.length} champ{substep.fields.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </h5>
                          {substep.fields && substep.fields.length > 0 ? (
                            <ul className="text-[11px] text-muted-foreground mt-1 ml-6 space-y-1">
                              {substep.fields.slice(0, 4).map((field, fieldIndex) => (
                                <li key={field.id || fieldIndex} className="flex items-center gap-1">
                                  <span>{fieldTypeIcons[field.type] || <Type className="h-3 w-3" />}</span>
                                  <span>{field.label}</span>
                                  {field.required && <span className="text-destructive">*</span>}
                                </li>
                              ))}
                              {substep.fields.length > 4 && (
                                <li className="italic text-muted-foreground/60">
                                  + {substep.fields.length - 4} autres
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic ml-6">Aucun champ</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
