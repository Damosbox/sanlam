

## Plan : Synchroniser le CTA de l'assistant avec le bouton du flow interne

### Problème

Le bouton CTA dans le `SalesAssistant` (sidebar) utilise `getNextLabel()` qui ne tient compte que du `currentStep` global. Pendant la souscription Pack Obsèques (step 4 global, 7 sous-étapes internes), le sidebar affiche "Signature" alors que le flow interne affiche "Suivant" (étapes 1-6) ou "Payer" (étape 7).

### Solution

Rendre `getNextLabel()` dans `GuidedSalesFlow.tsx` sensible aux sous-étapes pour Pack Obsèques :

**Pour `state.currentStep === 4` (Souscription) :**

| Produit | Sous-étape | Label flow interne | Label sidebar actuel | Label corrigé |
|---------|-----------|-------------------|---------------------|--------------|
| Pack Obsèques | 1-6 | "Suivant" | "Signature" | "Suivant" |
| Pack Obsèques | 7 | "Payer" | "Signature" | "Payer" |
| Auto | 1-4 | "Suivant" | "Signature" | "Suivant" |
| Auto | 5 | "Continuer vers Signature" | "Signature" | "Signature" |

**Pour `state.currentStep === 1` (Simulation) :**
- Pack Obsèques sous-étape 5 (récap) : le CTA doit dire "Souscrire" (déjà OK)
- Auto sous-étapes 1-4 : "Suivant", sous-étape 5 : "Calculer" (à vérifier si nécessaire)

### Modification

**Fichier : `src/components/guided-sales/GuidedSalesFlow.tsx`** — Modifier `getNextLabel()` :

```typescript
const getNextLabel = () => {
  if (state.currentStep === 1 && state.simulationCalculated) {
    return isPackObseques ? "Souscrire" : "Voir les offres";
  }
  if (state.currentStep === 4) {
    if (isPackObseques) {
      return state.subscriptionSubStep === 7 ? "Payer" : "Suivant";
    }
    return state.subscriptionSubStep === 5 ? "Signature" : "Suivant";
  }
  if (state.currentStep === 2) return "Récapitulatif";
  if (state.currentStep === 3) return "Souscrire";
  if (state.currentStep === 5) return "Paiement";
  if (state.currentStep === 6) return "Émission";
  return "Suivant";
};
```

### Fichier modifié
- `src/components/guided-sales/GuidedSalesFlow.tsx` — 1 fonction modifiée

