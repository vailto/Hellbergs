# Architecture Appendix

This document contains detailed explanations, extended examples, and deep-dive content. For daily work, see **ARCHITECTURE.md**.

---

## Detailed Data Models

### Booking (Complete Schema)
```js
{
  // Identity
  id: string,              // e.g., "book_1234_abc"
  bookingNo: string,       // e.g., "2024-0123"
  
  // Core relationships
  customerId: string,      // FK to customers
  vehicleId: string,       // FK to vehicles (optional)
  driverId: string,        // FK to drivers (optional)
  blockId: string,         // Schema block assignment (optional)
  
  // Status flow
  status: 'Bokad' | 'Planerad' | 'Genomförd' | 'Prissatt' | 'Fakturerad',
  
  // Pickup details
  pickupAddress: string,
  pickupDate: string,      // yyyy-mm-dd
  pickupTime: string,      // HH:mm
  pickupContactName: string,
  pickupContactPhone: string,
  
  // Delivery details
  deliveryAddress: string,
  deliveryDate: string,
  deliveryTime: string,
  deliveryContactName: string,
  deliveryContactPhone: string,
  
  // Business data
  notes: string,
  distance: number,        // kilometers
  estimatedCost: number,   // SEK
  actualCost: number,      // SEK (after completion)
  
  // Timestamps (if needed in future)
  createdAt: string,
  updatedAt: string
}
```

### Vehicle (Complete Schema)
```js
{
  id: string,              // e.g., "veh_5678_xyz"
  regNo: string,           // e.g., "ABC123"
  type: string,            // e.g., "Skåpbil", "Släp"
  driverIds: string[],     // Array of driver IDs authorized for this vehicle
  active: boolean,         // true = active, false = inactive/archived
  
  // Future fields (not implemented)
  capacity: number,        // kg or m³
  fuelType: string,        // "Diesel", "Electric"
  insuranceExpiry: string  // yyyy-mm-dd
}
```

### Driver (Complete Schema)
```js
{
  id: string,              // e.g., "drv_9101_qwe"
  name: string,            // e.g., "Kalle Karlsson"
  phone: string,           // e.g., "070-111 11 11"
  code: string,            // e.g., "KAKA" (2+2 letters from first+last name)
  vehicleIds: string[],    // Array of vehicle IDs this driver can use
  active: boolean,
  
  // Future fields (not implemented)
  licenseExpiry: string,   // yyyy-mm-dd
  certifications: string[] // e.g., ["ADR", "Forklift"]
}
```

### Customer (Complete Schema)
```js
{
  id: string,
  customerNumber: string,  // e.g., "ANK-001"
  name: string,            // Full business name
  shortName: string,       // Short display name (optional)
  contactPerson: string,
  email: string,
  mobile: string,
  phone: string,
  address: string,
  postalCode: string,
  city: string,
  priority: number,        // 1 (low) to 5 (high)
  notes: string,
  active: boolean
}
```

### Location (Complete Schema)
```js
{
  id: string,
  name: string,            // e.g., "Hamnen Göteborg"
  address: string,
  postalCode: string,
  city: string,
  customerIds: string[],   // Customers associated with this location
  
  // Future fields (not implemented)
  coordinates: {
    lat: number,
    lng: number
  },
  openingHours: string,
  accessNotes: string
}
```

---

## Status Flow (Detailed)

### Booking Status Transitions

```
┌─────────┐
│  Bokad  │  (red) - Initial state, no vehicle/driver assigned
└────┬────┘
     │ assign vehicle + driver
     ↓
┌─────────┐
│Planerad │  (yellow) - Vehicle and driver assigned, ready to execute
└────┬────┘
     │ mark completed
     ↓
┌──────────┐
│Genomförd │  (green) - Job completed, awaiting cost entry
└────┬─────┘
     │ enter costs
     ↓
┌─────────┐
│Prissatt │  (purple) - Costs entered, ready to invoice
└────┬────┘
     │ create invoice
     ↓
┌───────────┐
│Fakturerad │  (blue) - Invoiced, final state
└───────────┘
```

### Status Transition Rules

**Bokad → Planerad:**
- Requires: `vehicleId !== null` AND `driverId !== null`
- Both must be set to transition
- Driver must be authorized for the vehicle

