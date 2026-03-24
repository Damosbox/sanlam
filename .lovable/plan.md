

## Plan : Pilotage P0 → P2

Rappel des priorites du brainstorming AARRR :
- **P0** : Funnel de conversion avec drop-off + Evolution CA mensuel
- **P1** : Objectifs vs Realise par agent + Alertes leads dormants/renouvellements imminents
- **P2** : Ratio sinistralite par agent

### 1. P0 — Funnel de conversion (ConversionsPage)

Ajouter dans `ConversionsPage.tsx` un graphique funnel horizontal (Recharts BarChart) montrant le nombre de leads par statut ordonne : Nouveau → Contacte → Qualifie → Proposition → Negocie → Converti (+ Perdu en rouge a part). Afficher le % de drop-off entre chaque etape.

### 2. P0 — Evolution CA mensuel (AgentsPortfolioPage)

Ajouter dans `AgentsPortfolioPage.tsx` un graphique LineChart/BarChart (Recharts) montrant l'evolution du CA (somme des primes) mois par mois sur la periode selectionnee. Grouper les subscriptions par mois de `start_date` et afficher la courbe.

### 3. P1 — Objectifs vs Realise par agent (nouvelle page)

Creer `src/pages/admin/AgentPerformancePage.tsx` accessible via `/admin/agent-performance`.
- Tableau par agent avec colonnes : Objectif CA, CA Realise, % atteinte, Objectif conversions, Conversions realisees
- Les objectifs seront stockes dans une nouvelle table `agent_targets` (agent_id, period_start, period_end, target_premium, target_conversions)
- Barre de progression visuelle pour chaque agent
- Filtre par periode

### 4. P1 — Alertes leads dormants et renouvellements imminents (AdminDashboardPage)

Ajouter dans `src/pages/admin/DashboardPage.tsx` deux sections d'alertes :
- **Leads dormants** : leads dont `last_contact_at` > 7 jours ou `next_followup_at` depasse, avec compteur par agent
- **Renouvellements imminents** : subscriptions dont `end_date` est dans les 30/60/90 jours, non contactees

### 5. P2 — Ratio sinistralite par agent (nouvelle page)

Creer `src/pages/admin/LossRatioPage.tsx` accessible via `/admin/loss-ratio`.
- Par agent : total primes encaissees vs total montant sinistres (`claims.cost_estimation` ou `claims.approved_amount`)
- Ratio = sinistres / primes * 100
- Tableau + graphique BarChart par agent
- Filtre par periode et par produit
- KPIs globaux : ratio global, agents au-dessus du seuil (ex: > 70%)

### 6. Migration DB — table `agent_targets`

```sql
CREATE TABLE public.agent_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_premium numeric NOT NULL DEFAULT 0,
  target_conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agent targets"
  ON public.agent_targets FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their own targets"
  ON public.agent_targets FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
```

### 7. Sidebar + Routing

Ajouter dans `AdminSidebar.tsx` pilotageItems :
- `{ title: "Performance Agents", url: "/admin/agent-performance", icon: Target }`
- `{ title: "Sinistralité", url: "/admin/loss-ratio", icon: AlertTriangle }`

Ajouter dans `App.tsx` :
- `<Route path="agent-performance" element={<AgentPerformancePage />} />`
- `<Route path="loss-ratio" element={<LossRatioPage />} />`

### Fichiers

| Action | Fichier |
|--------|---------|
| Migration | Table `agent_targets` + RLS |
| Modifie | `src/pages/admin/ConversionsPage.tsx` — funnel chart |
| Modifie | `src/pages/admin/AgentsPortfolioPage.tsx` — CA mensuel chart |
| Modifie | `src/pages/admin/DashboardPage.tsx` — alertes leads/renouvellements |
| Nouveau | `src/pages/admin/AgentPerformancePage.tsx` |
| Nouveau | `src/pages/admin/LossRatioPage.tsx` |
| Modifie | `src/components/admin/AdminSidebar.tsx` |
| Modifie | `src/App.tsx` |

