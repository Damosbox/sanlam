## Contexte — où implémenter

Plateforme = **prototype**, pas d'intégration Milliard. Les données du scoring viennent des tables existantes (`profiles`, `subscriptions`, `claims`, `broker_clients`) + saisie agent.

Deux briques existent déjà et sont **non conformes** à la grille VF_v2 — on les **remplace** :

1. `src/components/clients/ClientValueScore.tsx` + table `client_scores` : moteur 9 dimensions avec `Math.random()`. Affiché dans `ClientDetailSheet`.
2. `src/components/portfolio/ScoreDetailPopover.tsx` + `PortfolioDataTable.calculateMockScore()` : score 0-100 simulé.
3. `loyalty_profiles / loyalty_levels` : système basé sur **points cumulés**, incompatible avec "niveau = fonction du score /100".

**Décision** : on garde l'enum `loyalty_level` (bronze/silver/gold/platinum, libellé Argent en UI) et `loyalty_profiles` pour missions/récompenses, mais le **niveau de fidélité affiché côté CIP** est désormais piloté par `client_scores.score_global` (source de vérité unique).

---

## V1 — livrables

### 1. Schéma BDD

`client_scores` — ajouter les colonnes VF_v2 (les 9-dimensions actuelles deviennent obsolètes, laissées en place pour ne rien casser) :

```text
score_anciennete           int   (0..20)
score_prime                int   (0..30)
score_multi_equipements    int   (0..20)
score_sinistre             int   (-5..15)
score_action_ponctuelle    int   (0..15)
score_global               int   (-5..100)
niveau                     text  ('bronze'|'argent'|'or'|'platine')
is_partial                 bool
missing_fields             text[]
manual_override            bool
override_reason            text
override_approved_by       uuid
kyc_flag                   bool  (V2)
last_recalc_source         text  ('seed'|'action'|'monthly_job'|'manual')
```

Nouvelles tables :
- `scoring_actions_ponctuelles` : `client_id, agent_id, type, points, created_at` — plafond 15 pts sur 12 mois glissants.
- `scoring_history` : `client_id, score_before, score_after, niveau_before, niveau_after, trigger, created_at`.
- `scoring_job_runs` : `started_at, finished_at, status, clients_processed, errors_count, error_log`.
- `scoring_manual_override_requests` (squelette V2).

GRANT + RLS sur chaque table (broker → ses clients, admin/backoffice global).

### 2. Moteur de calcul — Edge Function `score-client`

`supabase/functions/score-client/index.ts` :
- Entrée : `client_id`. Lit depuis `subscriptions` (prime annuelle, nb produits, ancienneté = âge plus ancienne souscription) + `claims` (sinistres responsables 12 derniers mois).
- Applique la grille VF_v2 (paliers exacts du brief).
- `is_partial = true` si ≥1 champ manquant ; `sinistres_responsables = null` → pas de malus (AC-3).
- Score plancher = `-5` (pas de `Math.max(0, …)`).
- Niveau : `<40 bronze`, `<65 argent`, `<80 or`, `≥80 platine`.
- Upsert `client_scores`, append `scoring_history`.

Appelée :
- Bouton "Recalculer le score" dans la fiche client (prototype).
- Après chaque action ponctuelle.
- Par le job mensuel.

### 3. Job mensuel + monitoring — `score-monthly-recalc`

Edge Function manuellement déclenchable depuis l'admin (cron pas activé sur le prototype, mais bouton "Lancer maintenant" + dernier run affiché). Écrit dans `scoring_history` et `scoring_job_runs`. Notification in-app (`toast` + entrée future dans `audit_logs`) au broker référent si changement de niveau.

### 4. UI Fiche client — refonte `ClientValueScore.tsx`

