

## Page Récapitulative après le choix de la formule

### Contexte

Actuellement le flux est : Simulation (step 1) → Formules (step 2) → Souscription (step 3). L'utilisateur veut insérer une **page récapitulative** entre le choix de la formule et la souscription, qui résume toutes les informations avant de s'engager.

### Approche

Ajouter une nouvelle étape (step 3 = Récap) et décaler les étapes suivantes (+1). La page récap restera dans la phase "construction" et affichera un résumé complet : véhicule, formule choisie, garanties, décompte de prime, et les actions (Sauvegarder, Envoyer, Souscrire).

### Modifications

**1. Nouveau composant : `src/components/guided-sales/steps/RecapStep.tsx`**

Page récapitulative avec sections :
- **Véhicule** : marque, modèle, puissance fiscale, énergie, valeur vénale, usage, date de circulation
- **Formule sélectionnée** : plan (MINI/BASIC/TOUT RISQUE), durée du contrat, date d'effet
- **Garanties incluses** : liste des garanties selon le plan + assistance si sélectionnée
- **Décompte de prime** : Prime Nette, Frais d'accessoires, Taxes, Prime TTC, FGA, CEDEAO, **Total à payer** (réutilise les tooltips de `QuoteSummaryCard`)
- **Actions** : Sauvegarder, Envoyer, SOUSCRIRE (déplacés depuis `FormulaSelectionStep`)

Chaque section aura un bouton "Modifier" pour revenir à l'étape concernée.

**2. Fichier : `GuidedSalesFlow.tsx`**

- Mettre à jour `PHASE_STEPS` : `construction: [2, 3]` (formule + récap)
- Décaler les étapes : souscription → step 4, paiement → step 5, signature → step 6
- Mettre à jour `getPhaseFromStep`, `renderStep`, `getNextLabel`, `handleEdit`
- Le skip pour produits Vie (pack_obseques) saute du step 1 au step 4 (souscription)
- Importer et rendre `RecapStep` au step 3
- Déplacer les actions Sauvegarder/Envoyer/Souscrire de `FormulaSelectionStep` vers `RecapStep`

**3. Fichier : `FormulaSelectionStep.tsx`**

- Supprimer le bloc "Résumé prix" et les boutons d'actions (Sauvegarder, Envoyer, Souscrire)
- Supprimer le `QuotationSaveDialog`
- Le bouton principal devient "Voir le récapitulatif" qui appelle `onSubscribe` (renommé `onNext`)
- Simplifier les props (supprimer `onSaveQuote`)

**4. Fichiers impactés par le décalage des numéros d'étape :**

- `PhaseNavigation.tsx` : aucun changement (basé sur les phases, pas les steps)
- `QuoteSummaryCard.tsx` / `SalesAssistant.tsx` / `MobileCoverageStickyBar.tsx` : ajuster les conditions si elles référencent des numéros d'étape

### Résultat

Le flux devient : Simulation → Formule → **Récap** → Souscription → Paiement → Signature. La page récap centralise le décompte de prime détaillé et les actions de devis, offrant au courtier une vue claire avant de s'engager dans la souscription.

