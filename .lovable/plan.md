

## Diagnostic

Le composant `ProductSelectionStep.tsx` est **entièrement statique** : les produits "Assurance Auto" et "Pack Obsèques" sont codés en dur avec des icônes et descriptions fixes. Il ne fait aucune requête à la base de données — les produits créés dans l'admin ne sont jamais récupérés ni affichés.

## Plan : Rendre la sélection de produits dynamique

### Approche

Remplacer les cartes statiques par une liste dynamique alimentée depuis la table `products` (filtré par `is_active = true`), tout en conservant le regroupement par onglet Non-Vie / Vie.

### Changements

**Fichier : `src/components/guided-sales/steps/ProductSelectionStep.tsx`**

1. Ajouter un `useQuery` qui charge les produits actifs depuis `supabase.from("products").select("*").eq("is_active", true)`
2. Grouper les résultats par `category` ("vie" / "non-vie")
3. Mapper chaque produit vers une `ProductCard` avec :
   - `title` = `product.name`
   - `description` = `product.description`
   - `icon` = icône par défaut selon `product_type` ou `category` (Car pour auto, Shield pour vie, etc.)
   - `onSelect` → passe `product.id` et `product.product_type` au state
4. Afficher un skeleton loader pendant le chargement
5. Conserver le fallback statique si aucun produit n'est trouvé en base

**Fichier : `src/components/guided-sales/types.ts`**

- Vérifier que `SelectedProductType` accepte des valeurs dynamiques (string) au lieu de seulement `"auto" | "pack_obseques"` — ajuster si nécessaire pour supporter les nouveaux produits

### Impact sur le flux existant

Les flows de souscription existants (auto, pack obsèques) continueront de fonctionner car ils matchent par `product_type`. Les nouveaux produits sans flow dédié afficheront un message "Parcours en construction".

