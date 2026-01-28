
# Plan de Refonte Dashboard & Sidebar Broker

## Vue d'Ensemble

Ce plan restructure entièrement la navigation et le dashboard broker selon la maquette fournie, avec une nouvelle organisation en 6 groupes de navigation et un dashboard centré sur les indicateurs de contact et l'actualité dynamique.

---

## Phase 1 : Restructuration de la Sidebar

### Structure de Navigation Cible

```text
SIDEBAR BROKER
├── ACCUEIL
│   └── Tableau de bord (/b2b/dashboard)
│
├── MON PORTEFEUILLE
│   ├── Clients (/b2b/portfolio?tab=clients)
│   └── Prospects (/b2b/portfolio?tab=prospects)
│
├── VENTE
│   └── Nouvelle Vente (/b2b/sales)
│
├── GESTION
│   ├── Sinistres (/b2b/claims)
│   ├── Polices (/b2b/policies)
│   └── Renouvellement (/b2b/renewals)  ← NOUVELLE PAGE
│
├── PERFORMANCES
│   ├── Statistiques (/b2b/stats)
│   └── Rapports (/b2b/reports)  ← Placeholder
│
└── COMMUNICATIONS
    ├── Messages (/b2b/messages)
    ├── Actualités (/b2b/news)  ← NOUVELLE PAGE
    └── Campagnes (/b2b/campaigns)  ← Placeholder
```

### Fichiers à Modifier/Créer

| Action | Fichier | Description |
|--------|---------|-------------|
| Modifier | `src/components/broker/BrokerSidebar.tsx` | Refonte complète avec 6 groupes |
| Créer | `src/pages/broker/RenewalsPage.tsx` | Page dédiée renouvellement |
| Créer | `src/pages/broker/NewsPage.tsx` | Page actualités dynamiques |
| Créer | `src/pages/broker/ReportsPage.tsx` | Placeholder rapports |
| Créer | `src/pages/broker/CampaignsPage.tsx` | Placeholder campagnes |
| Modifier | `src/App.tsx` | Nouvelles routes |

### Détail Technique - BrokerSidebar.tsx

```typescript
// Nouvelle structure des items de navigation
const navigationGroups = [
  {
    label: "Accueil",
    items: [
      { title: "Tableau de bord", url: "/b2b/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    label: "Mon Portefeuille",
    items: [
      { title: "Clients", url: "/b2b/portfolio?tab=clients", icon: Users },
      { title: "Prospects", url: "/b2b/portfolio?tab=prospects", icon: UserPlus }
    ]
  },
  {
    label: "Vente",
    items: [
      { title: "Nouvelle Vente", url: "/b2b/sales", icon: Zap }
    ]
  },
  {
    label: "Gestion",
    items: [
      { title: "Sinistres", url: "/b2b/claims", icon: FileText, badge: pendingClaims },
      { title: "Polices", url: "/b2b/policies", icon: Shield },
      { title: "Renouvellement", url: "/b2b/renewals", icon: RefreshCw, badge: renewalsCount }
    ]
  },
  {
    label: "Performances",
    items: [
      { title: "Statistiques", url: "/b2b/stats", icon: PieChart },
      { title: "Rapports", url: "/b2b/reports", icon: FileBarChart }
    ]
  },
  {
    label: "Communications",
    items: [
      { title: "Messages", url: "/b2b/messages", icon: MessageSquare },
      { title: "Actualités", url: "/b2b/news", icon: Newspaper },
      { title: "Campagnes", url: "/b2b/campaigns", icon: Megaphone, disabled: true }
    ]
  }
];
```

---

## Phase 2 : Refonte du Dashboard

### Layout Cible (selon maquette)

Le layout doit etre en system de grids 2X2

