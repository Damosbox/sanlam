import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Copy, Trash2, FileText, AlertCircle, Search, ExternalLink } from "lucide-react";
import { FormEditorDrawer } from "../FormEditorDrawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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

interface FormsTabProps {
  productId?: string;
  productCategory?: string;
  productType?: string;
  productName?: string;
}

interface ProductFormLink {
  id: string;
  product_id: string;
  form_template_id: string;
  calc_rule_id: string | null;
  channel: string;
  is_active: boolean;
  display_order: number;
}

export function FormsTab({ productId, productCategory, productType, productName }: FormsTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Fetch linked forms for this product
  const { data: linkedForms = [] } = useQuery({
    queryKey: ["product-forms", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_forms")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data as ProductFormLink[];
    },
    enabled: !!productId,
  });

  // Fetch all form templates
  const { data: formTemplates = [] } = useQuery({
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

  // Fetch all calc rules
  const { data: calcRules = [] } = useQuery({
    queryKey: ["calculation-rules-list"],
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

  // Add link mutation
  const addLinkMutation = useMutation({
    mutationFn: async (formTemplateId: string) => {
      const { error } = await supabase.from("product_forms").insert({
        product_id: productId!,
        form_template_id: formTemplateId,
        channel: "b2b",
        display_order: linkedForms.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-forms", productId] });
      toast({ title: "Formulaire lié avec succès" });
    },
    onError: (error: any) => {
      const isDuplicate = error?.code === "23505";
      toast({
        title: isDuplicate ? "Formulaire déjà lié" : "Erreur",
        description: isDuplicate ? "Ce formulaire est déjà lié à ce produit." : "Impossible de lier le formulaire.",
        variant: "destructive",
      });
    },
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductFormLink> }) => {
      const { error } = await supabase.from("product_forms").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-forms", productId] });
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-forms", productId] });
      toast({ title: "Lien supprimé" });
    },
  });

  const getFormName = (formTemplateId: string) =>
    formTemplates.find((f) => f.id === formTemplateId)?.name || "Formulaire inconnu";

  const getCalcRuleName = (calcRuleId: string | null) =>
    calcRules.find((r) => r.id === calcRuleId)?.name || null;

  // Forms not yet linked
  const availableForms = formTemplates.filter(
    (f) => !linkedForms.some((lf) => lf.form_template_id === f.id)
  );

  const handleCreateNew = () => {
    setEditingFormId(null);
    setDuplicatingFormId(null);
    setEditorOpen(true);
  };

  const handleEdit = (formId: string) => {
    setEditingFormId(formId);
    setDuplicatingFormId(null);
    setEditorOpen(true);
  };

  const handleDuplicate = (formId: string) => {
    setEditingFormId(null);
    setDuplicatingFormId(formId);
    setEditorOpen(true);
  };

  const handleFormSaved = (formId: string) => {
    // Auto-link the new/duplicated form
    if (productId) {
      addLinkMutation.mutate(formId);
    }
  };

  if (!productId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Veuillez d'abord enregistrer les informations générales du produit avant de lier des formulaires.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulaires liés
          </CardTitle>
          <CardDescription>
            Liez un ou plusieurs formulaires de souscription à ce produit, avec canal et règle de calcul pour chacun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linked forms list */}
          {linkedForms.length > 0 ? (
            <div className="space-y-3">
              {linkedForms.map((link) => (
                <Card key={link.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{getFormName(link.form_template_id)}</h4>
                          {!link.is_active && <Badge variant="secondary">Inactif</Badge>}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* Channel */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Canal</Label>
                            <Select
                              value={link.channel}
                              onValueChange={(value) =>
                                updateLinkMutation.mutate({ id: link.id, updates: { channel: value } })
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="b2b">B2B (Courtiers)</SelectItem>
                                <SelectItem value="b2c">B2C (Clients directs)</SelectItem>
                                <SelectItem value="both">Les deux</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Calc rule */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Règle de calcul</Label>
                            {calcRules.length === 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-amber-600 border-amber-300"
                                onClick={() => navigate("/admin/calc-rules")}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Créer une règle
                              </Button>
                            ) : (
                              <Select
                                value={link.calc_rule_id || "__none__"}
                                onValueChange={(value) =>
                                  updateLinkMutation.mutate({
                                    id: link.id,
                                    updates: { calc_rule_id: value === "__none__" ? null : value },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Aucune règle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Aucune règle</SelectItem>
                                  {calcRules.map((rule) => (
                                    <SelectItem key={rule.id} value={rule.id}>
                                      {rule.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {!link.calc_rule_id && calcRules.length > 0 && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs mt-1">
                                Aucune règle
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(checked) =>
                            updateLinkMutation.mutate({ id: link.id, updates: { is_active: checked } })
                          }
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(link.form_template_id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(link.form_template_id)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteLinkMutation.mutate(link.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun formulaire n'est lié à ce produit. Les clients ne pourront pas souscrire sans formulaire.
              </AlertDescription>
            </Alert>
          )}

          {/* Add form actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={availableForms.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Lier un formulaire existant
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un formulaire..." />
                  <CommandList>
                    <CommandEmpty>Aucun formulaire disponible.</CommandEmpty>
                    <CommandGroup>
                      {availableForms.map((form) => (
                        <CommandItem
                          key={form.id}
                          value={form.name}
                          onSelect={() => {
                            addLinkMutation.mutate(form.id);
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
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un formulaire
            </Button>
          </div>

          {/* No calc rules warning */}
          {calcRules.length === 0 && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Aucune règle de calcul n'est disponible. Vous devez d'abord en créer une.
                <Button
                  variant="link"
                  className="px-1 text-amber-800 underline"
                  onClick={() => navigate("/admin/calc-rules")}
                >
                  Aller aux règles de calcul
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Form editor drawer */}
      <FormEditorDrawer
        open={editorOpen}
        onOpenChange={setEditorOpen}
        formId={editingFormId}
        duplicateFromId={duplicatingFormId}
        productCategory={productCategory as any}
        productType={productType || ""}
        productName={productName || "Nouveau produit"}
        onFormSaved={handleFormSaved}
      />
    </div>
  );
}
