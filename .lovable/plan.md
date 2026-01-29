
# Extraction et Restructuration du Dashboard en Grid

## Analyse de la Maquette - Positions Extraites

En analysant l'image, voici la structure exacte du layout avec toutes les positions identifiées :

```text
DASHBOARD GRID LAYOUT (12 colonnes)
================================================================================

ROW 0: HEADER (span 12)
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Avatar] Bienvenue [Nom]     [Product Pills: Tous|Auto|MRH|...]   [Devis ▼]   │
│          Temps de connexion: 5h                                                │
└────────────────────────────────────────────────────────────────────────────────┘

ROW 1: KPI CARDS (4 cards, span 3 each)
┌──────────────────┬──────────────────┬──────────────────┬──────────────────────┐
│  Mes Tâches      │  Mes commissions │  Mes Primes      │  Mes polices         │
│       7          │  1 283 592 FCFA  │  112 254 889 FCFA│    453 Contrats      │
│     [↗]          │       [↗]        │       [↗]        │         [↗]          │
└──────────────────┴──────────────────┴──────────────────┴──────────────────────┘
      span 3             span 3             span 3              span 3

ROW 2: MAIN CONTENT (2x2 grid)
┌────────────────────────────────────────────┬────────────────────────────────────┐
│  TAUX DE RENOUVELLEMENT                    │  PIPELINE LEADS           12 Total │
│  ┌───────────────┬───────────────┐         │  [Progress Bar ████████████]       │
│  │   Effectif    │    A faire    │         │  [●4] [●0] [0] [8] [●0]            │
│  │    [Donut]    │    [Donut]    │         ├────────────────────────────────────┤
│  │   Atteint     │   Non atteint │         │  ANALYSE IA                 [4]    │
│  └───────────────┴───────────────┘         │  ┌──────────────────────────────┐  │
│  INDICATEURS DE CONTACT     Résumé         │  │ 🌟 Nouveaux Prospects        │  │
│  ┌─────────────────┬────────────────────┐  │  │    4 nouveaux prospects...   │  │
│  │ Indicateur    N  %    │  76%  82%    │  │  ├──────────────────────────────┤  │
│  │ Personnes     156 100%│  Taux  Clients│  │  │ ⚠ Prospects en attente      │  │
│  │ à appeler             │  renouv atteint│  │  │   2 prospects inactifs...   │  │
│  │ Contactés     128  82%│               │  │  ├──────────────────────────────┤  │
│  │ Atteints      105  82%│  24    8%     │  │  │ 🔄 Cross-sell               │  │
│  │ Pb téléphone   23  18%│  A contacter  │  │  │   3 clients ont 1 produit   │  │
│  └─────────────────┴────────────────────┘  │  └──────────────────────────────┘  │
│          span 7 (ou 8)                     │          span 5 (ou 4)             │
└────────────────────────────────────────────┴────────────────────────────────────┘

ROW 3: NEWS BANNER (span 12)
┌────────────────────────────────────────────────────────────────────────────────┐
│     📢 Bannière de publicité actualisée                                        │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Structure Grid CSS/Tailwind Proposée

### Grid Principal (12 colonnes)

```typescript
// DashboardPage.tsx - Nouvelle structure Grid
<div className="grid grid-cols-12 gap-4">
  
  {/* ROW 0: Header - Full Width */}
  <div className="col-span-12">
    <DashboardHeader />
  </div>
  
  {/* ROW 1: KPI Cards - 4 cards x 3 cols each */}
  <div className="col-span-12 grid grid-cols-4 gap-3">
    <KPICard label="Mes Tâches" value="7" />
    <KPICard label="Mes commissions" value="1 283 592 FCFA" />
    <KPICard label="Mes Primes" value="112 254 889 FCFA" />
    <KPICard label="Mes polices" value="453 Contrats" />
  </div>
  
  {/* ROW 2: Main Content - Split 7/5 */}
  <div className="col-span-7 space-y-4">
    <RenewalRateSection />      {/* Donuts + Stats */}
    <ContactIndicatorsCard />   {/* Table + Summary */}
  </div>
  
  <div className="col-span-5 space-y-4">
    <LeadsPipeline />           {/* Pipeline + Progress */}
    <AIRecommendations />       {/* AI Cards */}
  </div>
  
  {/* ROW 3: News Banner - Full Width */}
  <div className="col-span-12">
    <NewsBanner />
  </div>
  
