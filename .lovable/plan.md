

## Plan : Améliorations du moteur de calcul, import CSV et documents

### 1. Sauvegarde par section dans le CalcRuleEditor

**Probleme actuel** : Un seul bouton "Enregistrer" en bas de page. L'utilisateur doit scroller tout en bas pour sauvegarder.

**Solution** : Ajouter un bouton "Enregistrer" dans chaque section d'accordion du `CalcRuleEditor`. Chaque bouton sauvegarde la règle entiere (car c'est un seul enregistrement JSON), mais le feedback est contextuel.

**Fichiers modifiés :**
- `src/components/admin/calc-rules/CalcRuleEditor.tsx` : Modifier le composant pour accepter un `ruleId` optionnel et gérer la sauvegarde interne via `useMutation`. Ajouter un bouton compact `<Save>` dans le header de chaque `AccordionTrigger`. Quand on clique, on sauvegarde tout le formulaire et on affiche un toast "Section sauvegardée".
- `src/pages/admin/CalcRulesPage.tsx` : Adapter l'interface pour que le `CalcRuleEditor` puisse sauvegarder directement (passer `queryClient` ou déléguer la mutation).

**Approche technique** : Le `CalcRuleEditor` reçoit toujours `onSave`, mais on ajoute un bouton save par accordion header. Chaque bouton appelle `onSave(form)` directement. Le bouton global en bas est conservé.

### 2. Import CSV pour les tables de référence

**Probleme actuel** : Les tables de référence (key_value et brackets) sont saisies manuellement ligne par ligne.

**Solution** : Ajouter un bouton "Importer CSV" à côté de "Ajouter une table" dans la section Tables de référence.

**Fichier modifié :** `src/components/admin/calc-rules/CalcRuleEditor.tsx`

**Logique :**
- Bouton `📥 Importer CSV` avec `<input type="file" accept=".csv">`
- Pour `key_value` : CSV à 2 colonnes (clé, valeur) → parsé en `Record<string, number>`
- Pour `brackets` : CSV à 3 colonnes (min, max, valeur) → parsé en `Array<{min, max, value}>`
- Utilise la lib native `FileReader` + split par lignes/virgules (pas de dépendance)
- Preview du nombre de lignes importées avant confirmation
- Toast de succès avec le nombre d'entrées importées

### 3. Upload de fichiers dans DocumentsTab

**Probleme actuel** : Le DocumentsTab configure des templates (nom, type, variables) mais ne permet pas d'uploader les fichiers PDF/Word réels.

**Solution** : Ajouter un champ d'upload dans le dialog de création/édition de document. Le fichier est uploadé dans le bucket `product-images` (ou un nouveau bucket si nécessaire) et l'URL est stockée dans le template.

**Fichiers modifiés :**
- `src/components/admin/products/tabs/DocumentsTab.tsx` : Ajouter un `<input type="file">` dans le dialog. Upload vers le storage bucket. Stocker `file_url` et `file_name` dans le `DocumentTemplate` interface.
- Pas de migration DB nécessaire : les templates sont stockés en JSONB dans la colonne `document_templates` de `products`.

**Interface enrichie :**
```typescript
interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  variables: string[];
  file_url?: string;    // nouveau
  file_name?: string;   // nouveau
}
```

### Fichiers impactés (3)
1. `src/components/admin/calc-rules/CalcRuleEditor.tsx` — boutons save par section + import CSV tables
2. `src/pages/admin/CalcRulesPage.tsx` — adaptation mineure de l'interface
3. `src/components/admin/products/tabs/DocumentsTab.tsx` — upload fichiers templates

