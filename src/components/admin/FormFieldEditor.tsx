import { FieldConfig } from "./FormFieldLibrary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Lock, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OCR_DOCUMENT_TYPES, OCR_KEYS_BY_TYPE, OcrDocumentType } from "@/constants/ocrDocumentKeys";

interface FormFieldEditorProps {
  field: FieldConfig | null;
  onUpdate: (field: FieldConfig) => void;
  onDelete: () => void;
  allFields?: FieldConfig[]; // All fields in the current step for OCR mapping
  onGenerateOcrFields?: (documentType: OcrDocumentType) => void;
}

export const FormFieldEditor = ({ field, onUpdate, onDelete, allFields = [], onGenerateOcrFields }: FormFieldEditorProps) => {
  const navigate = useNavigate();

  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Sélectionnez un champ pour le modifier</p>
      </div>
    );
  }

  // Locked field — read-only view
  if (field.locked) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Champ verrouillé</h3>
          <Badge variant="secondary" className="text-xs">
            {field.sourceType === "ocr" ? "OCR" : "Règle de calcul"}
          </Badge>
        </div>
        <Separator />
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <p className="font-medium">{field.label}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <p>{field.type}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Requis</Label>
            <p>{field.required ? "Oui" : "Non"}</p>
          </div>
          {field.ocrDataKey && (
            <div>
              <Label className="text-xs text-muted-foreground">Clé OCR</Label>
              <Badge variant="outline">{field.ocrDataKey}</Badge>
            </div>
          )}
          {field.options && field.options.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Options</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {field.options.map((o, i) => (
                  <Badge key={i} variant="outline">{o}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {field.sourceType === "ocr"
            ? "Ce champ est généré automatiquement depuis la configuration OCR."
            : "Ce champ est généré automatiquement depuis la règle de calcul. Pour le modifier, éditez la règle dans l'espace Actuariat."}
        </p>
        {field.sourceType !== "ocr" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/admin/calc-rules")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Aller aux règles de calcul
          </Button>
        )}
      </div>
    );
  }

  const updateField = (updates: Partial<FieldConfig>) => {
    onUpdate({ ...field, ...updates });
  };

  const addOption = () => {
    const options = field.options || [];
    updateField({ options: [...options, `Option ${options.length + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    updateField({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    updateField({ options });
  };

  // OCR config helpers
  const handleOcrToggle = (enabled: boolean) => {
    if (enabled) {
      updateField({
        isOcr: true,
        ocrConfig: { documentType: "", mappings: [] },
      });
    } else {
      updateField({ isOcr: false, ocrConfig: undefined });
    }
  };

  const handleDocumentTypeChange = (docType: string) => {
    const keys = OCR_KEYS_BY_TYPE[docType as OcrDocumentType] || [];
    updateField({
      ocrConfig: {
        documentType: docType,
        mappings: keys.map((k) => ({ ocrKey: k.key, targetFieldId: undefined })),
      },
    });
  };

  const handleMappingChange = (ocrKey: string, targetFieldId: string) => {
    if (!field.ocrConfig) return;
    const mappings = field.ocrConfig.mappings.map((m) =>
      m.ocrKey === ocrKey ? { ...m, targetFieldId: targetFieldId || undefined } : m
    );
    updateField({ ocrConfig: { ...field.ocrConfig, mappings } });
  };

  // Other fields available for mapping (exclude the file field itself and locked OCR fields)
  const mappableFields = allFields.filter(
    (f) => f.id !== field.id && f.type !== "file"
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Propriétés du champ</h3>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="Nom du champ"
          />
        </div>

        <div>
          <Label htmlFor="field-id">ID (technique)</Label>
          <Input
            id="field-id"
            value={field.id}
            onChange={(e) => updateField({ id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            placeholder="identifiant_unique"
          />
        </div>

        <div>
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ""}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Texte d'aide..."
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="field-required">Champ requis</Label>
          <Switch
            id="field-required"
            checked={field.required || false}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>

        {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
          <div className="space-y-2">
            <Label>Options</Label>
            {field.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une option
            </Button>
          </div>
        )}

        {field.type === "text" && (
          <div className="space-y-2">
            <Label>Validation</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-length" className="text-xs">Min longueur</Label>
                <Input
                  id="min-length"
                  type="number"
                  value={field.validation?.minLength || ""}
                  onChange={(e) => updateField({
                    validation: { ...field.validation, minLength: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="max-length" className="text-xs">Max longueur</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={field.validation?.maxLength || ""}
                  onChange={(e) => updateField({
                    validation: { ...field.validation, maxLength: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {field.type === "number" && (
          <div className="space-y-2">
            <Label>Validation</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min-value" className="text-xs">Min</Label>
                <Input
                  id="min-value"
                  type="number"
                  value={field.validation?.min || ""}
                  onChange={(e) => updateField({
                    validation: { ...field.validation, min: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="max-value" className="text-xs">Max</Label>
                <Input
                  id="max-value"
                  type="number"
                  value={field.validation?.max || ""}
                  onChange={(e) => updateField({
                    validation: { ...field.validation, max: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {/* OCR Configuration Block — Only for file fields */}
        {field.type === "file" && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ocr-toggle" className="font-semibold text-sm">
                  Activer OCR
                </Label>
                <Switch
                  id="ocr-toggle"
                  checked={field.isOcr || false}
                  onCheckedChange={handleOcrToggle}
                />
              </div>

              {field.isOcr && (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type de document OCR</Label>
                    <Select
                      value={field.ocrConfig?.documentType || ""}
                      onValueChange={handleDocumentTypeChange}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner un type de document" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCR_DOCUMENT_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {field.ocrConfig?.documentType && field.ocrConfig.mappings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Mapping des clés OCR
                      </Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {field.ocrConfig.mappings.map((mapping) => {
                          const keyDef = OCR_KEYS_BY_TYPE[field.ocrConfig!.documentType as OcrDocumentType]?.find(
                            (k) => k.key === mapping.ocrKey
                          );
                          return (
                            <div key={mapping.ocrKey} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium truncate block">
                                  {keyDef?.label || mapping.ocrKey}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {mapping.ocrKey}
                                </span>
                              </div>
                              <Select
                                value={mapping.targetFieldId || "__none__"}
                                onValueChange={(v) => handleMappingChange(mapping.ocrKey, v === "__none__" ? "" : v)}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">— Non mappé —</SelectItem>
                                  {mappableFields.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      {f.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>

                      {onGenerateOcrFields && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => onGenerateOcrFields(field.ocrConfig!.documentType as OcrDocumentType)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Auto-créer les champs manquants
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
