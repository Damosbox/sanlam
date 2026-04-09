

## Plan : Simplifier l'OCR — sélection de champs uniquement, mapping automatique

### Problème actuel
L'UI montre un tableau de mapping manuel (clé OCR → champ cible) que l'admin doit remplir un par un. Or les clés sont prédéfinies et le mapping est automatique — l'admin n'a qu'à choisir **quels champs OCR il veut**.

### Nouveau comportement

1. L'admin active OCR sur un champ `file`
2. Il choisit le type de document (CNI / Permis / Carte Grise)
3. La liste des champs OCR disponibles s'affiche sous forme de **checkboxes multi-select** avec les labels FR (ex: "Nom", "Date de naissance", "Numéro CNI")
4. L'admin coche les champs qu'il veut → les champs sont auto-générés dans le formulaire avec le bon type, le bon `ocrDataKey`, et le mapping est implicite
5. **Aucun tableau de mapping visible** — tout est automatique en coulisse

### Modifications

**`src/components/admin/FormFieldEditor.tsx`**
- Supprimer tout le bloc "Mapping des clés OCR" (lignes 325-377) avec les Select par clé
- Remplacer par une liste de checkboxes des clés OCR du type sélectionné
- Chaque checkbox affiche le label FR (ex: "Nom (surname)")
- Quand une checkbox est cochée/décochée, mettre à jour `ocrConfig.mappings` avec les clés sélectionnées (sans `targetFieldId` — le mapping est automatique par `ocrDataKey`)
- Supprimer le bouton "Auto-créer les champs manquants" — la génération se fait automatiquement quand on coche
- Supprimer la prop `onGenerateOcrFields` et `allFields` (plus nécessaires pour le mapping)

**`src/components/admin/form-builder/FormPhaseEditor.tsx`**
- Adapter `generateOcrFields` pour être appelé automatiquement quand les checkboxes changent (via `updateField`)
- Quand un champ est décoché, supprimer le champ OCR correspondant de l'étape
- Quand un champ est coché, générer le champ avec `ocrDataKey`, `locked: true`, `sourceType: "ocr"`, type approprié

**`src/components/admin/FormFieldLibrary.tsx`**
- Pas de changement structurel, `ocrConfig.mappings` reste mais simplifié (juste `ocrKey` sans `targetFieldId`)

### Résumé UX

```text
Avant : Select docType → Tableau mapping (clé → champ cible) × N → Bouton "Auto-créer"
Après : Select docType → Checkboxes des champs souhaités → Génération automatique
```

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `FormFieldEditor.tsx` | Remplacer mapping par checkboxes multi-select |
| `FormPhaseEditor.tsx` | Auto-génération/suppression sur changement de sélection |

