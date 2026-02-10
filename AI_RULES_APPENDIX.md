# AI Rules Appendix

Extended examples, rationale, and anti-patterns. For quick reference, see **AI_RULES.md**.

---

## Why These Rules Matter

### Rule 1: NO Inline Styles

**Problem without this rule:**
```jsx
// Badge appears in 6 files with identical inline styles
<span style={{ 
  background: '#667eea', 
  color: 'white', 
  padding: '0.2rem 0.4rem',
  borderRadius: '3px',
  fontWeight: 'bold',
  fontSize: '0.7rem',
  minWidth: '45px',
  textAlign: 'center'
}}>
  {code}
</span>
```

**Issues:**
- Duplication: 75 lines of identical styles across codebase
- Inconsistency: Easy to copy-paste and forget one property
- Hard to change: Update badge color = edit 6 files
- No design system: Styles scattered, not reusable

**Solution with CSS class:**
```jsx
<span className="badge-driver">{code}</span>
```

**Benefits:**
- Single source of truth (index.css)
- Change color once, applies everywhere
- Clear design system
- Reusable across all components

---

### Rule 2: NO Duplicate Logic

**Problem without this rule:**
```jsx
// Component A (Booking.jsx)
const authorizedDrivers = vehicleId 
  ? drivers.filter(d => (d.vehicleIds || []).includes(vehicleId))
  : [];

// Component B (Planning.jsx)
const authorizedDrivers = vehicleId 
  ? data.drivers.filter(d => (d.vehicleIds || []).includes(vehicleId))
  : [];

// Component C (Schema.jsx)
const authorizedDrivers = vehicleId 
  ? (data.drivers || []).filter(d => (d.vehicleIds || []).includes(vehicleId))
  : [];
```

**Issues:**
- Same logic copy-pasted 3 times
- Slight variations (defensive checks) indicate incomplete understanding
- Bug fix requires updating 3 files
- No single test covers all cases

**Solution with utility:**
```jsx
// utils/vehicleUtils.js
export function getAuthorizedDrivers(vehicleId, drivers = []) {
  if (!vehicleId) return [];
  return drivers.filter(d => (d.vehicleIds || []).includes(vehicleId));
}

// All components
import { getAuthorizedDrivers } from '../utils/vehicleUtils';
const authorizedDrivers = getAuthorizedDrivers(vehicleId, data.drivers);
```

**Benefits:**
- Single implementation
- Consistent behavior
- One place to fix bugs
- Testable in isolation

---

### Rule 3: SYNC Vehicle-Driver

**Problem without this rule:**
```jsx
// Manually updating vehicle.driverIds
vehicle.driverIds.push(driverId); // ❌ WRONG!
updateData({ vehicles: [...data.vehicles, vehicle] });

// Now driver.vehicleIds is out of sync!
// Driver doesn't know they're authorized for this vehicle
```

**Issues:**
- Orphaned relationships
- Authorization checks fail
- Inconsistent data
- Hard-to-debug errors

**Solution with sync helper:**
```jsx
// After modifying vehicle.driverIds
vehicle.driverIds.push(driverId);

const { vehicles, drivers } = syncVehicleDriverRelation(
  data.vehicles, 
  data.drivers
);

updateData({ vehicles, drivers }); // ✅ Both synced
```

**Benefits:**
- Guaranteed consistency
- Bidirectional relationships work
- No orphaned data
- Authorization checks always correct

---

## Extended Examples

### Good Component Structure

