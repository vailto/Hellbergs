# Maintainability & Refactor Report – Hellbergs

## Current Architecture

### Overview

React SPA for truck route planning. ~9,500 lines JS/JSX + ~800 lines CSS. No backend; all persistence via `localStorage`. Single global state in `App.jsx`, passed down as props.

### Module Map

| Module | Lines | Responsibility |
|--------|-------|---------------|
| `App.jsx` | 124 | Root: state, auto-save, section routing |
| `Booking.jsx` | 2,075 | Booking CRUD, status tabs, inline assignment |
| `Settings.jsx` | 2,080 | 6 tabs: Fordon, Förare, Kunder, Platser, Backup, Testdata |
| `Schema.jsx` | 1,289 | Visual week schedule, drag-and-drop, blocks |
| `Customers.jsx` | 748 | Customer CRUD (standalone page) |
| `Planning.jsx` | 695 | Filtered booking list, assignment, cost entry |
| `Statistics.jsx` | 508 | Dashboard, date-range stats |
| `Equipage.jsx` | 256 | Vehicle-driver assignment overview |
| `CostEntryModal.jsx` | 156 | Cost calculation from price templates |
| `index.css` | 794 | Global styles: theme, layout, components, utilities |
| `utils/*.js` | 371 | Formatters, validation, storage, vehicle utils, constants |
| `data/mockData.js` | 352 | Test data factory |

### Data Flow

```
User Action → Component → updateData({...}) → App.setState → useEffect → saveData → localStorage
```

All components receive `data` (read) and `updateData` (write) as props from `App.jsx`.

---

## Top 10 Maintainability Issues

### 1. Giant Components (Critical)

**Problem:** `Settings.jsx` (2,080 lines) and `Booking.jsx` (2,075 lines) are far too large.

**Files:** `src/components/Settings.jsx`, `src/components/Booking.jsx`

**Impact:** Hard to navigate, hard to review changes, high merge conflict risk. Each contains ~20 useState hooks, multiple forms, tables, modals, and handler functions.

**Category:** Larger refactor

---

### 2. Duplicated handleVehicleAssign / handleDriverAssign (High)

**Problem:** Identical logic duplicated across 3 components with minor variations.

**Files:**
- `src/components/Booking.jsx` (lines 458-482)
- `src/components/Planning.jsx` (lines 207-226)
- `src/components/Schema.jsx` (lines 258-280)

Each file has its own version of:
- Authorization check (`authorizedDrivers.filter(...)`)
- Status transition logic (`Bokad → Planerad`)
- Driver keep/reset logic

**Category:** Quick win (1-2 hours)

---

### 3. Duplicated generateDriverCode (High)

**Problem:** Same function copy-pasted in 2 files.

**Files:**
- `src/components/Settings.jsx` (lines 119-128)
- `src/components/Equipage.jsx` (lines 13-21)

**Category:** Quick win (30 minutes)

---

### 4. Massive Inline Style Repetition (High)

**Problem:** 100+ occurrences of repeated inline style objects. The driver badge style alone appears 6+ times, vehicle badge 4+ times.

**Files:** `Settings.jsx`, `Equipage.jsx`, `Booking.jsx`, `Schema.jsx`

**Examples:**
- Driver badge: `{ background: '#667eea', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.7rem', minWidth: '45px', textAlign: 'center' }` — 6 occurrences
- Inactive badge: `{ background: '#95a5a6', ... }` — 4 occurrences
- Vehicle regNo badge: `{ background: '#e8f5e9', color: '#2e7d32', ... }` — 4 occurrences
- `{ whiteSpace: 'nowrap' }` — 50+ occurrences
- `{ display: 'flex', alignItems: 'center', gap: '0.5rem' }` — 20+ occurrences

**Category:** Medium refactor

---

### 5. Inconsistent Sortable Table Headers (Medium)

**Problem:** Two different approaches for the same thing.

**Approach A** (Booking, Planning, Customers): `className="sortable"` with CSS
**Approach B** (Settings, Equipage): `style={{ cursor: 'pointer', userSelect: 'none' }}`

