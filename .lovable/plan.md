

## Problème identifié

Les champs "Information du propriétaire" (Nom, Prénom, Contact, Type d'emploi) dans l'étape 5 (Conducteur) du parcours Auto souffrent de deux bugs :

1. **Aucun `onChange` handler** — les `Input` et `Select` n'ont pas de `onChange`, donc impossible de taper quoi que ce soit même quand ils ne sont pas `disabled`.
2. **Validation bloquante** — `isSubStep5Valid()` exige `state.clientIdentification.lastName/firstName`, mais si ces données n'ont pas été remplies à l'étape d'identification, il est impossible de les saisir ici car les champs n'ont pas de handler.

## Solution

**Fichier** : `src/components/guided-sales/steps/SubscriptionFlow.tsx`

### Modifications :

1. **Ajouter des `onChange` handlers** à chaque champ propriétaire :
   - Nom → `onChange` qui met à jour `subscription.driverName` (ou un nouveau champ `ownerLastName` dans subscription state)
   - Prénom → idem pour `ownerFirstName`
   - Contact → idem pour un champ phone
   - Type d'emploi → `onValueChange` sur le Select

   Approche : Les champs restent pré-remplis depuis `clientIdentification`/`needsAnalysis` s'ils existent, mais l'utilisateur peut les éditer. On stocke les valeurs éditées dans `subscription` (ex: `onUpdate({ driverName: e.target.value })`). On utilise un fallback : `subscription.X || clientIdentification.X || ""`.

2. **Retirer le `disabled`** conditionnel — remplacer par un pré-remplissage non bloquant. Les champs sont toujours éditables, simplement pré-remplis si les données existent.

3. **Mettre à jour `isSubStep5Valid()`** pour vérifier les valeurs effectives (subscription fallback vers clientIdentification) au lieu de ne vérifier que `clientIdentification`.

4. **Ajouter les types manquants** dans `SubscriptionData` (dans `types.ts`) si nécessaire : `ownerLastName`, `ownerFirstName`, `ownerPhone`, `ownerEmploymentType`.

### Fichiers impactés :
- `src/components/guided-sales/steps/SubscriptionFlow.tsx` — handlers + validation
- `src/components/guided-sales/types.ts` — ajout champs owner dans `SubscriptionData` + `initialState`

