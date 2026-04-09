

## Plan : Améliorer le layout du Form Builder et regrouper les champs OCR

### Problèmes identifiés

1. La colonne du milieu (col-span-6) prend trop de place, comprimant la colonne droite (Bibliothèque + Configuration)
2. Les champs générés par OCR s'affichent à plat dans la liste, ce qui surcharge visuellement quand il y en a beaucoup

### Modifications

**1. `src/components/admin/form-builder/FormPhaseEditor.tsx`** — Ajuster le grid layout
- Passer de `col-span-3 / col-span-6 / col-span-3` à `col-span-3 / col-span-5 / col-span-4`
- La colonne droite gagne de l'espace pour afficher la config OCR correctement
- Augmenter la hauteur des cartes Configuration pour éviter le scroll excessif

**2. `src/components/admin/form-builder/FormSubStepEditor.tsx`** — Champs OCR dans un Collapsible
- Regrouper les champs ayant `sourceType === "ocr"` sous un bloc `Collapsible` replié par défaut
- Le header du collapsible affiche : icône fichier + label du champ file parent + badge avec le nombre de champs OCR
- Quand on déplie : les champs OCR s'affichent normalement (drag, select, delete)
- Les champs non-OCR restent affichés normalement dans la liste principale

### Détail technique

Dans `FormSubStepEditor`, séparer `step.fields` en deux groupes :
- `regularFields` : champs où `sourceType !== "ocr"`
- `ocrGroups` : groupés par le champ `file` parent (on peut identifier le parent via l'`ocrConfig` du champ file ou via un `ocrDataKey` partagé)

Chaque groupe OCR est rendu comme :
```text
┌─ 📄 CNI (Pièce d'identité)  [11 champs]  ▼ ─┐
│  Nom          text     🗑                     │
│  Prénoms      text     🗑                     │
│  ...                                          │
└───────────────────────────────────────────────┘
```

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `FormPhaseEditor.tsx` | Grid 3/5/4 au lieu de 3/6/3 |
| `FormSubStepEditor.tsx` | Collapsible pour champs OCR groupés |

