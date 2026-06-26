# Modification manuelle du score client (workflow d'approbation)

## Objectif
Permettre au Back-office de proposer une modification du score d'un client, soumise à validation par un supérieur (admin). Couvre les 5 critères d'acceptation.

## Périmètre
- Page concernée prioritairement : **Admin → Scoring** (`/admin/scoring`, onglet « Modifications manuelles ») — actuellement un placeholder « V2 ».
- Composants partagés réutilisables depuis la fiche client (bouton « Demander modification manuelle » à côté de « Recalculer »).

## Acceptance criteria → implémentation

- **AC-1 — Accès Back-office uniquement**
  RLS déjà en place sur `scoring_manual_override_requests` (admin / backoffice_crc / backoffice_conformite). On gate aussi l'UI via `PermissionGate` + `useUserRole`. Les autres rôles voient un état vide.

- **AC-2 — Workflow d'approbation**
  Création d'une demande `pending` par le Back-office (non self-approve). Un admin (rôle hiérarchique) voit l'onglet « En attente » et peut Approuver / Refuser avec commentaire. Bouton Approuver désactivé si `requested_by = auth.uid()`.

- **AC-3 — Persistance**
  À l'approbation, edge function `score-manual-override-decide` :
  - met à jour `client_scores` : `vf_score_global = requested_score`, `vf_manual_override = true`, `vf_last_recalc_source = 'manual_override'`, recalcule `vf_niveau`
  - écrit une ligne dans `scoring_history` (trigger `manual_override`, before/after)
  - passe la demande en `approved` + `approver_id` + `approver_comment` + `decided_at`

- **AC-4 — Historique consultable et exportable**
  Onglet « Historique » : table de toutes les demandes (toutes statuts), filtres statut / dates / client, bouton **Exporter CSV** via `exportToCSV`. Champs : date, client, demandeur, score avant/après, statut, approbateur, commentaire, justification.

- **AC-5 — Refus → restauration + notification**
  Comme l'`UPDATE` du score n'a lieu qu'à l'approbation, le refus n'a rien à restaurer côté `client_scores`. La demande passe `rejected` + commentaire obligatoire. Toast à l'initiateur via realtime (Supabase channel sur la table filtré par `requested_by`) ; fallback : badge « Décisions reçues » au prochain chargement.

## Détails techniques

### Migration
Ajouter quelques colonnes manquantes à `scoring_manual_override_requests` :
- `current_score integer` (snapshot du score au moment de la demande, pour l'historique)
- `current_niveau text`
- `notified_at timestamptz` (pour AC-5)

Pas de nouvelle table.

### Edge function
`supabase/functions/score-manual-override-decide/index.ts`
- input : `{ request_id, decision: 'approved'|'rejected', comment }`
- vérifie rôle admin via JWT + `has_role`
- vérifie `requested_by !== auth.uid()`
- sur `approved` : update `client_scores`, insert `scoring_history`
- update la demande (statut, approver, commentaire, decided_at)

### UI
- `src/components/admin/scoring/ManualOverrideRequestDialog.tsx` — formulaire (nouveau score -5..100, justification ≥ 20 char), validation Zod.
- `src/components/admin/scoring/ScoringManualOverrideTable.tsx` — réécriture : tabs « En attente » / « Historique », actions Approuver/Refuser, export CSV.
- `src/components/clients/ClientValueScore.tsx` — bouton « Demander modification » (visible Back-office) ouvre le dialog.
- Hook `src/hooks/useManualOverrideRequests.ts` (list + create + decide via mutation).

### Hors périmètre
- Pas d'email transactionnel (notification = toast in-app + badge).
- Pas de modification du moteur de scoring lui-même.

## Fichiers touchés
```text
migration              scoring_manual_override_requests (+3 colonnes)
new edge fn            supabase/functions/score-manual-override-decide/index.ts
new                    src/hooks/useManualOverrideRequests.ts
new                    src/components/admin/scoring/ManualOverrideRequestDialog.tsx
rewrite                src/components/admin/scoring/ScoringManualOverrideTable.tsx
update                 src/components/clients/ClientValueScore.tsx (bouton)
```
