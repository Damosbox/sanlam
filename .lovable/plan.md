

## Simplifier la page Renouvellement

### Ce qui change

- Supprimer les onglets Tabs (Vue d'ensemble, Indicateurs, Pipeline) — la page affiche directement le tableau pipeline sans tabs
- Supprimer les imports `ContactIndicatorsTable`, `RenewalDecisionCharts`, `Tabs*`, `PieChart`, `TrendingUp`
- Garder les 4 blocs KPI en haut (Taux renouvellement, Clients atteints, A contacter, Taux churn) et les rendre cliquables pour filtrer le tableau :
  - Clic sur "Taux renouvellement" → filtre `renewalFilter = "renewed"`
  - Clic sur "Clients atteints" → filtre `contactFilter = "contacted"`
  - Clic sur "A contacter" → filtre `contactFilter = "not_contacted"`
  - Clic sur "Taux churn" → filtre `renewalFilter = "lost"`
  - Re-clic sur le bloc actif → reset du filtre correspondant à `"all"`
- Ajouter un état visuel (bordure colorée) sur le bloc actif pour indiquer le filtre en cours
- Le `RenewalStatusToggles` et le `RenewalPipelineTable` restent en dessous directement (sans Card wrapper de tab)

### Fichier modifie

| Fichier | Action |
|---|---|
| `src/pages/broker/RenewalsPage.tsx` | Modifier — supprimer tabs, rendre les KPI cards interactives |

