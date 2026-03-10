

## Plan : Supprimer les décimales dans le détail de la prime

### Problème
Les montants dans le détail de la prime affichent des virgules (ex: "123 456,00 FCFA") via `formatFCFADecimal`. Il faut utiliser `formatFCFA` (entiers, sans virgule) partout dans les parcours.

### Changement
Remplacer tous les appels à `formatFCFADecimal` par `formatFCFA` dans les 3 fichiers concernés :

| Fichier | Occurrences |
|---------|-------------|
| `src/components/guided-sales/QuoteSummaryCard.tsx` | 6 lignes |
| `src/components/guided-sales/steps/RecapStep.tsx` | ~10 lignes |
| `src/components/guided-sales/steps/SignatureEmissionStep.tsx` | ~10 lignes |

Supprimer l'import `formatFCFADecimal` de chaque fichier (garder uniquement `formatFCFA`).

