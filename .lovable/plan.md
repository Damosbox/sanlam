

## Plan : OCR Mapping intelligent dans le Form Builder

### Objectif

Quand un champ `file` est ajouté dans le form builder et configuré comme OCR, l'admin peut :
1. Choisir le **type de document** (CNI, Permis, Carte Grise)
2. Voir la **liste des clés OCR normalisées** correspondantes
3. **Mapper chaque clé OCR** vers un champ du formulaire via un dropdown
4. Quand le champ file OCR est drag-and-dropped, les **champs mappés s'affichent automatiquement** dans l'étape

### Données OCR normalisées

Dictionnaire statique des clés par type de document (constante partagée) :

```text
CNI:       surname, given_names, date_of_birth, place_of_birth, sex, height, document_number, date_of_issue, date_of_expiry, place_of_issue, issuing_state_name
PERMIS:    surname, given_names, date_of_birth, place_of_birth, document_number, date_of_issue, place_of_issue, dl_class, issuing_state_name
CARTE_GRISE: owner, document_number, regcert_regnumber, regcert_carmark, regcert_carmodel, regcert_carcolor, fuel_type, engine_power, engine_volume, number_of_seats, date_of_issue, first_issue_date, issuing_state_name
```

### Modifications fichiers

**1. `src/constants/ocrDocumentKeys.ts`** (nouveau)
- Exporter `OCR_DOCUMENT_TYPES` : tableau des types (CNI, Permis, Carte Grise)
- Exporter `OCR_KEYS_BY_TYPE` : dictionnaire `{ CNI: [{key: "surname", label: "Nom"}, ...], ... }`
- Exporter `getDefaultFieldType(ocrKey)` : retourne le type de champ approprié (date → "date", number → "number", etc.)

**2. `src/components/admin/FormFieldLibrary.tsx`** — Enrichir `FieldConfig`
- Ajouter à l'interface : `ocrConfig?: { documentType: string; mappings: Array<{ ocrKey: string; targetFieldId?: string }> }`
- Ce champ n'existe que quand `type === "file"` et OCR est activé

**3. `src/components/admin/FormFieldEditor.tsx`** — Bloc OCR dans la configuration
- Quand `field.type === "file"` : afficher une section "Configuration OCR"
  - Switch "Activer OCR" → `isOcr: boolean`
  - Select "Type de document" → `ocrConfig.documentType` (CNI / Permis / Carte Grise)
  - Quand un type est sélectionné : afficher la **liste des clés OCR** avec pour chaque clé un dropdown "Mapper vers → [champs existants du formulaire]"
  - Les champs existants sont récupérés depuis les autres champs de l'étape courante
- Ajouter prop `allFields?: FieldConfig[]` pour alimenter les dropdowns de mapping

**4. `src/components/admin/form-builder/FormPhaseEditor.tsx`** — Auto-génération des champs OCR
- Modifier `addFieldToStep` : quand un champ `file` avec `ocrConfig` est ajouté, générer automatiquement les champs correspondants aux clés OCR sélectionnées (avec `ocrDataKey` renseigné et `type` approprié)
- Passer `allFields` au `FormFieldEditor` via les props
- Enrichir `updateField` pour détecter le changement de `ocrConfig.documentType` et proposer de régénérer les champs mappés

**5. `src/components/forms/DynamicFormField.tsx`** — Côté rendu (pas de changement majeur)
- Les champs générés ont déjà un `id` qui correspond à l'`ocrKey`, donc le remplissage auto fonctionne directement

**6. `src/components/DynamicFormRenderer.tsx`** — Remplissage OCR automatique
- Quand un champ `file` avec `ocrConfig` reçoit un fichier : appeler l'edge function OCR correspondante
- Mapper les clés retournées vers les `field.id` correspondants via `ocrConfig.mappings`
- Pré-remplir `formData` avec les valeurs extraites

### Résumé du flux

```text
Admin (Form Builder):
  1. Ajoute champ "Fichier" → sélectionne dans config → OCR activé
  2. Choisit "CNI" → voit les 11 clés OCR avec labels FR
  3. Mappe chaque clé vers un champ existant OU clique "Auto-créer"
  4. Les champs mappés apparaissent dans le formulaire

Runtime (DynamicFormRenderer):
  1. Client upload fichier dans le champ OCR
  2. Appel edge function ocr-identity/ocr-vehicle-registration
  3. Réponse → mapping via ocrConfig → pré-remplissage automatique
```

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/constants/ocrDocumentKeys.ts` | Créer — dictionnaire clés OCR |
| `src/components/admin/FormFieldLibrary.tsx` | Enrichir FieldConfig (ocrConfig) |
| `src/components/admin/FormFieldEditor.tsx` | Ajouter bloc config OCR avec mappings |
| `src/components/admin/form-builder/FormPhaseEditor.tsx` | Auto-génération champs + passer allFields |
| `src/components/DynamicFormRenderer.tsx` | Appel OCR + remplissage auto |