```jsx
// ✅ GOOD: Clear separation of concerns
import React, { useState } from 'react';
import { generateId } from '../utils/formatters';
import { assignVehicleToBooking } from '../utils/vehicleUtils';
import { validateBooking } from '../utils/validation';

function BookingForm({ data, updateData }) {
  // Local UI state (form inputs)
  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    driverId: '',
    pickupAddress: '',
    deliveryAddress: ''
  });
  
  const [errors, setErrors] = useState([]);

  // Event handler - calls utils for logic
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation (from util)
    const validationErrors = validateBooking(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Business logic (from util)
    const newBooking = {
      ...formData,
      id: generateId('book'),
      status: 'Bokad'
    };
    
    // If vehicle assigned, use helper for status logic
    const finalBooking = formData.vehicleId
      ? assignVehicleToBooking(newBooking, formData.vehicleId, data.drivers)
      : newBooking;
    
    // Update centralized state
    updateData({ 
      bookings: [...data.bookings, finalBooking] 
    });
    
    // Reset form
    setFormData({ customerId: '', vehicleId: '', ... });
  };

  // Render (just JSX and CSS classes)
  return (
    <form onSubmit={handleSubmit} className="form">
      {errors.length > 0 && (
        <div className="alert alert-error">
          {errors.map(e => <p key={e}>{e}</p>)}
        </div>
      )}
      
      <div className="form-group">
        <label>Kund</label>
        <select 
          value={formData.customerId}
          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
        >
          {data.customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      
      {/* More fields... */}
      
      <button type="submit" className="btn btn-primary">
        Spara
      </button>
    </form>
  );
}

export default BookingForm;
```

### Bad Component Structure

```jsx
// ❌ BAD: Everything mixed together
function BookingForm({ data, updateData }) {
  const [formData, setFormData] = useState({...});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ❌ Validation logic in component
    if (!formData.customerId) {
      alert('Kund är obligatorisk');
      return;
    }
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      alert('Adresser är obligatoriska');
      return;
    }
    
    // ❌ ID generation in component
    const id = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // ❌ Authorization logic in component
    const authorizedDrivers = formData.vehicleId
      ? data.drivers.filter(d => d.vehicleIds.includes(formData.vehicleId))
      : [];
    
    // ❌ Status logic in component
    let status = 'Bokad';
    if (formData.vehicleId && formData.driverId) {
      const driver = data.drivers.find(d => d.id === formData.driverId);
      if (driver && driver.vehicleIds.includes(formData.vehicleId)) {
        status = 'Planerad';
      }
    }
    
    // ❌ All this logic should be in utils!
    
    const newBooking = { ...formData, id, status };
    updateData({ bookings: [...data.bookings, newBooking] });
  };

  return <form>...</form>;
}
```

**Problems:**
- 50+ lines of business logic in component
- Can't test validation without rendering component
- Can't reuse authorization logic in other components
- Hard to maintain

---

## CSS Anti-Patterns

### ❌ DON'T: Inline Styles for Common Patterns

```jsx
// Bad - repeated everywhere
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <span style={{ whiteSpace: 'nowrap' }}>Text</span>
  <button style={{ cursor: 'pointer' }}>Click</button>
</div>
```

### ✅ DO: Use Utility Classes

```jsx
// Good - reusable, consistent
<div className="flex-center">
  <span className="nowrap">Text</span>
  <button className="u-cursor-pointer">Click</button>
</div>
```

### When Inline Styles Are OK

```jsx
// ✅ OK: Dynamic computed value
<div style={{ width: `${percentage}%` }}>

// ✅ OK: Truly unique one-off (rare)
<div style={{ transform: 'rotate(45deg) translateX(10px)' }}>

// ✅ OK: Conditional style that can't be a class
<div style={{ opacity: isLoading ? 0.5 : 1 }}>
```

---

## Business Logic Anti-Patterns

### ❌ DON'T: Duplicate Authorization Checks

```jsx
// Component A
const canAssign = vehicleId && driverId && 
  drivers.find(d => d.id === driverId)?.vehicleIds.includes(vehicleId);

// Component B
const canAssign = vehicle && driver && 
  driver.vehicleIds.includes(vehicle.id);

// Component C
const isAuthorized = booking.vehicleId && booking.driverId &&
  data.drivers.find(d => d.id === booking.driverId)?.vehicleIds.includes(booking.vehicleId);
```

