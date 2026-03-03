

## Boutons "Sauvegarder" / "Envoyer" sur les ecrans de cotation (Auto + Pack Obseques)

### Principe

Quand le courtier clique sur **Sauvegarder** ou **Envoyer**, un dialog s'ouvre pour collecter les informations de contact du client : **Nom**, **Prenom**, **Adresse e-mail**. Ces champs sont pre-remplis si un contact est deja lie dans le parcours. En mode "Envoyer", un selecteur de canal (Email / WhatsApp / SMS) est affiche en plus. Le bouton **Souscrire** reste present pour continuer vers la souscription sans passer par le dialog.

### Fichiers concernes

| Fichier | Action |
|---|---|
| `src/components/guided-sales/QuotationSaveDialog.tsx` | Creer |
| `src/components/guided-sales/steps/FormulaSelectionStep.tsx` | Modifier |
| `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx` | Modifier |
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Modifier |

### 1. Nouveau composant `QuotationSaveDialog`

Dialog modal avec :
- Champs : **Nom** (obligatoire), **Prenom** (obligatoire), **Adresse e-mail** (obligatoire, validation format email)
- Pre-remplissage depuis `state.clientIdentification` si disponible
- Deux modes : `"save"` (titre "Sauvegarder la cotation") et `"send"` (titre "Envoyer la cotation")
- Mode `"send"` : affiche en plus un selecteur de canal d'envoi (Email / WhatsApp / SMS)
- Bouton de confirmation qui appelle `onConfirm({ lastName, firstName, email })` puis le parent declenche la sauvegarde en base

### 2. Modifier `FormulaSelectionStep` (Auto)

Remplacer le bouton unique "Sauvegarder le devis" par trois boutons :

```text
[ Sauvegarder ]  [ Envoyer ]  [ SOUSCRIRE -> ]
```

- "Sauvegarder" et "Envoyer" ouvrent le `QuotationSaveDialog` dans le mode correspondant
- "SOUSCRIRE" reste inchange (appelle `onSubscribe`)

### 3. Modifier `PackObsequesSimulationStep` (Pack Obseques)

Apres l'affichage des resultats de simulation (sous-etape 4, section visible apres calcul), ajouter les memes trois boutons :

```text
[ Sauvegarder ]  [ Envoyer ]  [ SOUSCRIRE -> ]
```

- "SOUSCRIRE" appelle `onNext()` pour continuer vers la souscription
- Passer la prop `onSaveQuote` depuis le parent

### 4. Modifier `GuidedSalesFlow`

- Passer `onSaveQuote={handleSaveQuote}` au composant `PackObsequesSimulationStep`
- La fonction `handleSaveQuote` existante persiste deja dans la table `quotations`

### Detail technique du dialog

```text
Props :
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "save" | "send"
  defaultValues?: { lastName?: string; firstName?: string; email?: string }
  onConfirm: (info: { lastName: string; firstName: string; email: string; channel?: string }) => void

Validation :
  - Nom : requis, max 100 caracteres
  - Prenom : requis, max 100 caracteres
  - Email : requis, format email valide
  - Canal (mode send uniquement) : requis parmi Email/WhatsApp/SMS
```

