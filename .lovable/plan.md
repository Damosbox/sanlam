

## Plan : 4 améliorations du parcours de vente guidée Auto

### 1. Mise à jour des formules d'assurance

**Fichier** : `src/components/guided-sales/steps/FormulaSelectionStep.tsx`

Modifications dans `FORMULA_DEFINITIONS` :
- **Ajouter** une formule "TIERS AMELIORE" (nouveau tier `medium`) entre TIERS SIMPLE AMELIORE et TIERS COMPLET, avec garanties intermédiaires (RC + Défense/Recours + Individuel + Avance sur recours + Incendie + Vol). Restriction : minPeriodMonths = 3, pas de restriction d'âge véhicule.
- **Fusionner** TIERS COMPLET et TOUT RISQUE en une seule formule "TOUS RISQUES" sur le tier `medium_plus`. Garanties combinées (inclut Tierce complète + Incendie + Vol + Bris de glaces). Restriction : véhicule <= 5 ans, minPeriodMonths = 6.
- Supprimer l'ancienne formule TOUT RISQUE (tier `evolution`).
- Conserver TIERCE COLLISION inchangée.

**Fichier** : `src/components/guided-sales/types.ts` — Ajouter `"medium"` au type `PlanTier`.

### 2. Upload OCR du permis de conduire

**Fichier** : `src/components/guided-sales/steps/SubscriptionFlow.tsx`

Dans la sous-étape 5 (Conducteur), section "Permis de conduire" :
- Ajouter un bloc `CameraUploadButton` en haut de la card Permis (avant les champs manuels).
- Appeler la Edge Function `ocr-identity` existante avec `documentType: "permis"` pour extraire les données.
- Pré-remplir automatiquement : `licenseNumber`, `licenseCategory` (si extractible), `licenseIssueDate`, et éventuellement nom/prénom du conducteur.
- Afficher un toast avec les champs pré-remplis.

### 3. Supprimer le badge "Option supplémentaire ajoutée"

**Fichier** : `src/components/guided-sales/steps/IssuanceStep.tsx`

Supprimer le bloc conditionnel `{upsellAccepted && (...)}` (lignes 82-91) qui affiche "Option supplémentaire ajoutée à votre contrat".

### 4. Cross-selling en fin de parcours

**Fichier** : `src/components/guided-sales/steps/IssuanceStep.tsx`

Remplacer le badge supprimé par une section "Découvrez nos autres produits" affichant 2 cartes produit compactes :
- **Assurance Habitation** : icone Home, description courte, prix indicatif, bouton "En savoir plus".
- **Pack Obsèques** : icone Heart, description courte, prix indicatif, bouton "En savoir plus".

Les boutons redirigent vers le parcours de vente guidée avec le produit pré-sélectionné (via `navigate` avec query params). Si le produit actuel est `pack_obseques`, proposer Auto + Habitation à la place.

**Fichier** : `src/components/guided-sales/steps/UpsellSidebar.tsx` — Inchangé (reste l'offre latérale avant émission).

---

### Fichiers impactés

| Action | Fichier |
|--------|---------|
| Modifié | `src/components/guided-sales/types.ts` |
| Modifié | `src/components/guided-sales/steps/FormulaSelectionStep.tsx` |
| Modifié | `src/components/guided-sales/steps/SubscriptionFlow.tsx` |
| Modifié | `src/components/guided-sales/steps/IssuanceStep.tsx` |

