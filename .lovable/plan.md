
# Implementations requises - 5 chantiers

## 1. Vente guidee : suppression de l'etape analyse des risques

L'etape `UnderwritingStep` (Step 4 actuel) sera completement supprimee du flux. Le parcours passera directement de la souscription (Step 3) a la finalisation.

**Fichiers concernes :**
- `src/components/guided-sales/GuidedSalesFlow.tsx` : Supprimer l'import de `UnderwritingStep`, re-mapper les etapes pour que Step 4 = MobilePayment et Step 5 = SignatureEmission (flux en 6 etapes -> 5 etapes). Mettre a jour `PHASE_STEPS`, `getPhaseFromStep`, `renderStep()`, et les labels de navigation.
- `src/components/guided-sales/steps/UnderwritingStep.tsx` : Fichier conserve mais plus importe (nettoyage optionnel).

**Mapping actuel -> nouveau :**

```text
Step 0: Product Selection     -> Step 0 (inchange)
Step 1: Simulation            -> Step 1 (inchange)
Step 2: Formula Selection     -> Step 2 (inchange)
Step 3: Subscription Flow     -> Step 3 (inchange)
Step 4: Mobile Payment        -> Step 4 (ancien Step 4 supprime)
Step 5: Signature & Emission  -> Step 5 (inchange en numero, ancien Step 5)
```

Note : L'etape UnderwritingStep n'est en fait jamais appelee dans le `renderStep()` actuel (les steps vont de 0 a 5, avec 4=MobilePayment et 5=Signature). L'import existe mais le composant n'est pas utilise. Verification : le `renderStep` actuel ne contient pas de case pour UnderwritingStep. **Aucune modification de flux n'est necessaire**, seul le nettoyage de l'import mort sera fait.

---

## 2. Vente guidee : suppression des garanties optionnelles sur le recap

Les garanties optionnelles (checkboxes "Options Additionnelles") apparaissent dans `CoverageStep.tsx` (lignes ~540+). Elles seront supprimees de la page recap/formule.

**Fichier concerne :**
- `src/components/guided-sales/steps/CoverageStep.tsx` : Supprimer la section "Options Additionnelles" (le bloc avec les checkboxes `additionalOptions.map(...)`). Conserver les garanties incluses par defaut (RC, Defense, etc.) qui sont des informations obligatoires.
- `src/components/guided-sales/steps/FormulaSelectionStep.tsx` : Aucune option additionnelle n'y figure, donc pas de changement.

---

## 3. Sinistres : tableau dynamique par produit

Actuellement, le tableau `BrokerClaimsTable` a des colonnes statiques. Il faut afficher des colonnes specifiques selon le type de sinistre selectionne (via le `ProductSelector` deja en place).

**Fichier concerne :**
- `src/components/BrokerClaimsTable.tsx` : Ajouter une colonne dynamique entre "Type" et "Police" qui affiche :
  - **Auto** : "Immatriculation" (extraite de `ocr_data` ou `description`)
  - **Voyage** : "N Passeport"
  - **MRH** : "Adresse du bien"
  - **Sante** : "N Assure"
  - **Tous** : Colonne masquee ou generique "Reference"
  
  La donnee sera lue depuis le champ `ocr_data` (jsonb) qui peut stocker ces informations specifiques au produit. L'en-tete de colonne changera dynamiquement selon `selectedProduct`.

---

## 4. Renouvellements : distinction avenant vie / non-vie

Actuellement, le `RenewalDetailDialog` affiche un bouton generique "Avenant (apres paiement)". Il faut distinguer :
- **Non-vie** (Auto, MRH, Voyage) : Avenant classique avec recap des garanties
- **Vie** (Molo Molo, Pack Obseques) : Avenant specifique avec valeur de rachat, capital, beneficiaires

**Fichier concerne :**
- `src/components/policies/RenewalDetailDialog.tsx` : Ajouter le champ `product_name` dans la logique post-paiement pour conditionner l'affichage. Apres paiement, afficher :
  - Non-vie : boutons "Avenant" + "Attestation" + "Carte verte" (pour auto)
  - Vie : boutons "Avenant vie" + "Attestation" + "Releve de situation"

  La distinction sera basee sur `subscription.product_name` (qui contient "Molo Molo", "Pack Obseques" pour vie, et "Auto", "MRH", "Voyage" pour non-vie).

---

## 5. Renouvellements : cross-selling / enquete de satisfaction post-paiement

Apres l'envoi du lien et la confirmation de paiement (etat `paymentSent`), ajouter deux actions :
1. **Cross-selling** : Proposer un produit complementaire (ex: Auto -> MRH, Vie -> Pack Obseques)
2. **Enquete NPS** : Bouton pour declencher l'envoi d'une enquete de satisfaction

**Fichier concerne :**
- `src/components/policies/RenewalDetailDialog.tsx` : Apres le bloc post-paiement actuel (lignes 367-384), ajouter :
  - Une section "Opportunite commerciale" avec une suggestion de produit complementaire basee sur `product_name`
  - Un bouton "Envoyer enquete de satisfaction" qui appelle l'edge function `send-survey` existante ou affiche un toast de confirmation

---

## Resume des fichiers modifies

| Fichier | Modifications |
|---------|--------------|
| `GuidedSalesFlow.tsx` | Nettoyage import UnderwritingStep |
| `CoverageStep.tsx` | Suppression section Options Additionnelles |
| `BrokerClaimsTable.tsx` | Colonne dynamique par produit |
| `RenewalDetailDialog.tsx` | Distinction vie/non-vie + cross-selling + NPS |
