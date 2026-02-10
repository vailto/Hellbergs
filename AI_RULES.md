# AI Coding Rules

## Purpose
These rules help AI assistants maintain consistency and avoid introducing duplication or anti-patterns when modifying this codebase.

---

## Critical Rules (MUST Follow)

### 1. CSS Styling - NO Inline Styles

**❌ NEVER do this:**
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
<span style={{ background: '#667eea', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.7rem' }}>
```

**✅ ALWAYS do this:**
```jsx
<div className="flex-center">
<span className="badge-driver">
```

**Rule:** If you need a style that appears (or will appear) 2+ times, add it to `src/index.css` as a utility class. Do NOT create inline styles.

**Exceptions (inline styles acceptable):**
- Dynamic/computed values: `style={{ width: `${percentage}%` }}`
- Truly unique one-off styles (rare)
- Conditional styles based on props/state that can't be classes

---

### 2. Business Logic - Extract to Utils

**❌ NEVER duplicate logic:**
```jsx
// Component A
const authorizedDrivers = vehicleId ? drivers.filter(d => d.vehicleIds.includes(vehicleId)) : [];

// Component B
const authorizedDrivers = vehicleId ? drivers.filter(d => d.vehicleIds.includes(vehicleId)) : []; // DUPLICATE!
```

**✅ ALWAYS extract to utils:**
```jsx
// src/utils/vehicleUtils.js
export function getAuthorizedDrivers(vehicleId, drivers) {
  if (!vehicleId) return [];
  return drivers.filter(d => (d.vehicleIds || []).includes(vehicleId));
}

// Both components
import { getAuthorizedDrivers } from '../utils/vehicleUtils';
const authorizedDrivers = getAuthorizedDrivers(vehicleId, drivers);
```

**Rule:** If logic appears in 2+ components, it belongs in `src/utils/`. No exceptions.

---

### 3. Data Model - Vehicle-Driver Synchronization

**Critical:** `vehicle.driverIds` and `driver.vehicleIds` MUST stay synchronized.

**❌ NEVER modify directly:**
```jsx
// This breaks synchronization!
vehicle.driverIds.push(driverId);
```

**✅ ALWAYS use sync helpers:**
```jsx
import { syncVehicleDriverRelation } from '../utils/vehicleUtils';

// After modifying vehicle.driverIds
const { vehicles: updatedVehicles, drivers: updatedDrivers } = 
  syncVehicleDriverRelation(vehicles, drivers);

updateData({ vehicles: updatedVehicles, drivers: updatedDrivers });
```

**Rule:** Never manually manage `driverIds` or `vehicleIds`. Always call sync functions.

---

### 4. Component Size - Keep Files Focused

**Rule:** If a component exceeds 500 lines, split it.

**❌ Don't:**
- Create 2000-line mega-components
- Mix multiple concerns in one file

**✅ Do:**
- Split by feature/concern
- Extract reusable sub-components
- Move business logic to utils

---

### 5. Imports - Use Existing Utilities

**Before creating a new function, CHECK:**
- `src/utils/formatters.js` - dates, numbers, codes
- `src/utils/vehicleUtils.js` - vehicle/driver logic
- `src/utils/validation.js` - form validation
- `src/utils/storage.js` - localStorage operations

**Rule:** Reuse existing utilities. Don't reinvent the wheel.

---

## Styling Rules

### Utility Class Usage

**Always check `src/index.css` first.** If a utility exists, use it:

**Layout:**
- `.nowrap` instead of `style={{ whiteSpace: 'nowrap' }}`
- `.flex-center` instead of `style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}`
- `.u-flex-gap-sm` for smaller gaps (0.25rem)
- `.u-cursor-pointer` instead of `style={{ cursor: 'pointer' }}`

**Badges:**
- `.badge-driver` - purple driver code badge (#667eea)
- `.badge-driver-inactive` - gray inactive badge (#95a5a6)
- `.badge-vehicle` - green vehicle badge (#e8f5e9 / #2e7d32)

**Spacing:**
- `.mb-1`, `.mb-2` - margin-bottom
- `.u-mb-xs`, `.u-mb-sm`, `.u-mb-md`, `.u-mb-lg` - additional margins
- `.u-p-xs`, `.u-p-sm`, `.u-p-md` - padding

### Adding New Utilities

If you need a style that doesn't exist:

1. **Check if it repeats** - if used 2+ times (or will be), add to CSS
2. **Add to `src/index.css`** under appropriate section
3. **Use `.u-*` prefix** for generic utilities
4. **Document in ARCHITECTURE.md** under "Styling Guide"

Example:
```css
/* src/index.css */
.u-flex-gap-xl { display: flex; gap: 1rem; }
```

---

## Data Flow Rules

### Centralized State Pattern

**Rule:** All persistent data lives in `App.jsx` state and flows down via props.

**✅ Do:**
```jsx
// In App.jsx
const [data, setData] = useState(loadData());
<Booking data={data} updateData={updateData} />

// In Booking.jsx
function Booking({ data, updateData }) {
  const handleSave = () => {
    updateData({ bookings: [...data.bookings, newBooking] });
  };
}
```

**❌ Don't:**
```jsx
// In Booking.jsx - WRONG!
const [bookings, setBookings] = useState([]); // Bypasses centralized state
```

**Rule:** Components receive `data` and `updateData` as props. Never manage persistent state locally.

---

## Booking Status Rules

### Status Transitions

**Rule:** Use the correct status flow:

```
Bokad → Planerad → Genomförd → Prissatt → Fakturerad
```

**Status change logic:**
- `Bokad → Planerad`: requires both `vehicleId` AND `driverId`
- Removing vehicle OR driver from `Planerad` → revert to `Bokad`
- Use `vehicleUtils.js` helpers: `assignVehicleToBooking`, `assignDriverToBooking`

**❌ Don't:**
```jsx
booking.status = 'Planerad'; // Ignores business rules
```

**✅ Do:**
```jsx
const updated = assignVehicleToBooking(booking, vehicleId, drivers);
// Status is set correctly based on authorization
```

---

## Naming Rules

### Consistency

**Functions:**
- Event handlers: `handle*` (e.g., `handleSubmit`, `handleEdit`)
- Getters: `get*` (e.g., `getAuthorizedDrivers`)
- Boolean checks: `is*` / `has*` (e.g., `isActive`, `hasVehicle`)
- Generators: `generate*` (e.g., `generateId`, `generateDriverCode`)

**Components:**
- PascalCase: `Booking.jsx`, `ConfirmModal.jsx`
- Use descriptive names: `SortIcon.jsx` not `Icon.jsx`

**Utils:**
- camelCase files: `formatters.js`, `vehicleUtils.js`
- Group related functions in one file

**CSS Classes:**
- Utilities: `.u-*` prefix
- Components: `.c-*` prefix (if needed)
- Use kebab-case: `.flex-center`, `.badge-driver`

---

## Import Organization

**Rule:** Always organize imports in this order:

```jsx
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Component imports
import ConfirmModal from './ConfirmModal';
import SortIcon from './SortIcon';

// 3. Utility imports
import { generateId, formatTime24 } from '../utils/formatters';
import { assignVehicleToBooking } from '../utils/vehicleUtils';

// 4. Constants
import { BOOKING_STATUSES } from '../utils/constants';
```

---

## What to Avoid

### Anti-Patterns

**❌ Never:**
1. **Duplicate code** - extract to utils if used 2+ times
2. **Inline styles for common patterns** - use CSS classes
3. **Magic numbers** - use named constants
4. **Giant components** - split if >500 lines
5. **Business logic in JSX** - extract to functions
6. **Manual array manipulation** - use helper functions
7. **Skipping sync functions** - always sync vehicle-driver relationships

### Code Smells

If you see:
- Same inline style object in multiple places → create CSS class
- Same function logic in 2+ files → extract to utils
- Complex ternary nested 3+ levels → extract to function
- Component >500 lines → split into smaller components
- Props drilling >3 levels → consider refactor

---

## Commit Messages

**Format:** `type(scope): description`

**Types:**
- `feat` - new feature
- `fix` - bug fix
- `refactor` - code restructuring (no behavior change)
- `style` - formatting, missing semi-colons
- `docs` - documentation only
- `test` - adding tests

**Examples:**
```
feat(booking): add multi-vehicle assignment
fix(schema): correct date sorting logic
refactor(css): replace inline badge styles
docs(architecture): add styling guide section
```

---

## Before Committing

**Checklist:**
1. ✅ Run `npm run build` - must pass with 0 errors
2. ✅ No new inline styles for repeated patterns
3. ✅ No duplicated business logic
4. ✅ Imports organized correctly
5. ✅ CSS classes used where applicable
6. ✅ Sync functions called for vehicle-driver changes

---

## Summary: The 3 Golden Rules

1. **NO INLINE STYLES** for patterns that repeat 2+ times → use CSS classes
2. **NO DUPLICATE LOGIC** across components → extract to `src/utils/`
3. **SYNC VEHICLE-DRIVER** relationships → always use helper functions

Follow these rules, and the codebase will stay clean, maintainable, and consistent.
