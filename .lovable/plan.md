

## Plan : Alignement complet Pack Obsèques sur Auto — 12 corrections

Ce plan couvre toutes les demandes de l'utilisateur en un seul sprint. Voici les modifications regroupées par fichier.

---

### 1. Renommer les phases : "Simulation - Souscription - Finalisation"

**`PhaseNavigation.tsx`** — Modifier `packObsequesPhases` :
- `"Préparation"` → `"Simulation"`
- `"Souscription"` reste
- `"Finalisation"` reste

---

### 2. Pack Obsèques doit atteindre l'écran IssuanceStep (comme Auto)

**Problème actuel** : Quand le paiement est confirmé dans `PackObsequesSubscriptionFlow` (step 7 interne), `onNext()` est appelé mais `nextStep()` dans `GuidedSalesFlow` bloque à step 4 pour Pack Obsèques (`return prev`). Le flow ne passe jamais à l'écran d'émission.

**`GuidedSalesFlow.tsx`** :
- Modifier `nextStep()` : au lieu de bloquer à step 4 pour Pack Obsèques, avancer vers step 7 (IssuanceStep) directement
- Modifier `getPhaseFromStep()` : ajouter `if (step >= 7) return "finalisation"` pour Pack Obsèques
- Modifier `prevStep()` : step 7 pour Pack Obsèques recule vers step 4

---

### 3. Déplacer le récap de paiement sur l'étape 6/7 du SubscriptionFlow

**`PackObsequesSubscriptionFlow.tsx`** — Step 6 (Résumé) :
- Ajouter une section "Détail de la prime" dans l'accordion du récap (même format que la simulation : première prime, prime périodique nette, frais d'adhésion)
- Utiliser `calculatePackObsequesPremium` + `getPeriodicPremium` + `formatFCFA`

---

### 4. Ne pas rendre bloquants "Pays de résidence" et "Ville de résidence"

**`PackObsequesSubscriptionFlow.tsx`** — Step 1 validation :
- Retirer `data.paysResidence` et `data.villeResidence` de `isStep1Valid`
- Ces champs restent visibles mais optionnels

---

### 5. Message d'alerte quand téléphone < 10 chiffres

**`PackObsequesSubscriptionFlow.tsx`** — Steps 1 et 2 (champs téléphone) :
- Ajouter un message d'alerte conditionnel sous chaque champ téléphone : si la valeur est non vide et < 10 chiffres, afficher `<p className="text-xs text-destructive">Le numéro doit contenir au moins 10 chiffres</p>`
- Même logique pour le champ `paymentPhoneNumber` dans Step 7

---

### 6. Détails de la solde (comme Diapazon) dans Step 5

**`PackObsequesSubscriptionFlow.tsx`** — Step 5 :
- Quand `typePrelevement === "solde"`, afficher les champs supplémentaires : Matricule, Employeur, Direction/Service
- Ajouter ces champs dans le type `PackObsequesData` si nécessaire (ou utiliser les champs existants avec des noms génériques)

**`types.ts`** — Ajouter dans `PackObsequesData` :
- `soldeMatricule?: string`
- `soldeEmployeur?: string`
- `soldeDirection?: string`

---

### 7. Séparateurs de milliers

**Déjà implémenté** via `formatFCFA()`. Vérifier que tous les montants dans `PackObsequesSubscriptionFlow` Step 7 utilisent `formatFCFA()` (actuellement c'est le cas).

---

### 8. Date en français

**`PackObsequesSubscriptionFlow.tsx`** — Step 6 (résumé) et données de simulation :
- Formater les dates affichées avec `format(new Date(date), "dd MMMM yyyy", { locale: fr })` au lieu d'afficher la date brute
- Importer `format` de `date-fns` et `fr` de `date-fns/locale`

**`PackObsequesSimulationStep.tsx`** — Section 3 "Données de simulation" :
- Remplacer `{data.effectiveDate}` par `{format(new Date(data.effectiveDate), "dd MMMM yyyy", { locale: fr })}`

---

### 9. Récupérer les informations de la simulation pour la souscription

**Déjà fait** : les données sont dans `state.packObsequesData` partagé entre simulation et souscription. Les champs nom, prénom, email, téléphone, date de naissance sont pré-remplis avec le label `(pré-rempli)`.

---

### 10. DynamicSummaryBreadcrumb pour Pack Obsèques

**`DynamicSummaryBreadcrumb.tsx`** — Ajouter branche Pack Obsèques :
- Si `state.productSelection.selectedProduct === "pack_obseques"` et `state.packObsequesData` :
  - Formule (Bronze/Argent/Or)
  - Adhésion (Individuelle/Famille/Famille+Ascendant)
  - Périodicité
  - Prime périodique (via `getPeriodicPremium`)
  - Assuré (nom complet)

**`GuidedSalesFlow.tsx`** :
- Modifier `showBreadcrumb` : `state.currentStep > 1 || (isPackObseques && state.currentStep >= 4 && state.simulationCalculated)`

---

### 11. Persister sous-étape souscription + activer SalesAssistant

**`GuidedSalesFlow.tsx`** :
- Passer `initialSubStep` et `onSubStepChange` au `PackObsequesSubscriptionFlow`
- Supprimer l'exclusion Pack Obsèques de `showSalesAssistant` (ligne 548) : `const showSalesAssistant = state.simulationCalculated && state.currentStep >= 1`

**`PackObsequesSubscriptionFlow.tsx`** :
- Accepter `initialSubStep?: number` et `onSubStepChange?: (step: number) => void`
- Remplacer `useState(1)` par `useState(initialSubStep || 1)`
- Appeler `onSubStepChange` à chaque changement de step

---

### 12. Écran d'émission identique à Auto (IssuanceStep)

L'`IssuanceStep` est déjà générique et fonctionne pour tout produit. Le changement clé est dans le point 2 : permettre au flow Pack Obsèques d'atteindre step 7 après le paiement interne.

Les documents mock seront adaptés au contexte Pack Obsèques :
- Reçu de paiement
- Certificat d'adhésion
- Conditions Particulières
- Conditions Générales

**`IssuanceStep.tsx`** — Conditionner les documents mock selon le produit :
- Si `state.productSelection.selectedProduct === "pack_obseques"`, utiliser des noms de documents spécifiques obsèques

---

### Fichiers modifiés (6 fichiers)

1. `src/components/guided-sales/types.ts` — 3 champs solde
2. `src/components/guided-sales/PhaseNavigation.tsx` — Renommer phases
3. `src/components/guided-sales/DynamicSummaryBreadcrumb.tsx` — Branche Pack Obsèques
4. `src/components/guided-sales/GuidedSalesFlow.tsx` — Breadcrumb, SalesAssistant, step flow vers IssuanceStep, sub-step persistence
5. `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx` — Validation allégée, alerte téléphone, détails solde, récap prime step 6, dates FR, persistence
6. `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx` — Date FR
7. `src/components/guided-sales/steps/IssuanceStep.tsx` — Documents conditionnels Pack Obsèques

