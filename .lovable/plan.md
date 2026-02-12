
# Restructuration complete du parcours de souscription Pack Obseques (7 etapes)

## Contexte

Le parcours actuel de souscription Pack Obseques (`PackObsequesSubscriptionFlow.tsx`) ne contient que 3 sous-etapes simplifiees (piece d'identite, verification, coordonnees). La specification complete exige **7 etapes** avec questionnaire medical, beneficiaires, prelevement, resume/signature et paiement.

De plus, les etapes 6 (Resume + Signature) et 7 (Paiement) de la spec remplacent les Steps 4 (`MobilePaymentStep`) et 5 (`SignatureEmissionStep`) du flux principal pour le produit Pack Obseques. Il faut donc rediriger le flux pour que tout soit gere dans le composant de souscription.

## Architecture cible

```text
Step 0: Selection produit
Step 1: Simulation (PackObsequesSimulationStep - 2 etapes internes)
Step 2: [SAUTE pour pack_obseques]
Step 3: Souscription (PackObsequesSubscriptionFlow - 7 etapes internes)
         1/7: Enregistrement assure principal (13 champs)
         2/7: Conjoint (conditionnel si marie - 12 champs)
         3/7: Questionnaire medical (2 mesures + 10 questions oui/non)
         4/7: Beneficiaires (ayant droit legaux / autre)
         5/7: Moyen de prelevement (conditionnel banque/e-wallet)
         6/7: Resume + CGU + Signature
         7/7: Paiement mobile (recap financier + selection methode)
Step 4: [SAUTE pour pack_obseques]
Step 5: [SAUTE pour pack_obseques]
```

## Fichiers a modifier

### 1. `src/components/guided-sales/types.ts`
- Ajouter les nouveaux champs dans `PackObsequesData` :
  - Conjoint : `conjointIdType`, `conjointIdNumber`, `conjointLastName`, `conjointFirstName`, `conjointBirthDate`, `conjointNationality`, `conjointProfession`, `conjointPaysResidence`, `conjointVilleResidence`, `conjointEmail`, `conjointPhone`
  - Medical : `taille`, `poids`, `medicalQuestion1` a `medicalQuestion10` (booleans)
  - Beneficiaires : `beneficiaireType: "ayant_droit" | "autre"`, `beneficiaireDetails?: string`
  - Prelevement : `prelevementAuto: boolean`, `typePrelevement?: "banque" | "solde" | "aps" | "ewallet"`, `rib?: string`, `nomBanque?: string`, `titulaireBanque?: string`
  - Souscription existante : `nationality`, `profession`, `paysResidence`, `villeResidence`
- Mettre a jour les valeurs par defaut dans `initialState`

### 2. `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx` (reecriture complete)
Le composant passera de 3 sous-etapes a 7 etapes :

**Etape 1/7 - Enregistrement assure principal** (13 champs) :
- Type de piece d'identite (dropdown: Attestation d'identite, CNI, Passeport, Permis, Carte sejour)
- Numero d'identification (texte)
- Upload piece d'identite (zone upload)
- Nom de famille (texte)
- Prenoms (texte)
- Date de naissance (date picker)
- Nationalite (dropdown - liste de nationalites)
- Profession (dropdown - 7 options: Agriculteur exploitant, Artisans, Cadres, Employes, Ouvriers, Professions intermediaires, Retraites)
- Pays de residence (dropdown)
- Ville de residence (texte)
- Situation matrimoniale (dropdown: Marie, Celibataire, Divorce(e), Veuf/Veuve)
- Email (texte email)
- Telephone (texte tel)

Logique : Si situation matrimoniale = "Marie" alors etape suivante = 2/7, sinon saute a 3/7.

**Etape 2/7 - Conjoint** (conditionnel) :
- Memes 12 champs que l'etape 1 (sans situation matrimoniale)
- Upload piece d'identite conjoint

**Etape 3/7 - Questionnaire medical** :
- Taille (cm) - nombre
- Poids (kg) - nombre
- 10 questions medicales (radio Oui/Non chacune) :
  1. Hospitalise problemes cardio-vasculaire / AVC / crise cardiaque ?
  2. Insuffisance renale ?
  3. Diabete ?
  4. Cancer ?
  5. Ampute ?
  6. Cirrhose ?
  7. Paraplegique / hemiplegique ?
  8. Totalement aveugle ?
  9. Operation chirurgicale 12 derniers mois ?
  10. Hospitalise ou conge maladie >30 jours 12 derniers mois ?

**Etape 4/7 - Beneficiaires** :
- Radio : "Ayant droit legaux" / "Autre a preciser"
- Si "Autre" : champs nom, prenom, lien de parente, pourcentage

