

## Plan : Remplacer les 3 formules Auto par les 7 Packs du tarificateur

### Contexte

Le CSV du tarificateur définit **7 packs** pour Auto (401 - Promenades et affaires), alors que l'application n'en propose que 3 (MINI, BASIC, MEDIUM+). Voici les vrais packs avec leurs garanties :

```text
Pack              Garanties ajoutées vs précédent         Assistance
─────────────────────────────────────────────────────────────────────
1. MINI           RC + Recours Tiers Incendie +           Avantage (0 FCFA)
                  Défense Recours + IC/IPT
2. BASIC          + Avance sur recours                    Avantage (0 FCFA)
3. MEDIUM         + Incendie + Vol accessoires +          Confort (38 000)
                  Bris de glaces
4. MEDIUM+        + Vol + Vol à mains armées              Confort (38 000)
5. EVOLUTION      + Tierce complète plafonnée             Relax (55 000)
6. EVOLUTION+     + Tierce collision plafonnée            Relax (55 000)
7. SUPREME        + Tierce complète (non plafonnée)       Relax (55 000)
                  + Bris glaces gratuit + Avance recours gratuite
```

### Modifications

**1. `src/components/guided-sales/types.ts`** — Étendre `PlanTier` :
```typescript
export type PlanTier = "mini" | "basic" | "medium" | "medium_plus" | "evolution" | "evolution_plus" | "supreme";
```
Mettre à jour `initialState.coverage.planTier` de `"basic"` à `"mini"`.

**2. `src/components/guided-sales/steps/CoverageStep.tsx`** — Remplacer les 3 plans auto par 7 cartes avec les garanties exactes du CSV. L'assistance est fixée par pack (pas de choix séparé). Adapter `getRecommendedPlan` pour retourner les bons tiers selon l'âge du véhicule.

**3. `src/utils/autoPremiumCalculator.ts`** — Mettre à jour `PLAN_COVERAGES` pour 7 tiers avec les bonnes combinaisons de garanties optionnelles.

**4. `src/components/guided-sales/steps/RecapStep.tsx`** — Mettre à jour `planNames` (7 entrées) et `guaranteesByPlan` (7 listes de garanties).

**5. `src/components/guided-sales/steps/SignatureEmissionStep.tsx`** — Idem : `planNames` et `guaranteesByPlan` à 7 entrées.

**6. `src/components/guided-sales/steps/FormulaSelectionStep.tsx`** — Remplacer le tableau `plans` de 3 à 7 entrées.

**7. `src/components/guided-sales/QuoteSummaryCard.tsx`** — Adapter la logique de recommandation AI (remplacer les comparaisons `"premium"` par les bons tiers haut de gamme).

**8. `src/components/guided-sales/steps/UnderwritingStep.tsx`** — Adapter les règles de souscription qui vérifient `"premium"` → vérifier les tiers `evolution`/`evolution_plus`/`supreme`.

### Impact Pack Obsèques
Aucun changement : Pack Obsèques garde ses 3 formules (Essentiel/Famille/Élargi) mais utilise les mêmes valeurs `PlanTier`. Il faudra mapper `basic`→`mini`, `standard`→`basic`, `premium`→`medium` pour Pack Obsèques, ou mieux : garder un mapping séparé inchangé côté Pack Obsèques en utilisant les 3 premiers tiers (`mini`, `basic`, `medium`).

### Fichiers modifiés (8 fichiers)
- `src/components/guided-sales/types.ts`
- `src/components/guided-sales/steps/CoverageStep.tsx`
- `src/utils/autoPremiumCalculator.ts`
- `src/components/guided-sales/steps/RecapStep.tsx`
- `src/components/guided-sales/steps/SignatureEmissionStep.tsx`
- `src/components/guided-sales/steps/FormulaSelectionStep.tsx`
- `src/components/guided-sales/QuoteSummaryCard.tsx`
- `src/components/guided-sales/steps/UnderwritingStep.tsx`

