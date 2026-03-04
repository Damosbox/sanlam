

## Fix : Navigation phase intelligente pour Pack Obsèques

### Problème

`goToPhase("preparation")` appelle `getFirstStepOfPhase("preparation")` qui retourne `0` (sélection produit) via `PHASE_STEPS`. Quand l'utilisateur clique sur "Simulation" dans le stepper, il est renvoyé à l'écran de choix de produit au lieu de la simulation (step 1).

### Solution

Modifier `goToPhase` dans `GuidedSalesFlow.tsx` pour être product-aware :
- Pour Pack Obsèques, la phase "preparation" (renommée "Simulation") doit naviguer vers step `1`, pas step `0`
- Step `0` est la sélection produit, qui ne devrait jamais être une cible de navigation une fois qu'on a avancé

**`GuidedSalesFlow.tsx`** — Modifier `goToPhase` :

```typescript
const goToPhase = (phase: SalesPhase) => {
  const isPackObseques = state.productSelection.selectedProduct === "pack_obseques";
  let targetStep = getFirstStepOfPhase(phase);
  
  // Pour Pack Obsèques, "preparation" = Simulation = step 1, pas step 0
  if (isPackObseques && phase === "preparation" && targetStep === 0) {
    targetStep = 1;
  }
  
  if (targetStep <= state.currentStep) {
    setDirection("backward");
    setState(prev => ({
      ...prev,
      currentStep: targetStep,
      currentPhase: phase
    }));
  }
};
```

Même logique à appliquer pour Auto : si l'utilisateur est déjà au-delà de step 0, cliquer "Préparation" devrait revenir à step 1 (simulation) plutôt que step 0. On peut généraliser : `if (targetStep === 0 && state.currentStep > 0) targetStep = 1`.

### Fichier modifié
- `src/components/guided-sales/GuidedSalesFlow.tsx` — 1 fonction modifiée

