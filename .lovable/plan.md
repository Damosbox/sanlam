
# Plan d'Implémentation - Formulaire Auto Exact SanlamAllianz

## Analyse des Exigences

Le tableau fourni définit **23 champs** répartis sur 2 étapes :
- **Étape 1/2** : 17 champs de qualification véhicule/client
- **Étape 2/2** : 6 champs de sélection formule et garanties

## Comparaison avec l'Existant

| Champ Requis | État Actuel | Action |
|-------------|-------------|--------|
| Type de devis (Auto/2&3 Roues) | Non existant | **CRÉER** |
| VTC (Oui/Non) | Non existant | **CRÉER** |
| Appartient à entreprise | Non existant | **CRÉER** |
| Déjà client SanlamAllianz | Existe (`clientType`) | Adapter libellé |
| Accident 36 derniers mois | Existe (`hasClaimHistory`) | Adapter libellé |
| Sexe | Non existant | **CRÉER** |
| Type d'emploi | Existe (`socioProfessionalCategory`) | Adapter options |
| Énergie | Existe (`vehicleEnergy`) | Adapter (Essence/Gasoil) |
| Puissance fiscale | Existe (`vehicleFiscalPower`) | Changer en Dropdown 1-8 |
| Date première circulation | Existe (`vehicleFirstCirculationDate`) | OK |
| Nombre de places | Existe (`vehicleSeats`) | Changer en Dropdown 3-8 |
| Date d'effet | Non existant | **CRÉER** |
| Durée du contrat | Existe (`contractPeriodicity`) | OK |
| Valeur à neuf | Existe (`vehicleNewValue`) | OK |
| Valeur vénale | Existe (`vehicleVenalValue`) | OK |
| Toit panoramique | Non existant | **CRÉER** |
| Protection GPS | Non existant | **CRÉER** |
| Formule (MINI/BASIC/MEDIUM+) | Existe (`planTier`) | Adapter noms |
| Garanties incluses (4) | Existe | Afficher comme checkbox désactivées |
| Type d'assistance | Existe (`assistanceLevel`) | Limiter à "Avantage" |

---

## Phase 1 : Mise à jour des Types

### Fichier : `src/components/guided-sales/types.ts`

Nouveaux champs à ajouter dans `NeedsAnalysisData` :

```typescript
// Auto VP specific - Nouveaux champs SanlamAllianz
quoteType?: "auto" | "2_3_roues";           // Type de devis
isVTC?: boolean;                            // VTC
belongsToCompany?: boolean;                 // Appartient à entreprise
isExistingClient?: boolean;                 // Déjà client SanlamAllianz
hasAccident36Months?: boolean;              // Accident 36 derniers mois
gender?: "feminin" | "masculin";            // Sexe
employmentType?: string;                    // Type d'emploi (enum)
effectiveDate?: string;                     // Date d'effet
hasPanoramicRoof?: boolean;                 // Toit panoramique
hasGPSProtection?: boolean;                 // Protection GPS
```

Nouveau type enum pour emploi :
```typescript
export type EmploymentType = 
  | "fonctionnaire" 
  | "salarie" 
  | "exploitant_agricole" 
  | "artisan" 
  | "religieux" 
  | "retraite" 
  | "sans_profession" 
  | "agent_commercial" 
  | "autres";
```

---

## Phase 2 : Refonte NeedsAnalysisStep (Étape 1/2)

### Structure des 17 champs en ordre exact

```text
┌────────────────────────────────────────────────────────────────┐
│  1. TYPE DE DEVIS                                              │
│  ○ Devis Auto    ○ Devis 2 & 3 Roues                          │
├────────────────────────────────────────────────────────────────┤
│  2. VTC?           3. Entreprise?      4. Déjà client?        │
│  [Oui ▼]           [Non ▼]             [Non ▼]                │
├────────────────────────────────────────────────────────────────┤
│  5. Accident 36 mois?                  6. Sexe                 │
│  [Non ▼]                               [Féminin ▼]             │
├────────────────────────────────────────────────────────────────┤
│  7. Type d'emploi                                              │
│  [Sélectionner... ▼]                                           │
├────────────────────────────────────────────────────────────────┤
│  8. Énergie              9. Puissance fiscale (CV)             │
│  [Essence ▼]             [7 ▼]                                 │
├────────────────────────────────────────────────────────────────┤
│  10. Date 1ère circulation           11. Nombre de places      │
│  [📅 DD/MM/YYYY]                      [5 ▼]                    │
├────────────────────────────────────────────────────────────────┤
│  12. Date d'effet                    13. Durée du contrat      │
│  [📅 DD/MM/YYYY]                      [12 mois ▼]              │
├────────────────────────────────────────────────────────────────┤
│  14. Valeur à neuf                   15. Valeur vénale         │
│  [_________ FCFA]                     [_________ FCFA]         │
├────────────────────────────────────────────────────────────────┤
│  16. Toit panoramique?               17. Protection GPS?       │
│  [Non ▼]                              [Non ▼]                  │
└────────────────────────────────────────────────────────────────┘
```

### Implémentation Technique

