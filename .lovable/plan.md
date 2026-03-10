

## Plan : Réorganiser le flow Pack Obsèques — "Calculer la prime" après le récapitulatif

### Problème actuel
À la sous-étape 4 (Assuré Principal 2/2), le CTA est "Calculer la prime". Le calcul se fait AVANT de voir le récapitulatif. L'utilisateur veut inverser : d'abord voir le récapitulatif des données saisies, puis calculer la prime.

### Nouveau flow

| Sous-étape | Contenu | CTA Form | CTA Assistant |
|------------|---------|----------|---------------|
| 1-3 | Config, famille, infos | Suivant | Suivant |
| 4 (Assuré 2/2) | Formulaire assuré | **Voir le récapitulatif** | **Voir le récapitulatif** |
| 5 (Récap) | Données de simulation + capitaux | **Calculer la prime** | **Calculer la prime** |
| 5 (après calcul) | + Détail prime affiché | **Souscrire** | **Souscrire** |

### Changements

#### 1. `GuidedSalesFlow.tsx` — Labels CTA
- Sous-étape 4 : toujours "Voir le récapitulatif" (plus de condition sur `simulationCalculated`)
- Sous-étape 5 : "Calculer la prime" si pas encore calculé, "Souscrire" si calculé

#### 2. `PackObsequesSimulationStep.tsx` — Sous-étape 5
- Afficher les sections 2 (capitaux) et 3 (données de simulation) toujours
- Afficher la section 1 (détail prime + réductions) **uniquement** si `simulationCalculated === true`
- Le bouton "Calculer la prime" dans le formulaire déclenche `onCalculate()` sans naviguer

#### 3. `GuidedSalesFlow.tsx` — Navigation
- Sous-étape 4 → 5 : navigation directe (sans calcul)
- Sous-étape 5 + clic "Calculer" : appeler `handlePackObsequesCalculate()` sans changer de sous-étape
- Sous-étape 5 + clic "Souscrire" (après calcul) : passer à l'étape suivante

### Fichiers impactés
- `src/components/guided-sales/GuidedSalesFlow.tsx`
- `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

