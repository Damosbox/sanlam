# Refonte du Parcours Vente Guidée Auto - 4 Phases UX

## ✅ STATUT : IMPLÉMENTÉ (2025-01-30)

## Contexte et Analyse des Documents

Basé sur les trois documents fournis :

1. **Feuille de calcul SanlamAllianz** : Définit les champs obligatoires pour simulation (17 champs) + souscription (6 étapes)
2. **UX POUR ENVOI** : Maquettes visuelles avec le stepper 3 phases (Préparation → Construction → Finalisation)
3. **Compte-rendu atelier** : Principes UX validés - réduction du nombre d'étapes affichées, possibilité de s'arrêter à la simulation

### Changements Clés Demandés

| Actuel (7 étapes) | Nouveau (4 phases) |
|-------------------|-------------------|
| Produit → Identification → Besoin → Couverture → Vérification → Signature → Émission | Phase 1 (Simulation) → Phase 2 (Construction) → Phase 3 (Souscription) → Phase 4 (Finalisation) |

**Point critique** : La sélection du client ne se fait plus à la simulation (Phase 1). Le client est identifié uniquement en Phase 3 lors du passage à la souscription.

---

## Nouvelle Architecture : 4 Phases

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1 : PREPARATION (Simulation Rapide)            │
│  Objectif: Obtenir un tarif rapidement                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 1.1 : Le Véhicule                                                │
│  - Type de devis (Auto/2-3 Roues)                                       │
│  - Usage VTC (Oui/Non)                                                  │
│  - Appartient à entreprise (Oui/Non)                                    │
│  - Marque et Modèle (avec recherche)                                    │
│  - Énergie (Essence/Gazoil/Hybride/Électrique)                         │
│  - Puissance fiscale (CV)                                               │
│  - Nombre de places                                                     │
│  - Valeur à neuf + Valeur vénale                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 1.2 : Le Profil Risque                                           │
│  - Sexe + Type d'emploi                                                 │
│  - Sinistres au cours des 24 derniers mois                              │
│  - Équipé d'un GPS/Tracker ?                                            │
│                                                                         │
│  [Bouton "CALCULER" activé si tous champs obligatoires remplis]         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2 : CONSTRUCTION (Offres et Personnalisation)  │
│  Affichage dynamique des formules basées sur Phase 1                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 2.1 : Choix de la Formule                                        │
│  - Sélection base : MINI / BASIC / TOUT RISQUE                          │
│  - Garanties incluses (checkboxes par défaut désactivées) :             │
│    ☑ Responsabilité Civile                                             │
│    ☑ Défense                                                           │
│    ☑ Recours                                                           │
│    ☑ Individuelle Conducteur                                           │
│  - Durée du contrat (1/3/6/12 mois)                                     │
│  - Date d'effet                                                         │
│                                                                         │
│  Actions: [Sauvegarder devis] [SOUSCRIRE →]                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3 : SOUSCRIPTION (Données Morales et Physiques)│
│  On transforme le devis en contrat ferme                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 3.1 : Informations Conducteur et Documents                       │
│  - Identité : Nom de l'assuré, Conducteur habituel                      │
│  - Permis : Numéro, Catégorie (A/B/C...), Date d'obtention              │
│  - Véhicule : N° immatriculation, N° châssis                            │
│  - Upload : Carte grise, Déclaration d'honneur                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 3.2 : Adresse et Localisation                                    │
│  - Zone géographique : Ville (Abidjan, Bouaké...)                       │
│  - Code Agence                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4 : FINALISATION (Paiement et Émission)        │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 4.1 : Paiement Mobile                                            │
│  - Mode : Orange Money / MTN / Wave / Moov                              │
│  - N° téléphone de paiement                                             │
│  - Date de règlement                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Étape 4.2 : Signature et Émission                                      │
│  - Résumé financier (Montant net + taxes + total)                       │
│  - Checkboxes légales (CGV, partage informations)                       │
│  - Signature digitale (Canvas)                                          │
│  - Bouton "Émettre la police"                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Composants UI Clés à Intégrer