```text
┌─────────────────────────────────────────────────────────────────┐
│  HEADER : Bonjour [Nom] + Product Selector + Quick Actions      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ Leads    │ Conv.    │ Commiss. │ Mes      │  ← 4 KPIs        │
│  │ 24h      │ Rate     │ MTD      │ Tâches   │    horizontaux   │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TAUX DE RENOUVELLEMENT (Donuts + Stats)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ INDICATEURS DE CONTACT                                      │ │
│  │ ┌───────────────────────────┬────────────────────────────┐ │ │
│  │ │ Tableau synthétique       │ Graphique Pie/Donut        │ │ │
│  │ │ • À appeler: 156          │                            │ │ │
│  │ │ • Contactés: 128 (82%)    │      [PIE CHART]           │ │ │
│  │ │ • Atteints: 105 (82%)     │                            │ │ │
│  │ │ • Pb tél: 23 (18%)        │                            │ │ │
│  │ └───────────────────────────┴────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────┬─────────────────────────────┐ │
│  │ ACTIONS DU JOUR              │ RECOMMANDATIONS IA          │ │
│  │ • Relancer X                 │ • Upsell opportunité        │ │
│  │ • Sinistre Y                 │ • Client à risque           │ │
│  └──────────────────────────────┴─────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📢 BANNIÈRE ACTUALITÉ (dynamique admin)                    │ │
│  │ "Nouvelle offre Assurance Auto Eco disponible..."          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fichiers à Modifier/Créer

| Action | Fichier | Description |
|--------|---------|-------------|
| Modifier | `src/pages/broker/DashboardPage.tsx` | Nouveau layout complet |
| Modifier | `src/components/broker/dashboard/DashboardKPIs.tsx` | 4 KPIs horizontaux + "Mes Tâches" |
| Créer | `src/components/broker/dashboard/ContactIndicatorsCard.tsx` | Tableau + graphique inline |
| Créer | `src/components/broker/dashboard/NewsBanner.tsx` | Bannière actualité dynamique |
| Conserver | `src/components/broker/dashboard/RenewalRateCards.tsx` | Déjà fonctionnel |
| Conserver | `src/components/broker/dashboard/TasksReminders.tsx` | Déjà fonctionnel |
| Conserver | `src/components/broker/dashboard/AIRecommendations.tsx` | Déjà fonctionnel |

### Nouveau KPI "Mes Tâches"

Ajout d'un 4ème KPI qui affiche le nombre de tâches en attente avec un lien direct vers la section actions.

```typescript
// Dans DashboardKPIs.tsx
const kpis = [
  { label: "Nouveaux leads", value: "12", icon: Users, trend: "+3 vs hier" },
  { label: "Taux conversion", value: "24%", icon: TrendingUp, trend: "+2 pts" },
  { label: "Commissions", value: "850K", icon: Wallet, trend: "Mois en cours" },
  { label: "Mes Tâches", value: "5", icon: CheckSquare, trend: "À traiter", highlight: true }
];
```

---

## Phase 3 : Table Base de Données pour Actualités

### Création de la Table `broker_news`

```sql
CREATE TABLE public.broker_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_label TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  target_roles TEXT[] DEFAULT '{"broker"}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.broker_news ENABLE ROW LEVEL SECURITY;

-- Admins can manage all news
CREATE POLICY "Admins can manage all broker news"
  ON public.broker_news FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Brokers can view active news
CREATE POLICY "Brokers can view active news"
  ON public.broker_news FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );
```

### Composant NewsBanner.tsx

```typescript
// Récupère les actualités actives triées par priorité
const { data: news } = useQuery({
  queryKey: ['broker-news'],
  queryFn: async () => {
    const { data } = await supabase
      .from('broker_news')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(3);
    return data;
  }
});

