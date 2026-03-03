

## Audit des mots anglais dans la codebase

Voici les principaux mots/termes anglais trouvés dans l'interface utilisateur visible (labels, en-têtes de tableaux, statuts, messages toast, placeholders). Les mots purement techniques (noms de variables, props, types internes) ne sont pas listés.

---

### 1. En-têtes de tableaux (TableHead) visibles par l'utilisateur

| Fichier | Mot anglais | Traduction suggérée |
|---|---|---|
| `LeadsDataTable.tsx` | "Client", "Contact", "Statut", "Actions" | "Client" OK, **"Actions"** → "Actions" (acceptable) |
| `RenewalPipelineTable.tsx` | "Client", "Contact", "Actions" | OK (mixte fr acceptable) |
| `AdminSubscriptionsTable.tsx` | "Client", "Actions" | OK |
| `AdminClaimsTable.tsx` | "Type", "Description" | Acceptable (mots identiques en fr) |
| `CalcVariablesPage.tsx` | "Code", "Type", "Actions" | Acceptable |
| `PendingQuotationsTable.tsx` | "Actions" | Acceptable |
| `BrokerSubscriptions.tsx` | "Client", "Actions" | OK |

> **Verdict** : Les en-têtes de tableaux sont globalement en français ou sont des mots identiques dans les deux langues. Pas de problème majeur.

---

### 2. Statuts de sinistres (valeurs affichées en dur)

| Fichier | Valeurs anglaises | Traduction suggérée |
|---|---|---|
| `AdminClaimsTable.tsx` | `"Draft"`, `"Submitted"`, `"Approved"`, `"Rejected"`, `"Reviewed"`, `"Closed"` | Brouillon, Soumis, Approuvé, Rejeté, Examiné, Clôturé |
| `BrokerClaimsTable.tsx` | Idem | Idem |
| `BrokerAIInsights.tsx` | `"Submitted"`, `"Approved"`, `"Rejected"`, `"Reviewed"` | Idem |
| `AdminSidebar.tsx` | `.in("status", ["Submitted", "Draft"])` | Valeurs DB — affichage à mapper |

> **Important** : Ces valeurs sont stockées en anglais en base. Le mapping label existe déjà dans `BrokerClaimsTable.tsx` (`STATUS_OPTIONS`) mais les **badges affichés** utilisent parfois la valeur brute anglaise.

---

### 3. Statuts de souscriptions

| Fichier | Valeurs anglaises | Contexte |
|---|---|---|
| `CustomerSubscriptionsTable.tsx` | `"Active"` (label affiché) | Devrait être "Active" (identique en fr — OK) |
| `ClientDetailSheet.tsx` | `active → "Active"` | OK |

---

### 4. Labels de formulaires

| Fichier | Mot | Contexte |
|---|---|---|
| `ClientAuth.tsx`, `PartnerAuth.tsx` | `"Email"` (label) | Acceptable (terme universel) |
| `DocumentResendDialog.tsx` | `"Email"` (label) | OK |
| `AdminSurveyRules.tsx` | `label: "Email"` | OK |
| `FormFieldLibrary.tsx` | `label: "Email"` | OK |
| `ClientNotesSection.tsx` | `label: "Note"`, `label: "Email"` | "Note" OK en fr |

---

### 5. Mots dans le code UX flow (commentaires visibles)

| Fichier | Texte anglais |
|---|---|
| `AdminUXFlows.tsx` | `"Action: Changer statut (Draft/InReview/Approved/Rejected)"`, `"Update table claims"`, `"Redirect Tab Messages"` |

---

### Résumé des vrais problèmes à corriger

Les seuls vrais mots anglais **visibles par l'utilisateur final** sont :

1. **Statuts de sinistres affichés en anglais** dans les badges/cellules — `Draft`, `Submitted`, `Approved`, `Rejected`, `Reviewed`, `Closed` — dans `AdminClaimsTable.tsx`, `BrokerClaimsTable.tsx` et composants liés
2. **Textes UX flow** dans `AdminUXFlows.tsx` (commentaires de parcours en anglais)
3. **"Email"** comme label — acceptable car terme international, pas besoin de changer
4. **"Actions"** en en-tête de colonnes — identique en français, pas de changement nécessaire

### Plan de correction recommandé

| Fichier | Correction |
|---|---|
| `AdminClaimsTable.tsx` | Ajouter un mapping `statusLabels` pour afficher les badges en français (Brouillon, Soumis, Approuvé, Rejeté, Examiné, Clôturé) |
| `BrokerClaimsTable.tsx` | Le mapping `STATUS_OPTIONS` existe déjà — s'assurer qu'il est utilisé partout dans les badges |
| `BrokerAIInsights.tsx` | Mapper les statuts anglais vers français dans l'affichage |
| `AdminUXFlows.tsx` | Traduire les descriptions de parcours en français |

Pas de modification de la base de données — les valeurs restent en anglais en DB, seul l'affichage est traduit via un dictionnaire de mapping.

