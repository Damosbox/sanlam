
# Plan: Simplification du flux de vente guidée - Garder uniquement Auto et Pack Obsèques

## Contexte
Actuellement, le système de vente guidée supporte 5 produits : Auto, MRH, Assistance Voyage, Molo Molo, et Pack Obsèques. L'objectif est de réduire à 2 produits uniquement : **Auto** et **Pack Obsèques**.

## Fichiers à modifier

### 1. `src/components/guided-sales/types.ts`
**Modifications requises :**
- Ligne 1 : Simplifier `ProductType` pour supprimer "habitation", "sante", "mrh", "assistance_voyage"
  - Avant : `export type ProductType = "auto" | "habitation" | "sante" | "vie" | "mrh" | "assistance_voyage";`
  - Après : `export type ProductType = "auto" | "vie";`
- Ligne 3 : Simplifier `SelectedProductType` pour garder uniquement "auto" et "pack_obseques"
  - Avant : `export type SelectedProductType = "auto" | "molo_molo" | "pack_obseques" | "mrh" | "assistance_voyage";`
  - Après : `export type SelectedProductType = "auto" | "pack_obseques";`
- Supprimer les interfaces et types inutilisés : `MoloMoloData` (lignes 84-103), tous les champs MRH et Assistance Voyage des données de needs analysis (lignes 155-187)
- Mettre à jour l'état initial pour retirer les références à Molo Molo et les produits supprimés (lignes 317-445)

### 2. `src/components/guided-sales/steps/ProductSelectionStep.tsx`
**Modifications requises :**
- Supprimer le ProductCard pour "Multirisque Habitation" (lignes 79-84)
- Supprimer le ProductCard pour "Assistance Voyage" (lignes 85-90)
- Supprimer le ProductCard pour "Molo Molo" (lignes 96-101)
- Retirer les imports inutilisés : `Home`, `Plane`, `Landmark` (ligne 4)
- Garder uniquement Auto (Non-Vie) et Pack Obsèques (Vie)

### 3. `src/components/guided-sales/steps/NeedsAnalysisStep.tsx`
**Modifications requises :**
- Supprimer les cas d'utilisation pour "habitation", "sante", "mrh", "assistance_voyage" du switch statement (lignes 796-808)
- Supprimer les fonctions de rendu : `renderHabitationFields()` (lignes 458-525), `renderSanteFields()` (lignes 527-648), `renderMRHFields()` (lignes 650-796), `renderAssistanceVoyageFields()`
- Supprimer les configurations de type de produit inutilisées (lignes 23-30)
- Ce composant ne sera plus utilisé pour les produits Vie (Pack Obsèques utilise PackObsequesSimulationStep), mais garder la structure pour la compatibilité Auto

### 4. `src/components/guided-sales/GuidedSalesFlow.tsx`
**Modifications requises :**
- Supprimer l'import de `MoloMoloNeedsStep` (ligne 11)
- Supprimer la logique de gestion de Molo Molo dans `updateMoloMoloData()` (lignes 151-165)
- Supprimer la logique de gestion de Molo Molo dans `handleCalculate()` (ne concerne pas ce flux)
- Mettre à jour le `renderStep()` : supprimer le cas `product === "molo_molo"` dans le switch step 1 (lignes 378-379)
- La logique life product pour skip step 2 restera : `const isLifeProduct = product === "pack_obseques"`

### 5. `src/components/guided-sales/SalesAssistant.tsx`
**Modifications requises :**
- Supprimer les entrées des produits supprimés dans l'objet `productLabels` (lignes 21-25)
- Garder uniquement : `auto: "Assurance Auto"` et `pack_obseques: "Pack Obsèques"`

### 6. `src/components/guided-sales/SalesAIChat.tsx`
**Modifications requises :**
- Supprimer les entrées des produits supprimés dans l'objet `productLabels` (lignes 18-22)
- Garder uniquement : `auto: "Assurance Auto"` et `pack_obseques: "Pack Obsèques"`

### 7. `src/components/guided-sales/steps/PaymentStatusDialog.tsx`
**Modifications requises :**
- Supprimer les cas "mrh" et "assistance_voyage" des deux objets de conseils (lignes 101-115 et 126-145)
- Supprimer les imports inutilisés si présents
- Garder uniquement "auto" et "pack_obseques"

### 8. `src/components/broker/dashboard/ProductSelector.tsx` (optionnel mais recommandé)
**Modifications requises :**
- Ligne 13 : Simplifier `ProductType` pour retirer "mrh", "sante", "vie"
  - Avant : `export type ProductType = "all" | "auto" | "mrh" | "sante" | "vie" | "obseques";`
  - Après : `export type ProductType = "all" | "auto" | "obseques";`
- Lignes 23-30 : Mettre à jour l'array `PRODUCTS` pour retirer MRH et Santé
  - Supprimer les lignes pour MRH, Santé, Vie/Épargne
  - Garder uniquement : "all", "auto", "obseques"

## Logique de navigation modifiée
- **Onglet Non-Vie** : affichera uniquement **Auto**
- **Onglet Vie** : affichera uniquement **Pack Obsèques**
- Step 2 (FormulaSelectionStep) sera sauté uniquement pour `pack_obseques` (la logique `isLifeProduct` changera de vérifier `product === "pack_obseques"`)

## Points clés
- ✅ Pas de suppression de tables ou modifications de base de données
- ✅ Compatibilité avec les données existantes : les quotations/subscriptions existantes pour Auto et Pack Obsèques continueront à fonctionner
- ✅ Les chemins de paiement, signature et émission demeurent inchangés
- ✅ Les interfaces d'admin et de gestion des produits ne sont pas affectées (elles utilisent d'autres tables)
- ✅ La logique SignatureEmissionStep pour les documents générés reste applicable aux deux produits

## Impact d'interface utilisateur
- Réduction visuelle simple : seulement 2 cartes de produits dans ProductSelectionStep
- Aucun changement dans les étapes suivantes (Simulation, Souscription, Paiement, Signature)
- Les filtres produits (ProductSelector) dans les tableaux afficheront "Auto" et "Obsèques" (optionnel)