**Impact:** Visual inconsistency risk, harder to maintain.

**Category:** Quick win (1 hour)

---

### 6. Business Logic in UI Components (Medium)

**Problem:** Status transitions, authorization checks, and sort comparators are embedded in JSX components instead of utility functions.

**Examples:**
- Status transitions (`Bokad → Planerad → Genomförd`) in Booking.jsx, Schema.jsx, Planning.jsx
- `authorizedDrivers` filtering logic in Booking.jsx, Schema.jsx, Planning.jsx (3 copies)
- `compareBookings` sort function (50 lines) in Booking.jsx, near-identical in Planning.jsx

**Category:** Medium refactor

---

### 7. Inconsistent Detail Section Styling (Medium)

**Problem:** Expanded row detail sections use two different approaches.

**Approach A** (newer): CSS classes `detail-label`, `detail-value`, `detail-section-title`
**Approach B** (older): Inline `color: '#8899a6'` and `color: '#e1e8ed'`

**Files:**
- `Settings.jsx` lines 1629-1638 (Approach B — customer expanded in "Aktiva kunder")
- `Settings.jsx` lines 1722-1731 (Approach A — customer expanded in "Inaktiva kunder")
- `Booking.jsx` lines 2004-2042 (Approach A)

**Category:** Quick win (30 minutes)

---

### 8. Schema.jsx Complexity (Medium)

**Problem:** `Schema.jsx` (1,289 lines) handles week rendering, day-level time grid, drag-and-drop, overlap detection, block management, booking detail modals, and vehicle/driver assignment — all in one component.

**Impact:** Hard to reason about. Drag-and-drop state management interleaved with rendering logic.

**Category:** Larger refactor

---

### 9. Customer Page Duplication (Low-Medium)

**Problem:** `Customers.jsx` (748 lines) duplicates much of the customer CRUD already in `Settings.jsx` (Kunder tab). Both have customer forms, expandable rows, sorting.

**Files:** `src/components/Customers.jsx`, `src/components/Settings.jsx` (Kunder tab)

**Category:** Medium refactor (decide which to keep, remove the other)

---

### 10. No CSS Class for Common Layout Patterns (Low)

**Problem:** Common layout patterns have no CSS classes:
- Flex row with gap: `{ display: 'flex', gap: '0.5rem' }`
- Flex center: `{ display: 'flex', alignItems: 'center', gap: '0.5rem' }`
- Detail grid: `{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }`

**File:** `src/index.css` (missing utility classes)

**Category:** Quick win (1 hour)

---

## Prioritized Refactor Plan

### Quick Wins (1-2 hours each)

| # | What | Files | Time |
|---|------|-------|------|
| Q1 | Extract `generateDriverCode` to `formatters.js`, remove from Settings + Equipage | formatters.js, Settings.jsx, Equipage.jsx | 30 min |
| Q2 | Extract `handleVehicleAssign`, `handleDriverAssign`, `getAuthorizedDrivers` to `vehicleUtils.js` | vehicleUtils.js, Booking.jsx, Planning.jsx, Schema.jsx | 1-2 hr |
| Q3 | Standardize sortable headers: all use `className="sortable"` | Settings.jsx, Equipage.jsx | 30 min |
| Q4 | Fix detail-section inconsistency: replace inline colors with `detail-label`/`detail-value` | Settings.jsx | 30 min |
| Q5 | Add CSS utility classes: `.flex-row`, `.flex-center`, `.badge-driver`, `.badge-driver-inactive`, `.badge-vehicle` | index.css | 1 hr |

### Medium Refactors (half day each)

| # | What | Files | Time |
|---|------|-------|------|
| M1 | Replace 100+ inline badge styles with CSS classes from Q5 | Settings.jsx, Equipage.jsx, Booking.jsx, Schema.jsx | 3-4 hr |
| M2 | Extract sort comparators to `utils/sorting.js` | Booking.jsx, Planning.jsx, Equipage.jsx, Customers.jsx | 2-3 hr |
| M3 | Extract status transition logic to `utils/bookingUtils.js` | Booking.jsx, Planning.jsx, Schema.jsx | 2-3 hr |
| M4 | Decide on Customers.jsx vs Settings Kunder tab; remove duplicate | Customers.jsx or Settings.jsx | 2 hr |

