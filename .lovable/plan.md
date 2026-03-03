

## Ajouter Hybride et Électrique aux options d'énergie

### Constat

- Le type `EnergyType` dans `types.ts` inclut déjà `"hybride" | "electrique"`
- Le calculateur de prime (`autoPremiumCalculator.ts`) a déjà les coefficients pour les 4 énergies (essence: 1.0, gasoil: 1.05, hybride: 0.95, électrique: 0.90)
- Seul le dropdown UI dans `SimulationStep.tsx` est limité à 2 options (ligne 34-37)

### Modification

| Fichier | Action |
|---|---|
| `src/components/guided-sales/steps/SimulationStep.tsx` | Ajouter `{ value: "hybride", label: "Hybride" }` et `{ value: "electrique", label: "Électrique" }` dans le tableau `energyOptions` (lignes 34-37) et retirer le commentaire "Only Essence and Gasoil" |

Aucun autre fichier à modifier — le backend de calcul gère déjà les 4 valeurs.

