

## Plan : Import CSV global + IA pour pré-remplir les règles de calcul

### Constat actuel

L'import CSV existant dans `CalcRuleEditor` ne concerne que les **tables de référence** (key_value ou brackets). Il n'y a aucun moyen d'importer un CSV global qui remplirait l'ensemble des sections (paramètres, formules, taxes, frais, charges, packages, options, tables).

### Fonctionnalité cible

Un bouton **"Importer un CSV actuariel"** en haut du `CalcRuleEditor` qui :
1. Accepte un fichier CSV préparé par un actuaire
2. Envoie le contenu à une Edge Function IA qui analyse la structure et mappe les données vers le format `CalcRule`
3. Pré-remplit toutes les sections du formulaire avec les données extraites
4. L'utilisateur peut vérifier/ajuster avant de sauvegarder

### Format CSV attendu

Le CSV utilise un format par sections, séparées par des lignes de type `[SECTION]` :

```text
[GENERAL]
name;Auto 401 - Privée
type;non-vie
usage_category;401
usage_category_label;Promenade / Tourisme

[PARAMETERS]
code;label;type;required;category;value
puissance_fiscale;Puissance fiscale;number;true;COTATION;
usage;Usage du véhicule;select;true;COTATION;prive|professionnel

[FORMULAS]
code;name;formula
RC;Responsabilité Civile;valeur_neuve * 0.035
VOL;Vol;valeur_neuve * 0.012

[TAXES]
code;name;rate;isActive
TVA;Taxe sur contrats;14.2;true
CEDEAO;Taxe CEDEAO;0.5;true

[FEES]
code;name;amount
FRAIS_GESTION;Frais de gestion;5000
CARTE_ROSE;Carte rose;2000

[TABLES]
code;name;type
coef_puissance;Coefficient puissance;key_value
1-5CV;0.8
6-10CV;1.0
11-15CV;1.3

[CHARGES]
code;name;value;category
COMM;Commission courtier;12%;CHARGEMENT
```

### Changements techniques

#### 1. Nouvelle Edge Function `parse-calc-rule-csv`

**Fichier :** `supabase/functions/parse-calc-rule-csv/index.ts`

- Reçoit le contenu CSV brut en `body.csvContent`
- Utilise l'IA (Lovable AI - `google/gemini-2.5-flash`) pour analyser le CSV et le mapper vers la structure `CalcRule`
- Le prompt IA reçoit : le contenu CSV + le schéma JSON attendu (paramètres, formules, taxes, fees, tables_ref, charges, packages, options)
- L'IA retourne un JSON structuré conforme aux types `CalcRule`
- Fallback : si le CSV suit le format par sections `[SECTION]`, un parser déterministe traite directement sans appel IA
- Retourne `{ success: true, data: Partial<CalcRule>, warnings: string[] }`

#### 2. Mise à jour de `CalcRuleEditor.tsx`

- Ajouter un bouton **"Importer CSV actuariel"** avec icône `FileSpreadsheet` en haut de l'éditeur, avant l'Accordion
- Au clic : ouvrir un `Dialog` avec :
  - Zone de drop/upload pour le CSV
  - Aperçu du fichier (premières lignes)
  - Bouton "Analyser avec l'IA" qui appelle `parse-calc-rule-csv`
  - Affichage du résultat : nombre d'éléments détectés par section (ex: "5 paramètres, 3 formules, 2 taxes")
  - Liste de warnings éventuels de l'IA
  - Bouton "Appliquer" qui fusionne le résultat dans le `form` state (merge, pas écrasement si des données existent déjà)
- State : `csvDialogOpen`, `csvContent`, `aiParsing`, `aiResult`, `aiWarnings`

#### 3. Logique de merge

Quand l'utilisateur clique "Appliquer" :
- Les infos générales (name, type, usage_category) ne sont appliquées que si les champs actuels sont vides
- Les paramètres, formules, taxes, fees, tables_ref, charges, packages, options sont **ajoutés** aux listes existantes (pas de doublon par `code`)
- La `base_formula` n'est mise à jour que si elle est vide

### UI du dialog d'import

```text
┌─────────────────────────────────────────────────┐
│  📊 Importer un fichier actuariel               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Glissez un fichier CSV ici             │    │
│  │  ou cliquez pour sélectionner           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  📄 auto_401_prive.csv (12 Ko)                  │
│  Aperçu : 45 lignes, 6 sections détectées       │
│                                                 │
│  [🤖 Analyser avec l'IA]                        │
│                                                 │
│  ✅ Résultat de l'analyse :                     │
│  • 8 paramètres détectés                        │
│  • 3 formules détectées                         │
│  • 2 taxes détectées                            │
│  • 2 frais détectés                             │
│  • 1 table de référence (12 entrées)            │
│  • 2 chargements détectés                       │
│                                                 │
│  ⚠️ 1 avertissement :                           │
│  • Colonne "garantie" ignorée (format inconnu)  │
│                                                 │
│              [Annuler]  [Appliquer]              │
└─────────────────────────────────────────────────┘
```

### Fichiers impactés

| Fichier | Changement |
|---|---|
| `supabase/functions/parse-calc-rule-csv/index.ts` | Nouvelle Edge Function (parser déterministe + IA) |
| `src/components/admin/calc-rules/CalcRuleEditor.tsx` | + bouton import global, Dialog, appel Edge Function, merge |

