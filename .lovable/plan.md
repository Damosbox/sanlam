## Diversification des paliers + redesign des médailles

### 1. Données mockées — 3 paliers distincts
Migration SQL ciblant les 3 clients de démo (`marie.dupont@test.com`, `jean.kouassi@test.com`, `fatou.diallo@test.com`) :

- `marie.dupont` → niveau **Bronze**, `vf_score_global = 15`
- `jean.kouassi` → niveau **Argent**, `vf_score_global = 50`
- `fatou.diallo` → niveau **Or**, `vf_score_global = 72`

UPDATE sur `client_scores` joint à `profiles.email`. Met aussi à jour `vf_niveau` et `calculated_at` pour cohérence.

### 2. Redesign des médailles (composant dédié)
Nouveau fichier `src/components/clients/MedalIcon.tsx` : SVG inline distinctif par palier (médaille avec ruban + reflet métallique), différentié visuellement :

| Niveau | Métal | Ruban | Reflet |
|---|---|---|---|
| Bronze | dégradé cuivre `#cd7f32 → #8b4513` | rouge-brun | étoile centrale |
| Argent | dégradé argent `#e8e8e8 → #9ca3af` | bleu nuit | demi-laurier |
| Or | dégradé or `#fde047 → #b45309` | bleu royal | couronne de laurier complète |
| Platine | dégradé platine `#ecfeff → #06b6d4` | violet | diamant central |

- Composant unique avec prop `niveau` et `size`.
- Variants HSL alignés sur les tokens existants (pas de hardcode en composants).
- Remplace `Medal/Award/Trophy` dans `NIVEAU_ICON` de `ClientValueScore.tsx` (vue compacte + vue détaillée + tooltip).

### 3. Score au survol — à l'intérieur du badge
Dans la vue compacte de `ClientValueScore.tsx` :
- **Supprimer** le `<span>` externe affichant `+15/100`.
- Badge passe en `group` : par défaut affiche `<MedalIcon /> Bronze`, au hover bascule sur `<MedalIcon /> +15/100` (transition `opacity` + largeur fixe pour éviter saut de mise en page).
- Le tooltip détaillé (paliers Bronze/Argent/Or) reste déclenché par le même hover, désormais cohérent : pastille = palier au repos, score en immersion au survol, paliers détaillés en tooltip.
- L'attribut `aria-label` du badge conserve `"Bronze — score +15 sur 100"` pour l'accessibilité.

### Détails techniques
- Pas de changement de schéma DB.
- Migration idempotente (UPDATE … WHERE email IN …).
- `MedalIcon` rendu via SVG (pas de dépendance image), réutilisable ailleurs (notification renouvellement, tooltip, fiche client).
