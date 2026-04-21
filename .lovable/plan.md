

## Vue Admin « Drill-down par Agent »

### Principe
Chaque page agent (`/b2b/*`) existe déjà en version **agrégée** côté admin. Il manque le **drill-down** : sélectionner un agent et voir **sa vue exacte** (read-only, impersonation lecture). Cela évite de dupliquer les composants.

### Architecture proposée

**1 hub + 6 onglets** sous une seule route dynamique :

```
/admin/agents/:agentId  →  AgentDetailPage (hub avec tabs)
  ├─ Tab "Vue d'ensemble"   → KPIs agent (UX.2.2)
  ├─ Tab "Prospects"        → Pipeline leads agent (UX.2.1)
  ├─ Tab "Portefeuille"     → Clients + polices agent
  ├─ Tab "Cotations"        → Devis PDF générés (UX.1.3)
  ├─ Tab "Commissions"      → Solde + historique (UX.2.3)
  └─ Tab "Activité"         → Timeline actions (souscriptions, sinistres)
```

### Point d'entrée : liste d'agents cliquable

La page existante **`/admin/agents-portfolio`** devient le **point d'entrée** : chaque ligne du tableau devient cliquable → navigue vers `/admin/agents/:agentId`.

### Mapping UX ↔ Route Admin

| Ref UX | Page Agent | Vue Admin drill-down |
|---|---|---|
| UX.1.1 | `/b2b/sales` → ProductInfoSheet | Non applicable (config produit → `/admin/products`) |
| UX.1.2 | KYC badge sur identification | Déjà admin-only → `/admin/compliance` |
| UX.1.3 | PDF devis à l'étape Récap | `/admin/agents/:id` → Tab Cotations (liste quotations + aperçu PDF) |
| UX.2.1 | Pipeline leads | `/admin/agents/:id` → Tab Prospects |
| UX.2.2 | KPIs dashboard | `/admin/agents/:id` → Tab Vue d'ensemble |
| UX.2.3 | Commissions | `/admin/agents/:id` → Tab Commissions |

### Réutilisation composants (zero duplication)

Tous les composants broker acceptent déjà un `broker_id` via `auth.uid()`. On ajoute un **prop optionnel `overrideAgentId`** pour forcer l'agent cible :

- `<LeadsPipeline overrideAgentId={agentId} />` 
- `<DashboardKPIs overrideAgentId={agentId} />`
- `<CommissionsPage>` → extraire le contenu en composant `<CommissionsView agentId={...} />`

Côté RLS : l'admin a déjà `has_role(auth.uid(),'admin')` sur toutes les tables concernées → aucune migration DB nécessaire.

### Nouveaux fichiers

```
src/pages/admin/AgentDetailPage.tsx          (hub avec Tabs)
src/components/admin/agent-detail/
  ├─ AgentOverviewTab.tsx    (réutilise DashboardKPIs)
  ├─ AgentLeadsTab.tsx       (réutilise LeadsPipeline + LeadsDataTable)
  ├─ AgentPortfolioTab.tsx   (réutilise PortfolioDataTable)
  ├─ AgentQuotationsTab.tsx  (nouveau : liste quotations + PDF preview)
  ├─ AgentCommissionsTab.tsx (extrait de CommissionsPage)
  └─ AgentActivityTab.tsx    (timeline subscriptions/claims/leads)
```

### Fichiers modifiés

- `src/App.tsx` → ajouter route `/admin/agents/:agentId`
- `src/pages/admin/AgentsPortfolioPage.tsx` → rendre lignes cliquables (`navigate('/admin/agents/' + id)`)
- `src/components/broker/dashboard/LeadsPipeline.tsx` → prop `overrideAgentId`
- `src/components/broker/dashboard/DashboardKPIs.tsx` → prop `overrideAgentId`
- `src/pages/broker/CommissionsPage.tsx` → extraire `CommissionsView` réutilisable
- `src/components/admin/AdminSidebar.tsx` → renommer "Portefeuille Agents" en "Agents (drill-down)" pour clarifier

### Header commun de la page détail

```
┌─────────────────────────────────────────────────────┐
│ ← Retour  │  👤 Jean Dupont  [Badge Courtier]       │
│           │  jean@sanlam.ci · +225 07 12 34 56 78   │
│           │  [Action: Envoyer message] [Voir audit] │
├─────────────────────────────────────────────────────┤
│ [Vue][Prospects][Portefeuille][Cotations][Comm.]... │
└─────────────────────────────────────────────────────┘
```

Filtre période global (`PeriodFilter`) en haut, partagé entre tous les onglets via state local.

### Avantages

1. **Source unique** : vue agent = vue admin drill-down (même composants)
2. **Pas de divergence UX** : l'admin voit exactement ce que l'agent voit
3. **Scalable** : nouveau tab broker = prop `overrideAgentId` + intégration
4. **Traçabilité** : ajout possible d'un `audit_logs` à l'ouverture (`admin_viewed_agent`)
5. **Compatible RLS existante** (rôle admin déjà global)

### Limitations assumées

- **Read-only** : l'admin ne peut pas agir au nom de l'agent (pas d'impersonation writes). Actions admin passent par les pages admin dédiées (`/admin/users/partners` pour désactivation, etc.)
- **UX.1.1** (ProductInfoSheet) n'a pas de drill-down agent — c'est une config produit globale

