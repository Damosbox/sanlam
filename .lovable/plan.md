

## Plan : Masquer la prime pour les brouillons sans calcul

### Problème
Quand un brouillon est sauvegardé avant l'étape de simulation/calcul, `premium_amount` est stocké avec la valeur `0` (ou une valeur résiduelle). Le tableau affiche "0 FCFA" ou un montant incorrect au lieu de masquer la colonne prime.

### Solution

#### 1. `PendingQuotationsTable.tsx` — Conditionner l'affichage de la prime
Dans la cellule "Prime" (ligne 364-370), afficher la prime uniquement si le brouillon a dépassé l'étape de calcul :

```typescript
// Si c'est un brouillon sans prime calculée → afficher "—"
{quotation.is_draft && (!quotation.premium_amount || quotation.premium_amount === 0) ? (
  <span className="text-muted-foreground">—</span>
) : (
  <>
    <div className="font-medium text-sm">{formatFCFA(quotation.premium_amount)}</div>
    <div className="text-xs text-muted-foreground">
      {frequencyLabels[quotation.premium_frequency] || quotation.premium_frequency}
    </div>
  </>
)}
```

Cependant, le vrai problème est que certains brouillons ont `premium_amount > 0` même sans calcul réel (valeur résiduelle dans l'état). Pour être plus fiable :

#### 2. `GuidedSalesFlow.tsx` — Stocker la prime uniquement si calculée
À la sauvegarde du brouillon (ligne ~605), conditionner la prime sur `simulationCalculated` :

```typescript
premium_amount: finalState.simulationCalculated 
  ? (finalState.calculatedPremium.totalAPayer || 0) 
  : 0,
```

#### 3. `PendingQuotationsTable.tsx` — Affichage conditionnel robuste
Masquer la prime si `premium_amount === 0`, quel que soit le statut (brouillon ou non) :

```typescript
{quotation.premium_amount > 0 ? (
  <>
    <div className="font-medium">{formatFCFA(quotation.premium_amount)}</div>
    <div className="text-xs text-muted-foreground">
      {frequencyLabels[quotation.premium_frequency] || ""}
    </div>
  </>
) : (
  <span className="text-muted-foreground text-sm">—</span>
)}
```

### Fichiers impactés
- `src/components/guided-sales/GuidedSalesFlow.tsx` — ne stocker la prime que si `simulationCalculated`
- `src/components/policies/PendingQuotationsTable.tsx` — masquer la prime si `= 0`

