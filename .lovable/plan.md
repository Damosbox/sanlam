

## Plan : Corrections Pack Obsèques

### 1. Plafond d'âge
**Constat :** Seul un minimum de 18 ans est vérifié, aucun plafond maximum n'existe.

**Modifications :**
- `PackObsequesSimulationStep.tsx` : Ajouter validation d'âge max (ex: 70 ans pour l'assuré principal, 65 ans pour le conjoint, 21 ans pour les enfants — à confirmer avec les règles métier exactes). Afficher un message d'erreur si l'âge dépasse le plafond.
- `PackObsequesSubscriptionFlow.tsx` : Même validation d'âge max dans les étapes 1 (assuré) et 2 (conjoint).
- Ajouter des constantes `MAX_AGE_PRINCIPAL = 70`, `MAX_AGE_CONJOINT = 65` (ajustables).

### 2. Informations exactes du volet
**Constat :** Les tarifs, capitaux et conditions sont actuellement des estimations statiques dans `packObsequesPremiumCalculator.ts`.

**Modifications :**
- Mettre à jour les tarifs exacts dans le calculateur si des valeurs précises sont fournies. Pour l'instant, afficher clairement les labels "Bronze / Argent / Or" avec les capitaux garantis correspondants dans la simulation (sub-step 5).
- S'assurer que toutes les informations affichées (capital garanti, prime périodique, frais d'adhésion) correspondent aux conditions réelles du produit.

### 3. Supprimer l'obligation des champs Ville et Pays de Résidence
**Constat :** Dans `PackObsequesSubscriptionFlow.tsx` :
- Step 1 (assuré principal) : `paysResidence` et `villeResidence` ne sont pas dans `isStep1Valid` mais ont un label sans `*`. OK.
- Step 2 (conjoint) : `conjointPaysResidence` et `conjointVilleResidence` **sont** dans `isStep2Valid` (ligne 235) avec `*` obligatoire.

**Modifications :**
- `PackObsequesSubscriptionFlow.tsx` : Retirer `conjointPaysResidence` et `conjointVilleResidence` de `isStep2Valid`. Retirer les `*` des labels correspondants.

### 4. Supprimer le champ BNS
**Constat :** Le `DiscountSelector` (BNS + réduction commerciale) est uniquement dans `RecapStep.tsx`, qui concerne le parcours Auto. Il n'apparaît pas dans le flux Pack Obsèques. Aucune modification nécessaire pour Pack Obsèques — c'est déjà absent.

### 5. OCR à chaque étape pour pré-remplissage des ayants droits
**Constat :** L'OCR est actuellement présent dans :
- Simulation sub-step 3 (assuré principal)
- Subscription step 1 (assuré principal)
- Subscription step 2 (conjoint)

Mais il manque dans l'étape 4 (bénéficiaires) quand le type est "autre".

**Modifications :**
- `PackObsequesSubscriptionFlow.tsx` step 4 (bénéficiaires) : Ajouter un bloc OCR identique quand `beneficiaireType === "autre"` pour scanner une pièce d'identité et pré-remplir `beneficiaireNom` et `beneficiairePrenom`.
- Ajouter un paramètre `target: "beneficiaire"` dans le handler OCR existant.

---

### Fichiers à modifier

| Fichier | Changements |
|---|---|
| `PackObsequesSimulationStep.tsx` | Ajouter validation âge max (assuré principal) |
| `PackObsequesSubscriptionFlow.tsx` | Âge max steps 1+2, retirer obligation ville/pays conjoint, OCR step 4 bénéficiaires |
| `packObsequesPremiumCalculator.ts` | Ajouter constantes d'âge max exportées |

