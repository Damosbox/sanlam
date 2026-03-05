

## Ajouter un champ "Code produit" dans les informations générales

### Contexte
La table `products` et le formulaire de création/édition ne disposent pas d'un champ "Code produit". Il faut l'ajouter en base et dans l'UI.

### 1. Migration DB
Ajouter une colonne `product_code` (text, nullable, unique) à la table `products`.

```sql
ALTER TABLE public.products ADD COLUMN product_code text UNIQUE;
```

### 2. `src/components/admin/products/ProductForm.tsx`
- Ajouter `product_code: string` à l'interface `ProductFormData` et au `defaultFormData` (valeur par défaut `""`)
- Initialiser depuis `product.product_code` quand le produit existe
- Inclure `product_code` dans le payload de sauvegarde

### 3. `src/components/admin/products/tabs/GeneralInfoTab.tsx`
- Ajouter un champ `Input` "Code produit" juste après le champ "Nom du produit", avec placeholder `"Ex: AUTO-ESS-001"` et un tooltip expliquant que c'est un identifiant unique interne.

### 4. `src/schemas/product.ts`
- Ajouter `product_code: z.string().optional().default("")` au `ProductFormSchema`.

### Fichiers impactés (4)
1. Migration SQL — nouvelle colonne
2. `ProductForm.tsx` — interface + payload
3. `GeneralInfoTab.tsx` — champ UI
4. `product.ts` (schema) — validation zod