</div>
```

---

## Mapping Composants vs Positions

| Position | Col Span | Composant | Fichier |
|----------|----------|-----------|---------|
| Header | 12 | `DashboardHeader` | Existant |
| KPI 1 | 3 | `KPICard` (Mes Tâches) | A ajouter |
| KPI 2 | 3 | `KPICard` (Commissions) | Existant |
| KPI 3 | 3 | `KPICard` (Primes) | Existant |
| KPI 4 | 3 | `KPICard` (Polices) | Existant |
| Taux Renouvellement | 7 (partie haute) | `RenewalRateCards` | Existant - A modifier |
| Indicateurs Contact | 7 (partie basse) | `ContactIndicatorsCard` | Existant - A modifier |
| Pipeline Leads | 5 (partie haute) | `LeadsPipeline` | Existant |
| Analyse IA | 5 (partie basse) | `AIRecommendations` | Existant |
| News Banner | 12 | `NewsBanner` | Existant |

---

## Modifications Requises

### 1. DashboardPage.tsx - Refonte Grid

```typescript
const DashboardPage = () => {
  return (
    <div className="space-y-4 max-w-6xl animate-fade-in">
      {/* Header + Quick Actions */}
      <div className="flex justify-between items-start">
        <DashboardHeader />
        <QuickActions />
      </div>
      
      {/* KPIs Row - 4 colonnes égales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={CheckSquare} label="Mes Tâches" value={tasksCount} link="/b2b/tasks" />
        <KPICard icon={Wallet} label="Mes commissions" value={formatFCFA(commissions)} />
        <KPICard icon={TrendingUp} label="Mes Primes" value={formatFCFA(premiums)} />
        <KPICard icon={FileText} label="Mes polices" value={`${policies} Contrats`} />
      </div>
      
      {/* Main Content Grid - 7/5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <RenewalRateSection />
          <ContactIndicatorsCard />
        </div>
        
        {/* Right Column: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <LeadsPipeline />
          <AIRecommendations />
        </div>
      </div>
      
      {/* News Banner - Full Width */}
      <NewsBanner />
    </div>
  );
};
```

### 2. Nouveau Composant KPICard Unifié

```typescript
// src/components/broker/dashboard/KPICard.tsx
interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  link?: string;
  highlight?: boolean;
}

export const KPICard = ({ icon: Icon, label, value, link, highlight }: KPICardProps) => (
  <Card className={cn(
    "border-border/60 hover:shadow-soft transition-all",
    highlight && "bg-primary/5 border-primary/30"
  )}>
    <CardContent className="p-4 flex justify-between items-start">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {link && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);
```

### 3. Modification ContactIndicatorsCard

Le composant actuel affiche table + pie chart cote à cote. Selon la maquette, il faut ajouter une section "Résumé" avec les 4 métriques clés (76%, 82%, 24, 8%).

```typescript
// Structure mise à jour
<div className="grid grid-cols-3 gap-4">
  {/* Colonne 1: Table indicateurs */}
  <div className="col-span-1">
    <Table>...</Table>
  </div>
  
  {/* Colonne 2: Donut Chart */}
  <div className="col-span-1">
    <PieChart>...</PieChart>
  </div>
  
  {/* Colonne 3: Résumé Cards */}
  <div className="col-span-1 grid grid-cols-2 gap-2">
    <SummaryCard value="76%" label="Taux renouvellement" color="primary" />
    <SummaryCard value="82%" label="Clients atteints" color="success" />
    <SummaryCard value="24" label="A contacter" color="warning" />
    <SummaryCard value="8%" label="Taux churn" color="destructive" />
  </div>
</div>
```

---

## Responsive Breakpoints

```typescript
// Tailwind Grid Classes
const gridClasses = {
  // KPI Row
  kpis: "grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3",
  
  // Main Content
  mainGrid: "grid grid-cols-1 lg:grid-cols-12 gap-4",
  leftColumn: "lg:col-span-7 space-y-4",
  rightColumn: "lg:col-span-5 space-y-4",
  
  // Contact Indicators Internal
  contactGrid: "grid grid-cols-1 md:grid-cols-3 gap-3",
};

// Breakpoints:
// - Mobile (<640px): 1 column, stacked
// - Tablet (640-1024px): 2 columns KPIs, stacked content
// - Desktop (>1024px): 4 cols KPIs, 7/5 split content
```

---

## Fichiers a Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `DashboardPage.tsx` | Modifier | Nouvelle structure grid 12 colonnes |
| `DashboardKPIs.tsx` | Modifier | Extraire en composants KPICard individuels |
| `ContactIndicatorsCard.tsx` | Modifier | Ajouter section "Résumé" avec 4 métriques |
| `KPICard.tsx` | Creer | Nouveau composant card unifié |
| `RenewalRateCards.tsx` | Conserver | Donuts existants OK |
| `LeadsPipeline.tsx` | Conserver | Existant OK |
| `AIRecommendations.tsx` | Conserver | Existant OK |
| `NewsBanner.tsx` | Conserver | Existant OK |

---

## Schema Grid Final

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        col-span-12: Header                           │
├──────────┬──────────┬──────────┬──────────────────────────────────────┤
│ col-3    │ col-3    │ col-3    │          col-3                       │
│ Tâches   │ Commiss. │ Primes   │          Polices                     │
├──────────┴──────────┴──────────┴──────────┬───────────────────────────┤
│              col-span-7                    │       col-span-5          │
│  ┌─────────────────────────────────────┐  │  ┌─────────────────────┐  │
│  │ RenewalRateCards (Donuts)           │  │  │ LeadsPipeline       │  │
│  └─────────────────────────────────────┘  │  └─────────────────────┘  │
│  ┌─────────────────────────────────────┐  │  ┌─────────────────────┐  │
│  │ ContactIndicatorsCard               │  │  │ AIRecommendations   │  │
│  │ (Table + Pie + Resume)              │  │  │                     │  │
│  └─────────────────────────────────────┘  │  └─────────────────────┘  │
├───────────────────────────────────────────┴───────────────────────────┤
│                        col-span-12: NewsBanner                        │
└───────────────────────────────────────────────────────────────────────┘
```
