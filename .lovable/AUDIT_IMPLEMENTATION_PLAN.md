# 📋 Plan d'Implémentation - Audit Produits & Formulaires
**Date**: Février 2026 | **Status**: En cours de finalisation

---

## 🎯 Vue d'ensemble exécutive

Suite à l'audit complet du module Produits/Formulaires, ce plan résout **10 incohérences majeure** organisées en **3 sprints** :
- **Sprint 1 (P0)** : Bugs critiques & data integrity (3-4 jours)
- **Sprint 2 (P1)** : Refactoring & unified UX (4-5 jours)  
- **Sprint 3 (P2)** : Polish & optimisation (2-3 jours)

---

## 📊 Classement des problèmes par priorité

### **P0 - CRITIQUE** (Bloquants production)

| # | Problème | Impact | Sévérité |
|---|----------|--------|----------|
| **1** | Bug SalesTab: `p.id` vs `formData.name` | Cross-sell ne fonctionne pas | 🔴 CRITIQUE |
| **2** | Category naming incohérent (vie/non-vie) | Data mismatch, filtres échoués | 🔴 CRITIQUE |
| **3** | Duplicate calculation rules logic | Désync produit ↔ formulaire | 🔴 CRITIQUE |
| **4** | Types `any` pour coverages/rules | Pas de validation runtime | 🟠 GRAVE |

### **P1 - IMPORTANT** (Affectent UX)

| # | Problème | Impact | Sévérité |
|---|----------|--------|----------|
| **5** | FormPreviewCard pas à jour (phases) | Prévisualisation cassée | 🟠 GRAVE |
| **6** | TabsList hardcoded grid trous visuels | Layout broken si tabs cachés | 🟠 GRAVE |
| **7** | CalculationRulesTab duplique l'éditeur | Double maintenance | 🟡 MOYEN |
| **8** | ProductForm trop volumineux (80+ lignes) | Maintenabilité difficile | 🟡 MOYEN |

### **P2 - AMÉLIORATION** (UX polish)

| # | Problème | Impact | Sévérité |
|---|----------|--------|----------|
| **9** | Validation & messages d'erreur manquants | UX confusing | 🟡 MOYEN |
| **10** | Migration data legacy → phases | Ancien format non supporté | 🟡 MOYEN |

---

## 🚀 Sprint 1: Bugs Critiques (P0) - 3-4 jours

### **Tâche 1.1: Corriger SalesTab - Bug produit croisé**

**Fichier**: `src/components/admin/products/tabs/SalesTab.tsx`

**Problème**:
```typescript
// AVANT (BUGUÉ)
const otherProducts = allProducts?.filter((p) => p.id !== formData.name) || [];
// Compare p.id (UUID) avec formData.name (string) ❌
```

**Solution**:
```typescript
// APRÈS (CORRECT)
const otherProducts = allProducts?.filter((p) => p.id !== formData.id) || [];
// Compare p.id avec formData.id ✅
```

**Estimation**: 15 min | **Dépendances**: Aucune | **Tests requis**: Vérifier que les produits optionnels/alternatifs s'affichent correctement

---

### **Tâche 1.2: Standardiser les catégories (vie/non-vie)**

**Problème**: Mélange de `"vie"` + `"non-vie"` vs `"vie"` + `"non_vie"`

**Fichiers affectés**:
- `AdminFormBuilder.tsx`: `"non-vie"` (ancien)
- `form-builder/types.ts`: `"non-vie"` (nouveau)
- Database: `products.category` type enum

**Solution**: Utiliser **PARTOUT** `"vie" | "non-vie"` (tiret, pas underscore)

**Checklist**:
- [ ] Vérifier `src/components/admin/form-builder/types.ts`
- [ ] Vérifier tous les `SelectItem` value dans ProductForm
- [ ] Vérifier les constantes `PRODUCT_TYPES` partout
- [ ] Tester les filtres de catégories

**Estimation**: 30 min | **Dépendances**: 1.1 | **Tests**: Filtrer par catégorie dans form builder

---

### **Tâche 1.3: Résoudre le conflit CalculationRulesTab ↔ FormBuilder**

**Problème**: Les règles de calcul peuvent être éditées à 2 endroits:
1. `CalculationRulesTab` (dans ProductForm - **OBSOLÈTE**)
2. `FormPhaseEditor` → `CalculationRulesEditor` (dans formulaire - **SOURCE DE VÉRITÉ**)

