

# Plan : Champs auto-generes verrouilles + Catalogue de variables partagees

## Contexte

Deux fonctionnalites complementaires pour renforcer la coherence entre les regles de calcul (Actuariat) et le builder de formulaires (Marketing) :

1. **Champs verrouilles** : quand une regle de calcul est liee a un produit, ses `parameters` apparaissent automatiquement dans le builder de formulaire, non-supprimables et non-modifiables
2. **Catalogue de variables** : une table centralisee de variables reutilisables, selectionnable lors de la creation de parametres dans les regles de calcul

---

## Partie 1 : Catalogue de variables partagees

### 1.1 Nouvelle table `calculation_variables`

Migration SQL pour creer la table :

```text
calculation_variables
- id          uuid (PK, gen_random_uuid())
- code        text NOT NULL UNIQUE   -- ex: "puissance_fiscale"
- label       text NOT NULL          -- ex: "Puissance fiscale"
- type        text NOT NULL          -- "text" | "number" | "select" | "date" | "boolean"
- options     jsonb DEFAULT '[]'     -- pour type "select" : ["essence","diesel","electrique"]
- category    text NOT NULL          -- "vehicule" | "assure" | "contrat" | "bien" | "sante"
- description text                   -- aide contextuelle
- is_active   boolean DEFAULT true
- created_at  timestamptz DEFAULT now()
- updated_at  timestamptz DEFAULT now()
```

RLS : admin ALL, broker/authenticated SELECT (is_active = true).

### 1.2 Page d'administration des variables

**Fichier** : `src/pages/admin/CalcVariablesPage.tsx` (creer)

- Table listant toutes les variables avec filtre par categorie
- CRUD via Sheet/drawer : code, label, type, options (si select), categorie, description
- Route : `/admin/calc-variables` ajoutee dans `AdminSidebar` et `App.tsx`

