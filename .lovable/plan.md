
## Plan : Intégration des typologies d'intermédiaires

### Objectif
Mettre à jour le système pour supporter les 5 typologies d'intermédiaires demandées et les rendre configurables depuis l'interface admin.

---

### Typologies à intégrer

| Valeur technique | Label affiché |
|------------------|---------------|
| `courtier` | Courtier |
| `agent_general` | Agent Général |
| `agent_mandataire` | Agent Mandataire |
| `agent_sanlam` | Agent Sanlam Allianz |
| `banquier` | Banquier |

---

### Modifications à effectuer

#### 1. Migration base de données

Ajouter les nouvelles valeurs à l'ENUM `partner_type` et renommer `agent_independant` en `agent_general` :

```sql
-- Ajouter les nouvelles valeurs à l'enum
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'agent_general';
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'agent_sanlam';
ALTER TYPE public.partner_type ADD VALUE IF NOT EXISTS 'banquier';

-- Mettre à jour les profils existants avec agent_independant -> agent_general
UPDATE public.profiles 
SET partner_type = 'agent_general' 
WHERE partner_type = 'agent_independant';
```

---

#### 2. Fichier `src/components/AdminUsersTable.tsx`

**Ligne 25 - Mettre à jour le type TypeScript :**

```typescript
type PartnerType = "agent_mandataire" | "courtier" | "agent_general" | "agent_sanlam" | "banquier";
```

**Lignes 228-239 - Mettre à jour `getPartnerTypeLabel` :**

```typescript
const getPartnerTypeLabel = (partnerType: PartnerType | null): string => {
  switch (partnerType) {
    case "courtier":
      return "Courtier";
    case "agent_general":
      return "Agent Général";
    case "agent_mandataire":
      return "Agent Mandataire";
    case "agent_sanlam":
      return "Agent Sanlam Allianz";
    case "banquier":
      return "Banquier";
    default:
      return "";
  }
};
```

**Lignes 338-351 - Mettre à jour le Select du type partenaire :**

```tsx
<Select
  value={user.partner_type || ""}
  onValueChange={(value) => updatePartnerType(user.id, value as PartnerType)}
>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Sélectionner..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="courtier">Courtier</SelectItem>
    <SelectItem value="agent_general">Agent Général</SelectItem>
    <SelectItem value="agent_mandataire">Agent Mandataire</SelectItem>
    <SelectItem value="agent_sanlam">Agent Sanlam Allianz</SelectItem>
    <SelectItem value="banquier">Banquier</SelectItem>
  </SelectContent>
</Select>
```

---

#### 3. Fichier `src/components/admin/CreateUserDialog.tsx`

**Ligne 30 - Mettre à jour le type :**

```typescript
type PartnerType = "agent_mandataire" | "courtier" | "agent_general" | "agent_sanlam" | "banquier";
```

**Lignes 291-305 - Mettre à jour le RadioGroup :**

```tsx
<RadioGroup
  value={formData.partnerType || ""}
  onValueChange={(value: PartnerType) => 
    setFormData({ ...formData, partnerType: value })
  }
  className="space-y-2"
>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="courtier" id="courtier" />
    <Label htmlFor="courtier" className="font-normal cursor-pointer">
      Courtier
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="agent_general" id="agent_general" />
    <Label htmlFor="agent_general" className="font-normal cursor-pointer">
      Agent Général
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="agent_mandataire" id="agent_mandataire" />
    <Label htmlFor="agent_mandataire" className="font-normal cursor-pointer">
      Agent Mandataire
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="agent_sanlam" id="agent_sanlam" />
    <Label htmlFor="agent_sanlam" className="font-normal cursor-pointer">
      Agent Sanlam Allianz
    </Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="banquier" id="banquier" />
    <Label htmlFor="banquier" className="font-normal cursor-pointer">
      Banquier
    </Label>
  </div>
</RadioGroup>
```

---

#### 4. Edge Function `supabase/functions/create-user/index.ts`

**Ligne 9 - Mettre à jour le type :**

```typescript
type PartnerType = 'agent_mandataire' | 'courtier' | 'agent_general' | 'agent_sanlam' | 'banquier';
```

**Lignes 101-109 - Mettre à jour la validation :**

```typescript
const validPartnerTypes = ['agent_mandataire', 'courtier', 'agent_general', 'agent_sanlam', 'banquier'];
if (role === 'broker' && (!partnerType || !validPartnerTypes.includes(partnerType))) {
  return new Response(
    JSON.stringify({ error: 'Type de partenaire invalide' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

### Résumé des fichiers modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter 3 valeurs à l'enum |
| `src/components/AdminUsersTable.tsx` | Mettre à jour types et labels |
| `src/components/admin/CreateUserDialog.tsx` | Mettre à jour types et radio buttons |
| `supabase/functions/create-user/index.ts` | Mettre à jour validation |

---

### Section technique

**Types de partenaires finaux :**
- `courtier` → Courtier
- `agent_general` → Agent Général (produits exclusifs Sanlam)
- `agent_mandataire` → Agent Mandataire (sous convention)
- `agent_sanlam` → Agent Sanlam Allianz (interne)
- `banquier` → Banquier (partenaire bancaire)

**Note :** Les types sont gérés en dur dans le code pour l'instant. Une évolution future pourrait stocker ces types dans une table `partner_types` pour une configuration 100% dynamique depuis l'admin.
