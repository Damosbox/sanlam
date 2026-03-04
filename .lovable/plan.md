

## Plan : OCR carte grise pour pré-remplir les informations véhicule

### Approche

Ajouter un upload OCR de la carte grise dans la **sous-étape 5 (Documents)**, à côté du bouton "Télécharger" existant pour la carte grise. Quand l'utilisateur uploade une image de carte grise, on appelle une edge function qui extrait via AI : marque, modèle, immatriculation, châssis, et on pré-remplit automatiquement les champs de la sous-étape 3 (Véhicule).

L'utilisateur peut aussi revenir modifier manuellement si l'OCR n'est pas parfait.

### Modifications

**1. Nouvelle edge function : `supabase/functions/ocr-vehicle-registration/index.ts`**
- Prompt spécifique carte grise africaine (extraction : marque, modèle, numéro immatriculation, numéro châssis, date 1ère mise en circulation)
- Utilise Lovable AI Gateway (Gemini Flash) avec tool calling pour retourner des données structurées
- Même pattern que `ocr-identity`

**2. `supabase/config.toml`**
- Ajouter `[functions.ocr-vehicle-registration]` avec `verify_jwt = true`

**3. `src/components/guided-sales/steps/SubscriptionFlow.tsx`**
- Sous-étape 5 (Documents) : remplacer le bouton fake "Télécharger" de la carte grise par un vrai `<input type="file" accept="image/*">` 
- Ajouter état `isOCRProcessing` + appel `supabase.functions.invoke("ocr-vehicle-registration")`
- Sur succès OCR, appeler `onUpdate()` avec `vehicleBrand`, `vehicleModel`, `vehicleRegistrationNumber`, `vehicleChassisNumber` extraits
- Toast de succès listant les champs pré-remplis
- Indicateur de chargement pendant l'OCR (spinner + texte "Analyse en cours...")

**4. Réordonner les sous-étapes** pour que Documents vienne **avant** Véhicule :
- 1: Agent → 2: Localisation → 3: **Documents** → 4: **Véhicule** (pré-rempli) → 5: Conducteur
- Ainsi l'OCR carte grise alimente directement les champs véhicule à l'étape suivante

### Fichiers modifiés (3)
- `supabase/functions/ocr-vehicle-registration/index.ts` (nouveau)
- `supabase/config.toml` (ajout config)
- `src/components/guided-sales/steps/SubscriptionFlow.tsx` (OCR + réordonnement)

