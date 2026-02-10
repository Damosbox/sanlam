

# Fix: Double Action Buttons in Pack Obseques Flow

## Problem

The screenshot shows two "action" buttons simultaneously:
- "Calculer la prime" + "Retour" inside the form (left panel)
- "Voir les offres" in the SalesAssistant sidebar (right panel)

**Root cause**: `updatePackObsequesData()` in `GuidedSalesFlow.tsx` sets `simulationCalculated: true` on every keystroke. This triggers `showSalesAssistant` prematurely, displaying the sidebar with "Voir les offres" before the user has even clicked "Calculer la prime".

After clicking "Calculer", the user sees sub-step 5 with its own "Voir les offres" button AND the sidebar still shows "Voir les offres" -- two competing CTAs.

## Solution

### 1. Stop setting `simulationCalculated` on every field update

**File**: `src/components/guided-sales/GuidedSalesFlow.tsx`

In `updatePackObsequesData` (lines 168-183), remove `simulationCalculated: true`. The premium recalculation can still happen for live preview, but the flag should only be set in `handlePackObsequesCalculate`.

```typescript
// BEFORE (buggy)
const updatePackObsequesData = useCallback((data) => {
  setState(prev => {
    ...
    return {
      ...prev,
      packObsequesData: newPackObsequesData,
      calculatedPremium: premium,
      simulationCalculated: true  // <-- BUG: set on every keystroke
    };
  });
}, []);

// AFTER (fixed)
const updatePackObsequesData = useCallback((data) => {
  setState(prev => {
    ...
    return {
      ...prev,
      packObsequesData: newPackObsequesData,
      // Don't set simulationCalculated here
      // Premium is recalculated but sidebar won't appear yet
    };
  });
}, []);
```

### 2. Remove the duplicate "Voir les offres" from sub-step 5

**File**: `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx`

In `renderSubStep5()`, remove the "Voir les offres" button since the SalesAssistant sidebar already provides this action after calculation. Replace with only a "Modifier" back button. The SalesAssistant will handle the progression to the next step.

### 3. Apply the same fix for Molo Molo

**File**: `src/components/guided-sales/GuidedSalesFlow.tsx`

`updateMoloMoloData` (lines 151-166) has the same bug -- it sets `simulationCalculated: true` on every field change. Fix it the same way.

## Files Impacted

| File | Change |
|------|--------|
| `src/components/guided-sales/GuidedSalesFlow.tsx` | Remove `simulationCalculated: true` from `updatePackObsequesData` and `updateMoloMoloData` |
| `src/components/guided-sales/steps/PackObsequesSimulationStep.tsx` | Remove duplicate "Voir les offres" button from sub-step 5 results view |

## Expected Result

- During form filling: no sidebar, only the form with "Calculer la prime"
- After clicking "Calculer": sidebar appears with premium summary and single "Voir les offres" CTA
- Sub-step 5 shows results and a "Modifier" button only

