

# Sprint 3 & 4 : Moteur de Calcul Dynamique + Integration Vente Guidee

## Vue d'ensemble

Ce plan transforme les regles de calcul stockees en base (Sprint 1-2) en un moteur d'execution fonctionnel, avec simulation dans l'editeur admin et integration dans le parcours de vente guide du courtier.

---

## Sprint 3 : Moteur d'Execution + Simulation + Tables de Reference

### 3.1 Moteur d'execution des formules (Edge Function)

**Fichier** : `supabase/functions/execute-calc-rule/index.ts`

Rewrite complet de l'ancienne edge function `calculate-premium` (qui est hard-codee) en un moteur generique qui :

1. Recoit `calc_rule_id` + `parameters` (valeurs saisies par le courtier) + `selected_formula_code` (pack choisi)
2. Charge la regle depuis `calculation_rules`
3. Execute la `base_formula` avec un interpreteur securise (pas de `eval`) :
   - Utilise une approche de remplacement de variables : `{param_code}` remplace par la valeur
   - Supporte les operations arithmetiques de base (+, -, *, /, parentheses)
   - Supporte les fonctions : `MIN()`, `MAX()`, `IF(condition, val_true, val_false)`, `LOOKUP(table_code, key)`
4. Applique les taxes actives (somme des taux * prime nette)
5. Ajoute les frais fixes
6. Retourne le breakdown complet : prime nette, taxes detaillees, frais, total

**Interpreteur de formule** (dans le meme fichier) :
- Tokenizer : decoupe la formule en tokens (nombres, operateurs, variables, fonctions)
- Parser : construit un arbre d'expression (AST)
- Evaluator : parcourt l'AST avec le contexte des variables
- Securite : pas d'acces au systeme, uniquement les variables declarees dans `parameters`

**Exemple de formule supportee** :
```text
base_rc * coeff_usage * coeff_energie * coeff_bns + LOOKUP(assistance, niveau_assistance)
```

### 3.2 Tables de reference (UI + Stockage)

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx` (modifier)

Ajouter une nouvelle section Accordion "Tables de reference" qui permet de :
- Creer des tables cle-valeur (ex: `assistance` -> `{avantage: 0, confort: 43510, relax: 62975}`)
- Creer des tables a tranches (ex: `puissance_fiscale` -> `[{min: 1, max: 5, value: 35000}, ...]`)
- Chaque table a un `code` (reference dans les formules via `LOOKUP`)

**Type** : `src/components/admin/calc-rules/types.ts` (modifier)
```typescript
export interface CalcRuleTableRef {
  id: string;
  code: string;
  name: string;
  type: "key_value" | "brackets";
  data: Record<string, number> | Array<{min: number; max: number; value: number}>;
}
```

Le champ `tables_ref` existant en base (JSONB) stocke ces tables directement dans la regle.

### 3.3 Simulation dans l'editeur

**Fichier** : `src/components/admin/calc-rules/CalcRuleSimulator.tsx` (creer)

Composant ajoute en bas de l'editeur de regle :
- Genere automatiquement un formulaire a partir des `parameters` de la regle (code/label/type)
- Bouton "Tester le calcul" qui appelle l'edge function `execute-calc-rule`
- Affiche le resultat : prime nette, detail des taxes, frais, total
- Affiche les erreurs de formule (variable inconnue, syntaxe invalide)
- Permet de tester plusieurs jeux de donnees

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx` (modifier)
- Integrer `CalcRuleSimulator` dans un nouvel Accordion "Simulation"
- Passer les `parameters`, `formulas`, `taxes`, `fees`, `tables_ref` au simulateur

### 3.4 Configuration Edge Function

**Fichier** : `supabase/config.toml` (ne pas modifier manuellement)
- L'edge function `execute-calc-rule` sera deploye automatiquement avec `verify_jwt = false` (validation dans le code)

---

## Sprint 4 : Integration dans la Vente Guidee

### 4.1 Chargement dynamique des regles