**Planerad → Bokad (reverse):**
- Triggers: removing `vehicleId` OR removing `driverId`
- Status automatically reverts

**Planerad → Genomförd:**
- Manual action: user marks as completed
- No automatic trigger

**Genomförd → Prissatt:**
- Triggers: entering `actualCost`
- Can also be manual

**Prissatt → Fakturerad:**
- Manual action: user creates invoice
- External invoicing system integration (future)

---

## Vehicle-Driver Authorization (Deep Dive)

### Many-to-Many Relationship

The system enforces a many-to-many relationship between vehicles and drivers:

**Design decisions:**
- **Flexibility:** One driver can operate multiple vehicles
- **Safety:** Not all drivers can use all vehicles (licenses, training)
- **Scalability:** Adding new vehicles/drivers doesn't require schema changes

### Data Synchronization

**Critical:** `vehicle.driverIds` and `driver.vehicleIds` must ALWAYS be synchronized.

**Why?**
- Prevents orphaned relationships
- Ensures consistent authorization checks
- Supports bidirectional queries

**How?**
Use sync helpers from `vehicleUtils.js`:

```js
// After modifying vehicle.driverIds
import { syncVehicleDriverRelation } from '../utils/vehicleUtils';

const { vehicles: updated, drivers: updatedDrivers } = 
  syncVehicleDriverRelation(vehiclesWithChanges, existingDrivers);

updateData({ 
  vehicles: updated, 
  drivers: updatedDrivers 
});
```

```js
// After modifying driver.vehicleIds
import { syncVehicleDriverIdsFromDrivers } from '../utils/vehicleUtils';

const updatedVehicles = 
  syncVehicleDriverIdsFromDrivers(existingVehicles, driversWithChanges);

updateData({ vehicles: updatedVehicles });
```

### Authorization in Booking Flow

**Rule:** When a vehicle is assigned to a booking, only authorized drivers should appear in the driver dropdown.

**Implementation:**
```js
// Get authorized drivers for selected vehicle
const authorizedDrivers = vehicleId 
  ? getAuthorizedDrivers(vehicleId, data.drivers)
  : data.drivers.filter(d => d.active);

// Filter dropdown
<select value={booking.driverId}>
  <option value="">Välj förare</option>
  {authorizedDrivers.map(driver => (
    <option key={driver.id} value={driver.id}>
      {driver.code} - {driver.name}
    </option>
  ))}
</select>
```

