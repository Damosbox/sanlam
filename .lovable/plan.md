

## Plan : OCR identité en premier bloc + Screening LCB-FT automatique

### Principe UX

Le bloc **"Scanner une pièce d'identité"** (CameraUploadButton) est toujours le **tout premier élément** de chaque card qui collecte des données d'identité. L'agent scanne d'abord, les champs en dessous se pré-remplissent, puis le screening LCB-FT se lance silencieusement en arrière-plan.

```text
┌────────────────────────────────────────────┐
│ 📄 Scanner une pièce d'identité           │  ← TOUJOURS EN PREMIER
│ [Uploader] [Scanner]                       │
│ ✅ Conformité validée  /  🔴 Bloqué       │
├────────────────────────────────────────────┤
│ Type de pièce :  [CNI    ▼]  (pré-rempli) │
│ N° pièce :       [________]  (pré-rempli) │
│ Nom :            [________]  (pré-rempli) │
│ Prénom :         [________]  (pré-rempli) │
│ Date naissance : [________]  (pré-rempli) │
│ ...                                        │
└────────────────────────────────────────────┘
```

### Changements par fichier

#### 1. `PackObsequesSubscriptionFlow.tsx` — Steps 1 et 2

**Actuellement :** L'OCR est en 3e position (après type de pièce et numéro d'identification).
**Cible :** Déplacer le bloc OCR **avant** les champs "Type de pièce" et "Numéro d'identification" pour qu'il les pré-remplisse.
- Après OCR réussi : chaîner `supabase.functions.invoke("screen-ppe")` avec `firstName`, `lastName` extraits
- State local `screeningStatus: "idle" | "processing" | "ok" | "blocked"` (un par step)
- Si bloqué : Alert destructive + "Suivant" désactivé
- Si OK : badge vert discret sous le bouton d'upload

#### 2. `SubscriptionFlow.tsx` — Sub-step 3 (Documents)

**Actuellement :** Pas d'OCR identité, seulement carte grise.
**Cible :** Ajouter un bloc OCR identité **en tout premier** dans la card Documents (avant "Lieu d'obtention du permis").
- Appel `ocr-identity` → pré-remplir `ownerLastName`, `ownerFirstName` dans le state subscription
- Chaîner `screen-ppe` automatiquement
- Même UI : badge vert ou alerte bloquante
- La carte grise reste en position 2

#### 3. `SubscriptionFlow.tsx` — Sub-step 5 (Conducteur/Propriétaire)

**Actuellement :** Champs nom/prénom du propriétaire manuels, pas d'OCR.
**Cible :** Ajouter le bloc OCR identité **en tout premier** dans la card "Information du propriétaire".
- Si déjà scanné à la sub-step 3, afficher le badge de conformité en lecture seule (pas de re-scan nécessaire)
- Sinon, permettre le scan avec pré-remplissage des champs propriétaire
- Chaîner `screen-ppe` si pas encore fait

#### 4. `ClientIdentificationStep.tsx`

**Actuellement :** L'OCR est dans un Collapsible en bas du formulaire d'identification.
**Cible :** Remonter le bloc OCR **en tout premier** dans la card, avant la recherche de contact.
- Après OCR : pré-remplir `firstName`, `lastName`, `identityDocumentType`, `identityDocumentNumber`
- Chaîner `screen-ppe` automatiquement
- Badge vert ou alerte bloquante visible immédiatement

### Logique screening commune (tous les points)

```typescript
// Après OCR réussi
const { data: screening } = await supabase.functions.invoke('screen-ppe', {
  body: { firstName, lastName, nationality }
});
if (screening?.screeningBlocked) {
  setScreeningStatus('blocked'); // alerte rouge, "Suivant" désactivé
} else {
  setScreeningStatus('ok'); // badge vert
}
```

L'agent ne voit **jamais** les détails PPE/AML — juste "Conformité validée" ou "Souscription impossible — contactez votre responsable".

### Fichiers impactés

| Fichier | Changement |
|---|---|
| `PackObsequesSubscriptionFlow.tsx` | Remonter OCR en 1er bloc steps 1 & 2, + chaîner `screen-ppe` |
| `SubscriptionFlow.tsx` | + OCR identité en 1er bloc sub-steps 3 & 5, + `screen-ppe` |
| `ClientIdentificationStep.tsx` | Remonter OCR en 1er bloc, + `screen-ppe` après extraction |

