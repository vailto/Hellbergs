# Phase 3: Component Splitting Plan

## Overview

Phase 3 splits large components into smaller, responsibility-focused files without changing behavior or UI.

**Target components (in order):**
1. Booking.jsx (2075 lines) ← START HERE
2. Schema.jsx (TBD)
3. Settings.jsx (TBD)

---

## Booking.jsx Analysis

### Current State
- **Total lines:** 2075
- **Target:** <300 lines per file
- **Main responsibilities:**
  1. Booking form (create/edit)
  2. Booking list (table with grouping/expanding)
  3. Modal management (new customer, save location, cost entry)
  4. Sorting and filtering logic
  5. Vehicle/driver assignment
  6. Status management
  7. Location management (pickup/delivery)

### State Management (28 useState calls)
```
Form state:
- formData (large object with all booking fields)
- errors
- editingId
- showForm

UI state:
- currentTab
- expandedBookingId
- expandedBlockId
- editingBlockId
- editingBlockNameValue
- sortField
- sortDirection

Modal state:
- showNewCustomerModal
- showSaveLocationModal
- costEntryBookingId

Location state:
- pickupMode / deliveryMode
- selectedPickupLocationId / selectedDeliveryLocationId
- tempLocationName / tempLocationCustomerId
- pendingBookingData

Temp data:
- tempCustomerData
```

### Functions to Extract (26 functions)

**Event handlers (keep in container):**
- handleChange, handleSubmit, handleEdit, handleDelete
- handleNewBooking, handleCancelForm, handleDuplicateBooking
- handlePickupLocationSelect, handleDeliveryLocationSelect
- handleVehicleAssign, handleDriverAssign, handleStatusChange
- handleCostSave, handleSort
- handleTempCustomerChange, handleSaveTempCustomer
- handleSaveLocation

**Pure logic (extract to utils):**
- compareBookings - sorting comparison logic → `src/utils/bookingSorters.js`
- sortBookings - sorting application → `src/utils/bookingSorters.js`
- filterByTab - tab filtering logic → `src/utils/bookingFilters.js`
- getDisplayRows - grouping logic → `src/utils/bookingGrouping.js`
- vehicleOccupied / driverOccupied - wrapper functions (already use utils)

**Derived data (can stay or extract):**
- getRowsToRender - combines filter + sort + group

**Helper functions:**
- resetForm, saveBooking - can stay in container

### JSX Structure (UI Components to Extract)

**1. BookingForm.jsx** (~600 lines)
- Form fields (customer, vehicle, driver, dates, addresses, notes)
- Location selection (pickup/delivery modes)
- Container/trailer toggles
- Form validation display
- Submit/cancel buttons

**2. BookingListTable.jsx** (~800 lines)
- Table headers with sorting
- Grouped rows (by date + customer)
- Expandable rows
- Inline vehicle/driver assignment
- Status change dropdown
- Action buttons (edit, delete, duplicate, cost entry)

**3. BookingDetailsRow.jsx** (~200 lines)
- Expanded booking details
- Pickup/delivery information grid
- Notes display
- Cost information

**4. BookingModals.jsx** (~150 lines)
- NewCustomerModal
- SaveLocationModal
- CostEntryModal (already separate, just import)

**5. BookingTabs.jsx** (~50 lines)
- Tab navigation
- Stats display

### Extraction Plan (Step-by-Step)

#### Step 1: Extract Pure Logic to Utils
**Files to create:**
- `src/utils/bookingSorters.js` - compareBookings, sortBookings
- `src/utils/bookingFilters.js` - filterByTab
- `src/utils/bookingGrouping.js` - getDisplayRows, grouping logic

**Commit:** `refactor(booking): extract sorting and filtering utils`

#### Step 2: Extract Form Component
**Files to create:**
- `src/components/booking/BookingForm.jsx`
- Pass formData, errors, handlers as props
- Keep all form logic in parent for now

**Commit:** `refactor(booking): extract BookingForm component`

#### Step 3: Extract Table Component
**Files to create:**
- `src/components/booking/BookingListTable.jsx`
- Pass bookings, handlers, expanded state as props
- Keep row rendering logic together

**Commit:** `refactor(booking): extract BookingListTable component`

#### Step 4: Extract Subcomponents
**Files to create:**
- `src/components/booking/BookingDetailsRow.jsx` - expanded row details
- `src/components/booking/BookingTabs.jsx` - tab navigation

**Commit:** `refactor(booking): extract table subcomponents`

#### Step 5: Final Cleanup
- Move modal logic to separate file if needed
- Ensure Booking.jsx is <300 lines
- All imports organized

**Commit:** `refactor(booking): finalize component split`

### Expected Final Structure

```
src/
  components/
    Booking.jsx                      # Container: ~250 lines
      - State management
      - Event handlers
      - Composition of subcomponents
    
    booking/
      BookingForm.jsx                # Form UI: ~300 lines
      BookingListTable.jsx           # Table UI: ~300 lines
      BookingDetailsRow.jsx          # Details UI: ~150 lines
      BookingTabs.jsx                # Tabs UI: ~50 lines
  
  utils/
    bookingSorters.js                # Sorting logic: ~80 lines
    bookingFilters.js                # Filtering logic: ~30 lines
    bookingGrouping.js               # Grouping logic: ~100 lines
```

**Total files:** 1 → 9 files
**Container size:** 2075 → ~250 lines (88% reduction)

---

## Risk Assessment

### Low Risk
- Extracting pure functions (sorters, filters)
- Extracting presentational components with explicit props
- No state ownership changes

### Medium Risk
- Form component with many fields and validation
- Table component with complex event handlers
- Must ensure all props are passed correctly

### High Risk (STOP if encountered)
- Implicit state coupling between components
- Circular dependencies
- Unclear state ownership

### Mitigation
- Extract one piece at a time
- Build after each extraction
- Test manually after each step
- Keep commits small and revertible

---

## Success Criteria

✅ Booking.jsx < 300 lines
✅ All extractions compile without errors
✅ No behavior changes (manual verification)
✅ No visual changes (manual verification)
✅ Clear separation of concerns
✅ No circular imports
✅ Props passed explicitly (no implicit coupling)

---

## Notes

- Do NOT touch Schema.jsx or Settings.jsx until Booking.jsx is complete
- After Booking.jsx is done, create similar plan for Schema.jsx
- After Schema.jsx is done, create similar plan for Settings.jsx
- Each component gets its own commit
- PHASE3_REPORT.md created at the end with full summary
