import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductsList } from "@/components/admin/products/ProductsList";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Produits d'Assurance
          </h1>
          <p className="text-muted-foreground">
            Configurez et gérez votre catalogue de produits.
          </p>
        </div>
        <Button onClick={() => navigate("/admin/products/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Produit
        </Button>
      </div>

      <DataTableToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Rechercher un produit..." }}
        filters={[
          {
            id: "category", label: "Catégorie", value: categoryFilter, onChange: setCategoryFilter,
            options: [
              { value: "all", label: "Toutes catégories" },
              ...(categories ?? []).map((cat) => ({ value: cat.name, label: cat.label })),
            ],
          },
          {
            id: "status", label: "Statut", value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: "all", label: "Tous statuts" },
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
            ],
          },
        ]}
        sort={{
          value: sortBy, onChange: setSortBy,
          options: [
            { value: "name_asc", label: "Nom A→Z" },
            { value: "name_desc", label: "Nom Z→A" },
            { value: "updated_desc", label: "Mise à jour récente" },
            { value: "updated_asc", label: "Mise à jour ancienne" },
          ],
        }}
      />

      <ProductsList
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        search={search}
        sortBy={sortBy}
      />
    </div>
  );
}
