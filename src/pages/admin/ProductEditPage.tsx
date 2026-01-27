import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nouveau Produit" : `Modifier: ${product?.name || ""}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Créez un nouveau produit d'assurance."
              : "Modifiez les paramètres du produit."}
          </p>
        </div>
      </div>

      <ProductForm product={product} isNew={isNew} />
    </div>
  );
}
