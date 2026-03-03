
## Adapter le PhaseNavigation pour Pack Obsèques

### Problème

Actuellement, le `PhaseNavigation` affiche toujours les 4 mêmes phases (Préparation → Construction → Souscription → Finalisation), même pour Pack Obsèques qui saute les étapes 2-3 (Construction) et dont l'étape 4 est terminale (les 7 sous-étapes internes gèrent tout jusqu'au paiement). Le stepper affiché ne correspond pas au parcours réel.

### Solution

Adapter le `PhaseNavigation` et le `GuidedSalesFlow` pour afficher des phases spécifiques au produit Pack Obsèques :

**Phases Pack Obsèques :**
1. **Préparation** — Sélection produit + Simulation (steps 0-1)
2. **Souscription** — PackObsequesSubscriptionFlow interne (step 4, sous-étapes 1-5 : identité, conjoint, médical, bénéficiaires, prélèvement)
3. **Finalisation** — Sous-étapes internes 6-7 : récap/signature + paiement

vs Auto actuel :
1. Préparation (steps 0-1)
2. Construction (steps 2-3)
3. Souscription (step 4)
4. Finalisation (steps 5-7)

### Modifications

**1. `PhaseNavigation.tsx`**
- Ajouter une prop `productType?: SelectedProductType`
- Utiliser un tableau de phases conditionnel : si `productType === "pack_obseques"`, afficher 3 phases (Préparation, Souscription, Finalisation) au lieu de 4
- Adapter `phaseOrder` dynamiquement

**2. `GuidedSalesFlow.tsx`**
- Passer `productType={state.productSelection.selectedProduct}` au `PhaseNavigation`
- Adapter `getPhaseFromStep` pour Pack Obsèques : step 0-1 = préparation, step 4 = souscription (pas de construction)
- Mettre à jour `PHASE_STEPS` conditionnellement ou adapter `getPhaseFromStep` pour dériver la phase correcte selon le produit

### Résultat

Le stepper reflète fidèlement le parcours Pack Obsèques en 3 phases au lieu de 4, sans la phase "Construction" qui n'existe pas pour ce produit.