**Etape 5/7 - Moyen de prelevement** :
- Dropdown : "Souhaitez-vous un prelevement automatique ?" (Oui/Non)
- Si Oui : Type (Banque/Solde/APS/E-Wallet)
- Si Banque : RIB, Nom banque, Nom titulaire, Upload RIB

**Etape 6/7 - Resume** :
- 5 sections accordion (assure, conjoint si applicable, medical, beneficiaires, prelevement)
- Checkbox CGU obligatoire
- Radio signature : "Signez ici" / "Telecharger signature"
- Zone signature digitale
- Boutons : Reprendre, Precedent, Suivant

**Etape 7/7 - Paiement** :
- Recap financier (prime periodique nette, frais adhesion, frais operateur, montant total)
- Numero de telephone pour paiement
- Selection methode paiement mobile (Orange Money, MTN Money, Wave, Moov Money)
- Bouton "Payer"

### 3. `src/components/guided-sales/GuidedSalesFlow.tsx`
- Modifier `nextStep()` pour que le parcours Pack Obseques saute aussi les Steps 4 et 5 (car resume/signature/paiement sont integres dans le Step 3)
- Modifier le `renderStep()` : pour pack_obseques, apres le Step 3, le flux est termine (pas de MobilePaymentStep ni SignatureEmissionStep)
- Le `onNext` passe au `PackObsequesSubscriptionFlow` declenchera la finalisation directement

### 4. `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`
- Correction du champ "Nombre d'enfants" : doit etre affiche pour **TOUS** les types d'adhesion (spec: "Affiche pour tous les types d'adhesion"), pas seulement Famille/Famille+ascendant
- Mise a jour de la condition lignes 146-164 pour retirer le conditionnel

## Donnees pre-remplies
Les champs suivants de l'etape 1/7 seront pre-remplis depuis les donnees de simulation :
- Nom de famille (depuis `data.lastName`)
- Prenoms (depuis `data.firstName`)
- Date de naissance (depuis `data.birthDate`)
- Email (depuis `data.email`)
- Telephone (depuis `data.phone`)

## Section technique detaillee

**Types a ajouter dans `PackObsequesData`** :
```text
// Etape 1 - champs manquants
nationality: string
profession: string
paysResidence: string
villeResidence: string

// Etape 2 - Conjoint
conjointIdType: string
conjointIdNumber: string
conjointLastName: string
conjointFirstName: string
conjointBirthDate: string
conjointNationality: string
conjointProfession: string
conjointPaysResidence: string
conjointVilleResidence: string
conjointEmail: string
conjointPhone: string

// Etape 3 - Medical
taille: number
poids: number
medicalQ1 a medicalQ10: boolean | undefined

// Etape 4 - Beneficiaires
beneficiaireType: "ayant_droit" | "autre"
beneficiaireNom: string
beneficiairePrenom: string
beneficiaireLien: string
beneficiairePourcentage: number

// Etape 5 - Prelevement
prelevementAuto: boolean
typePrelevement: string
rib: string
nomBanque: string
titulaireBanque: string

// Etape 6 - Signature
signatureMethod: "signer_ici" | "telecharger"
acceptCGU: boolean

// Etape 7 - Paiement
paymentPhoneNumber: string
selectedPaymentMethod: "orange_money" | "mtn" | "wave" | "moov"
```

**Navigation conditionnelle** :
- Etape 1 → Si marie → Etape 2, sinon → Etape 3
- Etape 2 → Etape 3
- Etape 3 → Etape 4
- Etape 4 → Etape 5
- Etape 5 → Etape 6
- Etape 6 → Etape 7
- Etape 7 → Fin (emission police)

**Impact sur GuidedSalesFlow** :
- Le `PackObsequesSubscriptionFlow` gerera en interne les 7 etapes
- Son `onNext` final declenchera la sauvegarde et l'emission
- Les Steps 4 et 5 du flux principal seront sautes pour pack_obseques

## Fichiers impactes

| Fichier | Nature de la modification |
|---------|--------------------------|
| `types.ts` | Ajout ~30 champs dans PackObsequesData + initialState |
| `PackObsequesSubscriptionFlow.tsx` | Reecriture complete : 3 sous-etapes → 7 etapes |
| `GuidedSalesFlow.tsx` | Skip steps 4-5 pour pack_obseques, gestion fin de flux |
| `PackObsequesSimulationStep.tsx` | Correction enfants visible pour tous types adhesion |

## Impact
- Aucune modification de base de donnees
- Le parcours Auto reste 100% inchange
- Les donnees de simulation sont preservees et reutilisees dans la souscription
