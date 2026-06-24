## Objectif
Affiner visuellement la sidebar B2B (`BrokerSidebar`) sans toucher à sa structure ni à sa logique.

## Changements ciblés

1. **Teinte de fond légèrement plus foncée**
   - Aujourd'hui : `bg-primary-foreground` (quasi blanc pur) sur `SidebarHeader`, `SidebarContent`, `SidebarFooter`.
   - Cible : un blanc cassé très légèrement teinté (ex. `hsl(220 20% 97%)` en light, équivalent subtil en dark) — perception d'une nuance, pas d'un vrai gris.
   - Implémentation via un nouveau token sémantique `--sidebar-broker` dans `src/index.css` (light + dark) plutôt qu'une couleur en dur.

2. **Bordure extérieure légèrement renforcée**
   - Aujourd'hui : `border-r border-border/50` sur `<Sidebar>`.
   - Cible : `border-r-2 border-border/70` + ombre douce `shadow-[1px_0_0_0_hsl(var(--border)/0.4)]` pour une séparation nette mais discrète.

3. **Cohérence**
   - Le `SidebarHeader` et `SidebarFooter` héritent du même token `--sidebar-broker` pour éviter tout effet de bandes.
   - Aucun changement sur la sidebar Admin (`AdminSidebar`).

## Fichiers touchés
- `src/index.css` — ajout du token `--sidebar-broker` (light + dark).
- `src/components/broker/BrokerSidebar.tsx` — remplacement de `bg-primary-foreground` par `bg-sidebar-broker`, ajustement de la bordure sur `<Sidebar>`.

## Hors scope
- Pas de modification d'icônes, d'espacements, de typographie, de comportement collapsible, ou de l'`AdminSidebar`.

Souhaites-tu que je lance la mise en œuvre ?
