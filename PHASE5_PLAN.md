# Phase 5: Component Splitting - Booking

## Overview

Split `Booking.jsx` into smaller, focused components now that state management is extracted to `useBookingState` hook. **Zero behavior/UI changes allowed.**

## Current State

- **Booking.jsx**: 1963 lines
- **State management**: Already extracted to `useBookingState` hook (Phase 4)
- **Target**: Thin wrapper + modular components

## Major JSX Sections in Booking.jsx

### 1. Component Structure (lines 1-86)
- Imports and hook destructuring
- **Destination**: Move to `BookingPage.jsx`

### 2. Event Handlers (lines 87-488)
- `handleChange` - Form field changes
- `handlePickupLocationSelect` / `handleDeliveryLocationSelect`
- `handleNewBooking` - Open form for new booking
- `handleEdit` - Open form for editing
- `handleDelete` - Delete booking with confirmation
- `handleSubmit` - Form validation and save
- `saveBooking` - Create new booking
- `handleSaveLocation` - Save location modal handler
- `handleCancelForm` - Close form
- `handleDuplicateBooking` - Duplicate existing booking
- `handleTempCustomerChange` / `handleSaveTempCustomer` - New customer modal
- `handleVehicleAssign` / `handleDriverAssign` - Assign resources
- `handleStatusChange` - Update booking status
- `handleCostSave` - Save cost entry
- `handleSort` - Sort table columns
- **Destination**: Stay in `BookingPage.jsx` (container logic)

### 3. Main Return / Page Layout (lines 489-2056)

#### 3a. Header + New Booking Button (lines 489-496)
```jsx
<h1>Bokningar</h1>
<button onClick={handleNewBooking}>+ Ny bokning</button>
```
**Destination**: Stay in `BookingPage.jsx`

#### 3b. Booking Form (lines 498-1229)
- Form wrapper with title
- Error display
- Form sections:
  - Basic info (customer, status)
  - Vehicle and driver
  - Pickup details (mode selector, address, date/time, contact)
  - Delivery details (mode selector, address, date/time, contact)
  - Pricing (km, costs, amount)
  - Notes
  - Action buttons (delete, duplicate, cancel, save)
- **Destination**: Extract to `BookingFormSection.jsx`

#### 3c. Save Location Modal (lines 1231-1303)
- Modal for saving new pickup location
- **Destination**: Move to `BookingModals.jsx`

#### 3d. Edit Block Name Modal (lines 1305-1370)
- Modal for editing booking block name
- **Destination**: Move to `BookingModals.jsx`

#### 3e. New Customer Modal (lines 1372-1521)
- Modal for creating new customer
- **Destination**: Move to `BookingModals.jsx`

#### 3f. Booking List View (lines 1523-2042)
- BookingTabs component (already extracted)
- Empty state display
- Booking table:
  - Table headers with sorting
  - Table rows (blocks and bookings)
  - Expandable row details
  - Vehicle/driver assignment dropdowns
  - Status badges
  - Action buttons
- **Destination**: Extract to `BookingTableSection.jsx`

#### 3g. Cost Entry Modal (lines 2044-2055)
- Conditional rendering of CostEntryModal
- **Destination**: Move to `BookingModals.jsx`

## Component Mapping

### Booking.jsx (New - Thin Wrapper)
**Purpose**: Maintain existing import path, prevent routing changes  
**Size**: ~10 lines  
**Content**:
```jsx
import BookingPage from './booking/BookingPage';
export default function Booking(props) {
  return <BookingPage {...props} />;
}
```

### booking/BookingPage.jsx (Container)
**Purpose**: Main container with state, handlers, and composition  
**Size**: ~500-600 lines (handlers + composition)  
**Responsibilities**:
- Import and call `useBookingState` hook
- Define all event handlers
- Compose child components
- Pass grouped props to sections

**Prop grouping strategy**:
```javascript
const stateProps = {
  formData, errors, editingId, showForm,
  currentTab, sortField, sortDirection,
  expandedBookingId, expandedBlockId,
  pickupMode, deliveryMode,
  selectedPickupLocationId, selectedDeliveryLocationId,
  // ... other state values
};

const actionProps = {
  setFormData, setErrors, setEditingId, setShowForm,
  handleChange, handleSubmit, handleEdit, handleDelete,
  handleNewBooking, handleCancelForm, handleSort,
  // ... other handlers
};

const derivedProps = {
  activeCustomers, activeVehicles, activeDrivers,
  driversForSelectedVehicle, customerPickupLocations,
  allPickupLocations, rowsToRender,
  // ... other computed values
};
```

### booking/BookingFormSection.jsx
**Purpose**: Booking form (create/edit)  
**Size**: ~700-800 lines  
**Props received**:
- `state` - Form state values
- `actions` - Form handlers
- `derived` - Collections for dropdowns
- `data` - For BOOKING_STATUSES

**Responsibilities**:
- Render form fields
- Display validation errors
- Show/hide based on `showForm`
- Location mode selectors
- Action buttons

### booking/BookingTableSection.jsx
**Purpose**: Booking list with table  
**Size**: ~500-600 lines  
**Props received**:
- `state` - Table state (sorting, expanded rows, tab)
- `actions` - Table handlers (sort, expand, assign, status change)
- `derived` - Filtered and sorted bookings
- `data` - For lookups (customers, vehicles, drivers)

**Responsibilities**:
- Render BookingTabs
- Empty state display
- Table with headers
- Booking rows (normal and block)
- Expandable details
- Assignment dropdowns
- Action buttons

### booking/BookingModals.jsx
**Purpose**: All modal dialogs  
**Size**: ~300-400 lines  
**Props received**:
- `state` - Modal open/close flags, temp data
- `actions` - Modal-specific handlers
- `derived` - Collections for dropdowns

