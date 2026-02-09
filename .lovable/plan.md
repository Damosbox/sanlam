

# Audit UX - Parcours de Construction de Produit

## Resume executif

Le parcours de construction de produit est fonctionnel et bien structure autour de 7 onglets (General, Souscription, Beneficiaires, Paiement, Docs, Ventes, FAQs). L'audit revele **18 problemes UX** classes par severite, avec des correctifs concrets pour chacun.

---

## 1. PROBLEMES CRITIQUES (bloquants pour l'utilisateur)

### 1.1 Aucune validation avant sauvegarde
**Constat :** La seule validation est `if (!formData.name.trim())`. Un produit peut etre sauvegarde sans type, sans categorie coherente, avec une prime a 0, sans formulaire lie.
**Impact :** Des produits incomplets sont enregistres en base, causant des erreurs en aval (vente guidee, souscription).

**Correctif :** Integrer le schema Zod existant (`src/schemas/product.ts` - `ProductFormSchema`) dans `handleSave()` de `ProductForm.tsx`. Afficher les erreurs par champ avec indicateurs visuels sur les onglets concernes.

### 1.2 Pas de confirmation avant quitter sans sauvegarder
**Constat :** Si l'admin modifie un produit et clique sur "Retour" ou change de page, toutes les modifications sont perdues sans avertissement.
**Impact :** Perte de travail, frustration majeure.

**Correctif :** Ajouter un hook `useBeforeUnload` et un `Prompt`/dialog de confirmation si `formData` a ete modifie (dirty state tracking).

### 1.3 Le FormEditorDrawer orphelin dans ProductForm
**Constat :** `ProductForm.tsx` (lignes 227-240) contient un `FormEditorDrawer` avec `formDrawerOpen` qui n'est **jamais ouvert** (aucun bouton ne le declenche). Le drawer fonctionnel est dans `SubscriptionFieldsTab.tsx`. C'est du code mort.
**Impact :** Confusion dans le code, potentiel doublon d'etats.

**Correctif :** Supprimer le `FormEditorDrawer` et l'etat `formDrawerOpen` de `ProductForm.tsx`.

### 1.4 Duplication invisible de formulaire
**Constat :** Le bouton "Dupliquer" dans `SubscriptionFieldsTab` ouvre le drawer avec `duplicatingFormId` mais le `FormEditorDrawer` ne gere jamais ce prop. Il n'y a pas de parametre `duplicatingFormId` dans les props de `FormEditorDrawer`. La duplication ne fonctionne pas.
**Impact :** L'utilisateur croit dupliquer un formulaire mais cree un formulaire vide.

**Correctif :** Implementer la logique de duplication dans `FormEditorDrawer` : charger les donnees du formulaire source et sauvegarder comme nouveau.

---

## 2. PROBLEMES MAJEURS (degradent l'experience)

### 2.1 Image produit en cercle (Avatar) au lieu d'un format carte
**Constat :** L'image utilise un composant `Avatar` (rond, 128x128px) qui tronque les images rectangulaires. Les produits d'assurance ont generalement des visuels au format paysage/carre.
**Impact :** Apercu deforme, ne correspond pas au rendu final sur le catalogue.

**Correctif :** Remplacer `Avatar` par un conteneur rectangulaire avec `aspect-ratio: 16/9` ou `4/3`, avec un `object-fit: cover`.

### 2.2 Pas d'indicateur de progression/completude
**Constat :** Les onglets n'indiquent pas si leur contenu est rempli ou non. L'admin ne sait pas quel onglet necessite son attention.
**Impact :** Produits publies avec des sections vides (FAQs, Documents).

**Correctif :** Ajouter des badges ou indicateurs colores sur chaque onglet :
- Pastille verte : section complete
- Pastille orange : section partiellement remplie
- Pastille rouge : champ obligatoire manquant

