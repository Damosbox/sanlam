import { GripVertical, Type, Hash, Calendar, Mail, Phone, List, CheckSquare, Circle, Upload, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type FieldType = 
  | "text" 
  | "textarea" 
  | "number" 
  | "date" 
  | "email" 
  | "phone" 
  | "select" 
  | "radio" 
  | "checkbox" 
  | "file" 
  | "currency";

export interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf?: {
      fieldId: string;
      value: any;
    };
  };
  locked?: boolean;
  sourceType?: "calc_rule";
  sourceRuleId?: string;
}

const FIELD_TYPES = [
  { type: "text", label: "Texte", icon: Type },
  { type: "textarea", label: "Zone de texte", icon: Type },
  { type: "number", label: "Nombre", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Téléphone", icon: Phone },
  { type: "select", label: "Liste déroulante", icon: List },
  { type: "radio", label: "Choix unique", icon: Circle },
  { type: "checkbox", label: "Cases à cocher", icon: CheckSquare },
  { type: "file", label: "Fichier", icon: Upload },
  { type: "currency", label: "Montant", icon: DollarSign },
] as const;

interface FormFieldLibraryProps {
  onAddField: (type: FieldType) => void;
}

export const FormFieldLibrary = ({ onAddField }: FormFieldLibraryProps) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm mb-3">Bibliothèque de champs</h3>
      <div className="space-y-2">
        {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
          <Card
            key={type}
            className="cursor-move hover:bg-accent transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("fieldType", type);
            }}
            onClick={() => onAddField(type as FieldType)}
          >
            <CardContent className="p-3 flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
