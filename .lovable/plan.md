## Nouvelle vue « Clients Sanlam » (Admin > Opérations)

### 1. Navigation
- `src/components/admin/AdminSidebar.tsx` : ajouter l'item **Clients Sanlam** dans le groupe **Opérations** → route `/admin/clients` (icône `Users`).
- `src/App.tsx` : enregistrer la route protégée (rôles `admin`, `backoffice_conformite`, `backoffice_crc`).

### 2. Page `src/pages/admin/ClientsPage.tsx`
Tableau unifié agrégeant 3 sources :

| Source | Détection | Statut compte |
|---|---|---|
| Profile + souscription | `profiles` ∩ `subscriptions` | Client Sanlam (compte actif) |
| Profile sans souscription | `profiles` seul | Utilisateur |
| Lead converti sans profile | `leads.status='converti'` sans `profiles` correspondant | Client Sanlam (sans compte) |

### 3. Colonnes du tableau
- Prénom · Nom · Email · Téléphone
- **Type** : badge (Client actif / Utilisateur / Client sans compte)
- **Agent rattaché** : via `broker_clients.broker_id` ou `leads.assigned_broker_id` → résolu en nom depuis `profiles`
- Nb polices · Nb sinistres
- Date création
- Action « Voir détails » → ouvre `ClientDetailSheet` (profile) ou `LeadDetailSheet` (lead sans compte)

### 4. Filtres & KPIs
- Barre de recherche (nom, email, téléphone)
- Filtres : Type compte (Tous / Avec compte / Sans compte), Agent rattaché
- Badges KPI : Total clients · Avec compte · Sans compte · Sans agent

### 5. Données
- Hook `src/hooks/useAdminClients.ts` : 3 requêtes parallèles (`profiles`, `leads converti sans profile`, `broker_clients`) puis fusion côté client. Réutilise les hooks existants `useClients`/`useLeads` si compatibles.
- Pas de migration SQL nécessaire (utilise tables existantes).

### Détails techniques
- Fusion en mémoire avec clé `email` pour éviter doublons profile/lead.
- Pagination client-side (50 lignes) avec `react-table` déjà utilisé ailleurs.
- Export CSV ajouté en bouton secondaire.