### 1.3 Selection de variables dans l'editeur de regles

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx` (modifier)

Dans la section "Parametres de cotation" :
- Ajouter un bouton "Importer depuis le catalogue" a cote de "Ajouter un parametre"
- Ouvre un Dialog/Popover listant les variables du catalogue, filtrable par categorie
- Au clic sur une variable : cree un parametre pre-rempli (code, label, type, options) avec un flag `source: "catalogue"` et `variable_id` pour tracer l'origine
- Les parametres importes du catalogue ont le code en lecture seule (pour garder la coherence)
- Les parametres crees manuellement restent editables normalement

### 1.4 Type mis a jour

**Fichier** : `src/components/admin/calc-rules/types.ts` (modifier)

```typescript
export interface CalcRuleParameter {
  id: string;
  code: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "boolean";
  options?: string[];
  required?: boolean;
  source?: "manual" | "catalogue";  // nouveau
  variable_id?: string;              // nouveau - ref vers calculation_variables
}
```

---

## Partie 2 : Champs auto-generes et verrouilles dans le builder

### 2.1 Concept

Quand un produit a une regle de calcul liee (via `product_calc_rules`), le builder de formulaire (`FormPhaseEditor`) doit :

1. Charger la regle principale du produit
2. Convertir ses `parameters` en `FieldConfig[]` avec un flag `locked: true`
3. Injecter ces champs en tete de la premiere etape "fields" de la phase Cotation
4. Ces champs sont affiches avec un style visuel distinct (bordure coloree, icone cadenas, badge "Calcul")
5. Ils ne peuvent pas etre supprimes, deplaces, ni modifies par l'utilisateur Marketing

### 2.2 Extension du type FieldConfig

**Fichier** : `src/components/admin/FormFieldLibrary.tsx` (modifier)

```typescript
export interface FieldConfig {
  // ... champs existants
  locked?: boolean;         // nouveau - champ verrouille non editable
  sourceType?: "calc_rule"; // nouveau - origine du champ
  sourceRuleId?: string;    // nouveau - id de la regle source
}
```

### 2.3 Modification du FormPhaseEditor

**Fichier** : `src/components/admin/form-builder/FormPhaseEditor.tsx` (modifier)

- Accepter une nouvelle prop `productId?: string`
- Utiliser un `useQuery` pour charger la regle principale via `product_calc_rules` + `calculation_rules`
- Convertir les `parameters` de la regle en `FieldConfig[]` verrouilles
- Fusionner ces champs avec ceux du builder (champs verrouilles en premier, non-deplacables)
- Empecher `removeField()` et `updateField()` sur les champs verrouilles
- Empecher le drag-and-drop des champs verrouilles

### 2.4 Modification du FormSubStepEditor

**Fichier** : `src/components/admin/form-builder/FormSubStepEditor.tsx` (modifier)

- Afficher les champs verrouilles avec un style distinct :
  - Bordure bleue/amber a gauche
  - Icone cadenas au lieu du grip
  - Badge "Regle de calcul" 
  - Fond legerement colore
- Masquer les boutons supprimer / deplacer pour ces champs
- Au survol : tooltip "Ce champ provient de la regle de calcul et ne peut pas etre modifie"

### 2.5 Modification du FormFieldEditor

**Fichier** : `src/components/admin/FormFieldEditor.tsx` (modifier)

- Si le champ selectionne a `locked: true` : afficher tous les champs en lecture seule
- Afficher un message explicatif : "Ce champ est genere automatiquement depuis la regle de calcul [nom]. Pour le modifier, editez la regle dans l'espace Actuariat."
- Lien vers `/admin/calc-rules` pour navigation rapide

### 2.6 Modification du FormEditorDrawer

**Fichier** : `src/components/admin/products/FormEditorDrawer.tsx` (modifier)

- Passer `productId` au `FormPhaseEditor` pour permettre le chargement des regles
- Lors de la sauvegarde : ne pas persister les champs verrouilles dans `form_templates` (ils sont dynamiques, generes a la volee depuis la regle)

---

## Resume des fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL | Creer | Table `calculation_variables` |
| `src/pages/admin/CalcVariablesPage.tsx` | Creer | CRUD des variables du catalogue |
| `src/components/admin/calc-rules/types.ts` | Modifier | Ajouter `source` et `variable_id` a `CalcRuleParameter` |
| `src/components/admin/calc-rules/CalcRuleEditor.tsx` | Modifier | Bouton "Importer depuis catalogue" |
| `src/components/admin/FormFieldLibrary.tsx` | Modifier | Ajouter `locked`, `sourceType`, `sourceRuleId` a `FieldConfig` |
| `src/components/admin/form-builder/FormPhaseEditor.tsx` | Modifier | Charger regle, injecter champs verrouilles |
| `src/components/admin/form-builder/FormSubStepEditor.tsx` | Modifier | Style visuel distinct pour champs verrouilles |
| `src/components/admin/FormFieldEditor.tsx` | Modifier | Mode lecture seule pour champs verrouilles |
| `src/components/admin/products/FormEditorDrawer.tsx` | Modifier | Passer productId, exclure champs verrouilles a la sauvegarde |
| `src/components/admin/AdminSidebar.tsx` | Modifier | Ajouter lien "Variables" |
| `src/App.tsx` | Modifier | Route `/admin/calc-variables` |

---

## Details techniques

### Conversion parametre -> FieldConfig

```text
function parameterToFieldConfig(param: CalcRuleParameter, ruleId: string): FieldConfig {
  return {
    id: `calc_${param.code}`,          // prefixe pour eviter les collisions
    type: mapParamType(param.type),     // "number" -> "number", "select" -> "select", etc.
    label: param.label,
    required: param.required ?? true,
    options: param.options,
    locked: true,
    sourceType: "calc_rule",
    sourceRuleId: ruleId,
  };
}
```

### Fusion dans le builder

Les champs verrouilles sont injectes dynamiquement lors du rendu, pas stockes en base. Cela garantit que :
- Si la regle est modifiee (ajout/suppression de parametre), le builder se met a jour automatiquement
- Pas de desynchronisation entre la regle et le formulaire
- Les champs marketing restent independants et editables

### Categories de variables suggerees

| Categorie | Exemples |
|-----------|----------|
| vehicule | puissance_fiscale, energie, date_1ere_circ, nombre_places, valeur_neuve |
| assure | age, genre, anciennete_permis, situation_pro |
| contrat | duree, periodicite, date_effet, usage |
| bien | surface, nb_pieces, type_construction, localisation |
| sante | age, nb_enfants, zone_couverture, formule |

