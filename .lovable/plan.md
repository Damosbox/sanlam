

## Reprise de brouillon à la sous-étape exacte

### Problème

Quand un brouillon est restauré, `setState(restoredState)` restaure correctement `currentStep` (l'étape globale) et toutes les données du formulaire. Cependant, les composants `SimulationStep`, `SubscriptionFlow` et `PackObsequesSimulationStep` utilisent un `useState(1)` local pour gérer leur sous-étape interne. Le brouillon revient donc toujours à la sous-étape 1 de l'étape courante, même si l'utilisateur avait progressé plus loin.

### Solution

Passer la sous-étape sauvegardée depuis l'état global aux composants enfants et l'utiliser comme valeur initiale.

### Modifications

**1. `SimulationStep.tsx`**
- Ajouter une prop `initialSubStep?: number` 
- Changer `useState<1|2|3|4|5>(1)` en `useState<1|2|3|4|5>(initialSubStep ?? 1)`

**2. `SubscriptionFlow.tsx`**
- Ajouter une prop `initialSubStep?: number`
- Changer `useState<1|2|3|4|5|6>(1)` en `useState<1|2|3|4|5|6>(initialSubStep ?? 1)`

**3. `PackObsequesSimulationStep.tsx`**
- Ajouter une prop `initialSubStep?: number`
- Changer `useState<1|2|3|4>(1)` en `useState<1|2|3|4>(initialSubStep ?? 1)`

**4. `GuidedSalesFlow.tsx`**
- Passer `initialSubStep={state.simulationSubStep}` à `SimulationStep`
- Passer `initialSubStep={state.subscriptionSubStep}` à `SubscriptionFlow`
- Passer `initialSubStep` à `PackObsequesSimulationStep` si applicable

**5. Sauvegarde des sous-étapes** (si pas déjà fait)
- Vérifier que `handleSaveAndQuit` sauvegarde bien `simulationSubStep` et `subscriptionSubStep` dans le state avant la sérialisation. Si les sous-étapes ne sont pas synchronisées vers l'état global, ajouter des callbacks `onSubStepChange` pour mettre à jour `state.simulationSubStep` / `state.subscriptionSubStep` à chaque changement de sous-étape dans les composants enfants.

### Résultat

À la reprise d'un brouillon, l'utilisateur retrouve exactement l'écran et la sous-étape où il s'est arrêté, avec toutes les données pré-remplies.

