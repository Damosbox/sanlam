
# Correction du bouton "Payer" dans Pack Obseques

## Probleme
Dans `PackObsequesSubscriptionFlow.tsx`, le bouton "Payer" a l'etape 7 affiche un toast de succes mais n'appelle jamais `onNext()` pour avancer dans le flux principal. Le flux reste bloque.

## Correction
**Fichier** : `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx`

Modifier la fonction `goNext` (lignes 55-63) pour appeler `onNext()` apres le toast a l'etape 7 :

```typescript
const goNext = () => {
  if (currentStep === 1 && !isMarried) {
    setCurrentStep(3);
  } else if (currentStep < 7) {
    setCurrentStep(currentStep + 1);
  } else {
    // Step 7: finalize and advance main flow
    toast.success("Paiement initie avec succes !");
    onNext(); // <-- ajout de cette ligne
  }
};
```

## Impact
- Une seule ligne ajoutee
- Aucun autre fichier modifie
- Le flux principal reprend normalement apres le paiement
