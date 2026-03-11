

## Plan : Alignement complet Prospect / Client

### Inventaire des désalignements

```text
┌─────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Aspect                  │ Prospect (Lead)              │ Client                       │
├─────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ State management        │ useState local               │ react-hook-form              │
│ Toast                   │ sonner (toast.success)       │ useToast (hook shadcn)       │
│ Gender options          │ homme, femme, autre          │ homme, femme                 │
│ Marital status          │ +concubinage                 │ 4 options seulement          │
│ Income tranches         │ moins_100k, 100k_300k...     │ 0-200000, 200000-500000...   │
│ Contact method          │ phone,whatsapp,email,sms     │ phone,email,whatsapp         │
│ Contact time            │ matin,midi,après_midi,       │ matin,apres_midi,soir        │
│                         │ soir,weekend                 │                              │
│ Property types          │ appartement,maison,terrain   │ appartement,maison,villa     │
│ Referral source         │ Select (6 options)           │ Input libre                  │
│ Champs manquants Client │ —                            │ socio_professional_category, │
│                         │                              │ existing_insurances,         │
│                         │                              │ loyalty_program_interest     │
│ KYC doc types           │ cni,passport,permit,other    │ cni,passport,carte_consulaire│
│                         │                              │ ,carte_sejour                │
│ KYC OCR auto-verify     │ NON (correct ✓)              │ OUI ligne 191 (BUG)         │
│ KYC state management    │ useState local               │ react-hook-form              │
│ KYC layout              │ Accordion flat               │ Cards                        │
│ Save button             │ Sticky, conditionnel         │ Toujours visible             │
│ DB schema               │ lead_additional_data a       │ client_additional_data       │
│                         │ socio_pro + loyalty          │ manque ces 2 colonnes        │
└─────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

### Sprint 1 — Bugs critiques + Schema DB (priorité immédiate)

#### 1.1 Fix OCR auto-verify côté Client
**Fichier:** `src/components/clients/ClientKYCSection.tsx` ligne 191
- Supprimer `setValue("identity_verified", true)` — le commentaire au-dessus dit de ne PAS le faire, mais le code le fait quand même.

#### 1.2 Migration DB : ajouter colonnes manquantes à `client_additional_data`
```sql
ALTER TABLE public.client_additional_data 
  ADD COLUMN IF NOT EXISTS socio_professional_category text,
  ADD COLUMN IF NOT EXISTS loyalty_program_interest boolean DEFAULT false;
```

---

### Sprint 2 — Unifier les options de référence (fichier partagé)

#### 2.1 Créer `src/constants/additionalDataOptions.ts`
Centraliser toutes les listes d'options dans un seul fichier :
- `genderOptions` : homme, femme, autre
- `maritalStatusOptions` : celibataire, marie, divorce, veuf, concubinage
- `socioProOptions` : cadre, employe, ouvrier, artisan, profession_liberale, fonctionnaire, retraite, etudiant, sans_emploi, entrepreneur
- `incomeOptions` : utiliser les valeurs Lead (moins_100k, 100k_300k...) car plus granulaires
- `propertyTypeOptions` : appartement, maison, villa, terrain (union des deux)
- `insuranceTypeOptions` : auto, habitation, sante, vie, voyage
- `contactMethodOptions` : phone, whatsapp, email, sms
- `contactTimeOptions` : matin, midi, apres_midi, soir, weekend
- `referralSourceOptions` : bouche_a_oreille, publicite, reseaux_sociaux, site_web, partenaire, autre
- `kycDocumentTypes` : cni, passport, carte_consulaire, carte_sejour, permit, other (union)

#### 2.2 Importer ces constantes dans les deux composants
- `AdditionalDataSection.tsx` → remplacer les options locales
- `ClientAdditionalDataSection.tsx` → remplacer les options inline

---

### Sprint 3 — Unifier le state management (react-hook-form partout)

#### 3.1 Refactorer `AdditionalDataSection.tsx` (Lead Données)
Actuellement : `useState` + `updateField` + `hasChanges` manuel.
Cible : `useForm` + `register` + `watch` + `setValue` + `formState.isDirty`.

- Remplacer `useState<AdditionalData>` par `useForm<AdditionalData>` avec `defaultValues = defaultData`
- Hydratation via `useEffect` + `reset(existingData)` (comme le Client)
- Remplacer `updateField("field", value)` par `setValue("field", value)`
- Remplacer `hasChanges` par `formState.isDirty`
- Remplacer `onClick={() => saveMutation.mutate(formData)}` par `handleSubmit(onSubmit)` sur le `<form>`

#### 3.2 Refactorer `LeadKYCSection.tsx` (Lead KYC)
Actuellement : `useState<Omit<LeadKYCData, "id">>` + `updateField`.
Cible : `useForm<KYCFormData>` identique à `ClientKYCSection`.

- Remplacer `useState` par `useForm<KYCFormData>` avec les mêmes champs que `ClientKYCSection`
- Hydratation via `useEffect` + `reset()` depuis `kycData`
- OCR : utiliser `setValue()` au lieu de `setFormData(prev => ...)`
- Submit : wraper dans `<form onSubmit={handleSubmit(onSubmit)}>`
- Remplacer `updateField("identity_verified", checked)` par `setValue("identity_verified", checked)`

---

### Sprint 4 — Unifier le toast system

Les deux composants Lead utilisent `sonner` (`toast.success`/`toast.error`), les Client utilisent `useToast` (shadcn).

**Action :** Migrer les composants Lead vers `useToast` pour cohérence avec le reste du projet.
- `AdditionalDataSection.tsx` : remplacer `import { toast } from "sonner"` → `import { useToast } from "@/hooks/use-toast"`
- `LeadKYCSection.tsx` : déjà sur `useToast` ✓

---

### Sprint 5 — Aligner les champs manquants dans le formulaire Client

#### 5.1 `ClientAdditionalDataSection.tsx`
Ajouter les champs manquants dans le formulaire et le `FormData` :
- `socio_professional_category` (Select avec `socioProOptions`)
- `existing_insurances` (Checkboxes avec `insuranceTypeOptions`)
- `loyalty_program_interest` (Checkbox)

#### 5.2 Unifier les types de documents KYC
**`ClientKYCSection.tsx` + `LeadKYCSection.tsx`** : utiliser la même liste `kycDocumentTypes` depuis les constantes partagées. La liste unifiée sera : CNI, Passeport, Carte consulaire, Carte de séjour, Permis de conduire, Autre.

---

### Sprint 6 — Aligner le layout visuel

Le Lead utilise des sections plates avec icônes, le Client utilise des `Card`. On conserve le layout `Card` pour les deux (plus structuré dans un Sheet).

**Action :** Refactorer `AdditionalDataSection.tsx` pour utiliser des `Card` + `CardHeader` + `CardContent` au lieu de `div` plates — même structure visuelle que `ClientAdditionalDataSection.tsx`.

---

### Résumé des fichiers impactés

| Fichier | Changements |
|---|---|
| **Migration SQL** | +2 colonnes sur `client_additional_data` |
| **`src/constants/additionalDataOptions.ts`** | Nouveau fichier, options centralisées |
| **`src/components/leads/AdditionalDataSection.tsx`** | react-hook-form, options partagées, layout Card, toast useToast |
| **`src/components/clients/ClientAdditionalDataSection.tsx`** | +3 champs, options partagées |
| **`src/components/leads/LeadKYCSection.tsx`** | react-hook-form, doc types partagés |
| **`src/components/clients/ClientKYCSection.tsx`** | Fix OCR bug ligne 191, doc types partagés |

