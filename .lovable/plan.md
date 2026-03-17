

## Analyse des demandes et plan de correction

### 1. Déplacer le scan de la carte grise au début du processus
**Statut : NON pris en compte**

Actuellement, le scan carte grise est dans `SubscriptionFlow.tsx` (étape 4, sous-étape 3 "Documents"). La demande est de le placer au début de la simulation (étape 1).

**Plan :** Ajouter une option de scan carte grise dans `SimulationStep.tsx` à la sous-étape 3 ("Véhicule") pour permettre le pré-remplissage OCR dès la simulation. Réutiliser la logique `handleCarteGriseUpload` existante de `SubscriptionFlow.tsx` en l'extrayant dans un hook partagé ou en la dupliquant dans SimulationStep. Le scan restera aussi disponible à l'étape souscription.

---

### 2. "Tout Risque" au lieu de "Tiers Risques"
**Statut : NON pris en compte**

Dans `FormulaSelectionStep.tsx` ligne 78 : `name: "TIERS RISQUES"` et dans `RecapStep.tsx` ligne 28 : `evolution: "TIERS RISQUES"`.

**Plan :** Renommer en `"TOUT RISQUE"` dans :
- `FormulaSelectionStep.tsx` (FORMULA_DEFINITIONS, tier "evolution")
- `RecapStep.tsx` (planNames)
- `QuoteSummaryCard.tsx` si présent

---

### 3. Supprimer la formule "Suprême"
**Statut : NON pris en compte**

La formule `supreme` existe dans `FormulaSelectionStep.tsx` lignes 104-117 et dans les types `PlanTier`.

**Plan :** 
- Retirer l'entrée `supreme` de `FORMULA_DEFINITIONS` dans `FormulaSelectionStep.tsx`
- Retirer `supreme` de `guaranteesByPlan` et `planNames` dans `RecapStep.tsx`
- Retirer `supreme` du type `PlanTier` dans `types.ts`
- Nettoyer les références dans `autoPremiumCalculator.ts` si présentes

---

### 4. Position du volet "Réduction (BNS)"
**Statut : PARTIELLEMENT pris en compte**

Le `DiscountSelector` est déjà dans `RecapStep.tsx` (ligne 261). Il est bien positionné entre la formule et le décompte de prime. Si la demande est simplement informative, c'est OK. Sinon, il peut être déplacé.

**Plan :** Pas de modification sauf si une position spécifique différente est souhaitée.

---

### 5. Supprimer les virgules dans les montants
**Statut : DÉJÀ pris en compte ✅**

`formatFCFA` dans `formatCurrency.ts` utilise `minimumFractionDigits: 0, maximumFractionDigits: 0` — pas de décimales. `formatFCFADecimal` existe mais n'est utilisé nulle part. C'est bon.

---

### 6. Champs obligatoires conditionnels par canal d'envoi
**Statut : NON pris en compte**

Dans `QuotationSaveDialog.tsx`, l'email est toujours obligatoire (ligne 97-98). La validation ne tient pas compte du canal choisi.

**Plan :** Dans `QuotationSaveDialog.tsx` :
- Si canal = "email" → seul l'email est obligatoire
- Si canal = "whatsapp" ou "sms" → seul le téléphone est obligatoire
- Si canal = "tous" (nouveau) → email ET téléphone obligatoires
- Adapter la fonction `validate()` en conséquence

---

### 7. Ajouter option "Tous les canaux"
**Statut : NON pris en compte**

Les canaux actuels sont : email, whatsapp, sms (lignes 260-283 de QuotationSaveDialog).

**Plan :** Ajouter une option `"tous"` dans le RadioGroup du `QuotationSaveDialog.tsx` avec le label "Tous les canaux".

---

## Résumé des fichiers à modifier

| Fichier | Modifications |
|---|---|
| `SimulationStep.tsx` | Ajouter scan carte grise (OCR) en sous-étape véhicule |
| `FormulaSelectionStep.tsx` | Renommer "TIERS RISQUES" → "TOUT RISQUE", supprimer "SUPRÊME" |
| `RecapStep.tsx` | Renommer dans planNames, supprimer supreme de guaranteesByPlan |
| `types.ts` | Retirer "supreme" de PlanTier |
| `QuotationSaveDialog.tsx` | Ajouter canal "Tous", validation conditionnelle par canal |
| `autoPremiumCalculator.ts` | Nettoyer références supreme si présentes |

