

## Plan v1 Admin : RBAC + Vues métier

### 1. Nouveaux rôles RBAC en base

**Migration SQL :**
- Ajouter `backoffice_crc` et `backoffice_conformite` à l'enum `app_role`
- Mettre à jour la fonction `get_user_role` pour intégrer la priorité des nouveaux rôles
- Ajouter des RLS policies pour que ces rôles accèdent aux données nécessaires (lectures sur leads, clients, KYC, subscriptions, claims)
- Renommer les labels d'affichage : "Broker" → "Agent", "Compliance" → gardé mais ajout des deux nouveaux

**Fichiers impactés :**
- `src/hooks/useUserRole.ts` : ajouter `backoffice_crc` et `backoffice_conformite` au type `UserRole`
- `src/hooks/useUserPermissions.ts` : idem
- `src/components/RoleProtectedRoute.tsx` : supporter les nouveaux rôles
- `src/components/admin/AdminPermissions.tsx` : ajouter les nouveaux rôles dans la matrice (ROLE_LABELS, ROLE_COLORS, roles array)
- `src/components/admin/CreateUserDialog.tsx` : ajouter les options de création pour ces rôles
- `src/components/AdminUsersTable.tsx` : supporter l'affichage et le filtre des nouveaux rôles
- `src/App.tsx` : ajouter les routes admin pour les nouvelles vues, autoriser `backoffice_conformite` sur les routes compliance

### 2. Vue Portefeuille & CA par Agent (nouvelle page)

**Page : `/admin/agents-portfolio`**
- Tableau listant tous les brokers/agents avec :
  - Nom, type de partenaire
  - Nombre de clients assignés (`broker_clients`)
  - Nombre de prospects (`leads`)
  - CA total (somme des primes `subscriptions` actives)
  - Nombre de polices actives
- Filtre par période (réutiliser `PeriodFilter`)
- Clic sur un agent → détail de son portefeuille

**Fichiers :**
- Nouveau : `src/pages/admin/AgentsPortfolioPage.tsx`
- Modifié : `src/App.tsx` (route)
- Modifié : `src/components/admin/AdminSidebar.tsx` (entrée menu)

### 3. Vue Conversion Prospect → Client (nouvelle page)

**Page : `/admin/conversions`**
- Tableau des prospects avec statut de conversion
- KPIs : taux de conversion global, par agent, par produit
- Filtre par période et par agent
- Données depuis `leads` (status = "converti" vs total)

**Fichiers :**
- Nouveau : `src/pages/admin/ConversionsPage.tsx`
- Modifié : `src/App.tsx`, `AdminSidebar.tsx`

### 4. Vue Conformité KYC/AML (nouvelle page)

**Page : `/admin/compliance`** (accessible aux rôles `admin`, `backoffice_conformite`, `compliance`)
- Tableau consolidé des dossiers KYC clients + prospects
- Colonnes : Nom, Type (client/prospect), Statut identité, Statut PPE, Niveau risque AML, Bloqué, Date screening
- Filtres : statut screening, niveau risque, bloqué/non bloqué
- Actions : déclencher screening, voir détails
- Données depuis `client_kyc_compliance` + `lead_kyc_compliance`

**Fichiers :**
- Nouveau : `src/pages/admin/CompliancePage.tsx`
- Modifié : `src/App.tsx`, `AdminSidebar.tsx`
- RLS : ajouter policies pour `backoffice_conformite` sur les tables KYC

### 5. Sidebar Admin mise à jour

Nouveau groupe **"Pilotage"** dans la sidebar :
- Portefeuille Agents → `/admin/agents-portfolio`
- Conversions → `/admin/conversions`
- Conformité KYC → `/admin/compliance`

### Résumé des fichiers

| Action | Fichier |
|--------|---------|
| Migration | Enum `app_role` + RLS + `get_user_role` |
| Nouveau | `src/pages/admin/AgentsPortfolioPage.tsx` |
| Nouveau | `src/pages/admin/ConversionsPage.tsx` |
| Nouveau | `src/pages/admin/CompliancePage.tsx` |
| Modifié | `src/App.tsx` |
| Modifié | `src/components/admin/AdminSidebar.tsx` |
| Modifié | `src/hooks/useUserRole.ts` |
| Modifié | `src/hooks/useUserPermissions.ts` |
| Modifié | `src/components/RoleProtectedRoute.tsx` |
| Modifié | `src/components/admin/AdminPermissions.tsx` |
| Modifié | `src/components/admin/CreateUserDialog.tsx` |
| Modifié | `src/components/AdminUsersTable.tsx` |

