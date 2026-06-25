
# Audit mobile B2B — Espace Courtier

Captures réalisées en 390×844 (iPhone 14) sur les 8 routes principales : Dashboard, Portefeuille, Vente, Sinistres, Polices, Renouvellements, Statistiques, Commissions.

## Problèmes identifiés

### 1. Header (présent sur 100% des pages — priorité haute)
- Le logo `Sanlam | Allianz` mesure ~530 px → écrase tout sur 390 px, pousse le bouton Déconnexion hors champ utile.
- 4 éléments alignés (burger, logo XL, téléphone, déconnexion) sans hiérarchie mobile.
- Hauteur trop grande (~120 px) au détriment du contenu.

### 2. Tables qui débordent horizontalement
- **Portefeuille** : colonne « Contact » coupée (`marie.dupont@te...`).
- **Polices / Cotations / Renouvellements** : colonne Prime tronquée, scroll horizontal involontaire.
- Pas de vue « carte » mobile alternative.

### 3. Onglets `Gestion` (Polices)
- Labels abrégés brutalement (`Pol.`, `Cot.`, `Renouv.`, `Att.`) et passent sur 2 lignes.
- Badge `27` détaché du label « Att. ».

### 4. Dashboard
- KPI « Mon Chiffre d'Affaires » : valeur tronquée `64 702 332 FC...`.
- Bloc Pipeline Leads : 5 statuts compressés sans labels.
- Le widget IA flottant masque le contenu en bas de page (boutons d'action notamment sur Renouvellements).

### 5. Typographie cassée sur certains titres
- `Sélection du produit` (Vente) et `Statistiques Renouvellement` apparaissent en **police monospace de fallback** → la font display ne charge pas sur ces vues.

### 6. Renouvellements
- Barre d'actions `Renouveler (0) · 68 affichés · page 1/X` empilée et coupée.
- Carte d'import très haute (zone dropzone surdimensionnée sur mobile).

### 7. Filtres
- Période (`Année d'exercice`) et filtres Agence/Statut prennent chacun une ligne complète, beaucoup d'espace vertical perdu.

---

## Plan de refonte mobile (présentation seulement, pas de logique métier)

### Étape 1 — Header mobile compact
Fichier : `src/components/Header.tsx`
- Sous 768 px : logo réduit à l'icône Sanlam (badge carré ~32 px) + texte `Sanlam Allianz` en petit.
- Hauteur header : `h-14` au lieu de h-auto.
- Trigger sidebar à gauche, déconnexion en icône seule à droite, téléphone repassé dans un menu kebab.

### Étape 2 — Tables → cartes en mobile
Composants : `PortfolioDataTable`, `RenewalPipelineTable`, `RenewalsPipelineCard`, `BrokerSubscriptions`, `PendingQuotationsTable`.
- Au-dessous de `md` : rendu en liste de cartes (1 carte par ligne) avec champs prioritaires (Client, Produit, Prime, Statut, action).
- Au-dessus de `md` : tables actuelles inchangées.
- Helper partagé `ResponsiveDataView` pour ne pas dupliquer la logique.

### Étape 3 — Tabs horizontaux scrollables
Fichier : `src/components/policies/UnifiedFiltersBar.tsx` + page `PoliciesPage`.
- Conserver les labels complets (`Polices`, `Cotations`, `Renouvellements`, `Attente`).
- Wrapper `overflow-x-auto snap-x` + onglets `whitespace-nowrap`.

### Étape 4 — Dashboard mobile
Fichier : `src/pages/broker/DashboardPage.tsx` + KPICard.
- KPI : `text-base` mobile / `text-xl` desktop, valeurs formatées en compact (`64,7 M FCFA`) sous 480 px.
- Pipeline Leads : labels visibles via icônes + tooltip, ou liste verticale empilée mobile.
- AI chat widget : décalage `bottom-20` sur pages avec barre d'actions, ou bouton plus petit (`h-12 w-12`) mobile.

### Étape 5 — Fix police de fallback
Audit `index.css` + `tailwind.config.ts` : certaines pages utilisent un wrapper avec `font-mono` involontaire (ex. classes héritées sur `h1`). Identifier la cause sur `GuidedSalesPage` et `RenewalStatsPage`, corriger.

### Étape 6 — Renouvellements mobile
Fichiers : `RenewalsPipelineCard.tsx`, `RenewalsImportCard.tsx`.
- Carte import : dropzone passe à `h-32` mobile, texte sur 1 ligne.
- Barre d'action : bouton `Renouveler` pleine largeur, compteur sous le bouton, pagination en footer dédié.

### Étape 7 — Filtres alignés en grille mobile
- Filtres secondaires (Agence, Statut, Période) regroupés en `grid grid-cols-2 gap-2` mobile au lieu d'empilés.

---

## Périmètre & non-objectifs
- Zéro changement de logique métier, données, RLS, routes ou permissions.
- Aucune création de nouvelle page.
- Pas de modification du desktop (≥ 768 px) sauf bugs cosmétiques découverts.

## Ordre proposé d'exécution
1. Header (impact toutes pages) → 2. Tables responsive → 3. Tabs + Filtres → 4. Dashboard → 5. Renouvellements → 6. Fix font fallback.

Confirme-moi si on attaque dans cet ordre, ou si tu veux prioriser le Dashboard ou les Renouvellements en premier.