### 1. Nouveau Stepper 3 Phases (Réduction visuelle)

```text
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
  │ PRÉPARATION  │─────►│ CONSTRUCTION │─────►│ FINALISATION │
  │   (actif)    │      │              │      │              │
  └──────────────┘      └──────────────┘      └──────────────┘
```

Le stepper visible montre uniquement **3 phases majeures** (pas les 7 étapes détaillées actuelles).

### 2. Résumé Dynamique (Fil d'Ariane)

Affiche les choix faits au fur et à mesure en haut de l'écran :
```text
Toyota | Privé | 7CV | Hybride | 10 000 000 | 7 000 000 | 01/01/2026
```

### 3. Boutons "Éditer" par Section

À la Phase 4 (Signature), possibilité de modifier les sections précédentes :
- Section Propriétaire [Éditer]
- Section Véhicule [Éditer]  
- Section Conducteur [Éditer]

---

## Détail Technique

### Fichiers à Modifier/Créer

| Fichier | Action | Description |
|---------|--------|-------------|
| `GuidedSalesFlow.tsx` | Refonte majeure | Nouvelle structure 4 phases, stepper réduit |
| `types.ts` | Mise à jour | Nouveaux champs Phase 3 (immatriculation, châssis, permis, ville, code agence) |
| `StepNavigation.tsx` | Refonte | Stepper 3 phases avec sous-étapes masquées |
| `VehicleStep.tsx` | Créer | Nouveau composant Phase 1.1 (Véhicule) |
| `RiskProfileStep.tsx` | Créer | Nouveau composant Phase 1.2 (Profil Risque) |
| `FormulaSelectionStep.tsx` | Créer | Nouveau composant Phase 2.1 (Formule + Durée) |
| `DriverInfoStep.tsx` | Créer | Nouveau composant Phase 3.1 (Conducteur + Documents) |
| `AddressStep.tsx` | Créer | Nouveau composant Phase 3.2 (Adresse + Agence) |
| `MobilePaymentStep.tsx` | Créer | Nouveau composant Phase 4.1 (Paiement mobile) |
| `SignatureEmissionStep.tsx` | Créer | Nouveau composant Phase 4.2 (Signature + Émission) |
| `DynamicSummaryBreadcrumb.tsx` | Créer | Fil d'Ariane dynamique |

### Nouveaux Champs Types (Phase 3)

```typescript
// Ajouts dans NeedsAnalysisData ou nouveau SubscriptionData
driverName: string;
habitualDriver: boolean;
licenseNumber: string;
licenseCategory: "A" | "B" | "ABCD" | "ABCDE" | "BCD" | "BCDE";
licenseIssueDate: string;
licenseIssuePlace: string;
vehicleRegistrationNumber: string;
vehicleChassisNumber: string;
vehicleRegistrationDocument?: string; // upload
honorDeclaration?: string; // upload
city: "abidjan" | "bouake" | "yamoussoukro" | "korhogo" | "daloa" | "san_pedro";
agencyCode: string; // readonly from agent profile
```

### Validation du Bouton "Calculer"

```typescript
const isPhase1Valid = () => {
  const { needsAnalysis } = state;
  return (
    // Étape 1.1 - Véhicule
    needsAnalysis.quoteType &&
    needsAnalysis.isVTC !== undefined &&
    needsAnalysis.belongsToCompany !== undefined &&
    needsAnalysis.vehicleBrand &&
    needsAnalysis.vehicleModel &&
    needsAnalysis.vehicleEnergy &&
    needsAnalysis.vehicleFiscalPower &&
    needsAnalysis.vehicleSeats &&
    needsAnalysis.vehicleNewValue &&
    needsAnalysis.vehicleVenalValue &&
    // Étape 1.2 - Profil Risque
    needsAnalysis.gender &&
    needsAnalysis.employmentType &&
    needsAnalysis.hasAccident36Months !== undefined &&
    needsAnalysis.hasGPSProtection !== undefined
  );
};
```

