

## Plan : Séparer le récap de simulation en une étape distincte

Actuellement, le formulaire "Assuré principal (2/2)" et le récap (détail prime + capitaux + données + boutons) sont dans la même sous-étape 4. L'utilisateur demande que le récap soit sur une page séparée.

### Modification unique : `PackObsequesSimulationStep.tsx`

**Changement** : Transformer le flow de 4 sous-étapes en 5 sous-étapes.

1. **Sous-étape 4** (Assuré 2/2) : Garder uniquement le formulaire (email, sexe, titre, lieu de naissance) + bouton "Calculer la prime". Après calcul, afficher un bouton "Voir le récapitulatif" qui avance vers la sous-étape 5.

2. **Nouvelle sous-étape 5** (Récapitulatif) : Déplacer les 3 sections (Détail prime, Capitaux, Données de simulation) + les 3 boutons d'action (Sauvegarder, Envoyer, Souscrire) dans un `renderSubStep5()` dédié.

3. **Ajuster la navigation** :
   - Type du `subStep` : `1 | 2 | 3 | 4 | 5`
   - `goToNextSubStep()` : step 4 → step 5
   - `goToPrevSubStep()` : step 5 → step 4
   - Back handler : gérer step 5
   - `getCurrentStepNumber()` et `getTotalSteps()` : ajouter le step 5
   - Rendre `subStep === 5 && renderSubStep5()` dans le JSX

### Fichier modifié
- `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

