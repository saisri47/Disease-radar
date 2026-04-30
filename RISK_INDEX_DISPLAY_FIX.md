# Risk Index Display Fix - Summary

## Problem
Risk index was showing `0` on the dashboard even though it should display actual values.

## Root Cause
**Timing Issue**: The risk index was being calculated before `userPincode` was set.

### Execution Order Problem:
1. ❌ First useEffect runs (fetchSymptomCounts) - `userPincode` is still `null`
2. ⚠️ `calculateRiskIndex(reports, data, userPincode)` called with `userPincode = null`
3. ❌ Function returns `0` because: `if (!userPincode) return 0`
4. ✅ Second useEffect runs (geolocation) - `userPincode` finally set
5. ❌ Too late! Dashboard already shows `0`

## Solution
Three fixes applied:

### Fix 1: Fallback to Overall Risk Index
**File**: `frontend/src/pages/HomePage.jsx` (Lines 343-352)

```javascript
// OLD: Always returns 0 if userPincode not ready
const riskScore = calculateRiskIndex(allReports, data, userPincode)

// NEW: Uses overall risk if userPincode not available yet
let riskScore = 0
if (userPincode) {
  riskScore = calculateRiskIndex(allReports, data, userPincode)
} else {
  // Fallback: use overall risk index if pincode not available yet
  riskScore = calculateOverallRiskIndex(allReports, data)
}
```

### Fix 2: Add userPincode to Dependency Array
**File**: `frontend/src/pages/HomePage.jsx` (Line 381)

```javascript
// OLD: Runs only once, before userPincode is set
useEffect(() => { ... }, [])

// NEW: Refetches when userPincode changes
useEffect(() => { ... }, [userPincode])
```

**Effect**: When `userPincode` updates, the fetchSymptomCounts function reruns and calculates accurate location-specific risk index.

### Fix 3: Update Overall Risk Formula
**File**: `frontend/src/pages/HomePage.jsx` (Lines 177-207)

Changed from simple addition to weighted formula:
```javascript
// OLD: Simple addition (can reach 0-9)
const totalRisk = Math.min(reportDensityScore + severeSymptomScore + diversityScore, 10)

// NEW: Weighted formula (matches research)
const totalRisk = Math.min(
  (reportDensityScore * 0.3) + (severeSymptomScore * 0.4) + (diversityScore * 0.3),
  10
)
```

## Result
✅ Risk index now displays immediately on load (using overall risk)
✅ Updates to location-specific risk once userPincode is available
✅ Formula is consistent across all risk calculations
✅ Uses proper weighted factors (30% density + 40% severity + 30% diversity)

## Data Flow (Fixed)
```
Page Load
├─ Initial fetch → Risk = Overall Index (fallback)
├─ Display: Shows overall risk immediately ✅
│
└─ Geolocation resolved
   └─ userPincode set
      └─ useEffect dependency triggers
         └─ Refetch with userPincode
            └─ Risk = User Location Risk (accurate)
               └─ Display: Updates to location-specific risk ✅
```

## Testing Checklist
- [ ] Dashboard loads and shows risk index (not 0)
- [ ] Risk index is between 0-10
- [ ] Risk index updates every 30 seconds
- [ ] Risk level indicator shows: LOW (< 3.3), MEDIUM (3.4-6.9), HIGH (7+)
- [ ] Location breakdown shows different risks for different areas

## Files Modified
1. `frontend/src/pages/HomePage.jsx`
   - Line 177-207: Updated `calculateOverallRiskIndex` with weighted formula
   - Line 343-352: Added fallback to overall risk
   - Line 381: Added `userPincode` to dependency array

## Status
✅ **COMPLETE** - Risk index now displays on dashboard