**Modals included**:
- Save Location Modal
- Edit Block Name Modal
- New Customer Modal
- Cost Entry Modal (wrapper for existing component)

**Responsibilities**:
- Conditional rendering of modals
- Modal-specific UI
- Close handlers

### booking/BookingTabs.jsx (Already Exists)
**Purpose**: Tab navigation  
**Size**: 68 lines  
**No changes needed** - already extracted in Phase 3

## Migration Steps (In Order)

### Step 1: Create BookingPage container
1. Create `src/components/booking/BookingPage.jsx`
2. Move entire Booking.jsx content into BookingPage
3. Update imports and exports
4. Build and verify

**Commit**: `refactor(booking): introduce BookingPage container`

### Step 2: Replace Booking.jsx with wrapper
1. Replace Booking.jsx content with thin wrapper
2. Wrapper passes all props to BookingPage
3. Keep default export and function name
4. Build and verify

**Commit**: `refactor(booking): convert Booking to thin wrapper`

### Step 3: Extract BookingModals
1. Create `src/components/booking/BookingModals.jsx`
2. Move all 4 modal JSX sections
3. Define props interface with state/actions groups
4. Update BookingPage to render BookingModals
5. Build and verify

**Commit**: `refactor(booking): extract BookingModals component`

### Step 4: Extract BookingFormSection
1. Create `src/components/booking/BookingFormSection.jsx`
2. Move form JSX (lines 498-1229)
3. Define props interface with state/actions/derived groups
4. Update BookingPage to render BookingFormSection
5. Build and verify

**Commit**: `refactor(booking): extract BookingFormSection component`

### Step 5: Extract BookingTableSection
1. Create `src/components/booking/BookingTableSection.jsx`
2. Move table JSX (lines 1523-2042)
3. Include BookingTabs in this section
4. Define props interface with state/actions/derived groups
5. Update BookingPage to render BookingTableSection
6. Build and verify

**Commit**: `refactor(booking): extract BookingTableSection component`

## Props Strategy

### Avoid Prop Explosion
Instead of 50+ individual props, group related values:

```javascript
// BAD - 50+ individual props
<BookingFormSection
  formData={formData}
  errors={errors}
  editingId={editingId}
  showForm={showForm}
  // ... 46 more individual props
/>

// GOOD - Grouped props
<BookingFormSection
  state={{ formData, errors, editingId, showForm, /* ... */ }}
  actions={{ handleChange, handleSubmit, /* ... */ }}
  derived={{ activeCustomers, activeVehicles, /* ... */ }}
  data={data}
/>
```

### Group Definitions

**state**: All useState values from hook  
**actions**: All handlers and setters  
**derived**: All memoized/computed values  
**data**: App data passed from parent (customers, vehicles, etc.)

## Expected Outcomes

### Before Phase 5
```
src/components/
  Booking.jsx                 # 1963 lines (monolithic)
  booking/
    BookingTabs.jsx          # 68 lines
```

### After Phase 5
```
src/components/
  Booking.jsx                 # ~10 lines (wrapper)
  booking/
    BookingPage.jsx           # ~500-600 lines (container)
    BookingFormSection.jsx    # ~700-800 lines
    BookingTableSection.jsx   # ~500-600 lines
    BookingModals.jsx         # ~300-400 lines
    BookingTabs.jsx           # 68 lines (unchanged)
```

**Total lines**: ~2000-2500 lines (including new structure)  
**Original**: 1963 lines  
**Net change**: +37-537 lines (better organization worth the tradeoff)

## Risks & Mitigations

### LOW Risk ✅
- Moving JSX to new files with same props
- Grouping props into objects
- Wrapper pattern to preserve imports

### MEDIUM Risk ⚠️
- Ensuring all handlers passed correctly
- Maintaining event handler closures
- Prop drilling depth (mitigated by grouping)

### HIGH Risk ❌
- Changing handler signatures (DON'T DO)
- Modifying business logic (DON'T DO)
- Breaking state updates (verify carefully)

## Stop Conditions

**Stop immediately if**:
1. Build fails and cannot be fixed with simple import changes
2. Handler closures break (stale data accessed)
3. More than 5 new ESLint warnings introduced
4. Need to modify handler logic to make extraction work

**Report to user**:
- Which component extraction failed
- Why it failed (technical reason)
- Proposed alternative approach

## Success Criteria

### Must Have ✅
- [ ] Booking.jsx is <20 lines (wrapper only)
- [ ] BookingPage.jsx created and working
- [ ] All 4 components extracted successfully
- [ ] Build passes after each step
- [ ] ESLint warnings remain at 48 (baseline)
- [ ] No UI changes visible
- [ ] No behavior changes detected

### Nice to Have 🎯
- [ ] Props grouped logically
- [ ] Clear component boundaries
- [ ] Easy to maintain going forward

## Build Verification

After each extraction:
```bash
npm run build  # Must pass
npm run lint   # Must stay at 48 warnings or less
```

## Commit Discipline

Format: `refactor(booking): <description>`

1. `refactor(booking): introduce BookingPage container`
2. `refactor(booking): convert Booking to thin wrapper`
3. `refactor(booking): extract BookingModals component`
4. `refactor(booking): extract BookingFormSection component`
5. `refactor(booking): extract BookingTableSection component`
6. `docs: Phase 5 component splitting completion report`

## References

- Phase 3 Report: Component splitting utils and BookingTabs
- Phase 4 Report: State extraction to useBookingState hook
- useBookingState hook: Already provides grouped state structure

---

**Status**: PLAN COMPLETE - Ready for implementation

**Wrapper note**: Keeping `Booking.jsx` as a wrapper (not renaming to `BookingPage.jsx` everywhere) prevents breaking existing imports from App.jsx and maintains backward compatibility.