### Larger Refactors (1-2 days each)

| # | What | Files | Time |
|---|------|-------|------|
| L1 | Split `Settings.jsx` into sub-components per tab | Settings.jsx → SettingsVehicles.jsx, SettingsDrivers.jsx, SettingsCustomers.jsx, SettingsLocations.jsx, SettingsBackup.jsx | 1 day |
| L2 | Split `Booking.jsx` into sub-components | Booking.jsx → BookingForm.jsx, BookingList.jsx, BookingDetail.jsx | 1 day |
| L3 | Split `Schema.jsx` into schedule rendering + interaction logic | Schema.jsx → SchemaGrid.jsx, SchemaBookingModal.jsx, useSchemaInteractions.js | 1-2 days |

---

## Target Structure

```
src/
  App.jsx                          # Root (unchanged)
  main.jsx                         # Entry (unchanged)
  index.css                        # Global styles + new utility/badge classes
  components/
    booking/
      Booking.jsx                  # Container: tabs, routing
      BookingForm.jsx              # Create/edit form
      BookingList.jsx              # Table with inline assignment
      BookingDetail.jsx            # Expanded booking view
    schema/
      Schema.jsx                   # Container: grid + modals
      SchemaGrid.jsx               # Visual grid rendering
      SchemaBookingModal.jsx       # Booking detail modal
    settings/
      Settings.jsx                 # Tab container
      SettingsVehicles.jsx         # Fordon tab
      SettingsDrivers.jsx          # Förare tab
      SettingsCustomers.jsx        # Kunder tab
      SettingsLocations.jsx        # Platser tab
      SettingsBackup.jsx           # Backup + Testdata tabs
    Planning.jsx                   # (stays as-is, 695 lines is OK)
    Statistics.jsx                 # (stays as-is, 508 lines is OK)
    Equipage.jsx                   # (stays as-is, 256 lines is OK)
    shared/
      ConfirmModal.jsx
      CostEntryModal.jsx
      SortIcon.jsx
      TimeInput24.jsx
      DriverBadge.jsx              # New: reusable driver code badge
      ExpandIndicator.jsx          # New: reusable ▶/▼ toggle
  data/
    mockData.js                    # (unchanged)
  utils/
    constants.js                   # (unchanged)
    formatters.js                  # + generateDriverCode (moved here)
    storage.js                     # (unchanged)
    validation.js                  # (unchanged)
    vehicleUtils.js                # + handleVehicleAssign, getAuthorizedDrivers
    bookingUtils.js                # New: status transitions, driver filtering
    sorting.js                     # New: reusable sort comparators
```

---

## Phased Refactor Plan

### Phase 1: Foundation (Quick Wins)

**Goal:** Eliminate the worst duplication without restructuring.

**Changes:**
1. Move `generateDriverCode` from Settings.jsx (lines 119-128) and Equipage.jsx (lines 13-21) → `src/utils/formatters.js`. Update all imports.
2. Add to `src/utils/vehicleUtils.js`:
   - `getAuthorizedDrivers(vehicleId, drivers)` — returns drivers authorized for a vehicle
   - `assignVehicleToBooking(booking, vehicleId, drivers)` — returns updated booking with correct driverId and status
   - `assignDriverToBooking(booking, driverId)` — returns updated booking with status logic
3. Replace 3 copies of `handleVehicleAssign` / `handleDriverAssign` in Booking, Planning, Schema with calls to the new utils.
4. Standardize all sortable headers to use `className="sortable"`.
5. Fix detail-section inconsistency in Settings.jsx: replace inline colors with `detail-label`/`detail-value`.

