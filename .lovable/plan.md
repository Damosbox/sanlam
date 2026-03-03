

## Ajouter un filtre de periodicite a la section Renouvellement

### Contexte

La page Renouvellement (onglet "Renouvellements" dans `PoliciesPage` et page dediee `RenewalsPage`) affiche les contrats expirant dans les 3 prochains mois en dur. Il n'y a pas de filtre de periodicite. Le composant `PeriodFilter` existe deja et est utilise sur le dashboard courtier.

### Modifications

**1. `src/pages/broker/PoliciesPage.tsx`** — Ajouter le `PeriodFilter` dans l'onglet renouvellements

- Importer `PeriodFilter` et `DateRange`
- Ajouter un state `dateRange` initialise a l'annee d'exercice
- Placer le `PeriodFilter` a cote du `ProductSelector` dans la barre de filtres
- Passer `dateRange` au `RenewalPipelineTable`
- Mettre a jour le fetch des counts pour utiliser `dateRange` au lieu du 3 mois en dur

**2. `src/pages/broker/RenewalsPage.tsx`** — Meme ajout sur la page dediee

- Importer et ajouter `PeriodFilter` dans le header, a cote du `ProductSelector`
- Ajouter state `dateRange`
- Passer `dateRange` au `RenewalPipelineTable`, `ContactIndicatorsTable`, `RenewalDecisionCharts`
- Rendre les KPI cards dynamiques en fonction de la periode (ou les garder statiques pour l'instant)

**3. `src/components/policies/RenewalPipelineTable.tsx`** — Accepter une prop `dateRange`

- Ajouter `dateRange?: { from: Date; to: Date }` aux props
- Remplacer le filtre "3 mois en dur" : si `dateRange` est fourni, filtrer `end_date` entre `from` et `to` ; sinon garder le comportement actuel (3 mois)
- Ajouter `dateRange` au `queryKey` pour refetch automatique

### Resultat

Le courtier pourra choisir la periodicite (annee, mois, trimestre, 6 mois, personnalise) sur la vue renouvellement. La pipeline se mettra a jour en consequence.

