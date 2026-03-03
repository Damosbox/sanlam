

## Fix "Prospect inconnu" — passer les infos client du dialog à la sauvegarde

### Problème

Quand le courtier clique "Sauvegarder" ou "Envoyer", le `QuotationSaveDialog` collecte nom/prénom/email mais ces valeurs ne sont **jamais transmises** à `handleSaveQuote()`. La fonction utilise `state.clientIdentification` qui reste vide → la cotation est sauvegardée sans info client → "Prospect inconnu" dans le tableau.

### Corrections

**1. `GuidedSalesFlow.tsx`** — Modifier `handleSaveQuote` pour accepter un paramètre optionnel `clientInfo`

```ts
const handleSaveQuote = useCallback(async (clientInfo?: { firstName: string; lastName: string; email: string }) => {
```

Dans `coverage_details.clientInfo`, fusionner les valeurs du dialog avec celles du state :

```ts
clientInfo: {
  ...state.clientIdentification,
  ...(clientInfo ? { firstName: clientInfo.firstName, lastName: clientInfo.lastName, email: clientInfo.email } : {})
}
```

**2. `FormulaSelectionStep.tsx`** — Passer les infos du dialog à `onSaveQuote`

Modifier `onSaveQuote` dans les props pour accepter `clientInfo` :
```ts
onSaveQuote: (clientInfo?: { firstName: string; lastName: string; email: string }) => void;
```

Dans `handleDialogConfirm`, appeler :
```ts
onSaveQuote({ firstName: info.firstName, lastName: info.lastName, email: info.email });
```

**3. `PackObsequesSimulationStep.tsx`** — Même correction

Modifier le type de `onSaveQuote` et passer les infos du dialog lors de l'appel.

### Résultat

Le nom/prénom/email saisis dans le dialog seront persistés dans `coverage_details.clientInfo`, et le tableau `BrokerQuotations` les affichera correctement (il lit déjà `coverage_details.clientInfo.firstName/lastName` en fallback).

