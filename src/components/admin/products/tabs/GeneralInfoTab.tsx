import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Upload, Loader2, X, ImageIcon, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductFormData } from "../ProductForm";
import { useToast } from "@/hooks/use-toast";

interface GeneralInfoTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
  errors?: Record<string, string[]>;
}

export function GeneralInfoTab({ formData, updateField, errors = {} }: GeneralInfoTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: types } = useQuery({
    queryKey: ["product-types", formData.category],
    queryFn: async () => {
      const category = categories?.find((c) => c.name === formData.category);
      if (!category) return [];
      
      const { data, error } = await supabase
        .from("product_types")
        .select("*")
        .eq("category_id", category.id)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!categories && !!formData.category,
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Utilisez une image JPG, PNG, WebP ou GIF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 5 Mo",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${formData.productId || crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      updateField("image_url", urlData.publicUrl);
      
      toast({
        title: "Image téléversée",
        description: "L'image du produit a été mise à jour",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur de téléversement",
        description: "Impossible de téléverser l'image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    updateField("image_url", "");
  };

  const fieldError = (field: string) =>
    errors[field]?.length ? (
      <p className="text-xs text-destructive mt-1">{errors[field][0]}</p>
    ) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Assurance Auto Essentiel"
                className={errors.name ? "border-destructive" : ""}
              />
              {fieldError("name")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Décrivez les caractéristiques principales du produit..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    updateField("category", value);
                    updateField("product_type", "");
                  }}
                >
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("category")}
              </div>

              <div className="space-y-2">
                <Label>Type de produit *</Label>
                <Select
                  key={formData.category}
                  value={formData.product_type}
                  onValueChange={(value) => updateField("product_type", value)}
                >
                  <SelectTrigger className={errors.product_type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {types?.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("product_type")}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="base_premium">Prime de base (FCFA) *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>Montant de référence pour la tarification. Les règles de calcul détaillées (coefficients, taxes) sont configurées dans le formulaire de cotation, onglet Souscription.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="base_premium"
                type="number"
                value={formData.base_premium}
                onChange={(e) => updateField("base_premium", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={errors.base_premium ? "border-destructive" : ""}
              />
              {fieldError("base_premium")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canaux & Périodicité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Canaux de distribution</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={(formData as any).channels?.b2b ?? true}
                    onCheckedChange={(checked) => updateField("channels" as any, { ...(formData as any).channels, b2b: checked })}
                  />
                  B2B (Courtiers)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={(formData as any).channels?.b2c ?? false}
                    onCheckedChange={(checked) => updateField("channels" as any, { ...(formData as any).channels, b2c: checked })}
                  />
                  B2C (Clients directs)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Périodicité de paiement</Label>
              <div className="flex flex-wrap gap-2">
                {["Unique", "Mensuelle", "Trimestrielle", "Semestrielle", "Annuelle"].map((p) => {
                  const selected = ((formData as any).periodicity || []).includes(p);
                  return (
                    <Button
                      key={p}
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      type="button"
                      onClick={() => {
                        const current: string[] = (formData as any).periodicity || [];
                        const next = selected ? current.filter((x: string) => x !== p) : [...current, p];
                        updateField("periodicity" as any, next);
                      }}
                    >
                      {p}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produit renouvelable</Label>
                <p className="text-sm text-muted-foreground">
                  Le contrat peut être renouvelé à l'échéance
                </p>
              </div>
              <Switch
                checked={formData.is_renewable}
                onCheckedChange={(checked) => updateField("is_renewable", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gestion des sinistres</Label>
                <p className="text-sm text-muted-foreground">
                  Les clients peuvent déclarer des sinistres
                </p>
              </div>
              <Switch
                checked={formData.has_claims}
                onCheckedChange={(checked) => updateField("has_claims", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Réductions & Bonus</Label>
                <p className="text-sm text-muted-foreground">
                  Activer les réductions et bonus pour ce produit
                </p>
              </div>
              <Switch
                checked={(formData as any).discounts_enabled ?? false}
                onCheckedChange={(checked) => updateField("discounts_enabled" as any, checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Questionnaires médicaux</Label>
                <p className="text-sm text-muted-foreground">
                  Poser des questions médicales à l'assuré
                </p>
              </div>
              <Switch
                checked={(formData as any).medical_questionnaire_enabled ?? false}
                onCheckedChange={(checked) => updateField("medical_questionnaire_enabled" as any, checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bénéficiaires</Label>
                <p className="text-sm text-muted-foreground">
                  Permettre la désignation de bénéficiaires
                </p>
              </div>
              <Switch
                checked={(formData as any).beneficiaries_enabled ?? false}
                onCheckedChange={(checked) => updateField("beneficiaries_enabled" as any, checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Statut actif</Label>
                <p className="text-sm text-muted-foreground">
                  Le produit est visible et commercialisable
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border bg-muted">
              <AspectRatio ratio={4 / 3}>
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt={formData.name || "Aperçu produit"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span className="text-sm">Aucune image</span>
                  </div>
                )}
              </AspectRatio>
              {formData.image_url && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Téléversement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Téléverser une image
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG, WebP ou GIF • Max 5 Mo
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="image_url" className="text-xs text-muted-foreground">
                Ou entrer une URL directe
              </Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                placeholder="https://..."
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