---

## Flux de Navigation Révisé

```text
Page 0: ProductSelectionStep (inchangé - sélection Auto/MRH/Vie...)
        ↓
Phase 1: PRÉPARATION
        ├─ Étape 1.1: VehicleStep (Marque, Modèle, Énergie, CV, Places, Valeurs)
        └─ Étape 1.2: RiskProfileStep (Sexe, Emploi, Sinistres, GPS)
                      → Bouton [CALCULER] → Affiche tarif
        ↓
Phase 2: CONSTRUCTION
        └─ Étape 2.1: FormulaSelectionStep (MINI/BASIC/TOUT RISQUE + Durée + Date effet)
                      → [Sauvegarder devis] ou [SOUSCRIRE →]
        ↓
Phase 3: SOUSCRIPTION  (uniquement si SOUSCRIRE cliqué)
        ├─ Étape 3.1: DriverInfoStep (Identité conducteur + Permis + Véhicule détails + Uploads)
        └─ Étape 3.2: AddressStep (Ville + Code Agence)
        ↓
Phase 4: FINALISATION
        ├─ Étape 4.1: MobilePaymentStep (Orange Money/MTN/Wave/Moov)
        └─ Étape 4.2: SignatureEmissionStep (Résumé + CGV + Signature canvas + [Émettre])
                      → Confirmation + Documents PDF
```

---

## Points d'Attention

1. **Client non identifié en Phase 1-2** : Les phases de simulation ne collectent plus les données client (nom, téléphone, email). Ces données sont saisies uniquement en Phase 3.

2. **Sauvegarde de devis** : En fin de Phase 2, le devis peut être sauvegardé sans passer à la souscription (comme validé dans le compte-rendu atelier).

3. **Fil d'Ariane dynamique** : Affiche en temps réel les choix véhicule sous forme de badges horizontaux.

4. **Sections éditables** : À la Phase 4, chaque section (Propriétaire, Véhicule, Conducteur) affiche un bouton "Éditer" pour revenir modifier.

5. **Types d'énergie élargis** : Ajouter "Hybride" et "Électrique" en plus de "Essence" et "Gasoil".

---

## ✅ Étapes d'Implémentation Complétées

1. ✅ Mise à jour des types avec nouveaux champs Phase 3
2. ✅ Création du nouveau PhaseNavigation avec 4 phases visuelles
3. ✅ Création du composant DynamicSummaryBreadcrumb
4. ✅ Refonte de GuidedSalesFlow.tsx avec la nouvelle structure
5. ✅ Création des nouveaux step components (VehicleStep, RiskProfileStep, FormulaSelectionStep, DriverInfoStep, AddressStep, MobilePaymentStep, SignatureEmissionStep)
6. ✅ Mise à jour des calculateurs de prime avec nouveaux champs (Hybride, Électrique)

---

## Fichiers Créés

- `src/components/guided-sales/steps/VehicleStep.tsx`
- `src/components/guided-sales/steps/RiskProfileStep.tsx`
- `src/components/guided-sales/steps/FormulaSelectionStep.tsx`
- `src/components/guided-sales/steps/DriverInfoStep.tsx`
- `src/components/guided-sales/steps/AddressStep.tsx`
- `src/components/guided-sales/steps/MobilePaymentStep.tsx`
- `src/components/guided-sales/steps/SignatureEmissionStep.tsx`
- `src/components/guided-sales/PhaseNavigation.tsx`
- `src/components/guided-sales/DynamicSummaryBreadcrumb.tsx`

## Fichiers Modifiés

- `src/components/guided-sales/types.ts` - Nouveaux types Phase 3/4
- `src/components/guided-sales/GuidedSalesFlow.tsx` - Refonte structure 4 phases
- `src/utils/autoPremiumCalculator.ts` - Support énergies Hybride/Électrique