**Edge case:** If a driver is already assigned but becomes unauthorized (e.g., removed from vehicle's driverIds), they should still appear in the dropdown with a warning indicator (not implemented yet).

---

## Component Boundaries (Extended)

### What Goes Where

**UI Components (src/components/):**
- JSX rendering
- Event handlers (onClick, onChange, onSubmit)
- Local UI state (modal open/closed, expanded rows, sort field/direction)
- Form state (input values during editing)
- Call utility functions for business logic

**Utils (src/utils/):**
- Pure functions (no React hooks, no JSX)
- Business logic (status transitions, authorization, calculations)
- Formatting (dates, numbers, currency, codes)
- Data transformations (filtering, sorting, mapping)
- Validation (form validation, data validation)

**Example - Good separation:**
```jsx
// Component - handles UI
function Booking({ data, updateData }) {
  const [formData, setFormData] = useState({...}); // ✅ Local form state

  const handleSubmit = () => {
    const errors = validateBooking(formData); // ✅ Call util
    if (errors.length > 0) return;
    
    const newBooking = {
      ...formData,
      id: generateId('book'), // ✅ Call util
      bookingNo: generateBookingNumber(...), // ✅ Call util
    };
    
    updateData({ bookings: [...data.bookings, newBooking] });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Example - Bad separation:**
```jsx
// Component - business logic mixed in (DON'T DO THIS)
function Booking({ data, updateData }) {
  const handleSubmit = () => {
    // ❌ Business logic in component
    const authorizedDrivers = formData.vehicleId 
      ? data.drivers.filter(d => d.vehicleIds.includes(formData.vehicleId))
      : [];
    
    // ❌ Validation in component
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      alert('Addresses required');
      return;
    }
    
    // ❌ ID generation in component
    const id = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // This logic should be in utils!
  };
}
```

---

## Data Persistence (localStorage)

### Storage Architecture

**Files:**
- `src/utils/storage.js` - all localStorage operations
- `src/App.jsx` - calls `loadData()` on mount, `saveData()` on state change

**Key:** `truckRouteData` (single localStorage key for entire app state)

**Format:**
```js
{
  vehicles: [...],
  drivers: [...],
  bookings: [...],
  customers: [...],
  locations: [...],
  vehicleTypes: [...],
  lastBookingNumber: { year: 2024, number: 123 }
}
```

### Data Migration

**Why?** Schema changes over time (e.g., `vehicle.driverId` → `vehicle.driverIds[]`)

**How?** `migrateVehicleDriverData()` in `storage.js` runs on every load:

```js
export function migrateVehicleDriverData(data) {
  // Convert old driverId to new driverIds array
  if (data.vehicles) {
    data.vehicles = data.vehicles.map(v => ({
      ...v,
      driverIds: Array.isArray(v.driverIds) 
        ? v.driverIds 
        : (v.driverId ? [v.driverId] : [])
    }));
  }
  
  // Sync driver.vehicleIds from vehicle.driverIds
  const { vehicles, drivers } = syncVehicleDriverRelation(
    data.vehicles || [], 
    data.drivers || []
  );
  
  data.vehicles = vehicles;
  data.drivers = drivers;
  
  return data;
}
```

**Adding new migrations:**
1. Add migration logic to `migrateVehicleDriverData()` or create new function
2. Call in `loadData()` before returning data
3. Preserve backward compatibility (check if field exists)
4. Test with old data formats

---

## Advanced Patterns

### Optimistic Updates

Currently not implemented, but recommended for future:

```js
// Optimistic update pattern
const handleUpdate = async () => {
  const optimisticData = {...data, bookings: updatedBookings};
  updateData(optimisticData); // Update UI immediately
  
  try {
    await api.updateBooking(...); // API call
  } catch (error) {
    updateData(data); // Rollback on error
    alert('Update failed');
  }
};
```

### Undo/Redo

Not implemented, but could use:
- History stack in App.jsx state
- `undoStack: []`, `redoStack: []`
- Store previous state before each `updateData()`

### Real-time Sync

Future consideration if multiple users:
- WebSocket connection
- Merge strategy for conflicts
- Optimistic updates with rollback

---

## Testing Guidelines (Future)

### Unit Tests (Utils)

Test all pure functions in `utils/`:

```js
// Example: formatters.test.js
import { generateDriverCode } from './formatters';

test('generates code from first and last name', () => {
  expect(generateDriverCode('Martin Vailto')).toBe('MAVA');
  expect(generateDriverCode('Kalle Karlsson')).toBe('KAKA');
});

test('handles single name', () => {
  expect(generateDriverCode('Martin')).toBe('MART');
});
```

### Integration Tests (Components)

Test component behavior with mock data:

```js
// Example: Booking.test.jsx
import { render, fireEvent } from '@testing-library/react';
import Booking from './Booking';

