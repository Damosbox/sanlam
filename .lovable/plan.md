
# Plan d'implementation complet -- Configuration Produits & Tarification

## Vue d'ensemble

Ce plan couvre l'ensemble des 4 sprints definis dans l'atelier du 16 fevrier. L'implementation cree une architecture de regles de calcul independantes (service Actuariat), liees aux produits (service Marketing), avec de nouveaux onglets dans la fiche produit et une entree dans le sidebar admin.

---

## Sprint 1 : Base de donnees + CRUD Regles de Calcul + Liaison Produit

### 1.1 Migration base de donnees

Creer une migration SQL avec :

**Table `calculation_rules`** (entite autonome actuariat) :
- id, name, description, type (vie/non-vie), usage_category, usage_category_label
- parameters (jsonb) -- champs obligatoires pour la cotation
- formulas (jsonb) -- packs/garanties
- rules (jsonb) -- formules de calcul, limites, delais de carence
- taxes, fees, tables_ref (jsonb)
- base_formula (text), is_active, created_by, created_at, updated_at

**Table `product_calc_rules`** (liaison N:N) :
- id, product_id (FK products), calc_rule_id (FK calculation_rules), is_primary, created_at
- Contrainte UNIQUE(product_id, calc_rule_id)

**Nouvelles colonnes sur `products`** :
- channels (jsonb), periodicity (text[])
- discounts_enabled, medical_questionnaire_enabled, beneficiaries_enabled (boolean)
- claims_config, discounts, questionnaires (jsonb)

**RLS** : Admins full access, Brokers SELECT sur regles actives.
**Trigger** : updated_at automatique sur calculation_rules.

### 1.2 Page admin "Regles de Calcul"

**Fichier** : `src/pages/admin/CalcRulesPage.tsx`
- Route `/admin/calc-rules`
- Table listant les regles avec filtres type/recherche
- Actions : Creer, Modifier (Sheet lateral), Dupliquer, Activer/Desactiver, Supprimer

**Fichier** : `src/components/admin/calc-rules/CalcRuleEditor.tsx`
- Editeur dans un Sheet avec sections en Accordion :
  - Infos generales (nom, type, categorie d'usage)
  - Parametres de cotation (champs dynamiques avec code/label/type)
  - Formules/Packs (nom, code, garanties couvertes avec limites, delai de carence)
  - Formule de base (textarea)
  - Taxes (code, nom, taux, actif)
  - Frais (code, nom, montant)

### 1.3 Sidebar admin

**Fichier** : `src/components/admin/AdminSidebar.tsx`
- Ajouter "Regles de calcul" avec icone Calculator dans la section Configuration

### 1.4 Route

**Fichier** : `src/App.tsx`
- Ajouter `<Route path="calc-rules" element={<CalcRulesPage />} />` dans les routes admin

### 1.5 Onglet "Regles de calcul" dans ProductForm

**Fichier** : `src/components/admin/products/tabs/CalcRulesTab.tsx`
- Liste les regles liees au produit via product_calc_rules
- Permet d'ajouter/retirer des regles avec un Select
- Marquer une regle comme "principale" (etoile)
- Apercu en lecture seule des parametres et formules

**Fichier** : `src/components/admin/products/ProductForm.tsx`
- Ajouter l'onglet "Calcul" entre General et Souscription
- Ajouter les nouveaux champs au ProductFormData (channels, periodicity, discounts_enabled, etc.)
- Ajouter les onglets conditionnels (Reductions, Questionnaires, Sinistres)

---

## Sprint 2 : Enrichissement de la Fiche Produit

### 2.1 GeneralInfoTab enrichi

**Fichier** : `src/components/admin/products/tabs/GeneralInfoTab.tsx`
- Ajouter les nouveaux champs du workshop :
  - Canaux : B2B / B2C (checkboxes)
  - Periodicite : Unique, Mensuelle, Trimestrielle, Semestrielle, Annuelle (multi-select)
  - Options supplementaires (switches) :
    - Reductions (Oui/Non)
    - Questionnaires medicaux (Oui/Non)
    - Beneficiaires (Oui/Non) -- deja present mais regroupe dans les options

### 2.2 Onglet "Reductions"

**Fichier** : `src/components/admin/products/tabs/DiscountsTab.tsx`
- Affiche uniquement si discounts_enabled est active
- Liste de reductions/bonus : Nom, Type (pourcentage/fixe), Valeur, Condition

### 2.3 Onglet "Questionnaires"

**Fichier** : `src/components/admin/products/tabs/QuestionnairesTab.tsx`
- Affiche uniquement si medical_questionnaire_enabled est active
- Builder de questions medicales avec impact surprime

### 2.4 Onglet "Sinistres"

**Fichier** : `src/components/admin/products/tabs/ClaimsConfigTab.tsx`
- Regles generales de gestion sinistre
- Types de sinistres autorises (rachat total, partiel, etc.)

---

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer tables + colonnes |
| `src/pages/admin/CalcRulesPage.tsx` | Creer |
| `src/components/admin/calc-rules/CalcRuleEditor.tsx` | Creer |
| `src/components/admin/AdminSidebar.tsx` | Modifier (ajouter entree) |
| `src/App.tsx` | Modifier (ajouter route) |
| `src/components/admin/products/ProductForm.tsx` | Modifier (nouveaux onglets + champs) |
| `src/components/admin/products/tabs/GeneralInfoTab.tsx` | Modifier (canaux, periodicite, options) |
| `src/components/admin/products/tabs/CalcRulesTab.tsx` | Creer |
| `src/components/admin/products/tabs/DiscountsTab.tsx` | Creer |
| `src/components/admin/products/tabs/QuestionnairesTab.tsx` | Creer |
| `src/components/admin/products/tabs/ClaimsConfigTab.tsx` | Creer |

---

## Details techniques

- Les `parameters` d'une regle de calcul sont un tableau JSON de champs (code, label, type, options) rendus dynamiquement dans le parcours de cotation
- Les `formulas` contiennent : nom, code, garanties couvertes (avec limites et delais de carence), et la formule de calcul associee
- La table `product_calc_rules` gere la relation N:N avec indicateur "principale"
- Les nouveaux onglets conditionnels (Reductions, Questionnaires) n'apparaissent que si l'option est activee dans l'onglet General
- Le `ProductFormData` est enrichi avec les nouvelles colonnes, et le payload de sauvegarde est mis a jour
- Toutes les nouvelles tables ont des RLS policies appropriees (admin full, broker read-only)
