# Phase 4: State Refactoring - Booking Component

## Overview

This phase extracts state management from `Booking.jsx` into custom hooks, reducing complexity and enabling future component splitting. **Zero behavior/UI changes allowed.**

## Current State Analysis

### Booking.jsx Statistics
- **Total lines:** 1919 lines (after Phase 3)
- **useState hooks:** 22 hooks
- **Event handlers:** ~20 handlers
- **Props:** 6 props from parent

### State Inventory by Domain

#### 1. Form State (4 hooks)
- `formData` (lines 47-79): 28-field object with all booking data
- `errors` (line 18): Validation errors object
- `editingId` (line 17): Currently editing booking ID or null
- `showForm` (line 16): Boolean toggle for form visibility

**Complexity:** HIGH - Large form object, complex validation, bidirectional sync with location pickers

#### 2. Location Selection State (7 hooks)
- `pickupMode` (line 21): 'customer' | 'browse' | 'freetext'
- `deliveryMode` (line 22): 'customer' | 'browse' | 'freetext'
- `selectedPickupLocationId` (line 23): ID of selected pickup location
- `selectedDeliveryLocationId` (line 24): ID of selected delivery location
- `tempLocationName` (line 25): Name for saving new location
- `tempLocationCustomerId` (line 26): Customer ID for saving location
- `pendingBookingData` (line 27): Booking data waiting for location save

**Complexity:** MEDIUM - Interconnected with formData, modal triggers

#### 3. Modal State (5 hooks)
- `showNewCustomerModal` (line 19): Boolean for new customer modal
- `showSaveLocationModal` (line 20): Boolean for save location modal
- `editingBlockId` (line 30): Block ID being edited or null
- `editingBlockNameValue` (line 31): Temp value for block name
- `costEntryBookingId` (line 15): Booking ID for cost entry modal or null

**Complexity:** LOW - Independent toggles, minimal interaction

#### 4. Temporary Form Data (1 hook)
- `tempCustomerData` (lines 35-45): 9-field object for new customer

**Complexity:** LOW - Self-contained, only used in modal

#### 5. List View UI State (2 hooks)
- `expandedBookingId` (line 28): ID of expanded booking row or null
- `expandedBlockId` (line 29): ID of expanded block row or null

**Complexity:** LOW - Simple toggles

#### 6. Tab State (1 hook)
- `currentTab` (line 14): 'bokad' | 'planerad' | 'genomford' | 'prissatt' | 'fakturerad'

**Complexity:** LOW - Single value, used for filtering

#### 7. Sorting State (2 hooks)
- `sortField` (line 32): Field name for sorting
- `sortDirection` (line 33): 'asc' | 'desc'

**Complexity:** LOW - Simple pair, used together

### Derived Data (candidates for useMemo)

From lines 450-534 and 514-522:
```javascript
activeCustomers          // line 450: filtered by active flag
activeVehicles          // line 451: filtered by active flag
activeDrivers           // line 452: filtered by active flag
formVehicleId           // line 453: extracted from formData
formDriverId            // line 454: extracted from formData
driversForSelectedVehicle  // lines 455-457: filtered by vehicleId
customerPickupLocations    // lines 525-531: filtered by customerId
allPickupLocations         // line 534: all locations
rowsToRender              // lines 514-522: filtered, sorted, grouped bookings
```

**Complexity:** MEDIUM - Some are simple filters, others are complex (rowsToRender)

## Proposed Hook Structure

### Core Hook: `useBookingState`

**Purpose:** Central state management for all Booking-related state  
**Location:** `src/hooks/useBookingState.js`

**Returns object with:**
```javascript
{
  // Form state
  formData, setFormData,
  errors, setErrors,
  editingId, setEditingId,
  showForm, setShowForm,
  
  // Location selection
  pickupMode, setPickupMode,
  deliveryMode, setDeliveryMode,
  selectedPickupLocationId, setSelectedPickupLocationId,
  selectedDeliveryLocationId, setSelectedDeliveryLocationId,
  tempLocationName, setTempLocationName,
  tempLocationCustomerId, setTempLocationCustomerId,
  pendingBookingData, setPendingBookingData,
  
  // Modals
  showNewCustomerModal, setShowNewCustomerModal,
  showSaveLocationModal, setShowSaveLocationModal,
  editingBlockId, setEditingBlockId,
  editingBlockNameValue, setEditingBlockNameValue,
  costEntryBookingId, setCostEntryBookingId,
  
  // Temp data
  tempCustomerData, setTempCustomerData,
  
  // List UI
  expandedBookingId, setExpandedBookingId,
  expandedBlockId, setExpandedBlockId,
  
  // Tab & Sorting
  currentTab, setCurrentTab,
  sortField, setSortField,
  sortDirection, setSortDirection,
  
  // Derived data (memoized)
  activeCustomers, activeVehicles, activeDrivers,
  formVehicleId, formDriverId,
  driversForSelectedVehicle,
  customerPickupLocations, allPickupLocations,
  rowsToRender,
  
  // Helper functions
  resetForm, vehicleOccupied, driverOccupied
}
```

## Migration Steps

1. ✅ Create branch: `refactor/phase-4-state-refactor-booking`
2. ✅ Create `PHASE4_PLAN.md`
3. Create `src/hooks/` directory
4. Implement `useBookingState.js` hook
5. Update `Booking.jsx` to use the hook
6. Manual testing
7. Optional sub-hook extraction
8. Create `PHASE4_REPORT.md`

## Success Criteria

- [ ] `src/hooks/useBookingState.js` created and working
- [ ] Booking.jsx useState count reduced from 22 to 1
- [ ] All state behavior identical (form, modals, sorting, etc.)
- [ ] Build passes: `npm run build`
- [ ] localStorage behavior preserved
- [ ] No UI/label changes
- [ ] No timing/render changes

## Expected Outcomes

### Before
```
Booking.jsx: 1919 lines
- 22 useState hooks scattered throughout
- 9 derived data calculations inline
- All state logic mixed with UI
```

### After
```
Booking.jsx: ~1850 lines (slight reduction)
- 1 hook call: useBookingState()
- Clear separation: state management vs. event handlers vs. UI

src/hooks/useBookingState.js: ~350 lines (new)
- All 22 state declarations
- All derived data (memoized)
- Pure helper functions
```

## Risk Assessment

### LOW Risk ✅
- Moving useState declarations to hook (same initialization)
- Moving useMemo for derived data (same dependencies)
- Moving pure helper functions (resetForm)
- Destructuring in component (no logic change)

### MEDIUM Risk ⚠️
- Moving useCallback handlers (closure dependencies)
- Moving complex derived data (rowsToRender with many dependencies)
- Ensuring all state references updated correctly

### HIGH Risk ❌
- Moving handlers that call updateData (keep in component initially)
- Changing initialization order
- Modifying useEffect dependencies
- Breaking localStorage persistence

## Stop Conditions

**Immediate stop if any of these occur:**

1. **Closure Behavior Changes** - Handler references stale data
2. **Build Failures** - Revert, analyze, fix or report
3. **State Initialization Issues** - localStorage not loading, props not syncing
4. **Re-render Behavior Changes** - Unnecessary re-renders, performance issues

## References

- [PHASE3_REPORT.md](PHASE3_REPORT.md) - Context for current state
- [Booking.jsx](src/components/Booking.jsx) - Current implementation (1919 lines)
- React Hooks documentation - useState, useMemo, useCallback patterns

---

**Status:** PLAN COMPLETE - Ready for implementation