### ✅ DO: Extract to Utility

```jsx
// utils/vehicleUtils.js
export function isDriverAuthorizedForVehicle(driverId, vehicleId, drivers) {
  if (!driverId || !vehicleId) return false;
  const driver = drivers.find(d => d.id === driverId);
  return driver && (driver.vehicleIds || []).includes(vehicleId);
}

// All components
import { isDriverAuthorizedForVehicle } from '../utils/vehicleUtils';
const canAssign = isDriverAuthorizedForVehicle(driverId, vehicleId, data.drivers);
```

---

## Data Flow Anti-Patterns

### ❌ DON'T: Local Persistent State

```jsx
// Bad - bypasses centralized state
function Booking() {
  const [bookings, setBookings] = useState([]); // ❌ Local persistent state
  
  useEffect(() => {
    const saved = localStorage.getItem('bookings'); // ❌ Direct localStorage
    setBookings(JSON.parse(saved));
  }, []);
  
  const addBooking = (booking) => {
    const updated = [...bookings, booking];
    setBookings(updated);
    localStorage.setItem('bookings', JSON.stringify(updated)); // ❌ Bypasses App.jsx
  };
}
```

**Problems:**
- State not shared with other components
- Bypasses central persistence logic
- Can't access bookings in other views
- Migrations don't run

### ✅ DO: Use Props from App.jsx

```jsx
// Good - centralized state
function Booking({ data, updateData }) {
  const addBooking = (booking) => {
    updateData({ 
      bookings: [...data.bookings, booking] 
    }); // ✅ Goes through App.jsx → storage.js
  };
}
```

---

## Commit Message Examples

### Good Commits

```
✅ refactor(css): replace inline badge styles in Settings
✅ feat(booking): add vehicle-driver authorization check
✅ fix(schema): correct date sorting logic
✅ docs(architecture): add styling guide section
✅ test(formatters): add tests for generateDriverCode
```

### Bad Commits

```
❌ "updated stuff"
❌ "fix"
❌ "WIP"
❌ "asdfasdf"
❌ "Fixed bug"  (which bug? where?)
```

### Commit Message Format

```
type(scope): description

type: feat, fix, refactor, style, docs, test, chore
scope: component/module name (booking, schema, css, etc.)
description: imperative mood, lowercase, no period
```

---

## Testing Patterns (Future)

### Unit Test Example

```js
// utils/__tests__/vehicleUtils.test.js
import { getAuthorizedDrivers, isDriverAuthorizedForVehicle } from '../vehicleUtils';

describe('vehicleUtils', () => {
  const mockDrivers = [
    { id: 'd1', name: 'Driver 1', vehicleIds: ['v1', 'v2'] },
    { id: 'd2', name: 'Driver 2', vehicleIds: ['v2'] },
    { id: 'd3', name: 'Driver 3', vehicleIds: [] }
  ];

  describe('getAuthorizedDrivers', () => {
    it('returns drivers authorized for vehicle', () => {
      const result = getAuthorizedDrivers('v1', mockDrivers);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d1');
    });

    it('returns empty array for non-existent vehicle', () => {
      const result = getAuthorizedDrivers('v99', mockDrivers);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for null vehicleId', () => {
      const result = getAuthorizedDrivers(null, mockDrivers);
      expect(result).toHaveLength(0);
    });
  });

  describe('isDriverAuthorizedForVehicle', () => {
    it('returns true when authorized', () => {
      expect(isDriverAuthorizedForVehicle('d1', 'v1', mockDrivers)).toBe(true);
      expect(isDriverAuthorizedForVehicle('d2', 'v2', mockDrivers)).toBe(true);
    });

    it('returns false when not authorized', () => {
      expect(isDriverAuthorizedForVehicle('d2', 'v1', mockDrivers)).toBe(false);
      expect(isDriverAuthorizedForVehicle('d3', 'v1', mockDrivers)).toBe(false);
    });

    it('returns false for invalid inputs', () => {
      expect(isDriverAuthorizedForVehicle(null, 'v1', mockDrivers)).toBe(false);
      expect(isDriverAuthorizedForVehicle('d1', null, mockDrivers)).toBe(false);
    });
  });
});
```

