
# Plan : Refonte du configurateur de produits

## Resume des changements

1. Un produit peut etre lie a **plusieurs formulaires** (pas un seul)
2. La **distribution/canal** se configure au niveau produit ET au niveau de chaque formulaire lie
3. **Supprimer l'onglet "Calcul"** du produit
4. Dans l'onglet **Formulaires**, pouvoir lier une regle de calcul a chaque formulaire
5. Si aucune regle de calcul n'existe, **rediriger vers la page regles de calcul**
6. Transformer le formulaire produit en **stepper** avec sauvegarde a chaque etape

---

## Partie 1 : Stepper de creation produit

### Remplacement des Tabs par un Stepper

**Fichier** : `src/components/admin/products/ProductForm.tsx` (refonte majeure)

Le formulaire actuel utilise `<Tabs>` avec un bouton "Enregistrer" global. Il sera remplace par un stepper sequentiel :

```text
Etape 1 : Informations generales
  -> Bouton "Enregistrer & Continuer"
  -> Insert en base, recupere le productId

Etape 2 : Formulaires & Regles de calcul  (ancien "Souscription" + "Calcul")
  -> Bouton "Enregistrer & Continuer"

Etape 3 : Paiement
  -> Bouton "Enregistrer & Continuer"

Etape 4 : Documents
  -> Bouton "Enregistrer & Continuer"

Etape 5 : Ventes croisees
  -> Bouton "Enregistrer & Continuer"

Etape 6 : FAQs
  -> Bouton "Enregistrer & Continuer"

(Etapes conditionnelles selon les options activees dans l'etape 1)
Etape 7 : Reductions     (si discounts_enabled)
Etape 8 : Questionnaires (si medical_questionnaire_enabled)
Etape 9 : Sinistres      (si has_claims)
Etape 10 : Beneficiaires (si categorie = "vie")
```

**Comportement du stepper** :
- Barre de progression horizontale en haut avec les etapes numerotees
- Chaque etape a son propre bouton "Enregistrer" qui persiste en base
- On peut revenir a une etape precedente sans perdre les donnees
- Pour un produit existant, on arrive directement a l'etape 1 mais on peut naviguer librement
- L'etape 1 (creation) doit etre completee avant de pouvoir avancer (car on a besoin du `productId`)

**Fichiers concernes** :
- `src/components/admin/products/ProductForm.tsx` : Refonte stepper
- `src/pages/admin/ProductEditPage.tsx` : Ajustements mineurs (passer le product)

---

## Partie 2 : Supprimer l'onglet "Calcul" du produit

**Fichier** : `src/components/admin/products/ProductForm.tsx`

- Supprimer le `<TabsTrigger value="calc-rules">` et le `<TabsContent value="calc-rules">`
- L'import de `CalcRulesTab` est retire du ProductForm
- Le composant `CalcRulesTab` n'est pas supprime car il sera reutilise dans l'onglet Formulaires (voir partie 3)

---

## Partie 3 : Multi-formulaires par produit + canal par formulaire

### 3.1 Nouveau modele de donnees

Actuellement un produit a un seul `subscription_form_id`. On passe a une relation N:N via une table de liaison existante ou nouvelle.

**Migration SQL** : Creer la table `product_forms`

```text
product_forms
- id            uuid (PK, gen_random_uuid())
- product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
- form_template_id  uuid NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE
- calc_rule_id  uuid REFERENCES calculation_rules(id) ON DELETE SET NULL
- channel       text NOT NULL DEFAULT 'b2b'   -- 'b2b' | 'b2c' | 'both'
- is_active     boolean NOT NULL DEFAULT true
- display_order integer NOT NULL DEFAULT 0
- created_at    timestamptz DEFAULT now()
- UNIQUE(product_id, form_template_id)
```

RLS : admin ALL, broker SELECT (is_active = true).

### 3.2 Refonte de l'onglet "Formulaires" (ex-Souscription)

**Fichier** : `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx` (renommer en `FormsTab.tsx`)

Le nouveau contenu :