```typescript
// Nouveau renderAutoFields dans NeedsAnalysisStep.tsx
const renderAutoFields = () => (
  <div className="space-y-6">
    {/* 1. Type de devis - Radio */}
    <div className="space-y-2">
      <Label>1. Type de devis</Label>
      <RadioGroup value={needsAnalysis.quoteType || "auto"}>
        <RadioGroupItem value="auto">Devis Auto</RadioGroupItem>
        <RadioGroupItem value="2_3_roues">Devis 2 & 3 Roues</RadioGroupItem>
      </RadioGroup>
    </div>

    {/* 2-4. VTC / Entreprise / Déjà client - Row of 3 dropdowns */}
    <div className="grid grid-cols-3 gap-4">
      <Select field="isVTC" options={["Oui", "Non"]} />
      <Select field="belongsToCompany" options={["Oui", "Non"]} />
      <Select field="isExistingClient" options={["Oui", "Non"]} />
    </div>

    {/* 5-6. Accident / Sexe */}
    <div className="grid grid-cols-2 gap-4">
      <Select field="hasAccident36Months" options={["Oui", "Non"]} />
      <Select field="gender" options={["Féminin", "Masculin"]} />
    </div>

    {/* 7. Type d'emploi - Full width dropdown */}
    <Select 
      field="employmentType" 
      options={[
        "Fonctionnaire",
        "Salarié", 
        "Exploitant agricole",
        "Artisan",
        "Religieux",
        "Retraité",
        "Sans profession",
        "Agent commercial",
        "Autres catégories socioprofessionnelles"
      ]} 
    />

    {/* 8-9. Énergie / Puissance fiscale */}
    <div className="grid grid-cols-2 gap-4">
      <Select field="vehicleEnergy" options={["Essence", "Gasoil"]} />
      <Select field="vehicleFiscalPower" options={[1,2,3,4,5,6,7,8]} />
    </div>

    {/* 10-11. Date circulation / Places */}
    <div className="grid grid-cols-2 gap-4">
      <DatePicker field="vehicleFirstCirculationDate" maxDate={today} />
      <Select field="vehicleSeats" options={[3,4,5,6,7,8]} />
    </div>

    {/* 12-13. Date effet / Durée */}
    <div className="grid grid-cols-2 gap-4">
      <DatePicker field="effectiveDate" minDate={today} />
      <Select field="contractPeriodicity" options={["1 mois", "3 mois", "6 mois", "12 mois"]} />
    </div>

    {/* 14-15. Valeurs */}
    <div className="grid grid-cols-2 gap-4">
      <Input field="vehicleNewValue" type="number" suffix="FCFA" />
      <Input field="vehicleVenalValue" type="number" suffix="FCFA" />
    </div>

    {/* 16-17. Toit panoramique / GPS */}
    <div className="grid grid-cols-2 gap-4">
      <Select field="hasPanoramicRoof" options={["Oui", "Non"]} />
      <Select field="hasGPSProtection" options={["Oui", "Non"]} />
    </div>
  </div>
);
```

---

## Phase 3 : Refonte CoverageStep (Étape 2/2)

### Structure des 6 champs

```text
┌────────────────────────────────────────────────────────────────┐
│  1. FORMULE                                                    │
│  ○ MINI    ○ BASIC    ○ MEDIUM+                               │
├────────────────────────────────────────────────────────────────┤
│  GARANTIES INCLUSES (non modifiables)                          │
│  ☑ Responsabilité Civile (désactivé)                          │
│  ☑ Défense/Recours (désactivé)                                │
│  ☑ Recours des Tiers Incendie (désactivé)                     │
│  ☑ Individuel Conducteur (désactivé)                          │
├────────────────────────────────────────────────────────────────┤
│  6. TYPE D'ASSISTANCE                                          │
│  ○ Avantage                                                    │
└────────────────────────────────────────────────────────────────┘
```

### Modifications Requises

1. **Renommer les plans** :
   - `basic` → "MINI"
   - `standard` → "BASIC" 
   - `premium` → "MEDIUM+"

2. **Garanties incluses** : Afficher comme checkboxes cochées mais désactivées

3. **Assistance** : Limiter à "Avantage" uniquement (ou afficher uniquement cette option)

---

## Fichiers à Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/guided-sales/types.ts` | Modifier | Ajouter nouveaux champs |
| `src/components/guided-sales/steps/NeedsAnalysisStep.tsx` | Refonte | 17 champs exactement ordonnés |
| `src/components/guided-sales/steps/CoverageStep.tsx` | Modifier | Formules MINI/BASIC/MEDIUM+ |
| `src/utils/autoPremiumCalculator.ts` | Modifier | Intégrer nouveaux facteurs |

---

## Considérations Techniques

### Validation

Tous les champs sont marqués "Obligatoire" → Ajouter validation avant passage à l'étape suivante :

```typescript
const isAutoStep1Valid = () => {
  const { needsAnalysis } = state;
  return (
    needsAnalysis.quoteType &&
    needsAnalysis.isVTC !== undefined &&
    needsAnalysis.belongsToCompany !== undefined &&
    needsAnalysis.employmentType &&
    needsAnalysis.vehicleEnergy &&
    needsAnalysis.vehicleFiscalPower &&
    needsAnalysis.vehicleFirstCirculationDate &&
    needsAnalysis.vehicleSeats &&
    needsAnalysis.effectiveDate &&
    needsAnalysis.contractPeriodicity &&
    needsAnalysis.vehicleNewValue &&
    needsAnalysis.vehicleVenalValue &&
    needsAnalysis.hasPanoramicRoof !== undefined &&
    needsAnalysis.hasGPSProtection !== undefined
  );
};
```

### Impact Tarification

Les nouveaux champs impactent le calcul de prime :
- **VTC** → Coefficient usage majoré
- **Entreprise** → Règles fiscales spécifiques
- **Accident 36 mois** → Malus
- **Toit panoramique** → Option bris de glace
- **Protection GPS** → Garantie supplémentaire incluse

---

## Ordre d'Implémentation

1. Mise à jour `types.ts` avec nouveaux champs
2. Refonte `NeedsAnalysisStep.tsx` pour Auto uniquement
3. Adaptation `CoverageStep.tsx` (formules MINI/BASIC/MEDIUM+)
4. Mise à jour `autoPremiumCalculator.ts`
5. Tests et validation du flux complet
