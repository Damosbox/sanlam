

## ✅ Plan implémenté : OCR identité en premier bloc + Screening LCB-FT automatique

### Principe UX

Le bloc **"Scanner une pièce d'identité"** (CameraUploadButton) est toujours le **tout premier élément** de chaque card qui collecte des données d'identité. L'agent scanne d'abord, les champs en dessous se pré-remplissent, puis le screening LCB-FT se lance silencieusement en arrière-plan.

### Changements implémentés

#### 1. `PackObsequesSubscriptionFlow.tsx` — Steps 1 et 2
- ✅ OCR déplacé en **premier bloc** avant les champs Type de pièce / Numéro
- ✅ Screening LCB-FT chaîné après OCR réussi
- ✅ Badge vert "Conformité validée" ou alerte bloquante
- ✅ Bouton "Suivant" désactivé si `screeningBlocked`

#### 2. `SubscriptionFlow.tsx` — Sub-step 3 (Documents)
- ✅ Bloc OCR identité ajouté en **premier** dans la card Documents
- ✅ Screening LCB-FT chaîné après extraction
- ✅ Pré-remplissage nom/prénom propriétaire
- ✅ Validation sub-step 3 inclut vérification screening

#### 3. `SubscriptionFlow.tsx` — Sub-step 5 (Conducteur)
- ✅ Bloc OCR identité en premier si pas encore scanné à la sub-step 3
- ✅ Badge de conformité affiché en lecture seule si déjà validé
- ✅ Screening LCB-FT si pas encore effectué

#### 4. `ClientIdentificationStep.tsx`
- ✅ OCR déplacé du Collapsible vers le **tout premier bloc** de la card
- ✅ Screening LCB-FT chaîné après extraction OCR
- ✅ Badge vert ou alerte bloquante visible immédiatement
- ✅ `canProceed` bloqué si screening échoué