**Architecture proposée**:

```
ProductForm (onglet Calcul)
  ├─ CalculationRulesDisplay (READ-ONLY)
  │  └─ "Éditer dans le formulaire" (lien vers FormEditorDrawer)
  └─ "Ajouter un formulaire si absent"
```

**Étapes**:
1. Créer `CalculationRulesDisplay.tsx` (lecture seule + badges)
2. Remplacer contenu de `CalculationRulesTab` par le display
3. Ajouter bouton "Éditer les règles" → ouvre `FormEditorDrawer`
4. Supprimer l'éditeur inline de `CalculationRulesTab`

**Estimation**: 2 heures | **Dépendances**: 1.2 | **Tests**: Vérifier qu'éditer dans le form builder met à jour l'affichage produit

---

### **Tâche 1.4: Typer coverages & calculation_rules (any → types)**

**Problème**: 
```typescript
coverages: Json        // any en pratique
calculation_rules: Json // any en pratique
```

**Solution**: Créer des interfaces strictes

**Nouveau fichier**: `src/types/product.ts`
```typescript
export interface ProductCoverage {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  minValue?: number;
  maxValue?: number;
}

export interface ProductCalculationRules {
  baseFormula?: string;
  coefficients?: PricingCoefficient[];
  taxes?: TaxConfig[];
  fees?: FeeConfig[];
}

// Importer du form-builder
export type { CalculationRules, PricingCoefficient, TaxConfig, FeeConfig } from "@/components/admin/form-builder";
```

**Puis dans ProductForm**:
```typescript
import type { ProductCoverage, ProductCalculationRules } from "@/types/product";

interface ProductFormData {
  // ...
  coverages: ProductCoverage[];
  calculation_rules: ProductCalculationRules;
}
```

**Estimation**: 1,5 heures | **Dépendances**: 1.3 | **Tests**: Vérifier qu'aucune erreur TypeScript

---

## 🔧 Sprint 2: Refactoring UX (P1) - 4-5 jours

### **Tâche 2.1: Mettre à jour FormPreviewCard**

**Problème**: `FormPreviewCard` affiche ancien format (flat steps), pas les phases/sous-étapes

**Fichier**: `src/components/admin/products/FormPreviewCard.tsx`

**Nouveau rendu requis**:
```
┌─────────────────────────────────────────┐
│ Formulaire: Auto Premium                │
├─────────────────────────────────────────┤
│ 📊 COTATION                             │
│   ├─ 📐 Règles de calcul                │
│   │  └─ Formule: base_premium * 1.2     │
│   ├─ 🚗 Infos véhicule (5 champs)       │
│   └─ ⚙️ Options (2 champs)              │
│                                         │
│ 📝 SOUSCRIPTION                         │
│   ├─ 👤 Identité (3 champs)             │
│   ├─ 📍 Coordonnées (4 champs)          │
│   └─ 📄 Documents                       │
└─────────────────────────────────────────┘
```

**Étapes**:
1. Parser la structure avec `parseFormStructure()`
2. Boucler sur `phases`
3. Pour chaque phase: afficher icône + nom
4. Pour chaque substep:
   - Si `type === "calculation_rules"`: icône + nb règles
   - Si `type === "fields"`: icône + nb champs
5. Ajouter bouton "Modifier le formulaire"

**Code exemple**:
```typescript
import { parseFormStructure } from "@/components/admin/form-builder";

export function FormPreviewCard({ formId }: Props) {
  const { data: form } = useQuery(...);
  
  const structure = parseFormStructure(form?.steps);
  
  return (
    <Card>
      {structure.phases.map(phase => (
        <div key={phase.id}>
          <h3>{phase.name}</h3>
          {phase.steps.map(step => (
            <div key={step.id}>
              {step.type === "calculation_rules" && <Badge>Règles</Badge>}
              {step.type === "fields" && <Badge>{step.fields?.length} champs</Badge>}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}
```

**Estimation**: 1,5 heures | **Dépendances**: 1.3, 2.2 | **Tests**: Ouvrir un produit, vérifier FormPreviewCard affiche phases

---

### **Tâche 2.2: Refactoriser ProductForm - Extraction composants**

**Problème**: ProductForm → **80+ lignes**, mélange logique + render

**Solution**: Diviser en **composants atomiques** par onglet

