# Homogénéisation des tableaux (filtres, tris, export)

## Objectif

Tous les tableaux de l'application doivent partager la **même structure de barre d'outils** au-dessus du tableau, avec des filtres et des tris **pertinents pour le domaine métier** de chaque page, et un bouton d'export CSV à droite.

## 1. Composant partagé `DataTableToolbar`

Un seul composant réutilisable placé dans `src/components/ui/data-table-toolbar.tsx`, structuré comme suit :

```text
┌──────────────────────────────────────────────────────────────┐
│ [🔍 Recherche]  [Filtre 1 ▾] [Filtre 2 ▾] [Tri ▾]   [⬇ CSV] │
└──────────────────────────────────────────────────────────────┘
```

Props :

- `searchPlaceholder?: string`, `searchValue`, `onSearchChange`
- `filters`: tableau de `{ label, value, onChange, options: [{label,value}] }`
- `sort`: `{ value, onChange, options: [{label,value}] }`
- `onExport?: () => void`, `exportLabel?: string`
- `extraActions?: ReactNode` (pour boutons spécifiques type "Nouveau", "Importer")

Règles :

- Recherche à gauche, filtres au centre, tri juste avant l'export, **export toujours en haut à droite** (`ml-auto`).
- Largeur des `Select` : 180–220 px.
- Sur mobile : empilement (`flex-wrap`), export reste en dernière position.
- Export CSV : utilitaire commun `src/lib/export-csv.ts` (BOM UTF-8, échappement guillemets, nom de fichier `{entité}_{YYYY-MM-DD}.csv`).

## 2. Cartographie page par page

Pour chaque tableau identifié, voici la configuration filtres + tris.

### Espace Admin


| Page / composant                                         | Filtres                                                                 | Tris                                                                                                   | Export |
| -------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| **Sinistres** `AdminClaimsTable`                         | Statut, Non assignés (toggle), Type sinistre                            | Sinistre récent / ancien, Création récente / ancienne, Estimation ↓/↑, Date de déclaration de sinistre | ✓      |
| **Souscriptions** `AdminSubscriptionsTable`              | Statut, Produit, Période (30j/90j/an)                                   | Date souscription récente / ancienne, Prime ↓/↑                                                        | ✓      |
| **Renouvellements – Pipeline** `RenewalsPipelineCard`    | Statut renouvellement, Agence, Produit, Échéance (≤7j / ≤30j / >30j)    | Échéance la plus proche, Prime ↓, Dernière relance récente, Score ↓                                    | ✓      |
| **Renouvellements – Approbations** `ApprovalsTable`      | Statut, Type (réduction / bonus-malus)                                  | Plus récente / ancienne, % d'ajustement ↓                                                              | ✓      |
| **Clients Sanlam** `ClientsPage`                         | Type (client / lead), Agent rattaché, Palier scoring (Bronze/Argent/Or) | Nom A→Z, Création récente, Score ↓                                                                     | ✓      |
| **Utilisateurs** `AdminUsersTable`                       | Rôle, Statut compte                                                     | Création récente / ancienne, Nom A→Z                                                                   | ✓      |
| **Audit logs** `AdminAuditLogs`                          | Action, Acteur, Période                                                 | Date récente / ancienne                                                                                | ✓      |
| **Surveys envoyés** `AdminSurveySends`                   | Canal, Statut envoi                                                     | Envoi récent / ancien, Taux réponse ↓                                                                  | ✓      |
| **OCR scans** `OCRScansTable`                            | Type document, Statut                                                   | Date récente / ancienne, Confiance ↓                                                                   | ✓      |
| **Produits** `ProductsList`                              | Catégorie, Statut (actif / désactivé)                                   | Nom A→Z, Mise à jour récente                                                                           | ✓      |
| **Templates documents** `DocumentTemplatesList`          | Type, Produit                                                           | Mise à jour récente, Nom A→Z                                                                           | ✓      |
| **Templates formulaires** `FormTemplatesListTable`       | Produit, Canal (B2B/B2C)                                                | Mise à jour récente, Nom A→Z                                                                           | ✓      |
| **Override scoring manuel** `ScoringManualOverrideTable` | Statut demande, Demandeur                                               | Demande récente, Écart de score ↓                                                                      | ✓      |


### Espace Broker


| Page / composant                                      | Filtres                                      | Tris                                     | Export |
| ----------------------------------------------------- | -------------------------------------------- | ---------------------------------------- | ------ |
| **Sinistres** `BrokerClaimsTable`                     | Statut, Type sinistre                        | Sinistre récent / ancien, Estimation ↓   | ✓      |
| **Souscriptions** `BrokerSubscriptions`               | Statut, Produit                              | Date récente, Prime ↓                    | ✓      |
| **Devis** `BrokerQuotations`                          | Statut, Produit, Validité (active / expirée) | Création récente, Montant ↓              | ✓      |
| **Clients** `BrokerClients`                           | Palier scoring, Produit souscrit             | Nom A→Z, Création récente, Score ↓       | ✓      |
| **Portefeuille** `PortfolioDataTable`                 | Produit, Statut police                       | Prime ↓, Échéance proche                 | ✓      |
| **Leads** `LeadsDataTable`                            | Statut, Source, Produit d'intérêt            | Création récente, Dernier contact récent | ✓      |
| **Devis en attente** `PendingQuotationsTable`         | Produit                                      | Création récente, Montant ↓              | ✓      |
| **Pipeline renouvellement** `RenewalPipelineTable`    | Statut, Produit, Échéance                    | Échéance proche, Prime ↓                 | ✓      |
| **Souscriptions client** `CustomerSubscriptionsTable` | Statut                                       | Date récente, Prime ↓                    | –      |


## 3. Détails techniques

- **Aucune logique métier modifiée** : seules les présentations (toolbar) et un tri/filtrage client-side sont ajoutés ou homogénéisés.
- Tri **par défaut** : toujours le plus récent en premier (date métier la plus pertinente : sinistre, souscription, échéance, etc.).
- L'état (`searchTerm`, `filters`, `sortBy`) reste local au composant ; pas de persistance pour ne pas surprendre les utilisateurs.
- L'export CSV exporte **les lignes filtrées/triées actuelles** (pas seulement la page courante), avec en-têtes français cohérents avec l'UI.
- Compatibilité conservée avec la pagination existante (`usePagination` reçoit déjà la liste filtrée/triée).
- Mobile : toolbar passe en `flex-wrap` ; bouton export reste accessible.

## 4. Mise en œuvre (ordre proposé)

1. Créer `data-table-toolbar.tsx` + util `export-csv.ts`.
2. Migrer un tableau pilote (Admin Sinistres, déjà en partie outillé) pour valider l'API.
3. Appliquer aux tableaux Admin restants.
4. Appliquer aux tableaux Broker.
5. Vérifier visuellement chaque page (desktop + mobile) et l'export.

## Hors périmètre

- Pas de changement de schéma BDD.
- Pas de modification des colonnes affichées (sauf si un filtre/tri révèle qu'une colonne manque, à confirmer au cas par cas).
- Pas de sauvegarde serveur des préférences de filtres.