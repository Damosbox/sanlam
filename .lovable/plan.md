

## Restructurer le flux : supprimer le doublon récap souscription, enchaîner Signature → Paiement → Émission

### Problème actuel

1. **Doublon** : L'étape 4 (SubscriptionFlow) a un sub-step 6 "Récapitulatif de souscription" qui fait doublon avec l'étape 5 (SignatureEmissionStep) qui contient déjà le récap global.
2. **Ordre incorrect** : Le bouton "Émettre la police" est sur l'étape de signature (step 5), mais on ne peut pas émettre sans paiement. L'étape 6 (MobilePaymentStep) vient après, ce qui est incohérent.
3. **CTAs incohérents** : Le widget Sales Assistant affiche parfois "Paiement", parfois "Émission de la police" de façon confuse.

### Solution

**Flux corrigé :**
- Étape 4 : Souscription (5 sous-étapes au lieu de 6 — suppression du sub-step 6 récap)
- Étape 5 : Récap global + Signature (sans bouton "Émettre" — le CTA devient "Continuer vers Paiement")
- Étape 6 : Paiement mobile → émission automatique après paiement (avec `IssuanceStep` affiché en step 7 ou en inline après confirmation de paiement)

### Modifications

**1. `src/components/guided-sales/steps/SubscriptionFlow.tsx`**
- Supprimer le sub-step 6 (renderSubStep6 + sa section dans le tableau `SUB_STEPS`)
- Réduire `SUB_STEPS` à 5 éléments (Agent, Localisation, Véhicule, Conducteur, Documents)
- Le sub-step 5 (Documents) appelle `onNext()` directement au lieu de passer à un sub-step 6
- Mettre à jour le CTA du sub-step 5 : "Continuer vers Signature" (au lieu de "Continuer vers Paiement")
- Ajuster les types et la navigation pour 5 sous-étapes max

**2. `src/components/guided-sales/steps/SignatureEmissionStep.tsx`**
- Remplacer le bouton "Émettre la police" par "Continuer vers Paiement"
- Supprimer la logique d'émission locale (`isEmitting`, `isEmitted`, la vue post-émission)
- Le composant appelle `onNext()` (nouvelle prop) quand la signature est validée et les conditions acceptées
- Le récap global + signature restent intacts

**3. `src/components/guided-sales/steps/MobilePaymentStep.tsx`**
- Après le paiement, déclencher automatiquement l'émission de police
- Le CTA passe de "Continuer vers Signature" à "Payer et émettre la police"
- Après confirmation du paiement, appeler `onNext()` pour naviguer vers l'étape d'émission (IssuanceStep)

**4. `src/components/guided-sales/GuidedSalesFlow.tsx`**
- Step 4 : SubscriptionFlow (5 sous-étapes)
- Step 5 : SignatureEmissionStep (récap + signature, nouveau prop `onNext`)
- Step 6 : MobilePaymentStep
- Step 7 : IssuanceStep (documents + cross-sell)
- Importer `IssuanceStep` et l'ajouter en case 7
- Mettre à jour `PHASE_STEPS.finalisation` : `[5, 6, 7]`
- Mettre à jour `getNextLabel()` :
  - Step 4 → "Signature"
  - Step 5 → "Paiement"
  - Step 6 → "Émettre"
  - Les autres inchangés
- Passer `onNext={nextStep}` à `SignatureEmissionStep`
- Passer `onNext={nextStep}` à `MobilePaymentStep` (navigue vers IssuanceStep)

### Résultat

Le flux devient : Souscription (5 sous-étapes) → Récap global + Signature → Paiement → Émission automatique + Documents + Cross-sell. Les CTAs sont cohérents à chaque étape.

