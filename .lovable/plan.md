

## Plan : Ajouter les informations du propriétaire dans la sous-étape Conducteur

### Contexte

La sous-étape 4 "Conducteur" ne contient actuellement que les infos permis (conducteur habituel, catégorie, numéro, date d'obtention). Il faut ajouter une section "Information du propriétaire" au-dessus, comme dans la maquette de référence, avec : Nom, Prénom, Contact téléphonique, Type d'emploi, Date d'effet et Durée du contrat.

### Modifications

**Fichier : `src/components/guided-sales/steps/SubscriptionFlow.tsx`**

- Ajouter une section "Information du propriétaire" en haut de `renderSubStep4()`, avant la section "Permis de conduire"
- Champs en grille 2 colonnes :
  - **Nom du propriétaire** : Input pré-rempli depuis `state.clientIdentification.lastName`
  - **Prénom du propriétaire** : Input pré-rempli depuis `state.clientIdentification.firstName`
  - **Contact téléphonique** : Input tel pré-rempli depuis `state.clientIdentification.phone`
  - **Type d'emploi** : Select avec les options existantes (fonctionnaire, salarié, etc.) — stocké dans `subscription.driverName` ou un champ dédié via `state.needsAnalysis.employmentType`
  - **Date d'effet** : Pré-rempli depuis `state.needsAnalysis.effectiveDate` (lecture seule, déjà saisi en simulation)
  - **Durée du contrat** : Pré-rempli depuis `state.needsAnalysis.contractPeriodicity` (lecture seule)
- Ces champs sont en lecture seule s'ils ont déjà été renseignés lors des étapes précédentes (identification client, simulation), sinon éditables
- Mettre à jour `isSubStep4Valid()` pour inclure le nom du conducteur comme requis
- Mettre à jour les props pour accepter aussi les updates de `clientIdentification` et `needsAnalysis` si besoin, ou simplement afficher les données existantes en lecture seule

**Fichier : `src/components/guided-sales/GuidedSalesFlow.tsx`**

- Passer `state` complet au `SubscriptionFlow` (déjà le cas) pour accéder aux données d'identification et simulation

### Fichiers modifiés (1)
- `src/components/guided-sales/steps/SubscriptionFlow.tsx`

