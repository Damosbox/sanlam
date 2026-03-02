

## Plan: Tableau de bord courtier - Retrait Contact Indicators + Filtre de periodicite

### 1. Retirer le bloc "Indicateur de contact"

Suppression de `ContactIndicatorsCard` du layout du dashboard. La colonne gauche ne contiendra plus que `RenewalRateCards`.

**Fichier:** `src/pages/broker/DashboardPage.tsx`
- Retirer l'import de `ContactIndicatorsCard`
- Retirer `<ContactIndicatorsCard selectedProduct={selectedProduct} />` de la grille

### 2. Ajouter un filtre de periodicite global

Ajout d'un composant `PeriodFilter` dans le header du dashboard, avec les options suivantes :

| Option | Valeur | Description |
|--------|--------|-------------|
| Annee d'exercice | `fiscal_year` | Du 1er janvier au 31 decembre de l'annee en cours (defaut) |
| Ce mois | `month` | Mois en cours |
| Ce trimestre | `quarter` | Trimestre en cours |
| 6 derniers mois | `6months` | 6 mois glissants |
| Personnalise | `custom` | Selecteur de dates debut/fin |

**Nouveau fichier:** `src/components/broker/dashboard/PeriodFilter.tsx`
- Composant `Select` compact avec les options ci-dessus
- Expose `dateRange: { from: Date; to: Date }` via un callback `onPeriodChange`
- L'option "Personnalise" affiche deux date pickers inline (debut/fin)
- Valeur par defaut : `fiscal_year` (annee en cours)

### 3. Propager le filtre aux blocs du dashboard

**Fichier:** `src/pages/broker/DashboardPage.tsx`
- Ajouter un state `period` et `dateRange`
- Placer le `PeriodFilter` a cote du `ProductSelector` dans le header
- Passer `dateRange` en props a chaque bloc :
  - `KPICard` : les requetes subscriptions/leads seront filtrees par `created_at` dans le `dateRange`
  - `RenewalRateCards` : filtre les subscriptions par `end_date` dans le `dateRange`
  - `LeadsPipeline` : filtre les leads par `created_at` dans le `dateRange`
  - `AIRecommendations` : pas de filtre (recommandations globales)
  - `NewsBanner` : pas de filtre (actualites)

**Fichiers modifies pour accepter `dateRange`:**
- `src/components/broker/dashboard/RenewalRateCards.tsx` : ajouter prop `dateRange` et filtrer `.gte('end_date', from).lte('end_date', to)`
- `src/components/broker/dashboard/LeadsPipeline.tsx` : ajouter prop `dateRange` et filtrer `.gte('created_at', from).lte('created_at', to)`
- `src/pages/broker/DashboardPage.tsx` : filtrer la requete `fetchKPIStats` avec `.gte('start_date', from).lte('start_date', to)` pour les subscriptions et `.gte('created_at', from).lte('created_at', to)` pour les leads

### 4. Details techniques

```text
+--------------------------------------------------+
| Header (Greeting + Product Selector)             |
| [PeriodFilter: Annee d'exercice v]               |
+--------------------------------------------------+
| KPI Cards (4 cols) -- filtrees par dateRange     |
+--------------------------------------------------+
| Renewal Rate (7 cols) | Pipeline + IA (5 cols)   |
|   filtrees            |   Pipeline filtree        |
+--------------------------------------------------+
| News Banner (full width, non filtree)            |
+--------------------------------------------------+
```

**Calcul du dateRange par periode:**
- `fiscal_year` : 1er janvier annee courante -> 31 decembre annee courante
- `month` : 1er du mois courant -> dernier jour du mois courant
- `quarter` : debut du trimestre courant -> fin du trimestre courant
- `6months` : date du jour - 6 mois -> date du jour
- `custom` : dates selectionnees par l'utilisateur

**Fichiers concernes:**
- Nouveau : `src/components/broker/dashboard/PeriodFilter.tsx`
- Modifie : `src/pages/broker/DashboardPage.tsx`
- Modifie : `src/components/broker/dashboard/RenewalRateCards.tsx`
- Modifie : `src/components/broker/dashboard/LeadsPipeline.tsx`

