## Plan : Remplacer l'assistant latéral par l'upsell à l'étape d'émission

### Contexte  
  
Dans les deux produits : Pack auto et pack obseque

À l'étape 7 (IssuanceStep), le SalesAssistant s'affiche dans la sidebar droite. L'upsell doit prendre sa place au lieu d'être une modal ou une carte inline dans le contenu principal.

### Changements

#### 1. `GuidedSalesFlow.tsx`

- Quand `currentStep === 7`, remplacer le `SalesAssistant` par un nouveau composant `UpsellSidebar` dans le même emplacement (35% droite sur desktop)
- Sur mobile, remplacer `MobileCoverageStickyBar` par le contenu upsell
- Supprimer la condition `showSalesAssistant` pour l'étape 7 et gérer séparément

#### 2. `UpsellModal.tsx` → `UpsellSidebar.tsx`

- Transformer le `Dialog` en une `Card` sticky (même style que `SalesAssistant` : `sticky top-20`)
- Garder toute la logique produit-spécifique (`upsellConfigs`)
- Props : `state`, `onAccept`, `accepted` (état géré par le parent)
- Quand accepté : afficher le badge de confirmation dans la sidebar

#### 3. `IssuanceStep.tsx`

- Supprimer l'import et l'usage de `UpsellModal`
- Supprimer le `useEffect` auto-open et le state `showUpsellModal`
- Garder `upsellAccepted` comme state, le remonter via callback au parent `GuidedSalesFlow`
- Ou plus simple : gérer `upsellAccepted` dans `GuidedSalesFlow` et le passer aux deux composants

### Architecture

```text
Étapes 1-6 :
┌──────────────┬─────────────┐
│  Formulaire  │ SalesAssist │
└──────────────┴─────────────┘

Étape 7 (Émission) :
┌──────────────┬─────────────┐
│  IssuanceStep│ UpsellCard  │
│  (documents) │ (offre)     │
└──────────────┴─────────────┘
```

### Fichiers impactés

- `src/components/guided-sales/GuidedSalesFlow.tsx` — conditionner sidebar étape 7
- `src/components/guided-sales/steps/UpsellModal.tsx` — refactorer en carte sidebar
- `src/components/guided-sales/steps/IssuanceStep.tsx` — retirer modal et useEffect