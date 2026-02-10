# Architecture Guide

## Purpose
React-based truck logistics booking application. Centralized state in `App.jsx`, localStorage persistence, no external API. Vehicle-driver many-to-many relationships with authorization checks.

---

## Folder Structure (Quick Reference)

```
src/
  App.jsx                    # Root: centralized state
  components/                # UI components
    Booking.jsx, Schema.jsx, Planning.jsx, Statistics.jsx,
    Equipage.jsx, Settings.jsx, Customers.jsx
    shared/                  # Reusable: modals, inputs, icons
  utils/                     # Pure functions, business logic
    formatters.js, vehicleUtils.js, storage.js, validation.js
  data/mockData.js           # Initial data structure
  index.css                  # Global styles + utilities
```

---

## Data Flow

**Centralized state:**
```
App.jsx (state) → data + updateData() → Components (props)
```

Components receive `data` and `updateData` as props. Never manage persistent state locally.

**Persistence:** `storage.js` handles localStorage with automatic migrations.

---

## Styling Rules

### Use CSS Classes, Not Inline Styles

**✅ Do:**
```jsx
<div className="flex-center">
<span className="badge-driver">{code}</span>
```

**❌ Don't:**
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
<span style={{ background: '#667eea', color: 'white', ... }}>{code}</span>
```

### Available Utilities (src/index.css)

**Layout:** `.nowrap`, `.flex-center`, `.u-flex-gap-sm/md/lg`, `.u-cursor-pointer`  
**Badges:** `.badge-driver`, `.badge-driver-inactive`, `.badge-vehicle`  
**Spacing:** `.mb-1`, `.mb-2`, `.u-mb-xs/sm/md/lg`, `.u-p-xs/sm/md`  
**Display:** `.u-opacity-50/60`

### Exceptions for Inline Styles

Only use inline styles for:
- Dynamic/computed values: `style={{ width: \`${percent}%\` }}`
- Truly unique one-off styles
- Conditional styles that can't be classes

---

## 10 Hard Rules

1. **NO inline styles** for patterns that appear 2+ times → use CSS classes
2. **NO duplicate logic** across components → extract to `src/utils/`
3. **ALWAYS sync vehicle-driver** relationships → use `syncVehicleDriverRelation()` or `syncVehicleDriverIdsFromDrivers()`
4. **Components receive data as props** → never create local persistent state
5. **Business logic goes in utils/** → keep components focused on UI
6. **Status transitions follow flow** → `Bokad → Planerad → Genomförd → Prissatt → Fakturerad`
7. **Files stay focused** → split if component >500 lines, util >300 lines
8. **Reuse existing utilities** → check `utils/` before creating new functions
9. **Driver filtering by vehicle** → only show authorized drivers when vehicle selected
10. **Run `npm run build` before commit** → must pass with 0 errors

---

## Quick Reference

### Data Model
- **Booking:** id, bookingNo, customerId, vehicleId, driverId, status, pickup/delivery details
- **Vehicle:** id, regNo, type, driverIds[], active
- **Driver:** id, name, phone, code, vehicleIds[], active
- **Customer:** id, customerNumber, name, contactPerson, address, active
- **Location:** id, name, address, customerIds[]

### Key Helpers (utils/vehicleUtils.js)
- `getAuthorizedDrivers(vehicleId, drivers)` - get drivers for vehicle
- `assignVehicleToBooking(booking, vehicleId, drivers, opts)` - assign with status logic
- `assignDriverToBooking(booking, driverId, opts)` - assign with status logic
- `syncVehicleDriverRelation(vehicles, drivers)` - sync from vehicle perspective
- `syncVehicleDriverIdsFromDrivers(vehicles, drivers)` - sync from driver perspective

### Naming Conventions
- **Components:** PascalCase (Booking.jsx)
- **Utils:** camelCase (formatters.js)
- **Functions:** camelCase, prefixes: `handle*`, `get*`, `is*`, `generate*`
- **CSS classes:** `.u-*` (utilities), `.c-*` (components), `.badge-*` (badges)

### Import Order
1. React imports
2. Component imports
3. Utility imports
4. Relative imports

---

## See Also

- **ARCHITECTURE_APPENDIX.md** - Detailed data models, advanced patterns, migration guide
- **AI_RULES.md** - Critical rules for AI assistants
- **PHASE2_REPORT.md** - CSS consolidation details