**Nouvelle structure**:
```
src/components/admin/products/
├─ ProductForm.tsx (orchestration + logique save)
├─ tabs/
│  ├─ GeneralInfoTab.tsx (nom, catégorie, type, image)
│  ├─ SubscriptionTab.tsx (FormPreviewCard + bouton éditer)
│  ├─ CalculationRulesDisplay.tsx (READ-ONLY)
│  ├─ BeneficiariesTab.tsx (inchangé)
│  ├─ PaymentMethodsTab.tsx (inchangé)
│  ├─ DocumentsTab.tsx (inchangé)
│  ├─ SalesTab.tsx (inchangé + bug fix 1.1)
│  └─ FAQsTab.tsx (inchangé)
```

**Pour chaque nouvel onglet**: extraire logique + rendre

**Exemple - GeneralInfoTab**:
```typescript
// AVANT (ProductForm ligne 40-80)
<div>
  <Label>Nom</Label>
  <Input value={formData.name} onChange={...} />
</div>

// APRÈS (GeneralInfoTab.tsx)
export function GeneralInfoTab({ formData, updateField }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Infos générales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input value={formData.name} onChange={...} />
          </div>
          {/* ... autres champs */}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Estimation**: 3 heures | **Dépendances**: 1.4 | **Tests**: Vérifier chaque onglet toujours fonctionne

---

### **Tâche 2.3: Corriger TabsList layout (grille dynamique)**

**Problème**:
```typescript
<TabsList className="grid w-full" 
  style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
```
Si certains tabs sont `display: none`, crée des trous visuels

**Solution**: Utiliser `flex` avec wrap ou `grid auto-fit`

```typescript
// AVANT
style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}

// APRÈS
className="flex flex-wrap gap-0"
```

**Ou meilleure UX** (pour beaucoup de tabs):
```typescript
<ScrollArea className="w-full">
  <TabsList className="flex gap-0">
    {/* tabs */}
  </TabsList>
