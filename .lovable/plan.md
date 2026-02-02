
# Correction - Ajout du Bouton "Voir les Offres" après Calcul

## Problème Identifié

Dans `SimulationStep.tsx`, après le calcul de la prime :
- Le résultat de la prime s'affiche correctement (39 787 FCFA)
- Le bouton "Recalculer" est présent
- **MAIS** il n'y a pas de bouton "Voir les offres" ou "Suivant" pour passer à l'étape de formule

Le `SalesAssistant` (panneau latéral) contient ce bouton, mais :
1. Sur mobile, il n'apparaît pas dans la sidebar
2. Le `MobileCoverageStickyBar` n'est pas toujours visible
3. Il devrait y avoir un bouton directement dans le formulaire

## Solution

Ajouter un bouton "Voir les offres" dans `SimulationStep.tsx` qui s'affiche **uniquement après que le calcul soit effectué**. Ce bouton sera le chemin principal pour avancer dans le parcours.

### Modification de `SimulationStep.tsx`

Ajouter les props nécessaires et le bouton de navigation :

```
Interface mise à jour :
- Ajouter `onNext: () => void` aux props

Après le bloc "Résultat simulation" (ligne 654), ajouter :
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [Recalculer]          [← Retour]          [Voir les offres →] │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Changements Techniques

1. **`SimulationStep.tsx`** :
   - Ajouter `onNext` aux props de l'interface
   - Dans `renderSubStep5()`, ajouter un bouton "Voir les offres" après le résultat de prime
   - Le bouton n'apparaît que si `simulationCalculated === true`

2. **`GuidedSalesFlow.tsx`** :
   - Passer `onNext={nextStep}` au composant `SimulationStep`

### Code Prévu

Dans `renderSubStep5()` (après le bloc de résultat, ligne 654) :

```tsx
{/* Navigation après calcul */}
<div className="flex flex-wrap justify-between gap-3 mt-6">
  <Button variant="outline" onClick={goBack} className="gap-2">
    <ChevronLeft className="h-4 w-4" />
    Retour
  </Button>
  
  {simulationCalculated && (
    <Button onClick={onNext} className="gap-2">
      Voir les offres
      <ChevronRight className="h-4 w-4" />
    </Button>
  )}
</div>
```

Cela garantit que l'utilisateur peut toujours passer à l'étape suivante, que le SalesAssistant soit visible ou non.
