
# Refonte du Parcours Pack Obsèques - Alignement sur Document SanlamAllianz

## Analyse du Document

Le document définit un flux en 3 étapes de simulation + 7 étapes de souscription (seule 1/7 est détaillée).

### Phase Simulation (15 champs en 3 sous-étapes document)

| Sous-étape Doc | N° | Champ | Type |
|----------------|-----|-------|------|
| **1/2** | 1 | Formules | Dropdown (BRONZE/ARGENT/OR) |
| **1/2** | 2 | Type d'adhésion | Dropdown (Individuelle/Famille/Famille+ascendant) |
| **1/2** | 3 | Périodicité | Dropdown |
| **1/2** | 4 | Nombre d'enfants | Number (0-3, conditionnel) |
| **1/2** | 5 | Nombre d'ascendants | Number (0-2, conditionnel) |
| **1/2** | 6 | Ajouter conjoint? | Radio (Oui/Non, conditionnel) |
| **1/2** | 7 | Date d'effet | Date picker |
| **2/3** | 8 | Nom | Texte |
| **2/3** | 9 | Prénom | Texte |
| **2/3** | 10 | Contact téléphonique | Texte |
| **2/3** | 11 | Date de naissance | Date picker |
| **2/3** | 12 | E-mail | Texte |
| **2/3** | 13 | Sexe | Dropdown |
| **2/3** | 14 | Titre | Dropdown |
| **2/3** | 15 | Lieu de naissance | Texte |
| **3/3** | - | Affichage primes calculées | Display |

### Phase Souscription (11 champs dans étape 1/7)

| N° | Champ | Type | Notes |
|-----|-------|------|-------|
| 1 | Upload pièce d'identité | File upload | Oui |
| 2 | Type de pièce d'identité | Dropdown | Oui |
| 3 | Numéro d'identification | Texte | Oui |
| 4 | Situation matrimoniale | Dropdown | Oui |
| 5 | Nom de famille | Texte | Pré-rempli |
| 6 | Prénom | Texte | Pré-rempli |
| 7 | Sexe | Dropdown | Pré-rempli |
| 8 | Date de naissance | Date picker | Pré-rempli |
| 9 | Lieu de naissance | Texte | Pré-rempli |
| 10 | Numéro de téléphone | Texte | Pré-rempli |
| 11 | Situation géographique | Texte | Optionnel |

---

## Structure Proposée - Sous-étapes de max 4 champs

### PHASE 1 : SIMULATION (4 sous-étapes)

```text
┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 1.1 : Formule & Type                   ●○○○       │
├────────────────────────────────────────────────────────────────┤
│ 1. Formule              [BRONZE ▼]                             │
│ 2. Type d'adhésion      [Famille ▼]                           │
│ 3. Périodicité          [Mensuel ▼]                           │
│ 4. Date d'effet         [📅 DD/MM/YYYY]                       │
├────────────────────────────────────────────────────────────────┤
│                                              [Suivant →]       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 1.2 : Famille (conditionnel)          ○●○○        │
├────────────────────────────────────────────────────────────────┤
│ (Si Type = Famille ou Famille+ascendant)                      │
│ 1. Nombre d'enfants     [0 ▼] (max 3)                         │
│ 2. Ajouter conjoint?    ○ Oui  ○ Non                          │
│                                                                │
│ (Si Type = Famille+ascendant)                                  │
│ 3. Nombre d'ascendants  [0 ▼] (max 2)                         │
├────────────────────────────────────────────────────────────────┤
│ [← Retour]                                   [Suivant →]       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 1.3 : Assuré principal (1/2)          ○○●○        │
├────────────────────────────────────────────────────────────────┤
│ 1. Titre                [Monsieur ▼]                          │
│ 2. Nom                  [_____________]                        │
│ 3. Prénom               [_____________]                        │
│ 4. Sexe                 [Masculin ▼]                          │
├────────────────────────────────────────────────────────────────┤
│ [← Retour]                                   [Suivant →]       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 1.4 : Assuré principal (2/2)          ○○○●        │
├────────────────────────────────────────────────────────────────┤
│ 1. Date de naissance    [📅 DD/MM/YYYY]                       │
│ 2. Lieu de naissance    [_____________]                        │
│ 3. Téléphone            [_____________]                        │
│ 4. E-mail               [_____________]                        │
├────────────────────────────────────────────────────────────────┤
│                    ┌─────────────────────┐                     │
│                    │     CALCULER        │                     │
│                    └─────────────────────┘                     │
│ [← Retour]                              [Voir les offres →]    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ RÉSULTAT SIMULATION (après calcul)                             │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ La première prime      : 15 000 FCFA                       │ │
│ │ Prime TTC              : 18 500 FCFA                       │ │
│ │ Prime périodique nette : 12 000 FCFA                       │ │
│ │ Capital assuré princ.  : 500 000 FCFA                      │ │
│ │ Capital par ascendant  : 150 000 FCFA                      │ │
│ │ Capital par enfant     : 100 000 FCFA                      │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### PHASE 2 : SOUSCRIPTION (3 sous-étapes pour étape 1/7)

```text
┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 2.1 : Pièce d'identité                ●○○         │
├────────────────────────────────────────────────────────────────┤
│ 1. Upload pièce d'identité  [📎 Télécharger]                  │
│ 2. Type de pièce            [CNI ▼]                           │
│ 3. Numéro d'identification  [_____________]                    │
│ 4. Situation matrimoniale   [Marié(e) ▼]                      │
├────────────────────────────────────────────────────────────────┤
│ [← Retour]                                   [Suivant →]       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 2.2 : Vérification informations       ○●○         │
├────────────────────────────────────────────────────────────────┤
│ Pré-rempli depuis simulation (modifiable) :                    │
│ 1. Nom de famille       [Kouamé        ]                       │
│ 2. Prénom               [Jean          ]                       │
│ 3. Sexe                 [Masculin ▼]                          │
│ 4. Date de naissance    [📅 15/03/1985]                       │
├────────────────────────────────────────────────────────────────┤
│ [← Retour]                                   [Suivant →]       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Sous-étape 2.3 : Coordonnées                     ○○●         │
├────────────────────────────────────────────────────────────────┤
│ 1. Lieu de naissance        [Abidjan    ]                      │
│ 2. Numéro de téléphone      [+225 07 00 00 00 00]              │
│ 3. Situation géographique   [Cocody, Abidjan] (optionnel)      │
├────────────────────────────────────────────────────────────────┤
│ [← Retour]                                   [Souscrire →]     │
└────────────────────────────────────────────────────────────────┘
```

---

## Nouveaux Types à Ajouter

```typescript
// Dans PackObsequesData
export type PackObsequesFormula = "bronze" | "argent" | "or";
export type AdhesionType = "individuelle" | "famille" | "famille_ascendant";
export type TitleType = "monsieur" | "madame" | "mademoiselle" | "docteur" | "maitre" | "corporation" | "entreprise" | "etablissement";

