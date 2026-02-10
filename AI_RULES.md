# AI Rules – Hellbergs Codebase

Rules the AI must follow when modifying this codebase.

## 1. No Duplication

- Before writing any function, search for existing implementations in `src/utils/` and all components.
- `generateDriverCode`, `handleVehicleAssign`, `handleDriverAssign`, sort comparators — these already exist. Reuse, don't rewrite.
- If a function exists in 2+ components with the same logic, extract it to `src/utils/` first.

## 2. Style Rules

- **Use CSS classes** from `index.css` instead of inline styles. If a style pattern appears 3+ times, add a class.
- **Never hardcode colors** — use CSS variables (`var(--color-primary)`, `var(--color-text-muted)`, etc.).
- **Driver badges**: use the `.driver-badge` class (to be created) — not inline `background: '#667eea'`.
- **Table headers**: use `className="sortable"` — not `style={{ cursor: 'pointer', userSelect: 'none' }}`.

## 3. Component Boundaries

- **Components are UI only** — business logic (status transitions, authorization checks, data sync) belongs in `src/utils/`.
- **Props**: components receive `data` and `updateData`. Don't call `localStorage` directly.
- **No cross-component state** — all shared state flows through `App.jsx`.

## 4. Data Model

- **Vehicle-driver relation is many-to-many**: `vehicle.driverIds[]` ↔ `driver.vehicleIds[]`.
- Always sync both sides using `syncVehicleDriverRelation()` (from vehicleUtils.js).
- Legacy `vehicle.driverId` may still exist in old data — always normalize to `driverIds`.
- **Booking.driverId** is a single value (one driver per booking trip) — this is NOT the same as the vehicle's `driverIds` (all authorized drivers).

## 5. File Size Limits

- No component file should exceed 500 lines. If it does, split it.
- `Settings.jsx` (2,080 lines) and `Booking.jsx` (2,075 lines) are overdue for splitting.
- Extract tab content into sub-components (e.g., `SettingsVehicles.jsx`, `SettingsDrivers.jsx`).

## 6. Naming & Patterns

- IDs: use `generateId('prefix')` from formatters.js. Prefixes: `cust`, `drv`, `veh`, `loc`, `bk`, `blk`.
- Driver codes: use `generateDriverCode(name)` — 2 chars from first name + 2 from last.
- Booking numbers: use `generateBookingNumber(lastBookingNumber)` — format `YYYY-####`.
- Sort handlers: pattern `handleSort(field)` toggles direction when same field, resets to asc for new field.

## 7. Before Every Edit

1. Read the file you're about to edit.
2. Search for existing patterns/functions that do what you need.
3. Check `ARCHITECTURE.md` for where things belong.
4. After editing, run `npm run build` to verify no errors.

## 8. What NOT to Do

- Don't create new CSS files — everything goes in `index.css`.
- Don't add new state management libraries (no Redux, no Zustand).
- Don't add a backend — this is a localStorage-only app.
- Don't change the data flow pattern (App → props → components).
- Don't use `useContext` — props are fine for this app size.
- Don't add TypeScript — the project is plain JS/JSX.