- Score signé `-2 / 100` ou `47 / 100` + badge niveau texte (Bronze/Argent/Or/Platine).
- Barre `progressbar` ARIA (`aria-valuenow/min/max=-5..100`, `aria-label`), segment rouge "Malus actif" si négatif.
- "Voir le détail" → 5 critères VF_v2 avec points.
- "X pts pour le niveau suivant" ou "Niveau maximum atteint".
- État `is_partial` → badge texte + liste des champs manquants.
- États : non-disponible, erreur (`Réessayer`), skeleton `aria-busy`.
- WCAG 2.1 AA (US-010) : tooltip malus accessible focus clavier (`aria-describedby`), zoom 200% sans scroll horizontal, jamais "couleur seule".
- Badge KYC visible uniquement admin/backoffice/compliance.

Intégré dans `ClientDetailSheet`, version `compact` pour le portefeuille.

### 5. Action ponctuelle (US-004)

`ScoringActionDialog.tsx` accessible depuis la fiche client :
- Select des 5 types (Parrainage 5 / Renouv 3 / Diversif 3 / Souscription 2 / Enquête 2).
- Insert `scoring_actions_ponctuelles`, appelle l'Edge Function.
- L'Edge Function vérifie le plafond **15 pts / 12 mois glissants**. Dépassement → 422 + message "Plafond annuel atteint (15 pts/an)".
- Onglet "Historique des actions" dans le bloc Fidélité.

### 6. UI Portefeuille (US-008 en avance)

`PortfolioDataTable.tsx` :
- Supprimer `calculateMockScore`.
- Lire `client_scores.score_global` + `niveau`.
- Colonne "Score" triable, filtre rapide par niveau, indicateur `is_partial`.

`ScoreDetailPopover.tsx` : remplacer `generateMockDimensions` par les 5 critères réels.

### 7. Admin — page `/admin/scoring`

Nouvelle page (route + entrée sidebar) :
- Onglet **Monitoring** (US-009b) : table `scoring_job_runs`, bouton "Lancer le job maintenant", alerte si dernier run en erreur.
- Onglet **Override manuel** (squelette V2 visible mais désactivé).

### 8. Seed de démo (prototype)

Script d'initialisation qui calcule un score VF_v2 pour tous les clients existants (à lancer une fois après la migration), afin d'avoir des données visibles dans portefeuille et fiches sans attendre une action utilisateur.

---

## V2 — préparé, non implémenté

- US-005 Dashboard distribution (page admin séparée, camembert, export CSV).
- US-006a/b Actions marketing auto au changement de niveau + config admin.
- US-007 Flag Bridger KYC/AML.
- US-011 Workflow d'approbation override manuel.

---

## Fichiers touchés

**Créés**
- `supabase/migrations/<ts>_scoring_vf_v2.sql`
- `supabase/functions/score-client/index.ts`
- `supabase/functions/score-monthly-recalc/index.ts`
- `src/hooks/useClientScore.ts`
- `src/lib/scoring/vfV2.ts` (constantes paliers, mapping niveau)
- `src/components/clients/ScoringActionDialog.tsx`
- `src/components/clients/ScoringHistoryList.tsx`
- `src/pages/admin/ScoringPage.tsx`
- `src/components/admin/scoring/ScoringJobMonitor.tsx`
- `src/components/admin/scoring/ScoringManualOverrideTable.tsx` (squelette)

**Modifiés**
- `src/components/clients/ClientValueScore.tsx` (refonte complète, WCAG)
- `src/components/clients/ClientDetailSheet.tsx` (boutons "Recalculer" + "Action ponctuelle", historique)
- `src/components/portfolio/PortfolioDataTable.tsx` (lecture `client_scores`, tri/filtre niveau)
- `src/components/portfolio/ScoreDetailPopover.tsx` (5 critères réels)
- `src/components/renewals/RenewalsPipelineCard.tsx` (réutiliser le hook)
- `src/layouts/AdminLayout.tsx` + sidebar admin (entrée Scoring)

---

## Question ouverte

Les pages B2C `LoyaltyDashboard` / `RewardsMarketplace` (points, missions, récompenses) restent visibles **en parallèle** du nouveau scoring CIP, ou on les masque pour éviter la double notion de niveau ? Recommandation : les garder (elles ne concernent que le B2C client), et n'utiliser VF_v2 que dans la CIP (agent/backoffice + bloc fidélité fiche client).
