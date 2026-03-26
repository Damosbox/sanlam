

## Plan : Remplacer l'Upsell Sidebar par le Cross-Selling

### Objectif

Quand la police est émise (étape 7), la sidebar droite affiche actuellement une offre upsell (Protection Corporelle). Il faut la remplacer par les cartes de cross-selling (Habitation, Pack Obsèques, Auto) qui lancent un **nouveau parcours de vente** complet.

### Modifications

**1. `src/components/guided-sales/steps/UpsellSidebar.tsx`** — Refactorer complètement

Remplacer le contenu upsell actuel par :
- Titre "Découvrez nos autres produits" + sous-titre
- 2 cartes produit (identiques au design de la capture : icône, nom, prix indicatif, description, bouton "En savoir plus")
- Logique dynamique selon le produit actuel (Auto → Habitation + Obsèques ; Obsèques → Auto + Habitation)
- Le bouton navigue vers `/broker/guided-sales?product=xxx` pour démarrer un nouveau flow
- Supprimer tout le code d'acceptation/dismiss/prix barré

**2. `src/components/guided-sales/GuidedSalesFlow.tsx`** — Simplifier

- Supprimer l'état `upsellAccepted` et la prop `onAccept`
- Passer uniquement `state` au composant sidebar renommé
- Supprimer le bloc mobile fixe en bas (step 7) — le cross-sell sera dans le contenu principal via `IssuanceStep`

**3. `src/components/guided-sales/steps/IssuanceStep.tsx`** — Conserver tel quel

La section cross-selling dans le contenu principal reste en place (elle est déjà implémentée). La sidebar la duplique pour le desktop large.

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/guided-sales/steps/UpsellSidebar.tsx` | Refactoré → CrossSellSidebar |
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Simplifié (suppression upsellAccepted) |

