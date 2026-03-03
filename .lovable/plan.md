

## Modale d'informations client lors de "Enregistrer et quitter" (non bloquant)

### Objectif
Quand le courtier clique sur "Enregistrer et quitter", la modale `QuotationSaveDialog` s'ouvre pour collecter nom/prenom/email. Mais c'est **non bloquant** : le courtier peut fermer la modale ou cliquer un bouton "Passer" et le brouillon est sauvegardé quand même (sans infos client).

### Modifications

**Fichier : `GuidedSalesFlow.tsx`**

1. Ajouter un state `saveAndQuitDialogOpen` pour contrôler la modale
2. Le bouton "Enregistrer et quitter" ouvre la modale au lieu d'appeler directement `handleSaveAndQuit`
3. Modifier `handleSaveAndQuit` pour accepter un paramètre optionnel `clientInfo?: { firstName, lastName, email }`
4. Si `clientInfo` est fourni, l'inclure dans `coverage_details` et/ou créer/lier un lead
5. Si la modale est fermée sans saisie (dismiss), appeler `handleSaveAndQuit()` sans infos client — le brouillon est sauvegardé tel quel
6. Ajouter le composant `QuotationSaveDialog` en mode "save" avec pré-remplissage depuis `state.clientIdentification`

**Comportement de la modale :**
- Bouton "Sauvegarder" → sauvegarde avec les infos client renseignées
- Bouton "Annuler" ou fermeture (X) → sauvegarde le brouillon **sans** infos client et redirige vers le portfolio
- Les champs ne sont PAS obligatoires (validation retirée ou rendue optionnelle pour ce mode)

**Approche technique :**
- Réutiliser `QuotationSaveDialog` mais ajouter une prop `optional?: boolean` qui rend les champs non requis
- Quand `optional=true`, le bouton "Annuler" déclenche aussi la sauvegarde (sans infos)
- Le `onOpenChange(false)` (fermeture) déclenche la sauvegarde sans infos

