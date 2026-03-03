

## Étape 6/6 — Récap global + Validation + Signature

### Objectif

Transformer l'étape 6 (`SignatureEmissionStep`) en un récapitulatif global qui regroupe :
1. Les données de la **cotation** (véhicule, formule, garanties) — reprises du `RecapStep` (étape 3)
2. Les données de la **souscription** (agent, localisation, véhicule immatriculé, conducteur, documents) — reprises du sub-step 6 de `SubscriptionFlow`
3. Le **décompte de prime** détaillé avec tooltips
4. Les **cases de validation légale** (CGU + partage de données)
5. La **signature digitale** du client
6. Le bouton **Émettre la police**

La vue post-émission (documents générés, n° de police) reste inchangée.

### Modifications

**Fichier : `src/components/guided-sales/steps/SignatureEmissionStep.tsx`**

Réécrire le contenu principal (état non-émis) pour inclure dans l'ordre :

1. **Section Véhicule** (depuis `state.needsAnalysis`) : marque, modèle, puissance fiscale, énergie, valeur vénale, places, date de circulation — avec bouton "Modifier" vers step 1
2. **Section Formule & Garanties** (depuis `state.coverage`) : badge plan, garanties incluses, durée, date d'effet — avec bouton "Modifier" vers step 2
3. **Section Souscription** : Agent, Localisation, Véhicule immatriculé, Conducteur, Documents (depuis `state.subscription`) — avec bouton "Modifier" vers step 4
4. **Décompte de prime** : Prime Nette, Frais, Taxes, Prime TTC, FGA, CEDEAO, Total — avec tooltips (réutiliser le pattern `PremiumLine` du `RecapStep`)
5. **Validation légale** : 2 checkboxes (CGU + partage données) — existant, inchangé
6. **Signature digitale** : zone de signature + bouton — existant, inchangé
7. **Bouton Émettre** — existant, inchangé

**Props** : Ajouter `onEditStep: (step: number) => void` pour permettre la navigation vers les étapes antérieures (simulation, formule, souscription).

**Fichier : `src/components/guided-sales/GuidedSalesFlow.tsx`**

Passer `onEditStep={goToStep}` au composant `SignatureEmissionStep` en plus des props existantes.

### Résultat

L'étape 6/6 devient un récapitulatif complet et final du contrat (cotation + souscription + prime), suivi des validations légales et de la signature, avant l'émission de la police.

