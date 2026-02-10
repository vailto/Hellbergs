# Architecture Guide

## Overview

This is a React-based booking and route planning application for truck logistics. The application uses a centralized state pattern with localStorage persistence.

---

## Folder Structure

```
src/
  App.jsx                    # Root component, manages centralized state
  main.jsx                   # Entry point
  index.css                  # Global styles + utility classes
  
  components/                # UI components
    Booking.jsx             # Booking creation and management
    Schema.jsx              # Visual schedule/timeline view
    Planning.jsx            # Booking list and planning view
    Statistics.jsx          # Dashboards and reports
    Equipage.jsx            # Vehicle-driver assignment overview
    Settings.jsx            # Configuration (vehicles, drivers, customers, locations)
    Customers.jsx           # Customer management standalone view
    
    shared/                 # Reusable components
      ConfirmModal.jsx      # Confirmation dialog
      CostEntryModal.jsx    # Cost entry form modal
      SortIcon.jsx          # Sortable table header indicator
      StatusSelect.jsx      # Status dropdown
      TimeInput24.jsx       # 24-hour time input
  
  data/
    mockData.js             # Initial/demo data structure
  
  utils/
    constants.js            # App constants (statuses, etc.)
    formatters.js           # Formatting utilities (dates, numbers, generateDriverCode)
    storage.js              # localStorage persistence and data migration
    validation.js           # Form validation
    vehicleUtils.js         # Vehicle/driver assignment and authorization logic
```

---

## Data Flow

### Centralized State Pattern

All application data lives in `App.jsx` and flows down via props:

```
App.jsx (state)
  ├─ data (vehicles, drivers, bookings, customers, locations)
  ├─ updateData(changes) - merge updates into state
  └─ Pass to child components as props
```

**Key principle:** Components receive `data` and `updateData` as props. Components do NOT manage their own persistent state.

### Data Persistence

- `src/utils/storage.js` handles all localStorage operations
- `loadData()` - loads from localStorage on app start, applies migrations
- `saveData(data)` - saves to localStorage (called by App.jsx after state changes)
- `migrateVehicleDriverData(data)` - migrates old data schemas to new format

---

## Data Model

### Core Entities

**Booking:**
```js
{
  id, bookingNo, customerId, vehicleId, driverId,
  status, // 'Bokad' | 'Planerad' | 'Genomförd' | 'Prissatt' | 'Fakturerad'
  pickupAddress, pickupDate, pickupTime, pickupContactName, pickupContactPhone,
  deliveryAddress, deliveryDate, deliveryTime, deliveryContactName, deliveryContactPhone,
  notes, distance, estimatedCost, actualCost
}
```

**Vehicle:**
```js
{
  id, regNo, type,
  driverIds: [],  // Array of driver IDs authorized for this vehicle (many-to-many)
  active
}
```

**Driver:**
```js
{
  id, name, phone, code, // code: e.g., "KAKA" (generated from name)
  vehicleIds: [],  // Array of vehicle IDs this driver is authorized for (many-to-many)
  active
}
```

**Customer:**
```js
{
  id, customerNumber, name, shortName, contactPerson, email, mobile, phone,
  address, postalCode, city, priority, notes, active
}
```

**Location:**
```js
{
  id, name, address, postalCode, city,
  customerIds: []  // Array of customers associated with this location
}
```

---

## Styling Guide

### CSS Architecture

**1. Use CSS Classes Over Inline Styles**

