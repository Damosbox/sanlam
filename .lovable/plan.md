## Modifications dans `src/components/clients/ClientValueScore.tsx`

### 1. Tooltip de la médaille (vue compacte + vue complète)
Simplifier `MedalTooltipContent` :
- Retirer la liste des paliers (Bronze / Argent / Or / Platine) et le tableau `MEDAL_TIERS`.
- Retirer l'en-tête « PALIERS DE FIDÉLITÉ ».
- Afficher uniquement le score en grand format : `20/100` (sans le préfixe `+`, le `-` reste pour les scores négatifs).
- Conserver la couleur destructive si score négatif.

### 2. Masquer les actions côté agent B2B (broker)
Dans la vue complète, masquer les boutons **Recalculer** et **Action ponctuelle** pour le rôle `agent` / `broker`.
- N'afficher ces deux boutons que si `role` ∈ { `admin`, `backoffice_crc`, `backoffice_conformite`, `compliance` }.
- Le bouton « Demander modification » conserve sa logique actuelle (`canRequestOverride`).
- Si aucun bouton n'est visible pour le rôle, ne pas afficher la barre d'actions.

Aucune autre page ni logique métier n'est modifiée.