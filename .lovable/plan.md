
## Plan : Séparation des pages d'authentification Client / Partenaire

### Contexte
Les particuliers et partenaires ont des points d'entrée distincts et ne doivent pas pouvoir accéder à la page de connexion de l'autre. Les particuliers arrivent depuis le site officiel Sanlam-Allianz, tandis que les partenaires reçoivent un lien interne vers notre app.

---

### Architecture proposée

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         POINTS D'ENTRÉE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   PARTICULIER                          PARTENAIRE                   │
│   ───────────                          ──────────                   │
│   Site officiel                        Lien interne                 │
│   ci.sanlamallianz.com                 notre-app.lovable.app        │
│         │                                    │                      │
│         ▼                                    ▼                      │
│   /auth/client                        / (Commercial.tsx)            │
│   (Login + Signup)                          │                       │
│         │                              "Se connecter"               │
│         ▼                                    │                      │
│      /b2c                                    ▼                      │
│   (Espace Client)                     /auth/partner                 │
│                                       (Login uniquement)            │
│                                              │                      │
│                                              ▼                      │
│                                        /b2b/dashboard               │
│                                      (Espace Partenaire)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 1. Créer les pages d'authentification séparées

#### Fichier `src/pages/auth/ClientAuth.tsx` (NOUVEAU)

Page de connexion dédiée aux particuliers :
- URL : `/auth/client`
- Design épuré avec logo Sanlam-Allianz
- Formulaire login + lien "Inscrivez-vous"
- Options : Email/Password, Google, Téléphone
- Redirection post-login → `/b2c`
- **PAS de lien** vers l'espace partenaire
- **PAS de bouton retour** vers une sélection d'espace

#### Fichier `src/pages/auth/PartnerAuth.tsx` (NOUVEAU)

Page de connexion dédiée aux partenaires :
- URL : `/auth/partner`
- Badge "Espace Partenaire" visible
- Formulaire login uniquement (pas de signup)
- Message : "L'inscription partenaire se fait via votre responsable commercial"
- Options : Email/Password, Google, Téléphone
- Redirection post-login → `/b2b/dashboard`
- **PAS de lien** vers l'espace client
- **PAS de bouton retour**

---

### 2. Modifier le routage

#### Fichier `src/App.tsx`

| Route actuelle | Action | Nouvelle route |
|----------------|--------|----------------|
| `/` | Remplacer `<Home />` par `<Commercial />` | Page partenaires par défaut |
| `/auth` | Rediriger vers `/auth/partner` | Compatibilité liens existants |
| `/auth/client` | NOUVEAU | Connexion particuliers |
| `/auth/partner` | NOUVEAU | Connexion partenaires |
| `/commercial` | Garder | Alias vers `/` |

```typescript
// Nouvelles routes
<Route path="/" element={<Commercial />} />
<Route path="/auth" element={<Navigate to="/auth/partner" replace />} />
<Route path="/auth/client" element={<ClientAuth />} />
<Route path="/auth/partner" element={<PartnerAuth />} />
```

---

### 3. Simplifier le Header

#### Fichier `src/components/Header.tsx`

**Supprimer :**
- Bloc de la top bar avec onglets "Particuliers" / "Partenaires" (lignes 106-161)
- Tableaux `insuranceProducts` et `savingsProducts` (non utilisés)
- Condition sur `isCommercialPage` pour les liens

**Garder :**
- Logo Sanlam-Allianz
- Numéro de téléphone
- Bouton "Se connecter" → `/auth/partner`
- Bouton "Dashboard" (si connecté)
- Navigation commerciale (Outils, Ressources)

**Nouveau Header simplifié :**
```tsx
{isPublicPage && (
  <div className="bg-secondary text-secondary-foreground">
    <div className="container flex h-10 items-center justify-end">
      <div className="flex items-center gap-4">
        {/* Téléphone */}
        <a href="tel:+2252720259700" className="...">
          <Phone className="w-4 h-4" />
          <span>(+225) 27 20 25 97 00</span>
        </a>
        
        {/* Connexion/Dashboard */}
        {user ? (
          <Link to="/b2b/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        ) : (
          <Link to="/auth/partner">
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
        )}
      </div>
    </div>
  </div>
)}
```

---

### 4. Nettoyage des fichiers

| Fichier | Action |
|---------|--------|
| `src/pages/Home.tsx` | **Supprimer** (plus utilisé) |
| `src/pages/Auth.tsx` | **Supprimer** (remplacé par ClientAuth + PartnerAuth) |
| `src/pages/Commercial.tsx` | Garder, devient la page d'accueil `/` |
| Header nav "Particuliers" | Supprimer la visibilité |

---

### 5. Gestion de la redirection OAuth

Les deux pages d'auth (client/partner) auront des redirections OAuth différentes :

```typescript
// ClientAuth.tsx
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/client`,
  }
});

// PartnerAuth.tsx  
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/partner`,
  }
});
```

---

### Résultat attendu

1. **URL `/`** → Landing partenaires (Commercial.tsx)
2. **URL `/auth/client`** → Connexion particuliers avec signup
3. **URL `/auth/partner`** → Connexion partenaires sans signup
4. **Header** → Plus d'onglets de sélection, juste logo + téléphone + connexion
5. **Isolation complète** → Un client ne peut pas accéder à `/auth/partner` par accident depuis l'UI

---

### Section technique

**Fichiers à créer :**
- `src/pages/auth/ClientAuth.tsx`
- `src/pages/auth/PartnerAuth.tsx`

**Fichiers à modifier :**
- `src/App.tsx` (routes)
- `src/components/Header.tsx` (suppression top bar)
- `src/pages/Commercial.tsx` (mise à jour lien "Se connecter")

**Fichiers à supprimer :**
- `src/pages/Home.tsx`
- `src/pages/Auth.tsx`

**Aucune modification base de données requise.**
