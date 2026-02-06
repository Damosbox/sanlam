
# Plan : Restructuration du Form Builder avec Phases Cotation/Souscription

## Explication Simple

**Actuellement**, le form builder a une structure plate :
- Étape 1 → Étape 2 → Étape 3 (maximum 3)
- Les champs et les règles de calcul sont séparés dans des onglets différents

**Ce que vous voulez** :
```
COTATION (Grande Phase 1)
├── Sous-étape 1.1 : Règles de calcul (en premier !)
├── Sous-étape 1.2 : Infos véhicule
└── Sous-étape 1.3 : Options

SOUSCRIPTION (Grande Phase 2)
├── Sous-étape 2.1 : Identité client
├── Sous-étape 2.2 : Coordonnées
└── Sous-étape 2.3 : Pièces justificatives
```

---

## Architecture Proposée

### Nouvelle Structure de Données

```text
form_templates.steps (JSONB) - AVANT :
{
  "step1": { title: "Infos", fields: [...] },
  "step2": { title: "Véhicule", fields: [...] }
}

form_templates.steps (JSONB) - APRÈS :
{
  "phases": [
    {
      "id": "cotation",
      "name": "Cotation",
      "icon": "Calculator",
      "steps": [
        {
          "id": "rules",
          "title": "Règles de calcul",
          "type": "calculation_rules",  // Type spécial
          "rules": {
            "base_formula": "...",
            "coefficients": [...]
          }
        },
        {
          "id": "vehicle",
          "title": "Informations véhicule",
          "type": "fields",
          "fields": [...]
        }
      ]
    },
    {
      "id": "souscription",
      "name": "Souscription",
      "icon": "FileSignature",
      "steps": [
        {
          "id": "identity",
          "title": "Identité",
          "type": "fields",
          "fields": [...]
        }
      ]
    }
  ]
}
```

---

## Modifications à Apporter

### 1. Mise à jour de l'interface TypeScript

Créer de nouvelles interfaces dans `FormStepEditor.tsx` :

```typescript
// Type d'étape
type StepType = "fields" | "calculation_rules";

// Sous-étape (dans une phase)
interface FormSubStep {
  id: string;
  title: string;
  type: StepType;
  fields?: FieldConfig[];           // Si type = "fields"
  calculationRules?: CalculationRules; // Si type = "calculation_rules"
}

// Grande phase (Cotation ou Souscription)
interface FormPhase {
  id: "cotation" | "souscription";
  name: string;
  icon: string;
  steps: FormSubStep[];
}

// Structure racine
interface FormStructure {
  phases: FormPhase[];
}
```

### 2. Nouveau Composant : PhaseStepEditor

Remplacer le simple `FormStepEditor` par un éditeur hiérarchique :

```text
┌─────────────────────────────────────────────────────────────────┐
│  [COTATION]  │  [SOUSCRIPTION]           ← Onglets des phases   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase : COTATION                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ▼ Règles de calcul (étape spéciale)    [↑] [↓] [×]         ││
│  │   - Formule de base                                         ││
│  │   - Coefficients                                            ││
│  │   - Taxes                                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ▼ Informations véhicule                [↑] [↓] [×]         ││
│  │   - Marque                                                  ││
│  │   - Modèle                                                  ││
│  │   - Valeur                                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [+ Ajouter une sous-étape]                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Composant CalculationRulesSubStep

Nouveau composant pour configurer les règles de calcul dans une sous-étape :

| Élément | Description |
|---------|-------------|
| Formule de base | Textarea avec variables disponibles |
| Coefficients | Table avec tranches (min, max, valeur) |
| Taxes | Taux + nom de la taxe |
| Frais | Accessoires, FGA, etc. |
| Simulateur | Tester le calcul avec des valeurs fictives |

### 4. Modifier FormEditorDrawer

Adapter l'interface pour :
1. Afficher les 2 phases (Cotation / Souscription) comme onglets principaux
2. Permettre d'ajouter des sous-étapes à chaque phase
3. Proposer le type de sous-étape : "Champs" ou "Règles de calcul"
4. Drag & drop pour réordonner les sous-étapes

### 5. Migration des Données Existantes

Script de migration pour convertir l'ancien format :

```typescript
// Ancien format
{ step1: {...}, step2: {...} }

// Converti en
{
  phases: [
    { id: "cotation", steps: [step1, step2] },
    { id: "souscription", steps: [] }
  ]
}
```

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `src/components/admin/FormStepEditor.tsx` | Renommer en `FormSubStepEditor.tsx`, adapter aux sous-étapes |
| `src/components/admin/FormPhaseEditor.tsx` | **Nouveau** - Éditeur de phase avec sous-étapes |
| `src/components/admin/CalculationRulesSubStep.tsx` | **Nouveau** - Éditeur de règles dans sous-étape |
| `src/components/admin/products/FormEditorDrawer.tsx` | Refactoriser pour structure phases/sous-étapes |
| `src/components/admin/AdminFormBuilder.tsx` | Adapter à la nouvelle structure |
| `src/components/admin/FormFieldLibrary.tsx` | Ajouter type "Règles de calcul" |

---

## Résultat Visuel Final

```text
┌──────────────────────────────────────────────────────────────────┐
│  Formulaire: Auto Tous Risques                                   │
├────────────────────────┬─────────────────────────────────────────┤
│                        │                                         │
│  📊 COTATION           │  ┌─────────────────────────────────────┐│
│  ├─ 📐 Règles calcul   │  │ Sous-étape: Règles de calcul       ││
│  ├─ 🚗 Véhicule        │  │                                     ││
│  └─ ⚙️ Options         │  │ Formule: base * coef * (1 + taxe)  ││
│                        │  │                                     ││
│  📝 SOUSCRIPTION       │  │ Coefficients:                       ││
│  ├─ 👤 Identité        │  │  - Puissance: [table]               ││
│  ├─ 📍 Coordonnées     │  │  - Zone: [table]                    ││
│  └─ 📄 Documents       │  │                                     ││
│                        │  │ Taxes: 14.5%                        ││
│                        │  └─────────────────────────────────────┘│
└────────────────────────┴─────────────────────────────────────────┘
```

---

## Ordre des Travaux

1. **Créer les nouvelles interfaces TypeScript** (FormPhase, FormSubStep)
2. **Créer FormPhaseEditor.tsx** (éditeur de phase)
3. **Créer CalculationRulesSubStep.tsx** (éditeur règles intégré)
4. **Adapter FormEditorDrawer.tsx** (UI phases/sous-étapes)
5. **Script de migration** (anciens formulaires → nouveau format)
6. **Tests** (vérifier cotation puis souscription)

---

## Avantage Clé

Les **règles de calcul** seront maintenant **visibles et modifiables directement dans le parcours de cotation**, avant les champs de saisie. Cela permettra à l'admin de :

1. Voir le contexte du calcul
2. Modifier les formules en sachant quels champs sont collectés
3. Tester le calcul directement dans le builder