test('filters drivers by selected vehicle', () => {
  const mockData = {
    vehicles: [{ id: 'v1', regNo: 'ABC', driverIds: ['d1'] }],
    drivers: [
      { id: 'd1', name: 'Driver 1', vehicleIds: ['v1'] },
      { id: 'd2', name: 'Driver 2', vehicleIds: [] }
    ]
  };
  
  const { getByLabelText, queryByText } = render(
    <Booking data={mockData} updateData={jest.fn()} />
  );
  
  // Select vehicle
  fireEvent.change(getByLabelText('Fordon'), { target: { value: 'v1' } });
  
  // Only authorized driver should appear
  expect(queryByText('Driver 1')).toBeInTheDocument();
  expect(queryByText('Driver 2')).not.toBeInTheDocument();
});
```

### E2E Tests (Future)

Playwright/Cypress for full user flows:
- Create booking → assign vehicle → assign driver → verify status change
- Edit vehicle → assign drivers → verify sync
- Create customer → use in booking

---

## Performance Considerations

### Current Scale
- **Target:** <100 bookings/day, <20 vehicles, <20 drivers
- **Performance:** Adequate with in-memory arrays and linear search
- **localStorage limit:** 5-10MB typical, sufficient for years of data

### Future Optimizations (if needed)

**If data grows large (1000+ bookings):**
1. **Pagination:** Show only current week/month
2. **Virtual scrolling:** Large lists (react-window)
3. **Memoization:** Expensive computations (useMemo)
4. **Web Workers:** Heavy sorting/filtering

**If switching to API:**
1. **React Query / SWR:** Caching and state management
2. **Pagination:** Server-side filtering
3. **Optimistic updates:** Better UX
4. **Real-time:** WebSocket for live updates

---

## Migration Guide (localStorage → API)

If moving from localStorage to backend API:

### Phase 1: Abstraction Layer
Create `src/api/client.js`:
```js
// Abstraction layer - works with localStorage or API
export const bookingClient = {
  getAll: () => storage.getBookings(),
  getOne: (id) => storage.getBooking(id),
  create: (data) => storage.createBooking(data),
  update: (id, data) => storage.updateBooking(id, data),
  delete: (id) => storage.deleteBooking(id)
};
```

### Phase 2: Swap Implementation
Replace localStorage calls with API calls:
```js
export const bookingClient = {
  getAll: () => fetch('/api/bookings').then(r => r.json()),
  getOne: (id) => fetch(`/api/bookings/${id}`).then(r => r.json()),
  create: (data) => fetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  // ...
};
```

### Phase 3: State Management
Consider Redux/Zustand/React Query for complex state needs.

---

## Security Considerations (Future)

Currently a client-only app, but if adding backend:

**Authentication:**
- User login/logout
- Role-based access (admin, dispatcher, driver)

**Authorization:**
- Drivers see only their assigned bookings
- Admins see all data

**Data Validation:**
- Server-side validation (don't trust client)
- Sanitize inputs (XSS prevention)

**Audit Trail:**
- Log all data changes (who, when, what)
- Immutable history

---

## Deployment

### Build for Production
```bash
npm run build
```

Output: `dist/` folder (static files)

### Hosting Options
- **Static hosting:** Netlify, Vercel, GitHub Pages
- **Self-hosted:** Nginx, Apache
- **Cloud:** AWS S3 + CloudFront, Azure Static Web Apps

### Environment Variables
None required currently (no API keys).

If adding API:
```bash
VITE_API_URL=https://api.example.com
```

---

## Troubleshooting

### Common Issues

**Issue:** "Data not persisting between sessions"
- **Cause:** localStorage not saving
- **Fix:** Check browser settings, ensure localStorage enabled
- **Debug:** Console → Application → Local Storage

**Issue:** "Old data format after migration"
- **Cause:** Migration function not running
- **Fix:** Clear localStorage, reload (data will reset to mockData)
- **Debug:** Add console.log in `migrateVehicleDriverData()`

**Issue:** "Vehicle-driver sync broken"
- **Cause:** Manual array manipulation without sync
- **Fix:** Always use `syncVehicleDriverRelation()` or `syncVehicleDriverIdsFromDrivers()`
- **Debug:** Check `vehicle.driverIds` and `driver.vehicleIds` match

**Issue:** "Status not changing to Planerad"
- **Cause:** Missing vehicleId or driverId, or driver not authorized
- **Fix:** Ensure both are set and driver is in vehicle.driverIds
- **Debug:** Check `assignVehicleToBooking()` logic

---

## Future Improvements Roadmap

### Short Term (1-3 months)
- [ ] Add ESLint configuration
- [ ] Add unit tests (Jest/Vitest)
- [ ] Split Settings.jsx into tabs (500+ lines → 5 files)
- [ ] Complete Phase 3 CSS consolidation

### Medium Term (3-6 months)
- [ ] Extract booking logic to `utils/bookingUtils.js`
- [ ] Create reusable table components
- [ ] Add TypeScript (gradual migration)
- [ ] Driver mobile view (read-only assigned bookings)

### Long Term (6-12 months)
- [ ] Backend API (Node.js + PostgreSQL)
- [ ] User authentication
- [ ] Real-time updates (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Route optimization (Google Maps API)
- [ ] Automated invoicing integration

---

## Resources

- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **localStorage Guide:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- **CSS Utilities Pattern:** Similar to Tailwind CSS (utility-first approach)