1. **Liste des formulaires lies** : tableau/cards affichant chaque formulaire lie avec :
   - Nom du formulaire
   - Canal (B2B / B2C / Les deux) modifiable via Select
   - Regle de calcul liee (Select parmi les regles existantes)
   - Boutons : Modifier / Dupliquer / Supprimer le lien
   - Switch actif/inactif

2. **Ajouter un formulaire** : 
   - Bouton "Lier un formulaire existant" -> Combobox de selection
   - Bouton "Creer un nouveau formulaire" -> ouvre FormEditorDrawer

3. **Lier une regle de calcul** :
   - Pour chaque formulaire lie, un Select affiche les regles de calcul disponibles
   - Si aucune regle n'existe dans le systeme : afficher un message d'alerte avec un bouton "Creer une regle de calcul" qui redirige vers `/admin/calc-rules`
   - Le badge "Aucune regle" apparait en orange pour signaler l'absence

4. **Distribution/Canal** :
   - Au niveau produit : les canaux globaux restent dans GeneralInfoTab (B2B/B2C)
   - Au niveau formulaire : chaque lien produit-formulaire a son propre canal
   - Un formulaire ne peut etre actif sur un canal que si le produit l'est aussi

### 3.3 Suppression de `subscription_form_id`

- Le champ `subscription_form_id` dans `ProductFormData` devient obsolete
- Les references a ce champ dans le code seront remplacees par des requetes vers `product_forms`
- Le champ en base reste pour compatibilite mais n'est plus utilise par le UI

---

## Partie 4 : Flow de redirection si 0 regles de calcul

**Fichier** : `src/components/admin/products/tabs/FormsTab.tsx` (nouveau nom)

Quand l'utilisateur essaie de lier une regle de calcul a un formulaire :
- Si `allRules.length === 0` : afficher une Alert avec :
  - Message : "Aucune regle de calcul n'est disponible. Vous devez d'abord creer une regle de calcul."
  - Bouton : "Aller aux regles de calcul" -> `navigate("/admin/calc-rules")`
- Si des regles existent : afficher le Select normalement

---

## Resume des fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL | Creer | Table `product_forms` (liaison produit-formulaire-regle-canal) |
| `src/components/admin/products/ProductForm.tsx` | Refonte | Stepper avec sauvegarde par etape |
| `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx` | Renommer/Refonte | Devient `FormsTab.tsx` avec multi-formulaires + regles + canaux |
| `src/components/admin/products/tabs/CalcRulesTab.tsx` | Conserver | Reutilise en tant que sous-composant dans FormsTab |
| `src/pages/admin/ProductEditPage.tsx` | Modifier | Adapter au stepper |
| `src/hooks/useProductValidation.ts` | Modifier | Adapter au stepper (validation par etape) |
| `src/schemas/product.ts` | Modifier | Retirer `subscription_form_id` de la validation |

---

## Details techniques

### Structure du stepper

```text
const STEPS = [
  { id: "general", label: "Informations", component: GeneralInfoTab },
  { id: "forms", label: "Formulaires", component: FormsTab },
  { id: "payment", label: "Paiement", component: PaymentMethodsTab },
  { id: "documents", label: "Documents", component: DocumentsTab },
  { id: "sales", label: "Ventes", component: SalesTab },
  { id: "faqs", label: "FAQs", component: FaqsTab },
];

// Etapes conditionnelles ajoutees dynamiquement
```

### Sauvegarde par etape

A chaque clic sur "Enregistrer & Continuer" :
1. Validation Zod de l'etape courante uniquement
2. Insert/Update en base (upsert du produit)
3. Recuperation du `productId` si creation
4. Passage a l'etape suivante
5. Toast de confirmation

### Schema de la table product_forms

```text
product_forms
  product_id ──── products.id
  form_template_id ── form_templates.id
  calc_rule_id ────── calculation_rules.id (nullable)
  channel ──────────── 'b2b' | 'b2c' | 'both'
```

Cela permet :
- 1 produit -> N formulaires
- Chaque formulaire a sa propre regle de calcul
- Chaque formulaire a son propre canal de distribution
