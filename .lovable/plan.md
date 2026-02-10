

# Alignement Pack Obsèques sur le referentiel metier (ISO champs)

## Contexte

Le PDF de specification definit exactement les champs, leur ordre et leur regroupement pour la simulation et la souscription Pack Obseques. L'implementation actuelle diverge sur l'ordre des champs et le regroupement. L'aide IA (SalesAssistant sidebar) est conservee.

## Ecarts identifies

### Simulation - Ordre des champs subscriber

| Spec (ordre officiel) | Implementation actuelle |
|---|---|
| 1. Nom | 1. Titre |
| 2. Prenom | 2. Nom |
| 3. Contact telephonique | 3. Prenom |
| 4. Date de naissance | 4. Sexe |
| 5. E-mail | 5. Date de naissance |
| 6. Sexe | 6. Lieu de naissance |
| 7. Titre | 7. Telephone |
| 8. Lieu de naissance | 8. Email |

### Simulation - Resultats (sub-step 5)

| Spec | Actuel | Probleme |
|---|---|---|
| Premiere prime | Premiere prime | Valeur = primeTTC (OK) |
| Prime TTC | Prime TTC | Valeur identique a Premiere prime (redondant) |
| Prime periodique nette | Prime periodique nette | Affiche primeTotale (annuel) au lieu de la prime periodique |
| Capital assure principal | Capital assure principal | OK |
| Capital par ascendant | Capital par ascendant | Valeur hardcodee 150000 au lieu de varier par formule |
| Capital par enfant | Capital par enfant | Valeur hardcodee 100000 au lieu de varier par formule |

### Souscription - Champs manquant

Le spec montre 11 champs pour Sousc 1/7. L'implementation actuelle les a mais le champ "Date picker" (ligne 7 du spec, probablement un doublon de date de naissance) est flou. Le reste est conforme.

### Routing - FormulaSelectionStep

Apres la simulation Pack Obseques, le flow passe par `FormulaSelectionStep` (Step 2) qui est concu pour Auto (MINI/BASIC/MEDIUM+). La formule Pack Obseques est deja selectionnee en simulation. Ce step doit etre saute.

## Modifications prevues

### 1. Reordonner les champs subscriber (Simulation sub-steps 3 et 4)

**Fichier**: `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

Sub-step 3 (max 4 champs) - dans l'ordre spec :
1. Nom
2. Prenom
3. Contact telephonique
4. Date de naissance

Sub-step 4 (max 4 champs) :
1. E-mail
2. Sexe
3. Titre
4. Lieu de naissance

Mise a jour des validations `isSubStep3Valid` et `isSubStep4Valid` en consequence.

### 2. Corriger les resultats (sub-step 5)

**Fichier**: `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

- **Prime periodique nette** : calculer via `getPeriodicPremium(breakdown.primeTotale, data.periodicity)` au lieu d'afficher la prime annuelle
- **Capital par enfant** : utiliser `CAPITAL_PAR_ENFANT[formula]` depuis le calculator (importer la constante ou recalculer via breakdown)
- **Capital par ascendant** : utiliser `CAPITAL_PAR_ASCENDANT[formula]` depuis le calculator

Pour rendre ces capitaux accessibles, ajouter `capitalParEnfant` et `capitalParAscendant` au `PackObsequesPremiumBreakdown` retourne par le calculator.

### 3. Sauter FormulaSelectionStep pour Pack Obseques et Molo Molo

**Fichier**: `src/components/guided-sales/GuidedSalesFlow.tsx`

Dans `nextStep()`, quand le step actuel est 1 (simulation) et le produit est `pack_obseques` ou `molo_molo`, sauter directement au step 3 (souscription) au lieu du step 2 (formule).

### 4. Exporter les capitaux par membre depuis le calculator

**Fichier**: `src/utils/packObsequesPremiumCalculator.ts`

Ajouter `capitalParEnfant` et `capitalParAscendant` dans le `PackObsequesPremiumBreakdown` pour que la vue resultats puisse les afficher dynamiquement selon la formule.

### 5. Remplacer l'icone Cross

**Fichier**: `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

Remplacer `Cross` (connotation negative) par `Shield` ou `Heart` (plus adapte a un produit obseques).

## Fichiers impactes

| Fichier | Modification |
|---|---|
| `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx` | Reordre champs, fix resultats, icone |
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Skip FormulaSelectionStep pour produits Vie |
| `src/utils/packObsequesPremiumCalculator.ts` | Exporter capitaux par membre dans le breakdown |

## Ce qui ne change pas

- SalesAssistant sidebar (aide IA partenaire) : conservee telle quelle
- Souscription (PackObsequesSubscriptionFlow) : champs deja conformes au spec
- Logique de calcul de prime : inchangee, seul l'affichage est corrige