</ScrollArea>
```

**Estimation**: 30 min | **Dépendances**: Aucune | **Tests**: Masquer un tab, vérifier layout reste ok

---

### **Tâche 2.4: Créer composant CalculationRulesDisplay**

**Nouveau fichier**: `src/components/admin/products/CalculationRulesDisplay.tsx`

**Affiche** (READ-ONLY):
- ✅ Formule de base (code block)
- ✅ Nombre de coefficients
- ✅ Taxes appliquées
- ✅ Frais

```typescript
export function CalculationRulesDisplay({ rules }: Props) {
  if (!rules || Object.keys(rules).length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Aucune règle de calcul configurée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Règles de calcul</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formule */}
        <div>
          <Label className="text-sm">Formule</Label>
          <code className="block bg-muted p-2 rounded text-xs mt-1">
            {rules.baseFormula}
          </code>
        </div>
        
        {/* Coefficients */}
        {rules.coefficients?.length > 0 && (
          <div>
            <Label className="text-sm">{rules.coefficients.length} Coefficients</Label>
            <ul className="text-sm mt-1">
              {rules.coefficients.map(c => (
                <li key={c.id}>• {c.name}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Taxes */}
        {rules.taxes?.length > 0 && (
          <Badge variant="outline">
            Taxes: {rules.taxes.map(t => `${t.rate}%`).join(", ")}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
```

**Estimation**: 1 heure | **Dépendances**: 1.4 | **Tests**: Afficher pour un produit avec + sans règles

---

## 📈 Sprint 3: Polish & Optimisation (P2) - 2-3 jours

### **Tâche 3.1: Ajouter validation & messages d'erreur**

**Champs critiques à valider**:
- Nom produit: non vide + < 100 car
- Prime de base: > 0
- Catégorie & type: requis
- Formule (si règles): syntaxe valide

**Pattern Zod + React Hook Form**:

```typescript
import { z } from "zod";

const ProductFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  base_premium: z.number().gt(0, "La prime doit être > 0"),
  category: z.enum(["vie", "non-vie"]),
  product_type: z.string().min(1),
});

export function ProductForm() {
  const form = useForm<z.infer<typeof ProductFormSchema>>({
    resolver: zodResolver(ProductFormSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("name")} />
      {form.formState.errors.name && (
        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
      )}
    </form>
  );
}
```

**Estimation**: 2 heures | **Dépendances**: 2.2 | **Tests**: Soumettre formulaire invalide, vérifier erreurs

---

### **Tâche 3.2: Migration données legacy → phases**

**Problème**: Anciens formulaires ont format plat `{ step1: {...}, step2: {...} }`

**Solution**: Auto-migration au chargement

Code déjà implémenté dans `parseFormStructure()` + `migrateOldStepsToPhases()`

**Checklist**:
- [ ] Tester charger ancien formulaire
- [ ] Vérifier qu'il s'affiche correctement
- [ ] Vérifier qu'éditer puis sauver convertit au nouveau format
- [ ] Ajouter test unitaire pour migration

**Estimation**: 1,5 heures | **Dépendances**: 1.3 | **Tests**: Charger ancien form, éditer, sauver

---

### **Tâche 3.3: Ajouter tests unitaires**

**Fichiers à tester**:
- `parseFormStructure()` → ancien + nouveau format
- `serializeFormStructure()` → sérialisation correcte
- SalesTab filtering
- CalculationRulesDisplay rendu

**Tests**:
```typescript
describe("Form Builder Migration", () => {
  it("should migrate legacy flat steps to phases", () => {
    const legacy = { 
      step1: { title: "Info", fields: [] },
      step2: { title: "Véhicule", fields: [] }
    };
    
    const result = parseFormStructure(legacy);
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].id).toBe("cotation");
  });
});
```

**Estimation**: 2 heures | **Dépendances**: Tous | **Tests**: `npm run test`

---

## 📅 Chronologie d'exécution

```
SEMAINE 1
├─ Lun : Tâches 1.1 → 1.2 (bug fixes rapides)
├─ Lun/Mar : Tâche 1.3 (conflit CalculationRules)
├─ Mar : Tâche 1.4 (typing)
├─ Mer/Jeu : Tâches 2.1 → 2.4 (refactoring ProductForm)
└─ Ven : Tâche 2.3 (TabsList fix)

SEMAINE 2
├─ Lun : Tâches 3.1 → 3.2 (validation + migration)
├─ Mar/Mer : Tâche 3.3 (tests)
├─ Jeu : Testing + bug fixes
└─ Ven : Déploiement + monitoring
```

---

## ✅ Critères d'acceptation globaux

- [ ] Aucune référence `any` pour coverages/rules
- [ ] SalesTab filter fonctionne (bug 1.1 fixé)
- [ ] Categories standardisées (vie/non-vie partout)
- [ ] FormPreviewCard affiche phases/sous-étapes
- [ ] CalculationRulesTab read-only + lien vers form builder
- [ ] ProductForm < 60 lignes par onglet
- [ ] Tous les tests passent
- [ ] Pas de console errors/warnings
- [ ] Data migration fonctionne pour anciens forms

---

## 📊 Matrice dépendances

```
1.1 (SalesTab) ← standalone
1.2 (Categories) → 1.1, 1.3, 1.4
1.3 (Rules) → 1.2, 2.1
1.4 (Types) → 1.2, 2.1, 2.2

2.1 (FormPreview) → 1.3, 1.4
2.2 (ProductForm) → 1.4, 2.3
2.3 (TabsList) → standalone
2.4 (Display) → 1.4

3.1 (Validation) → 2.2
3.2 (Migration) → 1.3, 1.4
3.3 (Tests) → Tous
```

---

## 💡 Notes de conception

### Principes clés
1. **Single Source of Truth**: Règles de calcul = formulaire SEULEMENT
2. **Lisibilité**: Onglets <60 lignes, composants <100 lignes
3. **Type Safety**: Pas de `any`, interfaces strictes
4. **User Feedback**: Erreurs claires, messages de succès

### Considérations futures
- [ ] Versioning des formulaires (v1.0, v1.1...)
- [ ] A/B testing des formules de calcul
- [ ] Simulateur premium intégré à l'admin
- [ ] Export formulaire (PDF/JSON)

---

## 🎬 Point de départ recommandé

**Jour 1 matin**:
```bash
git checkout -b fix/audit-products-forms
npm run dev
```

**Jour 1 - Commencer par**:
1. ✅ Tâche 1.1 (5 min)
2. ✅ Tâche 1.2 (20 min)
3. ✅ Tâche 1.3 (2h)

**Puis**: 1.4, 2.1, 2.2...

---

**Estimée totale**: **15-18 heures développement** + 4 heures tests = **2-2.5 sprints complets**
