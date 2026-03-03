

## Simplification de l'étape 5 — Équipements uniquement

### Contexte

Actuellement, l'étape 5/5 de la simulation contient :
1. Les champs équipements (toit panoramique, GPS)
2. Un bouton "CALCULER" / "Recalculer"
3. L'affichage de l'estimation de prime

L'utilisateur souhaite que le calcul de prime se fasse automatiquement au clic sur "Voir les offres" (passage à l'étape formules), pas dans l'étape 5.

### Modifications

**Fichier : `SimulationStep.tsx`**

- **Supprimer** le sous-titre "Étape 5/5 - Options du véhicule"
- **Supprimer** le bloc d'estimation de prime (carte avec `formatFCFA`)
- **Supprimer** le bouton "CALCULER" / "Recalculer" et le message d'aide
- **Remplacer** par un bouton "Voir les offres" qui :
  1. Déclenche `onCalculate()` 
  2. Puis enchaîne vers `onNext()` une fois le calcul terminé
- Conserver le bouton "Retour"

**Fichier : `GuidedSalesFlow.tsx`**

- Ajuster la logique pour que `simulationCalculated` soit mis à `true` lors du passage étape 5 → formules (le calcul se fait au moment du clic "Voir les offres")
- S'assurer que la transition vers l'étape suivante attend la fin du calcul

### Résultat

L'étape 5 ne montre que les 2 champs équipements + un bouton "Voir les offres" qui calcule et navigue en une seule action.

