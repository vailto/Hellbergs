# AI Coding Rules

## The 3 Golden Rules

1. **NO INLINE STYLES** for patterns that repeat 2+ times → use CSS classes from `index.css`
2. **NO DUPLICATE LOGIC** across components → extract to `src/utils/`
3. **SYNC VEHICLE-DRIVER** relationships → always use `syncVehicleDriverRelation()` or `syncVehicleDriverIdsFromDrivers()`

---

## Do / Don't

### ✅ DO

- Use CSS utility classes: `.flex-center`, `.badge-driver`, `.nowrap`, `.u-cursor-pointer`
- Extract repeated logic to `src/utils/` (if used 2+ times)
- Call sync helpers after modifying `driverIds` or `vehicleIds`
- Pass `data` and `updateData` as props (centralized state pattern)
- Keep components <500 lines, utils <300 lines
- Check existing utilities before creating new ones
- Run `npm run build` before committing

### ❌ DON'T

- Create inline styles for common patterns (flex, badges, spacing)
- Duplicate business logic across components
- Manually modify `vehicle.driverIds` or `driver.vehicleIds` without syncing
- Create local persistent state in components (use props)
- Mix business logic with JSX rendering
- Skip `getAuthorizedDrivers()` in booking driver dropdowns

---

## Before You Code (Checklist)

1. **Check existing utilities** - `formatters.js`, `vehicleUtils.js`, `validation.js`, `storage.js`
2. **Check existing CSS classes** - `index.css` has 24+ utilities
3. **Understand data flow** - state lives in App.jsx, flows down via props
4. **Know the data model** - `vehicle.driverIds[]` ↔ `driver.vehicleIds[]` must sync
5. **Review ARCHITECTURE.md** - "10 Hard Rules" section

---

## When You Refactor (Checklist)

1. **Keep behavior identical** - no functional changes during refactor
2. **Test before and after** - manually verify affected flows
3. **Use small commits** - one logical change per commit
4. **Build must pass** - `npm run build` with 0 errors
5. **Update docs if needed** - add new utilities to ARCHITECTURE.md

---

## Quick Reference

### CSS Utilities (index.css)
**Use these instead of inline styles:**
- `.nowrap` → `whiteSpace: 'nowrap'`
- `.flex-center` → `display: flex; alignItems: center; gap: 0.5rem`
- `.badge-driver` → full driver badge style (#667eea purple)
- `.badge-driver-inactive` → gray badge (#95a5a6)
- `.u-cursor-pointer` → `cursor: pointer`
- `.u-mb-sm`, `.u-p-xs` → spacing utilities

### Key Helpers (vehicleUtils.js)
- `getAuthorizedDrivers(vehicleId, drivers)` - filter drivers by vehicle
- `assignVehicleToBooking(booking, vehicleId, drivers)` - handles status logic
- `assignDriverToBooking(booking, driverId)` - handles status logic
- `syncVehicleDriverRelation(vehicles, drivers)` - sync after vehicle changes
- `syncVehicleDriverIdsFromDrivers(vehicles, drivers)` - sync after driver changes

### Naming Conventions
- Event handlers: `handle*` (handleSubmit, handleEdit)
- Getters: `get*` (getAuthorizedDrivers)
- Boolean checks: `is*`, `has*` (isActive, hasVehicle)
- Components: PascalCase (Booking.jsx)
- Utils: camelCase (formatters.js)
- CSS: `.u-*` (utilities), `.badge-*` (badges)

---

## See Also

- **AI_RULES_APPENDIX.md** - Extended examples, rationale, anti-patterns
- **ARCHITECTURE.md** - Core architecture guide
- **ARCHITECTURE_APPENDIX.md** - Detailed data models