**Acceptance Checks:**
- `npm run build` passes with 0 errors
- Manual test: create a booking, assign vehicle/driver, verify status transitions work
- Manual test: open Settings, verify all tabs display correctly
- Verify driver badges render identically before/after

---

### Phase 2: CSS Consolidation

**Goal:** Replace inline styles with CSS classes.

**Changes:**
1. Add to `index.css`:
   - `.badge-driver` (purple: `#667eea`)
   - `.badge-driver-inactive` (gray: `#95a5a6`)
   - `.badge-vehicle` (green: `#e8f5e9` / `#2e7d32`)
   - `.flex-row` (`display: flex; gap: 0.5rem`)
   - `.flex-center` (`display: flex; align-items: center; gap: 0.5rem`)
   - `.detail-grid` (`display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem`)
   - `.nowrap` (`white-space: nowrap`)
2. Replace all inline badge styles across Settings, Equipage, Booking, Schema with new classes.
3. Replace common inline flex/grid patterns with utility classes.

**Acceptance Checks:**
- `npm run build` passes
- Visual diff: compare screenshots before/after — should be pixel-identical
- Badge colors consistent across all views

---

### Phase 3: Extract Business Logic

**Goal:** Move business logic out of UI components.

**Changes:**
1. Create `src/utils/bookingUtils.js`:
   - `getStatusAfterVehicleAssign(booking, vehicleId)` — status transition logic
   - `getStatusAfterDriverAssign(booking, driverId)` — status transition logic
   - `filterDriversForBooking(booking, activeDrivers)` — authorization + occupation filter
2. Create `src/utils/sorting.js`:
   - `createBookingComparator(field, direction, data)` — replaces `compareBookings` in Booking/Planning
   - `createVehicleComparator(field, direction, data)` — replaces `sortVehicles` in Settings/Equipage
   - `createDriverComparator(field, direction)` — replaces `sortDrivers` in Settings
   - `createCustomerComparator(field, direction)` — replaces `sortCustomers` in Settings/Customers
3. Update Booking, Planning, Schema, Settings, Equipage, Customers to use these.

**Acceptance Checks:**
- `npm run build` passes
- Manual test: sorting works correctly in all tables
- Manual test: booking assignment flow works (status transitions)

---

### Phase 4: Split Giant Components

**Goal:** Get every file under 500 lines.

**Changes:**
1. Split `Settings.jsx` into:
   - `Settings.jsx` — tab container, shared state
   - `SettingsVehicles.jsx` — Fordon tab (~300 lines)
   - `SettingsDrivers.jsx` — Förare tab (~300 lines)
   - `SettingsCustomers.jsx` — Kunder tab (~300 lines)
   - `SettingsLocations.jsx` — Platser tab (~200 lines)
   - `SettingsBackup.jsx` — Backup + Testdata (~150 lines)
2. Split `Booking.jsx` into:
   - `Booking.jsx` — container, tab routing
   - `BookingForm.jsx` — create/edit form (~400 lines)
   - `BookingList.jsx` — table with inline selects (~400 lines)
   - `BookingDetail.jsx` — expanded row / detail view (~200 lines)
3. Remove `Customers.jsx` (redundant with Settings Kunder tab) or extract shared CustomerForm component.

**Acceptance Checks:**
- `npm run build` passes
- No file exceeds 500 lines
- All features work identically: CRUD, tabs, sorting, expanding, drag-and-drop

---

### Phase 5: Schema Simplification

**Goal:** Make Schema.jsx manageable.

**Changes:**
1. Extract `SchemaGrid.jsx` — pure rendering: header, time grid, vehicle/driver rows
2. Extract `SchemaBookingModal.jsx` — booking detail modal with assignment selects
3. Extract `useSchemaInteractions.js` — custom hook: drag state, overlap detection, block management
4. `Schema.jsx` becomes the glue: ~200 lines connecting grid + modal + interactions

**Acceptance Checks:**
- `npm run build` passes
- Drag-and-drop works: drop booking onto vehicle row
- Block creation on overlap works
- Booking detail modal opens/closes correctly
- Vehicle/driver toggle works
