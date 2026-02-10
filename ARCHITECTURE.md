# Architecture – Hellbergs Truck Route Planner

## Overview

React SPA (~9,500 lines JSX/JS, ~800 lines CSS). No backend; all data in `localStorage`.

## Folder Structure

```
src/
  App.jsx               # Root: global state, auto-save, section routing
  main.jsx              # React entry point
  index.css             # Single global stylesheet (CSS variables, components, utilities)
  components/
    Booking.jsx         # Booking CRUD, tabs by status, inline vehicle/driver assignment
    Schema.jsx          # Visual week schedule, drag-and-drop, overlap/block management
    Planning.jsx        # Filtered booking list, inline assignment, cost entry
    Settings.jsx        # Tabs: Fordon, Förare, Kunder, Platser, Backup, Testdata
    Customers.jsx       # Customer CRUD (standalone page, NOT used in sidebar currently)
    Equipage.jsx        # Vehicle-driver assignment overview (Bilar page)
    Statistics.jsx      # Dashboard: stats, charts, date-range filters
    CostEntryModal.jsx  # Modal: calculate cost from customer price templates
    ConfirmModal.jsx    # Reusable confirmation dialog
    SortIcon.jsx        # Table sort indicator (↕/↑/↓)
    TimeInput24.jsx     # 24h time picker (hour + minute dropdowns)
  data/
    mockData.js         # Test data factory (customers, drivers, vehicles, locations, bookings)
  utils/
    constants.js        # BOOKING_STATUSES array
    formatters.js       # Number/date/time formatting, ID generation
    storage.js          # localStorage CRUD, JSON export/import, data migration
    validation.js       # Booking form validation
    vehicleUtils.js     # Vehicle/driver occupation checks, relationship sync
```

## Data Flow

```
App.jsx (holds `data` state)
  │
  ├─ updateData({ ...partial }) ──→ setData(prev => ({...prev, ...partial}))
  │                                        │
  │                                        ▼
  │                                  useEffect: saveData(data) → localStorage
  │
  ├─ Booking        (data, updateData)
  ├─ Schema         (data, updateData, setCurrentSection, setEditingBookingId)
  ├─ Planning       (data, updateData, setCurrentSection)
  ├─ Settings       (data, updateData)
  ├─ Customers      (data, updateData)
  ├─ Equipage       (data, updateData)
  └─ Statistics     (data)           ← read-only
```

## Data Model

| Entity           | Key Fields                                                     |
|------------------|----------------------------------------------------------------|
| **Customer**     | id, name, shortName, customerNumber, pricesByVehicleType, active |
| **Vehicle**      | id, regNo, type, driverIds[], active                           |
| **Driver**       | id, name, code, phone, vehicleIds[], active                    |
| **Booking**      | id, bookingNo, customerId, vehicleId, driverId, status, ...   |
| **PickupLocation** | id, name, address, customerIds[]                             |
| **BookingBlock** | id, bookingIds[] (overlapping bookings on same vehicle)        |

**Vehicle ↔ Driver** is many-to-many: `vehicle.driverIds[]` and `driver.vehicleIds[]` are kept in sync via `syncVehicleDriverRelation()`.

## Rules

1. **State lives in App.jsx only.** Components receive `data` and `updateData` as props.
2. **No direct localStorage calls from components** — use `storage.js`.
3. **Styles**: use CSS classes from `index.css`; avoid inline styles for anything that appears more than twice.
4. **Shared logic goes in `utils/`** — don't duplicate functions across components.
5. **Formatting** always through `formatters.js` — never inline `toLocaleString` etc.
6. **Vehicle-driver sync**: always use `syncVehicleDriverRelation` or `syncVehicleDriverIdsFromDrivers` when changing assignments.

## Status Flow

```
Bokad → Planerad → Genomförd → Prissatt → Fakturerad
         (auto when vehicle assigned)   (auto when delivery time passes)
```
