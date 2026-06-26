## Objectif
Ajouter une pagination cohérente, **côté client, 25 lignes par défaut**, sur **tous les tableaux** de l'application (Admin, Broker, Customer).

## Pattern unifié

Création d'un composant réutilisable + d'un hook pour éviter de dupliquer la logique 30 fois.

### 1. `src/hooks/usePagination.ts` (nouveau)
- Entrée : `items: T[]`, `defaultPageSize = 25`.
- Sortie : `pageItems`, `page`, `setPage`, `pageSize`, `setPageSize`, `totalPages`, `totalItems`.
- Réinitialise automatiquement à la page 1 quand `items.length` change (ex. après un filtre/recherche).
- Persistance optionnelle via un `storageKey` (sessionStorage) pour mémoriser le choix utilisateur sur le sélecteur de taille.

### 2. `src/components/ui/data-table-pagination.tsx` (nouveau)
- Footer standard à coller sous chaque `<Table>` :
  - Texte d'info : « 26–50 sur 137 éléments ».
  - Sélecteur taille de page : 10 / 25 / 50 / 100.
  - Contrôles : ⏮ ◀ « Page 2 / 6 » ▶ ⏭ (boutons désactivés aux bornes).
- Responsive : sur mobile (< 640 px) le sélecteur passe sous les flèches.
- Props minimales : `page, setPage, pageSize, setPageSize, totalItems`.

## Tableaux à équiper

Périmètre exhaustif organisé par espace pour traçabilité.

### Admin (16)
- `AdminSubscriptionsTable`, `AdminClaimsTable`, `AdminUsersTable`
- `admin/AdminAuditLogs`, `admin/AdminSurveySends`
- `admin/approvals/ApprovalsTable`
- `admin/documents/DocumentTemplatesList`
- `admin/ocr/OCRScansTable`
- `admin/products/ProductsList`
- `admin/scoring/ScoringCoverageCard` (liste non scorés), `admin/scoring/ScoringJobMonitor` (historique runs), `admin/scoring/ScoringManualOverrideTable`
- `admin/FormTemplatesListTable`
- `admin/agent-detail/AgentLeadsTab`, `AgentPortfolioTab`, `AgentQuotationsTab`
- Pages tableau : `AgentPerformancePage`, `AgentsPortfolioPage`, `BrokerNewsPage`, `CalcDocsPage`, `CalcRulesPage`, `CalcVariablesPage`, `ComplianceDashboardPage`, `ConversionsPage`, `DsarPage`, `LossRatioPage`
- `ClientsPage` : déjà paginée → on remplace son implémentation locale par le composant commun pour homogénéiser.

### Broker (8)
- `BrokerClaimsTable`, `BrokerClients`, `BrokerQuotations`, `BrokerSubscriptions`
- `portfolio/PortfolioDataTable`
- `policies/PendingQuotationsTable`, `policies/RenewalPipelineTable`
- `renewals/RenewalsPipelineCard`
- `leads/LeadsDataTable`
- `broker/stats/ContactIndicatorsTable`
- `broker/CommissionsPage`

### Customer (1)
- `CustomerSubscriptionsTable`

### Hors périmètre (volontaire)
- `ProductComparator` : tableau comparatif fixe ≤ 4 colonnes produit, pas de scaling.
- `admin/CsvUserImportDialog` : preview d'import limitée par nature.
- Cards/listes non tabulaires (LeadCards, etc.) : non concernées par la demande.

## Comportements transverses

- **Filtres/recherche** : tous les composants paginés appliquent les filtres **avant** la pagination ; le hook reset à la page 1 sur changement de longueur.
- **Sélection multiple** (Approvals, Renewals, OCR) : la sélection est conservée entre pages (basée sur `id`), et la case d'en-tête ne coche que la page courante.
- **Loading / vide** : skeleton et empty state restent affichés à la place du tableau ; le footer de pagination n'apparaît que si `totalItems > 0`.
- **Export CSV** : continue d'exporter **toutes** les lignes filtrées, pas seulement la page courante.

## Détails techniques

- Utilise les composants shadcn existants `Pagination*` et `Select` (déjà présents dans `src/components/ui/pagination.tsx`).
- Pas de dépendance ajoutée (pas de TanStack Table) — on reste sur le pattern `useState` + `slice` déjà en place.
- Aucun changement de schéma DB.
- Aucun changement des hooks de fetch (toujours `select *` puis filtrage/pagination en mémoire). Si un tableau dépasse plus tard 1 000 lignes, migration ciblée vers server-side au cas par cas.

## Livraison
1. Création hook + composant commun.
2. Branchement sur les 8 tableaux Broker + Customer.
3. Branchement sur les 16+ tableaux Admin (par lots cohérents par page pour limiter les diffs).
4. Refactor de `ClientsPage` pour utiliser le composant commun.
5. Vérification visuelle rapide sur 3–4 pages clés (Subscriptions Admin, Portfolio Broker, Audit Logs, Approbations).