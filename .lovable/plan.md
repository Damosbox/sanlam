

## Alignement UX Pack Obsèques : Breadcrumb, Persistance, SalesAssistant, Sticky Bar

### 4 modifications à implémenter

**1. `DynamicSummaryBreadcrumb.tsx` — Support Pack Obsèques**

Ajouter une branche conditionnelle basée sur `state.productSelection.selectedProduct` :
- Si `pack_obseques` : afficher Formule (Bronze/Argent/Or), Type d'adhésion, Périodicité, Prime périodique, Nom assuré
- Garder la branche Auto existante inchangée
- Utiliser `state.packObsequesData` et `getPeriodicPremium()` pour les valeurs

**2. `GuidedSalesFlow.tsx` — Activer le breadcrumb pour Pack Obsèques**

Ligne 643 : changer la condition `showBreadcrumb` :
```typescript
const showBreadcrumb = state.currentStep > 1 || 
  (isPackObseques && state.currentStep >= 4 && state.simulationCalculated);
```

**3. `GuidedSalesFlow.tsx` — Activer SalesAssistant + MobileStickyBar pour Pack Obsèques step 4**

Ligne 548 : supprimer l'exclusion Pack Obsèques :
```typescript
const showSalesAssistant = state.simulationCalculated && state.currentStep >= 1;
```
Le SalesAssistant affichera la prime Pack Obsèques (déjà dans `state.calculatedPremium`) et l'assistant IA sera disponible pendant la souscription.

**4. `GuidedSalesFlow.tsx` + `PackObsequesSubscriptionFlow.tsx` — Persister la sous-étape**

- Dans `GuidedSalesFlow.tsx` : ajouter un `packObsequesSubStep` au state ou réutiliser `subscriptionSubStep` existant
- Passer `initialSubStep={state.subscriptionSubStep}` et `onSubStepChange` au `PackObsequesSubscriptionFlow`
- Dans `PackObsequesSubscriptionFlow.tsx` : accepter `initialSubStep` et `onSubStepChange` comme props, initialiser `useState(initialSubStep || 1)`, appeler `onSubStepChange` à chaque changement de sous-étape

### Fichiers modifiés

1. `src/components/guided-sales/DynamicSummaryBreadcrumb.tsx` — Ajout branche Pack Obsèques
2. `src/components/guided-sales/GuidedSalesFlow.tsx` — Conditions breadcrumb, SalesAssistant, props sub-step
3. `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx` — Props persistance sous-étape