// Affichage en carousel ou liste
return (
  <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
    <CardContent className="flex items-center gap-4">
      <Newspaper className="h-8 w-8 text-primary" />
      <div className="flex-1">
        <h4 className="font-semibold">{news[0]?.title}</h4>
        <p className="text-sm text-muted-foreground">{news[0]?.content}</p>
      </div>
      {news[0]?.link_url && (
        <Button variant="outline" size="sm">
          {news[0]?.link_label || "En savoir plus"}
        </Button>
      )}
    </CardContent>
  </Card>
);
```

---

## Phase 4 : Page Renouvellement Dédiée

### Structure de RenewalsPage.tsx

Déplacement de la logique actuelle de `RenewalStatsPage.tsx` vers une page dédiée avec :

1. **Vue d'ensemble** : KPIs de renouvellement
2. **Pipeline** : Tableau interactif avec statuts contact/renouvellement
3. **Actions rapides** : Boutons pour contacter les clients

```text
┌─────────────────────────────────────────────────────────────────┐
│  RENOUVELLEMENT                              [Product Selector] │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ 76%      │ 82%      │ 24       │ 8%       │                  │
│  │ Taux     │ Clients  │ À        │ Churn    │                  │
│  │ Renouv.  │ Atteints │ Contacter│ Rate     │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FILTRES: [Statut contact ▼] [Décision ▼] [Recherche...]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PIPELINE DES RENOUVELLEMENTS                               │ │
│  │ Client | Produit | Échéance | Contact | Décision | Actions │ │
│  │ ─────────────────────────────────────────────────────────  │ │
│  │ Dupont | Auto    | 15/02    | Atteint | Renouvelé | [📞]   │ │
│  │ Martin | MRH     | 20/02    | Non     | En attente| [📞💬] │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 5 : Interface Admin pour Actualités

### Ajout dans l'Admin Panel

Créer une section dans l'admin pour gérer les actualités broker :

| Action | Fichier | Description |
|--------|---------|-------------|
| Créer | `src/pages/admin/BrokerNewsPage.tsx` | CRUD des actualités |
| Modifier | `src/components/admin/AdminSidebar.tsx` | Ajouter entrée "Actualités Broker" |
| Modifier | `src/App.tsx` | Route `/admin/broker-news` |

---

## Résumé des Livrables

### Fichiers à Créer (7)

1. `src/pages/broker/RenewalsPage.tsx` - Page dédiée renouvellement
2. `src/pages/broker/NewsPage.tsx` - Page actualités broker
3. `src/pages/broker/ReportsPage.tsx` - Placeholder rapports
4. `src/pages/broker/CampaignsPage.tsx` - Placeholder campagnes
5. `src/components/broker/dashboard/ContactIndicatorsCard.tsx` - Widget indicateurs
6. `src/components/broker/dashboard/NewsBanner.tsx` - Bannière actualité
7. `src/pages/admin/BrokerNewsPage.tsx` - Admin CRUD actualités

### Fichiers à Modifier (5)

1. `src/components/broker/BrokerSidebar.tsx` - Nouvelle structure navigation
2. `src/pages/broker/DashboardPage.tsx` - Nouveau layout dashboard
3. `src/components/broker/dashboard/DashboardKPIs.tsx` - Ajout KPI "Mes Tâches"
4. `src/components/admin/AdminSidebar.tsx` - Entrée gestion actualités
5. `src/App.tsx` - Nouvelles routes

### Migration Base de Données (1)

- Création table `broker_news` avec RLS policies

---

## Ordre d'Implémentation Recommandé

1. **Migration DB** : Créer table `broker_news`
2. **Sidebar** : Restructurer la navigation
3. **Routes** : Ajouter les nouvelles pages
4. **Dashboard** : Refondre le layout avec tous les composants
5. **Renouvellement** : Page dédiée
6. **Actualités** : Admin + affichage broker
7. **Placeholders** : Rapports et Campagnes

---

## Icônes Utilisées

```typescript
import {
  LayoutDashboard,  // Dashboard
  Users,            // Clients
  UserPlus,         // Prospects
  Zap,              // Vente
  FileText,         // Sinistres
  Shield,           // Polices
  RefreshCw,        // Renouvellement
  PieChart,         // Statistiques
  FileBarChart,     // Rapports
  MessageSquare,    // Messages
  Newspaper,        // Actualités
  Megaphone,        // Campagnes
  CheckSquare,      // Mes Tâches
} from "lucide-react";
```
