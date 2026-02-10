

# Aligner Pack Obseques sur le pattern Auto (suppression sub-step 5)

## Probleme

Dans Auto, le bouton "Calculer" et les resultats sont sur la **meme sous-etape** (sub-step 5). Apres calcul, le resultat s'affiche en dessous et le bouton "Voir les offres" apparait inline. Pas de navigation vers un ecran separe.

Dans Pack Obseques, cliquer "Calculer" navigue vers une sous-etape 5 separee (resultats seuls + bouton "Modifier"), ce qui cree un conflit avec le "Voir les offres" du SalesAssistant.

## Solution

Fusionner sub-step 4 et sub-step 5 : garder le bouton "Calculer" sur sub-step 4 et afficher les resultats **en dessous** sur le meme ecran apres calcul, exactement comme Auto.

### Modifications

**Fichier** : `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

1. **Supprimer `renderSubStep5()`** entierement (lignes 391-470)
2. **Modifier `renderSubStep4()`** pour :
   - Garder les 4 champs (Email, Sexe, Titre, Lieu de naissance)
   - Garder le bouton "Calculer la prime" (sans navigation vers sub-step 5)
   - Apres calcul (`simulationCalculated === true`), afficher le resultat inline en dessous (carte prime + carte recapitulatif) - meme pattern que Auto
   - Le `handleCalculate` ne fait plus `setSubStep(5)`, il appelle juste `onCalculate()`
3. **Mettre a jour le state** : supprimer sub-step 5 du type (`useState<1 | 2 | 3 | 4>`)
4. **Corriger `getTotalSteps()`** : famille = 4, individuelle = 3
5. **Supprimer le rendu conditionnel** `{subStep === 5 && renderSubStep5()}` du return

### Pattern cible (identique a Auto)

```text
Sub-step 4 : Assure principal (2/2)
  - 4 champs (Email, Sexe, Titre, Lieu)
  - [Calculer la prime]          <- bouton principal
  - [Retour]
  
  --- apres calcul (inline) ---
  
  [Carte resultat prime]         <- apparait sous le bouton
  [Carte recapitulatif]
  [Retour]                       <- seul bouton, pas de "Voir les offres"
```

Le "Voir les offres" reste uniquement dans le SalesAssistant sidebar = source unique d'action principale.

## Fichier impacte

| Fichier | Modification |
|---|---|
| `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx` | Fusion sub-step 4+5, suppression sub-step 5, correction compteurs |