**Fichier** : `src/hooks/useProductCalcRule.ts` (creer)

Hook React qui :
1. Recoit un `product_type` (ex: "auto")
2. Charge le produit correspondant depuis `products`
3. Charge la regle de calcul principale via `product_calc_rules` (is_primary = true)
4. Retourne : la regle, ses parametres, ses formules, son etat de chargement
5. Cache avec React Query (`queryKey: ["product-calc-rule", productType]`)

### 4.2 Formulaire de simulation dynamique

**Fichier** : `src/components/guided-sales/steps/SimulationStep.tsx` (modifier)

Transformation progressive :
- Charge la regle via `useProductCalcRule`
- Si une regle est trouvee : genere les champs dynamiquement depuis `rule.parameters`
- Si pas de regle : fallback sur le formulaire statique actuel (compatibilite)
- Les valeurs saisies sont stockees dans un nouveau champ `state.dynamicParameters: Record<string, unknown>`

### 4.3 Calcul de prime dynamique

**Fichier** : `src/components/guided-sales/GuidedSalesFlow.tsx` (modifier)

- Nouveau handler `handleDynamicCalculate()` :
  1. Appelle l'edge function `execute-calc-rule` avec `calc_rule_id` + valeurs des parametres
  2. Mappe le resultat vers `calculatedPremium` (format existant)
  3. Fallback sur `calculateAutoPremium()` si pas de regle liee
- Le `QuoteSummaryCard` continue de fonctionner sans modification (meme format de donnees)

### 4.4 Types mis a jour

**Fichier** : `src/components/guided-sales/types.ts` (modifier)
- Ajouter `dynamicParameters?: Record<string, unknown>` dans `GuidedSalesState`
- Ajouter `calcRuleId?: string` pour tracker la regle utilisee

---

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| `supabase/functions/execute-calc-rule/index.ts` | Creer (moteur de formule) |
| `src/components/admin/calc-rules/types.ts` | Modifier (ajouter CalcRuleTableRef) |
| `src/components/admin/calc-rules/CalcRuleEditor.tsx` | Modifier (tables ref + simulation) |
| `src/components/admin/calc-rules/CalcRuleSimulator.tsx` | Creer |
| `src/hooks/useProductCalcRule.ts` | Creer |
| `src/components/guided-sales/types.ts` | Modifier (dynamicParameters) |
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Modifier (calcul dynamique) |
| `src/components/guided-sales/steps/SimulationStep.tsx` | Modifier (champs dynamiques) |

---

## Details techniques

### Interpreteur de formule (securise, sans eval)

L'interpreteur supporte :
- **Variables** : `{puissance_fiscale}`, `{coeff_usage}` - remplacees par les valeurs des parametres
- **Operateurs** : `+`, `-`, `*`, `/`, `(`, `)`
- **Comparaisons** : `>`, `<`, `>=`, `<=`, `==`
- **Fonctions** :
  - `MIN(a, b)` / `MAX(a, b)` : minimum/maximum
  - `IF(condition, val_true, val_false)` : conditionnel
  - `LOOKUP(table_code, key)` : recherche dans tables de reference
  - `BRACKET(table_code, value)` : recherche par tranches
- **Securite** : aucun acces au runtime Deno, uniquement les variables declarees

### Strategie de fallback

Le parcours de vente guide continue de fonctionner meme sans regle de calcul liee au produit :
1. Si regle trouvee -> moteur dynamique (edge function)
2. Si pas de regle -> calculateurs statiques existants (`autoPremiumCalculator.ts`, `packObsequesPremiumCalculator.ts`)

Cela permet une migration progressive produit par produit.

### Format de reponse du moteur

```text
{
  primeNette: number,
  taxes: [{code, name, rate, amount}],
  fees: [{code, name, amount}],
  totalTaxes: number,
  totalFees: number,
  primeTTC: number,
  totalAPayer: number
}
```

Ce format est mappe vers le `calculatedPremium` existant pour compatibilite avec `QuoteSummaryCard`.

