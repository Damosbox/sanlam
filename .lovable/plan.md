

## Plan : Scinder la gestion des utilisateurs en 3 groupes distincts

### Objectif
Remplacer l'entrée unique "Utilisateurs" dans la sidebar admin par trois entrées distinctes :
- **Clients** (utilisateurs avec rôle `customer`)
- **Partenaires** (utilisateurs avec rôle `broker`)  
- **Administrateurs** (utilisateurs avec rôle `admin`)

Chaque section affichera uniquement les utilisateurs du type concerné avec des colonnes adaptées.

---

### Architecture proposée

```text
Sidebar Admin (avant)              Sidebar Admin (après)
─────────────────────              ──────────────────────
Utilisateurs & Sécurité            Utilisateurs
├── Utilisateurs (tous)            ├── Clients
├── Permissions                    ├── Partenaires
└── Audit                          └── Administrateurs
                                   
                                   Sécurité
                                   ├── Permissions
                                   └── Audit
```

---

### Fichiers à créer

#### 1. `src/pages/admin/UsersClientsPage.tsx`
Page dédiée aux utilisateurs clients avec tableau filtré.

#### 2. `src/pages/admin/UsersPartnersPage.tsx`
Page dédiée aux utilisateurs partenaires avec colonnes spécifiques (type partenaire, OTP).

#### 3. `src/pages/admin/UsersAdminsPage.tsx`
Page dédiée aux utilisateurs administrateurs.

---

### Fichiers à modifier

#### 1. `src/components/AdminUsersTable.tsx`

Ajouter une prop `roleFilter` pour filtrer par rôle :

```typescript
interface AdminUsersTableProps {
  roleFilter?: "admin" | "broker" | "customer";
}

export const AdminUsersTable = ({ roleFilter }: AdminUsersTableProps) => {
  // Filtrer les utilisateurs après récupération des rôles
  const filteredUsers = roleFilter 
    ? usersWithRoles.filter(u => u.user_roles[0]?.role === roleFilter)
    : usersWithRoles;
}
```

Adapter l'affichage des colonnes selon le rôle :
- **Clients** : Masquer "Type partenaire" et "OTP Téléphone"
- **Partenaires** : Afficher toutes les colonnes actuelles
- **Admins** : Masquer "Type partenaire", garder OTP

---

#### 2. `src/components/admin/AdminSidebar.tsx`

Réorganiser les groupes de menu :

```typescript
// Nouveau groupe "Utilisateurs" avec 3 sous-entrées
const usersItems = [
  { title: "Clients", url: "/admin/users/clients", icon: User },
  { title: "Partenaires", url: "/admin/users/partners", icon: Briefcase },
  { title: "Administrateurs", url: "/admin/users/admins", icon: Shield },
];

// Groupe "Sécurité" séparé
const securityItems = [
  { title: "Permissions", url: "/admin/permissions", icon: KeyRound },
  { title: "Audit", url: "/admin/audit", icon: ScrollText },
];
```

Mettre à jour les badges pour afficher les nouveaux utilisateurs par type.

---

#### 3. `src/App.tsx`

Ajouter les nouvelles routes :

```typescript
import AdminUsersClientsPage from "./pages/admin/UsersClientsPage";
import AdminUsersPartnersPage from "./pages/admin/UsersPartnersPage";
import AdminUsersAdminsPage from "./pages/admin/UsersAdminsPage";

// Dans les routes admin
<Route path="users" element={<Navigate to="users/clients" replace />} />
<Route path="users/clients" element={<AdminUsersClientsPage />} />
<Route path="users/partners" element={<AdminUsersPartnersPage />} />
<Route path="users/admins" element={<AdminUsersAdminsPage />} />
```

---

### Détail des nouvelles pages

#### `UsersClientsPage.tsx`
```typescript
export default function UsersClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Clients</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des clients particuliers.
        </p>
      </div>
      <AdminUsersTable roleFilter="customer" />
    </div>
  );
}
```

#### `UsersPartnersPage.tsx`
```typescript
export default function UsersPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Partenaires</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des courtiers et agents.
        </p>
      </div>
      <AdminUsersTable roleFilter="broker" />
    </div>
  );
}
```

#### `UsersAdminsPage.tsx`
```typescript
export default function UsersAdminsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Administrateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des administrateurs de la plateforme.
        </p>
      </div>
      <AdminUsersTable roleFilter="admin" />
    </div>
  );
}
```

---

### Badges dynamiques par type

Dans `AdminSidebar.tsx`, ajouter des compteurs séparés :

```typescript
interface BadgeCounts {
  pendingClaims: number;
  newClients: number;
  newPartners: number;
  newAdmins: number;
}

const fetchBadgeCounts = async () => {
  // Récupérer les profils créés dans les 7 derniers jours
  const { data: newProfiles } = await supabase
    .from("profiles")
    .select("id")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Pour chaque profil, récupérer le rôle et compter
  const roleCounts = { customer: 0, broker: 0, admin: 0 };
  for (const profile of newProfiles || []) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id)
      .limit(1);
    const role = roles?.[0]?.role || "customer";
    roleCounts[role]++;
  }

  setBadges({
    pendingClaims: ...,
    newClients: roleCounts.customer,
    newPartners: roleCounts.broker,
    newAdmins: roleCounts.admin,
  });
};
```

---

### Colonnes adaptées par type d'utilisateur

| Colonne | Clients | Partenaires | Admins |
|---------|---------|-------------|--------|
| Prénom | Oui | Oui | Oui |
| Nom | Oui | Oui | Oui |
| Email | Oui | Oui | Oui |
| Rôle actuel | Non (implicite) | Non (implicite) | Non (implicite) |
| OTP Téléphone | Non | Oui | Oui |
| Type partenaire | Non | Oui | Non |
| Date création | Oui | Oui | Oui |
| Actions | Activer | - | - |
| Modifier rôle | Oui | Oui | Oui |

---

### Résumé des modifications

| Fichier | Action |
|---------|--------|
| `src/pages/admin/UsersClientsPage.tsx` | Créer |
| `src/pages/admin/UsersPartnersPage.tsx` | Créer |
| `src/pages/admin/UsersAdminsPage.tsx` | Créer |
| `src/components/AdminUsersTable.tsx` | Ajouter prop `roleFilter` + colonnes conditionnelles |
| `src/components/admin/AdminSidebar.tsx` | Réorganiser groupes + badges par type |
| `src/App.tsx` | Ajouter 3 nouvelles routes |
| `src/pages/admin/UsersPage.tsx` | Supprimer (optionnel, redirigé vers clients) |

---

### Section technique

**Routes finales :**
- `/admin/users` → Redirige vers `/admin/users/clients`
- `/admin/users/clients` → Page clients
- `/admin/users/partners` → Page partenaires
- `/admin/users/admins` → Page administrateurs

**Optimisation future possible :**
Créer une vue SQL ou utiliser une jointure côté base de données pour récupérer les utilisateurs avec leurs rôles en une seule requête, plutôt que N+1 requêtes.