### 2.3 L'onglet "Beneficiaires" disparait sans feedback
**Constat :** L'onglet "Benef." n'est affiche que pour `category === "vie"`. Si l'admin change la categorie apres avoir rempli les beneficiaires, les donnees sont perdues sans avertissement, et il ne retrouve plus l'onglet.
**Impact :** Perte silencieuse de donnees configurees.

**Correctif :** Afficher une confirmation si des donnees de beneficiaires existent avant de changer de categorie. Ou afficher l'onglet grise avec un message expliquant pourquoi il est desactive pour les produits Non-Vie.

### 2.4 Le bouton "Enregistrer" est hors de vue
**Constat :** Le bouton "Enregistrer" est positionne en haut a droite (`flex justify-end`), au-dessus des onglets. Quand l'admin deile dans un long formulaire, il perd le bouton de vue.
**Impact :** L'admin doit scroller tout en haut pour sauvegarder.

**Correctif :** Rendre le bouton sticky (`sticky top-0 z-10`) ou ajouter un bouton secondaire en bas de chaque onglet.

### 2.5 La "Prime de base" est dans General mais geree dans le formulaire
**Constat :** Le champ `base_premium` est dans l'onglet General (ligne 208-215 de GeneralInfoTab), mais les regles de calcul sont dans le formulaire de souscription. L'admin ne sait pas si cette prime de base est utilisee par le moteur de calcul ou si c'est juste informatif.
**Impact :** Confusion sur la source de verite de la tarification.

**Correctif :** Ajouter un libelle explicatif sous le champ ou le deplacer dans une section dediee avec un lien vers le formulaire de cotation.

---

## 3. PROBLEMES MINEURS (ameliorations UX)

### 3.1 Pas de previsualisation en temps reel du formulaire
**Constat :** Le FormPreviewCard montre une vue compacte statique. L'admin ne peut pas tester le formulaire tel qu'il sera rendu pour le client/courtier.
**Correctif :** Ajouter un bouton "Previsualiser" qui ouvre un apercu du formulaire dans un mode interactif (modal ou nouvelle page).

### 3.2 Pas de recherche/filtre dans la selection de formulaires
**Constat :** Le `Select` des formulaires dans SubscriptionFieldsTab liste tous les formulaires actifs sans possibilite de recherche.
**Correctif :** Utiliser un `Combobox` (commande/search) au lieu d'un `Select` simple.

### 3.3 Onglet FAQs : confirmation de suppression manquante
**Constat :** La suppression d'une FAQ est immediate (pas de dialog). Le bouton de suppression est directement a cote du contenu.
**Correctif :** Ajouter un `AlertDialog` de confirmation, identique a celui utilise dans le form builder.

### 3.4 Documents : variables dynamiques non expliquees
**Constat :** Les variables `{{nom}}`, `{{prenom}}`, etc. dans DocumentsTab sont clickables mais il n'y a pas d'explication de ce qu'elles representent ni quand elles sont remplacees.
**Correctif :** Ajouter un tooltip ou une description sous chaque variable.

### 3.5 Produits Optionnels/Alternatifs : pas de distinction visuelle
**Constat :** Dans SalesTab, les produits optionnels et alternatifs utilisent exactement le meme rendu. L'admin peut cocher le meme produit dans les deux listes sans avertissement.
**Correctif :** Ajouter un avertissement si un produit est selectionne dans les deux listes. Ajouter des icones differentes.

### 3.6 Le type de produit n'est pas resete si la categorie change
**Constat :** Quand on change la categorie dans GeneralInfoTab, le `product_type` est remis a "" mais le Select ne montre pas le placeholder. L'ancien type invisible pourrait persister visuellement.
**Correctif :** Forcer le re-render du Select de type avec une `key` dependante de la categorie.

### 3.7 Aucun etat vide guide pour la creation
**Constat :** En mode creation, l'admin voit un formulaire vide sans guidage. Pas de wizard, pas de template pre-rempli.
**Correctif :** Proposer des templates de produits pre-configures (Auto, Sante, Vie) au debut de la creation, ou un assistant etape par etape.

