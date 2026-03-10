

## Ajouter l'accès caméra temps réel sur tous les points d'upload des deux parcours

### Contexte
Actuellement, la plupart des `<input type="file">` n'ont pas l'attribut `capture`, ce qui empêche l'ouverture directe de la caméra sur mobile. Seul `ClientIdentificationStep` a `capture="environment"`. De plus, il manque un bouton explicite "Prendre une photo" à côté du bouton "Uploader" pour offrir le choix entre galerie et caméra.

### Approche
Créer un composant réutilisable `CameraUploadButton` qui affiche deux options (upload fichier + capture caméra) et l'intégrer dans tous les points d'upload des deux parcours.

### 1. Nouveau composant : `src/components/ui/CameraUploadButton.tsx`

Un composant qui encapsule :
- Un `<input type="file" accept="image/*">` pour l'upload classique (galerie)
- Un `<input type="file" accept="image/*" capture="environment">` pour la caméra directe
- Deux boutons côte à côte : "Uploader un fichier" (Upload icon) et "Prendre une photo" (Camera icon)
- Props : `onFileSelected(file: File)`, `disabled?`, `accept?`, `label?`, `id: string`

### 2. Fichiers à modifier (parcours Auto)

| Fichier | Point d'upload | Modification |
|---------|---------------|-------------|
| `SubscriptionFlow.tsx` | Carte grise OCR (ligne ~422) | Ajouter `capture="environment"` + bouton caméra séparé |
| `SubscriptionFlow.tsx` | Documents justificatifs (permis, assurance, etc.) | Ajouter bouton caméra |
| `UnderwritingStep.tsx` | Justificatifs underwriting (ligne ~217) | Ajouter `accept="image/*"` + `capture` |
| `BindingStep.tsx` | Scan reçu cash (ligne ~448) | Ajouter `capture="environment"` |
| `ClaimOCRUploader.tsx` | Upload constat/carte grise (ligne ~100) | Ajouter `capture="environment"` + bouton caméra |
| `DamageForm.tsx` | Photo zone dommage (ligne ~127) | Ajouter `capture="environment"` + bouton caméra |

### 3. Fichiers à modifier (parcours Pack Obsèques / Vie)

| Fichier | Point d'upload | Modification |
|---------|---------------|-------------|
| `PackObsequesSubscriptionFlow.tsx` | OCR identité step 1 (ligne ~257) | Ajouter `capture="environment"` |
| `PackObsequesSubscriptionFlow.tsx` | OCR identité step 2 (ligne ~399) | Ajouter `capture="environment"` |
| `ClientIdentificationStep.tsx` | OCR identité (déjà `capture`) | Ajouter bouton "Uploader depuis galerie" en complément |

### 4. Fichiers complémentaires (sinistres broker + KYC)

| Fichier | Modification |
|---------|-------------|
| `ClaimNewPage.tsx` (broker) | Ajouter `capture="environment"` + bouton caméra |
| `ClientKYCSection.tsx` | Ajouter `capture="environment"` (déjà accept image) |
| `LeadKYCSection.tsx` | Ajouter `capture="environment"` |
| `ClientDocumentsSection.tsx` | Ajouter `capture="environment"` + `accept="image/*"` |

### Détail technique du composant `CameraUploadButton`

```text
┌─────────────────────────────────┐
│  [📁 Uploader]  [📷 Scanner]   │
│     (galerie)    (caméra)       │
│  <input hidden>  <input hidden  │
│                   capture>      │
└─────────────────────────────────┘
```

- Le bouton "Scanner" utilise `<input capture="environment">` qui ouvre la caméra native sur mobile
- Le bouton "Uploader" ouvre le sélecteur de fichiers classique
- Sur desktop, les deux ouvrent le même dialogue fichier (comportement natif du navigateur)
- Le composant passe le fichier sélectionné via `onFileSelected(file)`

### Fichiers impactés (total : ~12)
1. **Nouveau** : `src/components/ui/CameraUploadButton.tsx`
2. `src/components/guided-sales/steps/SubscriptionFlow.tsx`
3. `src/components/guided-sales/steps/PackObsequesSubscriptionFlow.tsx`
4. `src/components/guided-sales/steps/ClientIdentificationStep.tsx`
5. `src/components/guided-sales/steps/BindingStep.tsx`
6. `src/components/guided-sales/steps/UnderwritingStep.tsx`
7. `src/components/ClaimOCRUploader.tsx`
8. `src/components/DamageForm.tsx`
9. `src/pages/broker/ClaimNewPage.tsx`
10. `src/components/clients/ClientKYCSection.tsx`
11. `src/components/leads/LeadKYCSection.tsx`
12. `src/components/clients/ClientDocumentsSection.tsx`

