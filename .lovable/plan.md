

## Plan : Amélioration de l'input OTP sur la page Partenaire

### Objectif
Remplacer le champ de saisie OTP actuel (simple Input texte) par un composant visuel avec **6 carrés individuels** groupés en **3 paires de 2**, séparés par des tirets.

---

### Design visuel attendu

```text
┌───┬───┐     ┌───┬───┐     ┌───┬───┐
│ 1 │ 2 │  -  │ 3 │ 4 │  -  │ 5 │ 6 │
└───┴───┘     └───┴───┘     └───┴───┘
   Groupe 1      Groupe 2      Groupe 3
```

Chaque carré est cliquable, le focus passe automatiquement au suivant après saisie.

---

### Modifications à effectuer

#### Fichier `src/pages/auth/PartnerAuth.tsx`

**1. Ajouter l'import du composant InputOTP :**

```typescript
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot, 
  InputOTPSeparator 
} from "@/components/ui/input-otp";
import { Minus } from "lucide-react";
```

**2. Remplacer le bloc OTP actuel (lignes 285-301) :**

Avant :
```tsx
<div className="space-y-2">
  <Label htmlFor="otp">Code de vérification</Label>
  <Input
    id="otp"
    type="text"
    placeholder="123456"
    value={otp}
    onChange={(e) => setOtp(e.target.value)}
    required
    maxLength={6}
    className="text-center text-2xl tracking-widest"
  />
  <p className="text-xs text-muted-foreground text-center">
    Un code a été envoyé au {phone}
  </p>
</div>
```

Après :
```tsx
<div className="space-y-4">
  <Label>Code de vérification</Label>
  <div className="flex justify-center">
    <InputOTP
      maxLength={6}
      value={otp}
      onChange={setOtp}
    >
      {/* Groupe 1 : chiffres 1-2 */}
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      
      {/* Séparateur tiret */}
      <InputOTPSeparator />
      
      {/* Groupe 2 : chiffres 3-4 */}
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
      
      {/* Séparateur tiret */}
      <InputOTPSeparator />
      
      {/* Groupe 3 : chiffres 5-6 */}
      <InputOTPGroup>
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  </div>
  <p className="text-xs text-muted-foreground text-center">
    Un code a été envoyé au {phone}
  </p>
</div>
```

---

### Personnalisation du séparateur (optionnel)

Le composant `InputOTPSeparator` utilise par défaut un point (`Dot`). Pour afficher un tiret à la place :

#### Option A : Modifier le séparateur inline
```tsx
<InputOTPSeparator>
  <Minus className="w-4 h-4 text-muted-foreground" />
</InputOTPSeparator>
```

#### Option B : Modifier le composant global `input-otp.tsx`
Remplacer `<Dot />` par `<Minus />` dans le fichier `src/components/ui/input-otp.tsx`.

---

### Résultat attendu

| Avant | Après |
|-------|-------|
| Un seul champ texte large | 6 carrés individuels |
| Saisie manuelle | Focus automatique entre les carrés |
| Pas de groupement visuel | 3 groupes de 2 avec séparateurs |

---

### Section technique

**Fichier modifié :**
- `src/pages/auth/PartnerAuth.tsx` : ~15 lignes (remplacement bloc OTP)

**Optionnel :**
- `src/components/ui/input-otp.tsx` : 1 ligne (changer `Dot` en `Minus` pour le séparateur)

**Aucune modification base de données requise.**

