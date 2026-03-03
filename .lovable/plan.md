

## Pack Obsèques : options enfants liées, plafond d'âge, et récap simulation enrichi

### Contexte

Actuellement, le nombre d'enfants est un select libre (0-3) indépendant de l'option sélectionnée. L'utilisateur demande :
- **Option 1** → 0 à 3 enfants, **Option 2** → 4 à 6 enfants
- Prise en compte d'un **plafond d'âge** (les enfants couverts doivent avoir moins de 21 ans, standard assurance obsèques)
- **Récap simulation enrichi** en 3 sections : Détail prime, Détail capitaux, Données de simulation
- 3 actions : Sauvegarder / Envoyer / Souscrire (déjà en place, à garder)

### Modifications

**1. `PackObsequesSimulationStep.tsx` — Sub-step 1 : lier enfants aux options**

- Modifier le select "Nombre d'enfants" pour afficher dynamiquement les valeurs selon `data.selectedOption` :
  - `option1` → valeurs 0, 1, 2, 3
  - `option2` → valeurs 4, 5, 6
- Quand l'option change, reset `nombreEnfants` à 0 (option1) ou 4 (option2) pour éviter une valeur incohérente
- Ajouter un label descriptif sur les options radio : "Option 1 (0 à 3 enfants)" / "Option 2 (4 à 6 enfants)"
- Ajouter un champ info "Plafond d'âge : enfants de moins de 21 ans" sous le select enfants

**2. `PackObsequesSimulationStep.tsx` — Sub-step 4 : récap simulation enrichi**

Remplacer le bloc de résultat actuel (grille simple) par 3 sections Card distinctes :

**Section 1 — Détail sur la prime :**
- Première prime = Prime Périodique nette + Frais d'adhésion
- Prime Périodique nette (via `getPeriodicPremium`)
- Frais d'adhésion (= `fraisAccessoires`)

**Section 2 — Détails sur les capitaux :**
- Capital assuré principal
- Capital par enfant (si enfants > 0)
- Capital par ascendant (si ascendants > 0)
- Capital total garanti

**Section 3 — Détails sur les données de simulation :**
- Option sélectionnée
- Formule
- Type d'adhésion
- Périodicité
- Nombre d'enfants
- Nombre d'ascendants (si applicable)
- Conjoint (Oui/Non)
- Date d'effet
- Assuré (nom complet)

Les 3 boutons d'action (Sauvegarder / Envoyer / Souscrire) restent identiques en bas.

**3. `packObsequesPremiumCalculator.ts` — Support 4-6 enfants**

Le calculateur utilise déjà `nombreEnfants * TARIF_ENFANT_ANNUEL[formula]`, donc il supporte naturellement 4-6 enfants sans modification. Aucun changement nécessaire.

**4. `types.ts` — Aucun changement**

`nombreEnfants: number` reste un number, les valeurs 0-6 sont toutes supportées.

### Résultat

L'option radio détermine la tranche d'enfants disponible, un message rappelle le plafond d'âge de 21 ans, et le récap post-calcul est structuré en 3 sections claires (prime, capitaux, données) avec les 3 actions en bas.

