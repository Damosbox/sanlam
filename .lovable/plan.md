

# Plan : Suppression du doublon des règles de calcul

## Contexte du problème

Actuellement, les règles de calcul existent à **2 endroits distincts** :

```
+---------------------------+       +---------------------------+
|    PRODUIT (products)     |       |  FORMULAIRE (form_templates) |
+---------------------------+       +---------------------------+
| - calculation_rules: JSON | <--?--| - steps.phases[cotation]    |
|   (doublon inutile)       |       |   .steps[type=calculation_rules] |
+---------------------------+       +---------------------------+
```

L'architecture définie indique que les règles font partie intégrante du formulaire (sous-étape de type `calculation_rules` dans la phase Cotation). L'onglet "Calcul" du produit est donc **redondant**.

---

## Solution proposée

Supprimer complètement l'onglet "Calcul" du formulaire produit et rediriger vers le formulaire de souscription.

### Changements prévus

#### 1. Supprimer l'onglet "Calcul" de ProductForm

**Fichier:** `src/components/admin/products/ProductForm.tsx`

- Retirer le `TabsTrigger` pour l'onglet "Calcul" 
- Retirer le `TabsContent` correspondant
- Simplifier le grid de tabs (passer de 8 à 7 colonnes max)
- Supprimer l'import de `CalculationRulesTab`

#### 2. Supprimer les fichiers devenus inutiles

**Fichiers à supprimer :**
- `src/components/admin/products/tabs/CalculationRulesTab.tsx`
- `src/components/admin/products/CalculationRulesDisplay.tsx`

#### 3. Nettoyer le type ProductFormData

**Fichier:** `src/components/admin/products/ProductForm.tsx`

- Garder `calculation_rules` dans l'interface (pour compatibilité DB) mais ne plus l'afficher
- Documenter que ce champ n'est plus utilisé directement

#### 4. Améliorer l'onglet Souscription

**Fichier:** `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx`

Ajouter une section informative indiquant clairement que les règles de calcul se gèrent dans le formulaire :

```
+-------------------------------------------------------+
| Formulaire de souscription                            |
| Le formulaire contient :                              |
| ✓ La phase Cotation (avec les règles de calcul)       |
| ✓ La phase Souscription (champs client)               |
+-------------------------------------------------------+
```

---

## Détails techniques

### Avant (8 onglets avec doublon)
```
[Général] [Souscription] [Calcul] [Bénéf.] [Paiement] [Docs] [Ventes] [FAQs]
                            ↑
                      DOUBLON À SUPPRIMER
```

### Après (7 onglets sans doublon)
```
[Général] [Souscription] [Bénéf.] [Paiement] [Docs] [Ventes] [FAQs]
               ↑
         Contient le lien vers le formulaire
         qui gère les règles de calcul
```

### Impact sur la base de données

Aucune migration requise. Le champ `products.calculation_rules` reste en base mais n'est plus affiché/édité directement. À terme, ce champ pourra être supprimé après vérification qu'aucun processus ne l'utilise.

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/admin/products/ProductForm.tsx` | Modifier (retirer tab Calcul) |
| `src/components/admin/products/tabs/CalculationRulesTab.tsx` | Supprimer |
| `src/components/admin/products/CalculationRulesDisplay.tsx` | Supprimer |
| `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx` | Modifier (ajouter info) |

---

## Estimation

| Tâche | Temps estimé |
|-------|--------------|
| Suppression onglet Calcul | 10 min |
| Suppression fichiers | 2 min |
| Amélioration onglet Souscription | 15 min |
| Tests visuels | 10 min |
| **Total** | **~40 min** |

