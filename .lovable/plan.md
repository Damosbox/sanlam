

## Audit UX : Cohabitation Intelligente Produits & Formulaires

### Diagnostic de l'Existant

Après analyse approfondie des deux modules, voici les observations clés :

---

### Forces Actuelles

| Module | Points Positifs |
|--------|----------------|
| **Produits** | Interface complète à 8 onglets, bonne séparation des préoccupations |
| **Formulaires** | Drag & drop fonctionnel, déploiement B2C/B2B distinct |
| **Liaison** | `subscription_form_id` permet de relier un formulaire à un produit |

---

### Problèmes UX Critiques Identifiés

#### 1. Double Source de Vérité (Violation du principe DRY)
- **Constat** : La catégorie (`vie`/`non-vie`) et le type (`Auto`, `Habitation`) sont définis à 2 endroits :
  - Dans `ProductForm` (onglet Général)
  - Dans `AdminFormBuilder` (config formulaire)
- **Impact** : Risque de désynchronisation, confusion utilisateur

#### 2. Navigation Fragmentée (Violation de la Loi de Fitts)
- **Constat** : Dans `SubscriptionFieldsTab`, le bouton "Gérer les formulaires" ouvre un nouvel onglet
- **Impact** : Perte de contexte, charge cognitive élevée, workflow interrompu

#### 3. Absence de Prévisualisation Contextuelle
- **Constat** : L'admin ne peut pas voir à quoi ressemble le formulaire lié depuis la page produit
- **Impact** : Décisions aveugles, allers-retours fréquents

#### 4. Règles de Calcul Déconnectées
- **Constat** : Les formules de calcul (CalculationRulesTab) ne sont pas liées aux champs du formulaire
- **Impact** : Impossible de mapper automatiquement `age_factor` au champ "Date de naissance"

#### 5. Formulaires Orphelins
- **Constat** : On peut créer des formulaires sans produit associé
- **Impact** : Prolifération de templates inutilisés, maintenance difficile

---

### Recommandations UX Stratégiques

#### Recommandation 1 : Hiérarchie Produit → Formulaire

Établir le **Produit comme entité maître** et le **Formulaire comme composant enfant**.

**Implémentation :**
```text
Produit (parent)
├── Informations générales
├── Formulaire de souscription (enfant intégré)
│   ├── Prévisualisation inline
│   ├── Actions : Éditer, Créer, Dupliquer
│   └── Mini-builder embarqué OU modal plein écran
├── Règles de calcul (avec mapping champs)
└── ...autres onglets
```

**Bénéfice** : Un seul point d'entrée, cohérence garantie

---

#### Recommandation 2 : Prévisualisation Inline du Formulaire

Dans l'onglet "Souscription" du produit, afficher :
- Un aperçu live du formulaire lié (miniature interactive)
- Les étapes avec leurs champs listés
- Un bouton "Éditer ce formulaire" ouvrant un modal/drawer plein écran

**Bénéfice** : Décisions éclairées sans quitter le contexte

---

#### Recommandation 3 : Création de Formulaire Contextuelle

Remplacer le lien externe par :
- **Option A** : "Créer un formulaire pour ce produit" → Pré-remplit catégorie/type
- **Option B** : "Dupliquer depuis un template existant" → Copie et personnalise
- **Option C** : "Sélectionner un formulaire existant" → Dropdown actuel amélioré

**Bénéfice** : Workflow fluide, moins d'erreurs

---

#### Recommandation 4 : Mapping Champs ↔ Variables de Calcul

Dans l'onglet "Règles de calcul", permettre :
1. Lister les champs du formulaire lié
2. Mapper chaque champ à une variable de formule (`date_naissance` → `age_factor`)
3. Validation automatique : alerte si variable non mappée

**Bénéfice** : Cohérence entre collecte de données et tarification

---

#### Recommandation 5 : Indicateurs de Complétude

Ajouter des badges visuels sur chaque onglet du produit :
- ✅ Vert : Complet
- ⚠️ Orange : Partiellement configuré
- ❌ Rouge : Manquant/Erreur

**Exemple** :
```text
[Général ✅] [Souscription ⚠️] [Calcul ❌] [Paiements ✅]
```

**Bénéfice** : Visibilité immédiate de l'état de configuration

---

### Plan d'Implémentation

#### Phase 1 : Amélioration de l'Onglet Souscription (Priorité Haute)

| Tâche | Fichier | Description |
|-------|---------|-------------|
| Prévisualisation formulaire | `SubscriptionFieldsTab.tsx` | Afficher aperçu inline du formulaire lié |
| Création contextuelle | `SubscriptionFieldsTab.tsx` | Boutons "Créer pour ce produit" / "Dupliquer" |
| Modal d'édition | Nouveau composant | Drawer plein écran pour éditer sans quitter |

#### Phase 2 : Héritage Catégorie/Type (Priorité Moyenne)

| Tâche | Fichier | Description |
|-------|---------|-------------|
| Auto-sync catégorie | `AdminFormBuilder.tsx` | Hériter catégorie/type du produit parent |
| Formulaires liés | `FormTemplatesList.tsx` | Afficher colonne "Produit associé" |

#### Phase 3 : Mapping Variables (Priorité Basse)

| Tâche | Fichier | Description |
|-------|---------|-------------|
| Mapper champs → variables | `CalculationRulesTab.tsx` | Interface de mapping visuel |
| Validation formules | `CalculationRulesTab.tsx` | Alertes si variables non mappées |

---

### Wireframe de l'Onglet Souscription Amélioré

```text
┌─────────────────────────────────────────────────────────────────┐
│  Formulaire de souscription                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Dropdown] Formulaire Auto Premium ▼                      │   │
│  │                                                            │   │
│  │ ○ Créer un nouveau formulaire pour ce produit             │   │
│  │ ○ Dupliquer depuis un template existant                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 APERÇU DU FORMULAIRE                      │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │ Étape 1: Informations véhicule                     │   │   │
│  │  │ • Marque/Modèle (texte)                            │   │   │
│  │  │ • Date mise en circulation (date)                  │   │   │
│  │  │ • Valeur vénale (nombre)                           │   │   │
│  │  ├────────────────────────────────────────────────────┤   │   │
│  │  │ Étape 2: Informations conducteur                   │   │   │
│  │  │ • Date de naissance (date)                         │   │   │
│  │  │ • Permis de conduire (fichier)                     │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                                                            │   │
│  │  [✏️ Modifier le formulaire]  [👁️ Prévisualiser]           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Section Technique

**Composants à créer/modifier :**

1. `FormPreviewCard.tsx` - Aperçu compact du formulaire
2. `FormEditorDrawer.tsx` - Modal plein écran pour édition
3. `FieldVariableMapper.tsx` - Interface de mapping champs/variables
4. `ProductCompletionBadge.tsx` - Indicateur de complétude par onglet

**Queries à optimiser :**
- Charger le formulaire lié avec le produit (`products` JOIN `form_templates`)
- Récupérer les champs du formulaire pour le mapping

**Structure de données étendue :**
```typescript
interface ProductFormData {
  // ...existant
  subscription_form_id: string | null;
  field_variable_mappings: {
    field_id: string;      // ID du champ formulaire
    variable_name: string; // Nom de la variable de calcul
  }[];
}
```

