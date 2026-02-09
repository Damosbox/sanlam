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
import { Save, Loader2 } from "lucide-react";
import {
  FormPhaseEditor,
  FormStructure,
  parseFormStructure,
  serializeFormStructure,
  createDefaultFormStructure,
} from "@/components/admin/form-builder";

interface FormEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string | null;
  duplicateFromId?: string | null;
  productCategory?: string;
  productType?: string;
  productName?: string;
  onFormSaved?: (formId: string) => void;
}

export function FormEditorDrawer({
  open,
  onOpenChange,
  formId,
  duplicateFromId,
  productCategory = "non-vie",
  productType = "Automobile",
  productName = "Nouveau formulaire",
  onFormSaved,
}: FormEditorDrawerProps) {
  const queryClient = useQueryClient();
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [structure, setStructure] = useState<FormStructure>(createDefaultFormStructure());
  const [loading, setLoading] = useState(false);

  // Determine source ID: edit existing or duplicate from another
  const sourceId = formId || duplicateFromId;
  const isDuplicating = !formId && !!duplicateFromId;

  useEffect(() => {
    if (open && sourceId) {
      loadFormData(sourceId, isDuplicating);
    } else if (open && !sourceId) {
      setFormName("");
      setDescription("");
      setStructure(createDefaultFormStructure());
    }
  }, [open, sourceId, isDuplicating]);

  const loadFormData = async (id: string, duplicate: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormName(duplicate ? `${data.name} (copie)` : data.name);
      setDescription(data.description || "");
      
      const parsedStructure = parseFormStructure(data.steps);
      setStructure(parsedStructure);
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error("Erreur lors du chargement du formulaire");
    } finally {
      setLoading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const serializedStructure = serializeFormStructure(structure);

      const formData = {
        name: formName || productName,
        category: (productCategory || "non-vie") as "vie" | "non-vie",
        product_type: productType || "Automobile",
        description,
        target_channels: ["B2C", "B2B"],
        steps: serializedStructure,
        is_active: false,
      };

      // When editing existing (not duplicating), update
      if (formId) {
        const { error } = await supabase
          .from("form_templates")
          .update(formData)
          .eq("id", formId);
        if (error) throw error;
        return formId;
      } else {
        // New form or duplicate → always insert
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
      toast.success(isDuplicating ? "Formulaire dupliqué" : "Formulaire enregistré");
      queryClient.invalidateQueries({ queryKey: ["form-templates"] });
      onFormSaved?.(savedFormId);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-6xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {formId
              ? "Modifier le formulaire"
              : isDuplicating
              ? "Dupliquer le formulaire"
              : "Créer un formulaire"}
          </SheetTitle>
          <SheetDescription>
            {formId 
              ? "Modifiez les phases (cotation et souscription) et les règles de calcul"
              : isDuplicating
              ? "Un nouveau formulaire sera créé à partir de la copie"
              : "Créez un nouveau formulaire avec cotation et souscription"
            }
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                  rows={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Structure du formulaire (Cotation → Souscription)
              </Label>
              <p className="text-sm text-muted-foreground">
                Configurez les étapes de cotation (avec règles de calcul) puis les étapes de souscription (champs client).
              </p>
              <FormPhaseEditor
                structure={structure}
                onChange={setStructure}
              />
            </div>

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
                {isDuplicating ? "Créer la copie" : "Enregistrer le formulaire"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