### 3.8 Le type `any` est utilise partout dans ProductFormData
**Constat :** `coverages: any`, `calculation_rules: any`, `beneficiaries_config: any`, `payment_methods: any` - ces types faibles empechent l'autocompletion et la detection d'erreurs.
**Correctif :** Utiliser les types stricts deja definis dans `src/types/product.ts` (`ProductCoverage[]`, `ProductCalculationRules`, etc.)

---

## 4. RESUME PAR PRIORITE

| Priorite | Ref | Probleme | Effort |
|----------|-----|----------|--------|
| P0 - Critique | 1.1 | Validation Zod manquante | Moyen |
| P0 - Critique | 1.2 | Pas de guard quitter sans sauver | Moyen |
| P0 - Critique | 1.3 | FormEditorDrawer orphelin (code mort) | Faible |
| P0 - Critique | 1.4 | Duplication formulaire cassee | Moyen |
| P1 - Majeur | 2.1 | Image en cercle | Faible |
| P1 - Majeur | 2.2 | Indicateurs de completude sur onglets | Moyen |
| P1 - Majeur | 2.3 | Onglet Beneficiaires disparait sans feedback | Faible |
| P1 - Majeur | 2.4 | Bouton Enregistrer hors de vue | Faible |
| P1 - Majeur | 2.5 | Prime de base ambigue | Faible |
| P2 - Mineur | 3.1 | Pas de preview interactive | Eleve |
| P2 - Mineur | 3.2 | Pas de recherche formulaires | Faible |
| P2 - Mineur | 3.3 | Suppression FAQ sans confirmation | Faible |
| P2 - Mineur | 3.4 | Variables documents non expliquees | Faible |
| P2 - Mineur | 3.5 | Produits croises optionnel/alternatif | Faible |
| P2 - Mineur | 3.6 | Reset type produit visuel | Faible |
| P2 - Mineur | 3.7 | Pas de templates creation | Moyen |
| P2 - Mineur | 3.8 | Types `any` dans ProductFormData | Faible |

---

## 5. PLAN D'IMPLEMENTATION RECOMMANDE

### Phase 1 - Correctifs critiques (priorite immediate)
1. Supprimer le FormEditorDrawer orphelin de ProductForm.tsx
2. Integrer la validation Zod dans handleSave avec affichage d'erreurs
3. Implementer la duplication de formulaire dans FormEditorDrawer
4. Ajouter un dirty state tracker + dialog de confirmation avant navigation

### Phase 2 - Ameliorations majeures UX
5. Remplacer Avatar par un conteneur image rectangulaire
6. Rendre le bouton Enregistrer sticky
7. Ajouter des indicateurs de completude par onglet
8. Gerer la transition de categorie avec avertissement beneficiaires
9. Clarifier le champ "Prime de base"

### Phase 3 - Polish
10. Remplacer Select par Combobox pour les formulaires
11. Ajouter confirmations de suppression FAQs
12. Tooltips sur variables documents
13. Detection doublons optionnel/alternatif
14. Typage strict ProductFormData

---

## 6. FICHIERS IMPACTES

| Fichier | Modifications |
|---------|---------------|
| `src/components/admin/products/ProductForm.tsx` | Validation Zod, sticky save, dirty state, suppression drawer orphelin |
| `src/components/admin/products/tabs/GeneralInfoTab.tsx` | Image rectangulaire, prime de base clarifiee, reset type produit |
| `src/components/admin/products/tabs/SubscriptionFieldsTab.tsx` | Combobox formulaires, fix duplication |
| `src/components/admin/products/FormEditorDrawer.tsx` | Support duplication via prop |
| `src/components/admin/products/tabs/FaqsTab.tsx` | AlertDialog suppression |
| `src/components/admin/products/tabs/DocumentsTab.tsx` | Tooltips variables |
| `src/components/admin/products/tabs/SalesTab.tsx` | Detection doublons |
| `src/components/admin/products/tabs/BeneficiariesTab.tsx` | Gestion changement categorie |

