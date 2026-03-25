# Plan: Améliorations Pilotage Admin

## Synthese des demandes

1. **Commissions** : Ajouter une colonne dans tableau par agent pour commissions + export CSV global
2. **Top 3 meilleurs / moins bons agents** : Afficher partout (Conversions, Performance, Sinistralité, Portefeuille)
3. **Filtres périodiques partout** : S'assurer que le `PeriodFilter` est au-dessus de chaque tableau (Compliance manque)
4. **Conversions : colonne Broker** : Ajouter le `partner_type` (groupe/entité) comme colonne "Broker"
5. **Performance : Top 3 meilleurs** : Section visuelle des 3 meilleurs agents
6. **Sidebar : Sections collapsibles** : Permettre de collapse/expand les groupes de navigation

---

## Etape 1 — Sidebar collapsible

**Fichier** : `src/components/admin/AdminSidebar.tsx`

Utiliser le composant `Collapsible` de Radix (deja disponible dans `src/components/ui/collapsible.tsx`) pour wrapper chaque `SidebarGroup`. Chaque label de groupe devient un `CollapsibleTrigger` avec une icone chevron qui tourne. Le contenu (`SidebarGroupContent`) est wrappé dans `CollapsibleContent`. Etat `open` par defaut pour chaque section, persisté en `localStorage`.

---

## Etape 2 — Composant Top3 / Bottom3 reutilisable

**Nouveau fichier** : `src/components/admin/TopBottomAgents.tsx`

Un composant generique qui prend une liste d'agents triée et un label de metrique, et affiche :

- Top 3 (icones medaille or/argent/bronze) avec nom + valeur
- Bottom 3 (icone alerte) avec nom + valeur
- Layout en 2 colonnes (Top / Bottom) dans une Card

---

## Etape 3 — Export CSV generique

**Nouveau fichier** : `src/utils/exportCsv.ts`

Fonction utilitaire `exportToCSV(data: Record<string, any>[], filename: string)` reutilisable sur toutes les pages pilotage. Bouton "Exporter CSV" ajoute dans le header de chaque page.

---

## Etape 4 — Page Conversions : ajout colonne Broker + Top3

**Fichier** : `src/pages/admin/ConversionsPage.tsx`

- Fetcher `partner_type` depuis `profiles` pour chaque agent
- Ajouter colonne "Broker" (= `partner_type` traduit via `PARTNER_TYPE_LABELS`) dans le tableau
- Ajouter le composant `TopBottomAgents` basé sur `conversionRate`
- Ajouter bouton export CSV

---

## Etape 5 — Page Performance : Top3 + export CSV

**Fichier** : `src/pages/admin/AgentPerformancePage.tsx`

- Ajouter `TopBottomAgents` basé sur le taux d'atteinte CA
- Ajouter bouton export CSV

---

## Etape 6 — Page Sinistralité : Top3 + export CSV

**Fichier** : `src/pages/admin/LossRatioPage.tsx`

- Ajouter `TopBottomAgents` (Top 3 = ratio le plus bas = meilleurs, Bottom 3 = ratio le plus haut)
- Ajouter bouton export CSV

---

## Etape 7 — Page Portefeuille : Top3 + export CSV

**Fichier** : `src/pages/admin/AgentsPortfolioPage.tsx`

- Ajouter `TopBottomAgents` basé sur le CA total
- Ajouter bouton export CSV

---

## Etape 8 — Page Conformité : ajout PeriodFilter

**Fichier** : `src/pages/admin/ComplianceDashboardPage.tsx`

- Ajouter `PeriodFilter` au-dessus des filtres existants
- Filtrer les enregistrements KYC par `created_at` dans la plage sélectionnée

---

## Etape 9 — (nouvelle colonne dans tableau)

**Fichier** : `src/pages/admin/ConversionsPage.tsx`

Page de suivi des commissions par agent. Puisque la table `partner_commissions` n'existe pas encore, cette page calculera les commissions estimées a partir des souscriptions actives (CA * taux configurable). Contenu :

- KPI Cards : Total commissions, Commission moyenne
- `PeriodFilter`
- Tableau par agent : ajouter commission
- Bouton export CSV
- &nbsp;

---

## Details techniques

- `Collapsible` : utilisation de `defaultOpen={true}` + `localStorage` key par section pour persister l'etat
- `partner_type` sert de "Broker" (groupe d'agents par entite) — deja present dans `profiles`
- Export CSV : encodage UTF-8 avec BOM pour compatibilite Excel
  &nbsp;