// Champs additionnels PackObsequesData
formula: PackObsequesFormula;
adhesionType: AdhesionType;
addSpouse: boolean;
effectiveDate: string;
title: TitleType;
firstName: string;
lastName: string;
gender: GenderType;
birthPlace: string;

// Souscription Pack Obsèques
identityDocumentFile?: string;
identityDocumentType: string;
identityNumber: string;
maritalStatus: string;
geographicLocation?: string;
```

---

## Fichiers à Modifier/Créer

| Fichier | Action | Description |
|---------|--------|-------------|
| `types.ts` | **MODIFIER** | Ajouter nouveaux types (formule, adhésion, titre) et champs PackObsequesData |
| `PackObsequesSimulationStep.tsx` | **CRÉER** | 4 sous-étapes de simulation avec max 4 champs |
| `PackObsequesSubscriptionFlow.tsx` | **CRÉER** | 3 sous-étapes de souscription selon doc 1/7 |
| `PackObsequesNeedsStep.tsx` | **SUPPRIMER** | Remplacé par PackObsequesSimulationStep |
| `packObsequesPremiumCalculator.ts` | **MODIFIER** | Ajuster calcul selon formule (Bronze/Argent/Or) |
| `GuidedSalesFlow.tsx` | **MODIFIER** | Intégrer nouveaux composants pour pack_obseques |

---

## Logique Conditionnelle

1. **Type d'adhésion** contrôle l'affichage :
   - `Individuelle` → Pas de champs enfants/ascendants/conjoint
   - `Famille` → Affiche enfants (0-3) + conjoint (Oui/Non)
   - `Famille + ascendant` → Affiche tout (enfants + ascendants + conjoint)

2. **Champs pré-remplis en souscription** :
   - Nom, Prénom, Sexe, Date naissance, Lieu naissance, Téléphone → viennent de la simulation
   - Modifiables si nécessaire

3. **Formule** affecte les capitaux garantis :
   - BRONZE : Capital de base
   - ARGENT : Capital intermédiaire
   - OR : Capital maximum

---

## Points Clés

1. **Ordre exact du document respecté** - Numérotation 1-15 pour simulation, puis 1-11 pour souscription

2. **Max 4 champs par sous-étape** - UX cohérente avec parcours Auto

3. **Sous-étape famille conditionnelle** - S'affiche uniquement si type ≠ Individuelle

4. **Résultat simulation complet** - Affiche 6 valeurs calculées (primes + capitaux)

5. **Pré-remplissage intelligent** - Les données saisies en simulation sont réutilisées en souscription