❌ **Avoid:**
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
```

✅ **Prefer:**
```jsx
<div className="flex-center">
```

**2. Utility Classes (src/index.css)**

All utility classes are defined in `src/index.css`. Use these for common patterns:

**Layout utilities:**
- `.nowrap` - white-space: nowrap
- `.flex-row` - display: flex; gap: 0.5rem
- `.flex-center` - display: flex; align-items: center; gap: 0.5rem
- `.u-flex-gap-sm` - display: flex; gap: 0.25rem
- `.u-flex-gap-md` - display: flex; gap: 0.35rem
- `.u-flex-center-sm` - display: flex; align-items: center; gap: 0.25rem
- `.u-flex-center-md` - display: flex; align-items: center; gap: 0.35rem
- `.u-cursor-pointer` - cursor: pointer
- `.u-grid-2col` - 2-column grid

**Spacing utilities:**
- `.mb-1`, `.mb-2` - existing margin-bottom
- `.u-mb-xs`, `.u-mb-sm`, `.u-mb-md`, `.u-mb-lg` - margin-bottom variants
- `.u-p-xs`, `.u-p-sm`, `.u-p-md` - padding variants

**Badge utilities:**
- `.badge-driver` - purple driver code badge
- `.badge-driver-inactive` - gray inactive driver badge
- `.badge-vehicle` - green vehicle badge

**Display utilities:**
- `.u-opacity-50`, `.u-opacity-60` - opacity variants

**3. Exceptions for Inline Styles**

Inline styles are acceptable ONLY for:
- **Dynamic/computed values** (e.g., `width: ${percentage}%`)
- **Unique one-off styles** that don't repeat anywhere else
- **Style variations based on props/state** (e.g., conditional colors)

**4. Adding New Utilities**

When adding utilities to `src/index.css`:
- Use `.u-*` prefix for generic utilities
- Use `.c-*` prefix for component-specific classes (if needed)
- Keep utilities small and composable
- Document new utilities in this file

---

## Component Boundaries

### What Goes Where

**UI Components** (`src/components/*.jsx`):
- Rendering JSX
- Event handlers (onClick, onChange)
- Local UI state (modals open/closed, expanded rows, sort direction)
- Call utility functions from `src/utils/`

**Utils** (`src/utils/*.js`):
- Pure functions (no React hooks, no JSX)
- Business logic (status transitions, authorization checks)
- Formatting (dates, numbers, codes)
- Data transformations

**❌ Don't:**
- Put business logic directly in components
- Duplicate utility functions across files
- Create new inline styles for patterns that appear 2+ times

**✅ Do:**
- Extract business logic to `src/utils/`
- Reuse existing utilities
- Use CSS classes for repeated patterns

---

## Status Flow

### Booking Status Transitions

```
Bokad (red)
  ↓ (assign vehicle + driver)
Planerad (yellow)
  ↓ (mark completed)
Genomförd (green)
  ↓ (enter costs)
Prissatt (purple)
  ↓ (invoice)
Fakturerad (blue)
```

**Rules:**
- `Bokad → Planerad`: requires vehicleId AND driverId
- Removing vehicle OR driver from `Planerad` → reverts to `Bokad`
- Use `vehicleUtils.js` helpers for assignment logic

---

## Vehicle-Driver Authorization

### Many-to-Many Relationship

- A vehicle can have multiple authorized drivers (`vehicle.driverIds[]`)
- A driver can be authorized for multiple vehicles (`driver.vehicleIds[]`)
- **Must stay synchronized** - use helper functions from `vehicleUtils.js`:
  - `syncVehicleDriverRelation(vehicles, drivers)` - sync from vehicle perspective
  - `syncVehicleDriverIdsFromDrivers(vehicles, drivers)` - sync from driver perspective
  - `getAuthorizedDrivers(vehicleId, drivers)` - get drivers for a vehicle
  - `assignVehicleToBooking(booking, vehicleId, drivers, options)` - assign vehicle to booking
  - `assignDriverToBooking(booking, driverId, options)` - assign driver to booking

### Driver Filtering in Booking Flow

When selecting a driver for a booking:
1. If vehicle is assigned: show only authorized drivers for that vehicle
2. If no vehicle assigned: show all active drivers

---

## Rules

### File Size Limits
- Components: aim for <500 lines
- Utils: aim for <300 lines
- If larger, split into smaller focused files

### Naming Conventions
- **Components:** PascalCase (e.g., `Booking.jsx`, `SortIcon.jsx`)
- **Utils:** camelCase (e.g., `formatters.js`, `vehicleUtils.js`)
- **CSS classes:** kebab-case for components, `.u-*` for utilities
- **Functions:** camelCase (e.g., `handleSubmit`, `generateDriverCode`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `BOOKING_STATUSES`)

### Import Order
1. React imports
2. Component imports
3. Utility imports
4. Relative imports

Example:
```js
import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { generateId, formatTime24 } from '../utils/formatters';
import { assignVehicleToBooking } from '../utils/vehicleUtils';
```

---

## What NOT to Do

❌ **Don't:**
1. Create inline styles for patterns that appear 2+ times → use CSS classes
2. Duplicate business logic → extract to `src/utils/`
3. Mix data fetching and UI logic → keep components focused on UI
4. Create new components for single-use elements → use existing patterns
5. Use magic numbers → define constants
6. Put styles in JS files → keep in `index.css`
7. Create giant components → split if >500 lines

✅ **Do:**
1. Use CSS utility classes for common patterns
2. Extract and reuse business logic
3. Keep components focused on rendering
4. Reuse existing components
5. Use named constants from `constants.js`
6. Keep all styles in CSS files
7. Split large components into smaller focused ones

---

## Testing & Verification

### Before Committing
1. Run `npm run build` - must pass with 0 errors
2. Manually test affected flows
3. Check for linter errors (if configured)

### When Refactoring
- Keep behavior identical
- Test before and after
- Use small, focused commits

---

## Future Improvements

**Short term:**
- Add ESLint configuration
- Add unit tests (Jest/Vitest)
- Split large components (Settings.jsx, Booking.jsx)

**Medium term:**
- Extract booking logic to `src/utils/bookingUtils.js`
- Create reusable table components
- Add TypeScript types

**Long term:**
- Consider state management library (if needed)
- API integration (replace localStorage)
- E2E testing (Playwright/Cypress)
