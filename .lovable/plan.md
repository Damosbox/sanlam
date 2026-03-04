

## Plan : Synchroniser le CTA assistant avec les boutons internes (Auto + Pack Obsèques)

### Problème

Le `getNextLabel()` ne tient pas compte des sous-étapes pour le parcours Auto. Par exemple :
- **Step 1 (Simulation Auto)** : sous-étapes 1-4 affichent "Suivant" en interne, mais l'assistant affiche "Voir les offres" dès que `simulationCalculated` est vrai
- **Step 4 (Souscription Auto)** : sous-étape 5 affiche "Continuer vers Signature" en interne, l'assistant affiche "Signature"

### Solution

Refactorer `getNextLabel()` dans `GuidedSalesFlow.tsx` pour être pleinement sensible aux sous-étapes des deux parcours :

```
Step 1 (Simulation):
  Auto:  sub 1-4 → "Suivant" | sub 5 → "Voir les offres"
  Pack:  sub 1-3 → "Suivant" | sub 4 → "Calculer la prime" | sub 5 → "Souscrire"

Step 2: "Récapitulatif" (Auto only)
Step 3: "Souscrire" (Auto only)

Step 4 (Souscription):
  Auto:  sub 1-4 → "Suivant" | sub 5 → "Continuer vers Signature"
  Pack:  sub 1-6 → "Suivant" | sub 7 → "Payer"

Step 5: "Paiement" (Auto)
Step 6: "Émission" (Auto)
Default: "Suivant"
```

### Fichier modifié
- `src/components/guided-sales/GuidedSalesFlow.tsx` — refactor `getNextLabel()`

