import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy, Pencil, Eye, FileText, AlertCircle, Search } from "lucide-react";
import { ProductFormData } from "../ProductForm";
import { FormPreviewCard } from "../FormPreviewCard";
import { FormEditorDrawer } from "../FormEditorDrawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SubscriptionFieldsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export function SubscriptionFieldsTab({ formData, updateField }: SubscriptionFieldsTabProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { data: formTemplates } = useQuery({
    queryKey: ["form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const linkedForm = formTemplates?.find((f) => f.id === formData.subscription_form_id);

  const handleCreateNew = () => {
    setEditingFormId(null);
    setDuplicatingFormId(null);
    setEditorOpen(true);
  };

  const handleEdit = () => {
    if (formData.subscription_form_id) {
      setEditingFormId(formData.subscription_form_id);
      setDuplicatingFormId(null);
      setEditorOpen(true);
    }
  };

  const handleDuplicate = () => {
    if (!linkedForm) return;
    setEditingFormId(null);
    setDuplicatingFormId(linkedForm.id);
    setEditorOpen(true);
  };

  const handleFormSaved = (formId: string) => {
    updateField("subscription_form_id", formId);
  };

  const suggestedForms = formTemplates?.filter(
    (f) => f.category === formData.category || f.product_type === formData.product_type
  );
  const otherForms = formTemplates?.filter(
    (f) => f.category !== formData.category && f.product_type !== formData.product_type
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulaire de souscription
          </CardTitle>
          <CardDescription>
            Liez ou créez un formulaire pour définir le parcours de cotation et souscription de ce produit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form selection - Combobox */}
          <div className="space-y-3">
            <Label>Formulaire lié</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                >
                  {linkedForm ? linkedForm.name : "Sélectionner un formulaire..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un formulaire..." />
                  <CommandList>
                    <CommandEmpty>Aucun formulaire trouvé.</CommandEmpty>
                    <CommandItem
                      value="__none__"
                      onSelect={() => {
                        updateField("subscription_form_id", null);
                        setComboboxOpen(false);
                      }}
                    >
                      <span className="text-muted-foreground">Aucun formulaire</span>
                    </CommandItem>
                    {suggestedForms && suggestedForms.length > 0 && (
                      <CommandGroup heading="Formulaires suggérés">
                        {suggestedForms.map((form) => (
                          <CommandItem
                            key={form.id}
                            value={form.name}
                            onSelect={() => {
                              updateField("subscription_form_id", form.id);
                              setComboboxOpen(false);
                            }}
                          >
                            <span>{form.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({form.category} - {form.product_type})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {otherForms && otherForms.length > 0 && (
                      <CommandGroup heading="Autres formulaires">
                        {otherForms.map((form) => (
                          <CommandItem
                            key={form.id}
                            value={form.name}
                            onSelect={() => {
                              updateField("subscription_form_id", form.id);
                              setComboboxOpen(false);
                            }}
                          >
                            <span>{form.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({form.category} - {form.product_type})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un formulaire
            </Button>
            
            {linkedForm && (
              <>
                <Button variant="outline" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </Button>
                <Button variant="outline" onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </>
            )}
          </div>

          {/* No form warning */}
          {!formData.subscription_form_id && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun formulaire n'est lié à ce produit. Les clients ne pourront pas souscrire sans formulaire de cotation.
              </AlertDescription>
            </Alert>
          )}

          {/* Form preview */}
          {linkedForm && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Aperçu du formulaire
              </Label>
              <FormPreviewCard
                formName={linkedForm.name}
                steps={linkedForm.steps as any}
                category={linkedForm.category}
                productType={linkedForm.product_type}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <Card className="bg-accent/50 border-accent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            💡 Contenu du formulaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Le formulaire de souscription contient deux phases principales :
          </p>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>Phase Cotation</strong> — Collecte des informations produit et 
                <span className="text-primary font-medium"> règles de calcul de prime</span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <div>
                <strong>Phase Souscription</strong> — Informations client (identité, coordonnées, paiement)
              </div>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Les règles de calcul (formule, coefficients, taxes) sont configurées directement dans le formulaire, 
            dans la phase Cotation.
          </p>
        </CardContent>
      </Card>

      {/* Form editor drawer */}
      <FormEditorDrawer
        open={editorOpen}
        onOpenChange={setEditorOpen}
        formId={editingFormId}
        duplicateFromId={duplicatingFormId}
        productCategory={formData.category}
        productType={formData.product_type}
        productName={formData.name || "Nouveau produit"}
        onFormSaved={handleFormSaved}
      />
    </div>
  );
}
