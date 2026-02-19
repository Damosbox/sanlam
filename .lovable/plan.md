

# Plan : Enrichissement de l'editeur de regles de calcul

## Contexte

Le fichier JSON de reference (moteur_produit.json) revele 4 manques dans l'editeur actuel :

1. Les **formules** (expressions de calcul) et les **packs** (formules commerciales Bronze/Argent/Or) sont melanges dans un seul bloc
2. Il manque un bloc **Options** (configurations parametrables comme "3 enfants", "6 enfants")
3. Il manque un bloc **Charges** (chargements d'acquisition, de gestion - actuellement noyes dans les parametres)
4. Les parametres manquent de champs : `category`, `value`, `valueType`

---

## Partie 1 : Nouveaux types

**Fichier** : `src/components/admin/calc-rules/types.ts`

Ajouter 3 nouvelles interfaces :

```text
CalcRuleOption
  - id: string
  - code: string        (ex: OPTION_1)
  - name: string        (ex: Option 1)
  - description: string (ex: 3 enfants)
  - parameters: string  (ex: NOMBRE_ENFANTS=3)
  - displayOrder: number
  - isActive: boolean

CalcRulePackage
  - id: string
  - code: string        (ex: BRONZE)
  - name: string        (ex: Formule Bronze)
  - description: string
  - configuration: string (ex: CAPITAL_ASSURE=300000;CAPITAL_ENFANT=150000)
  - displayOrder: number
  - isActive: boolean

CalcRuleCharge
  - id: string
  - code: string        (ex: CHARGEMENT_ACQUISITION)
  - name: string        (ex: Chargement d'acquisition)
  - description: string
  - value: string       (ex: 0.2)
  - category: string    (ex: CHARGEMENT, TECHNIQUE)
  - displayOrder: number
```

Enrichir `CalcRuleParameter` avec :
- `category?: string` (TECHNIQUE, CHARGEMENT, FRAIS, COTATION)
- `value?: string` (valeur par defaut)
- `valueType?: number` (type de valeur)

Enrichir `CalcRule` avec :
- `options: CalcRuleOption[]`
- `packages: CalcRulePackage[]`
- `charges: CalcRuleCharge[]`

---

## Partie 2 : Migration base de donnees

**Migration SQL** : Ajouter 3 colonnes jsonb a `calculation_rules`

```text
ALTER TABLE calculation_rules
  ADD COLUMN options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN charges jsonb NOT NULL DEFAULT '[]'::jsonb;
```

---

## Partie 3 : Refonte de l'editeur (CalcRuleEditor)

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx`

### 3.1 Separation "Formules / Packs" en deux accordions

L'accordion actuel "Formules / Packs" sera scinde en :

- **Accordion "Formules de calcul"** : expressions mathematiques (PUC, PAC, primes periodiques)
  - Code, nom, expression, variable resultat
  - Chaque formule garde ses garanties couvertes
  
- **Accordion "Packs commerciaux"** : formules commerciales (Bronze, Argent, Or)
  - Code, nom, description
  - Configuration sous forme cle=valeur (ex: CAPITAL_ASSURE=300000;CAPITAL_ENFANT=150000)
  - Ordre d'affichage, switch actif/inactif

### 3.2 Nouveau bloc "Options"

Nouvel accordion entre les packs et les taxes :

- Code, nom, description
- Parametres sous forme cle=valeur (ex: NOMBRE_ENFANTS=3)
- Ordre d'affichage, switch actif/inactif

### 3.3 Nouveau bloc "Chargements"

Nouvel accordion apres les parametres :

- Code, nom, description
- Valeur (taux ou montant fixe)
- Categorie (TECHNIQUE, CHARGEMENT, FRAIS)
- Ordre d'affichage

### 3.4 Parametres enrichis

Dans l'accordion "Parametres de cotation", ajouter :
- Champ `category` (select : TECHNIQUE, CHARGEMENT, FRAIS, COTATION)
- Champ `value` (valeur par defaut)
- Ces champs sont optionnels et collapses par defaut

---

## Partie 4 : Mise a jour du formulaire d'etat

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx`

Le state `form` sera enrichi avec :
- `options: CalcRuleOption[]`
- `packages: CalcRulePackage[]`
- `charges: CalcRuleCharge[]`

Les fonctions CRUD suivantes seront ajoutees :
- `addOption`, `updateOption`, `removeOption`
- `addPackage`, `updatePackage`, `removePackage`
- `addCharge`, `updateCharge`, `removeCharge`

Le `useEffect` d'hydratation et le `onSave` incluront ces 3 nouveaux tableaux.

---

## Partie 5 : Mise a jour de la page CalcRulesPage

**Fichier** : `src/pages/admin/CalcRulesPage.tsx`

- Ajouter les colonnes Options, Packs, Charges dans le tableau de la liste
- Le payload de sauvegarde inclura `options`, `packages`, `charges`

---

## Ordre des accordions dans l'editeur final

```text
1. Informations generales
2. Parametres de cotation (enrichis avec category/value)
3. Chargements (NOUVEAU)
4. Formules de calcul (separe des packs)
5. Packs commerciaux (NOUVEAU, separe des formules)
6. Options (NOUVEAU)
7. Formule de base
8. Tables de reference
9. Taxes
10. Frais
11. Simulation
```

---

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonnes `options`, `packages`, `charges` |
| `src/components/admin/calc-rules/types.ts` | Ajouter 3 interfaces + enrichir CalcRuleParameter et CalcRule |
| `src/components/admin/calc-rules/CalcRuleEditor.tsx` | 3 nouveaux accordions + separation formules/packs + parametres enrichis |
| `src/pages/admin/CalcRulesPage.tsx` | Colonnes et payload mis a jour |
| `src/components/admin/calc-rules/CalcRuleSimulator.tsx` | Passer les nouvelles props si necessaire |

