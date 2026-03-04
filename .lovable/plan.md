

## Plan : Déplacer Sexe et Type d'emploi du profil simulation vers la modale d'enregistrement

### Modifications

**1. `src/components/guided-sales/QuotationSaveDialog.tsx`**
- Ajouter 4 nouveaux champs au formulaire : **Sexe** (Select), **Date de naissance** (Input date), **Numéro de téléphone** (Input tel), et **Type d'emploi** (Select)
- Étendre l'interface `defaultValues` et le payload `onConfirm` avec `gender?`, `birthDate?`, `phone?`, `employmentType?`
- Layout en grille 2 colonnes pour Sexe / Date de naissance
- Tous les nouveaux champs sont optionnels

**2. `src/components/guided-sales/steps/SimulationStep.tsx`**
- Supprimer les champs 6 (Sexe) et 7 (Type d'emploi) du `renderSubStep2()`
- Le sous-étape 2 ne garde que le champ 5 (Accident 36 mois)
- Mettre à jour `isSubStep2Valid()` pour ne vérifier que `hasAccident36Months`
- Renuméroter les champs suivants (8→6, 9→7, etc.)

**3. `src/components/guided-sales/GuidedSalesFlow.tsx`**
- Passer les `defaultValues` enrichis (gender, birthDate, phone, employmentType) depuis `state.clientIdentification` / `state.needsAnalysis`
- Mettre à jour `handleSaveAndQuit` pour stocker les nouvelles données

### Fichiers modifiés (3)
- `src/components/guided-sales/QuotationSaveDialog.tsx`
- `src/components/guided-sales/steps/SimulationStep.tsx`
- `src/components/guided-sales/GuidedSalesFlow.tsx`

