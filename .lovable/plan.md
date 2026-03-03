

## Corrections sur les champs valeur et calendrier

### 3 modifications demandées

**1. Validation valeur neuve > valeur vénale**
- Dans `NeedsAnalysisStep.tsx` et `SimulationStep.tsx` : ajouter un message d'erreur sous le champ "Valeur vénale" si `vehicleVenalValue >= vehicleNewValue`
- Bloquer visuellement avec une bordure rouge et un texte d'erreur

**2. Séparateur de milliers sur les champs monétaires**
- Remplacer les `<Input type="number">` par des `<Input type="text">` avec formatage dynamique
- Afficher `7 000 000` au lieu de `7000000` — formater avec `Intl.NumberFormat('fr-FR')` à l'affichage
- Parser la valeur nettoyée (sans espaces) au `onChange` pour stocker le nombre brut dans le state

**3. Calendrier en français**
- Dans `src/components/ui/calendar.tsx` : passer `locale={fr}` de `date-fns/locale` au composant `DayPicker` pour que les mois et jours s'affichent en français (Mars, Lundi, etc.)

### Fichiers modifiés

| Fichier | Action |
|---|---|
| `src/components/ui/calendar.tsx` | Ajouter `locale={fr}` au DayPicker |
| `src/components/guided-sales/steps/NeedsAnalysisStep.tsx` | Formater valeurs avec séparateur + validation neuf > vénal |
| `src/components/guided-sales/steps/SimulationStep.tsx` | Idem |

