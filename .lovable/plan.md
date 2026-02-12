
# Correction du parcours Pack Obseques - Elimination des residus Auto

## Problemes identifies

### 1. Champ manquant en simulation (PackObsequesSimulationStep.tsx)
Le premier champ de la spec ("Selectionner une option - Radio Option 1 / Option 2") est absent du sub-step 1. Ce radio doit etre ajoute avant le champ Formule.

### 2. Champs manquants/mal ordonnes en souscription (PackObsequesSubscriptionFlow.tsx)
La spec demande 11 champs dans "Sousc 1/7" :
1. Upload piece d'identite
2. Type de piece d'identite
3. Numero d'identification
4. Situation matrimoniale
5. Nom de famille (pre-rempli)
6. Prenom (pre-rempli)
7. Sexe (pre-rempli) -- **MANQUANT**
8. Date de naissance (pre-rempli)
9. Lieu de naissance (pre-rempli)
10. Numero de telephone (pre-rempli)
11. Situation geographique (optionnel)

Actuellement les champs sont repartis en 3 sub-steps avec le Sexe absent. Il faut :
- Ajouter le champ Sexe (dropdown, pre-rempli depuis la simulation) en position 7
- Reorganiser les sub-steps pour respecter l'ordre : sub-step 1 (champs 1-4), sub-step 2 (champs 5-8), sub-step 3 (champs 9-11)

### 3. SignatureEmissionStep.tsx - Contenu 100% Auto (probleme majeur)

Le composant affiche du contenu exclusivement Auto meme pour Pack Obseques :

| Element | Actuel (Auto) | Attendu (Pack Obseques) |
|---------|---------------|------------------------|
| N de police | AUTO-2025-XXXXX | OBSEQ-2025-XXXXX |
| Documents | Attestation, Conditions, **Carte verte** | **Certificat d'adhesion**, Conditions, **Tableau des garanties** |
| Recap section 1 | **Vehicule** (marque, modele, CV) | **Souscripteur** (nom, prenom) |
| Recap section 2 | **Conducteur** (permis) | **Formule** (Bronze/Argent/Or) |
| Recap section 3 | Formule (MINI/BASIC/TOUT RISQUE) | **Adhesion** (type, periodicite) |

---

## Plan d'implementation

### Fichier 1 : `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`
- Ajouter un champ Radio "Selectionner une option" (Option 1 / Option 2) en position 1 du sub-step 1, avant le champ Formule
- Ajouter le champ dans le type `PackObsequesData` (types.ts) : `selectedOption: "option1" | "option2"`
- Mettre a jour la validation du sub-step 1 pour inclure ce champ

### Fichier 2 : `src/components/guided-sales/types.ts`
- Ajouter `selectedOption?: "option1" | "option2"` dans `PackObsequesData`
- Ajouter la valeur par defaut dans `initialState`

### Fichier 3 : `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx`
- Sub-step 2 : ajouter le champ Sexe (dropdown pre-rempli depuis `data.gender`) entre Prenom et Date de naissance
- Marquer visuellement les champs pre-remplis avec un indicateur "(pre-rempli depuis la simulation)"
- Reordonner les champs du sub-step 2 : Nom, Prenom, Sexe, Date de naissance
- Sub-step 3 : Lieu de naissance, Telephone, Situation geographique (inchange mais ajouter mention pre-rempli)

### Fichier 4 : `src/components/guided-sales/steps/SignatureEmissionStep.tsx`
Conditionner le contenu selon `state.productSelection.selectedProduct` :

**Section police emise :**
- Prefixe dynamique : `AUTO-` pour auto, `OBSEQ-` pour pack_obseques

**Section documents generes :**
- Auto : Attestation d'assurance, Conditions particulieres, Carte verte
- Pack Obseques : Certificat d'adhesion, Conditions particulieres, Tableau des garanties

**Section recap du contrat :**
- Auto : Vehicule + Conducteur + Formule (MINI/BASIC/TOUT RISQUE) -- inchange
- Pack Obseques : Souscripteur (nom/prenom depuis packObsequesData) + Formule (BRONZE/ARGENT/OR) + Adhesion (type + periodicite)

Les boutons "Editer" pour Pack Obseques redirigeront vers step 1 (simulation) au lieu de "vehicle"/"driver".

---

## Fichiers modifies

| Fichier | Nature |
|---------|--------|
| `types.ts` | Ajout champ `selectedOption` |
| `PackObsequesSimulationStep.tsx` | Ajout radio "Selectionner une option" |
| `PackObsequesSubscriptionFlow.tsx` | Ajout Sexe pre-rempli, mentions pre-rempli |
| `SignatureEmissionStep.tsx` | Conditionnement complet par produit |

## Impact
- Aucune modification de base de donnees
- Modifications purement UI dans 4 fichiers
- Le parcours Auto reste inchange