---

## Debugging Tips

### Problem: "Vehicle-driver sync not working"

**Debug steps:**
1. Console log before sync:
   ```js
   console.log('Before sync:', { 
     vehicleDriverIds: vehicle.driverIds, 
     driverVehicleIds: driver.vehicleIds 
   });
   ```

2. Console log after sync:
   ```js
   const { vehicles, drivers } = syncVehicleDriverRelation(...);
   console.log('After sync:', { 
     vehicleDriverIds: vehicles[0].driverIds, 
     driverVehicleIds: drivers[0].vehicleIds 
   });
   ```

3. Check if sync function was called:
   ```js
   // Add at top of syncVehicleDriverRelation()
   console.log('syncVehicleDriverRelation called');
   ```

### Problem: "Status not changing to Planerad"

**Debug steps:**
1. Check prerequisites:
   ```js
   console.log({
     hasVehicle: !!booking.vehicleId,
     hasDriver: !!booking.driverId,
     isAuthorized: isDriverAuthorizedForVehicle(
       booking.driverId, 
       booking.vehicleId, 
       data.drivers
     )
   });
   ```

2. Check `assignVehicleToBooking` logic:
   ```js
   const result = assignVehicleToBooking(booking, vehicleId, drivers);
   console.log('Assignment result:', result);
   ```

### Problem: "CSS class not applying"

**Debug steps:**
1. Check class exists in index.css
2. Check for typos in className
3. Inspect element in DevTools → Computed styles
4. Check if inline style is overriding (inline has higher specificity)

---

## Performance Tips

### Avoid Unnecessary Re-renders

```jsx
// ❌ Bad: Creates new function on every render
<button onClick={() => handleClick(id)}>

// ✅ Better: Use useCallback
const handleClickWithId = useCallback(() => handleClick(id), [id]);
<button onClick={handleClickWithId}>

// ✅ Best: Pass id to handler
<button onClick={(e) => handleClick(id)}>
```

### Memoize Expensive Computations

```jsx
// ❌ Bad: Recalculates on every render
const sortedBookings = data.bookings.sort((a, b) => 
  new Date(a.pickupDate) - new Date(b.pickupDate)
);

// ✅ Good: Memoize
const sortedBookings = useMemo(() => 
  data.bookings.sort((a, b) => 
    new Date(a.pickupDate) - new Date(b.pickupDate)
  ),
  [data.bookings]
);
```

---

## Common Mistakes to Avoid

1. **Forgetting to call sync after driver/vehicle changes**
   - Always call `syncVehicleDriverRelation()` or `syncVehicleDriverIdsFromDrivers()`

2. **Creating inline styles for repeated patterns**
   - Check `index.css` first, add utility if missing

3. **Duplicating business logic**
   - Extract to `utils/` if used more than once

4. **Mutating state directly**
   - Always create new objects/arrays
   - Use spread operator: `{...obj}`, `[...arr]`

5. **Skipping build verification**
   - Run `npm run build` before committing

6. **Not using TypeScript types (future)**
   - When TypeScript is added, always define types for functions

7. **Mixing concerns in components**
   - Keep business logic in utils
   - Keep rendering logic in components

---

## Summary Checklist

Before creating a PR, verify:

- [ ] No new inline styles for repeated patterns
- [ ] No duplicated business logic
- [ ] Vehicle-driver sync called after changes
- [ ] Components receive data as props (no local persistent state)
- [ ] Business logic extracted to utils
- [ ] Build passes (`npm run build`)
- [ ] Imports organized (React → Components → Utils)
- [ ] Commit messages follow format
- [ ] No console.logs left in code (except intentional logging)
- [ ] Code formatted consistently

If all checked, you're good to go! 🚀
