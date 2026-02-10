# Phase 2: CSS Consolidation - Implementation Plan

## Goal
Replace duplicated inline styles with CSS utility classes to improve maintainability and consistency. **No visual changes intended** - all CSS values will be copied exactly from inline styles.

---

## Top 10 Inline Style Hotspots

### 1. Driver Badge Styling (High Priority)
**Pattern:** `background: '#667eea', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.7rem', minWidth: '45px', textAlign: 'center'`

**Locations:**
- `src/components/Settings.jsx` (lines ~857, ~1247, ~1922) - 3 occurrences
- `src/components/Equipage.jsx` (line ~163) - 1 occurrence

**Total:** 4 occurrences

---

### 2. Inactive Driver/Badge Styling (High Priority)
**Pattern:** `background: '#95a5a6', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.7rem', minWidth: '45px', textAlign: 'center'`

**Locations:**
- `src/components/Settings.jsx` (lines ~937, ~1365) - 2 occurrences

**Total:** 2 occurrences

---

### 3. White-Space: Nowrap (Medium Priority)
**Pattern:** `whiteSpace: 'nowrap'`

**Locations:**
- `src/components/Settings.jsx` - 6 occurrences
- `src/components/Booking.jsx` - 19 occurrences
- `src/components/Planning.jsx` - 1 occurrence
- `src/components/Equipage.jsx` - 1 occurrence
- `src/components/Customers.jsx` - 7 occurrences

**Total:** 34+ occurrences

---

### 4. Flex Center Layout (Medium Priority)
**Pattern:** `display: 'flex', alignItems: 'center', gap: '0.5rem'` (and variations with different gap values)

**Locations:**
- `src/components/Settings.jsx` - 12 occurrences
- `src/components/Booking.jsx` - 3 occurrences
- `src/components/Schema.jsx` - 4 occurrences
- `src/components/Planning.jsx` - 2 occurrences
- `src/components/Equipage.jsx` - 2 occurrences
- `src/components/Customers.jsx` - 3 occurrences
- `src/components/Statistics.jsx` - 8 occurrences

**Total:** 35+ occurrences

---

### 5. Cursor Pointer (Medium Priority)
**Pattern:** `cursor: 'pointer'` (often with additional styles)

**Locations:**
- `src/components/Settings.jsx` - 25 occurrences
- `src/components/Schema.jsx` - 6 occurrences
- `src/components/Equipage.jsx` - 4 occurrences
- `src/components/Booking.jsx` - 3 occurrences
- `src/components/Planning.jsx` - 2 occurrences

**Total:** 43+ occurrences

---

### 6. Grid Template Columns (Low Priority)
**Pattern:** `display: 'grid', gridTemplateColumns: '...'` (various column patterns)

**Locations:**
- `src/components/Settings.jsx` - 10 occurrences
- `src/components/Booking.jsx` - 2 occurrences
- `src/components/Schema.jsx` - 2 occurrences
- `src/components/Customers.jsx` - 2 occurrences
- `src/components/Equipage.jsx` - 1 occurrence

**Total:** 17 occurrences

**Note:** Many grid patterns are unique (different column configurations). Will only create utilities for repeated patterns.

---

### 7. Margin Bottom Spacing (Low Priority)
**Pattern:** `marginBottom: '1rem'`, `marginBottom: '0.75rem'`, `marginBottom: '0.5rem'`

**Locations:**
- `src/components/Settings.jsx` - 18 occurrences
- `src/components/Schema.jsx` - 11 occurrences
- `src/components/Statistics.jsx` - 8 occurrences
- `src/components/Customers.jsx` - 6 occurrences
- `src/components/Booking.jsx` - 2 occurrences

**Total:** 47+ occurrences

**Note:** Many can use existing `.mb-1`, `.mb-2` utilities. Will check and add missing values if needed.

---

### 8. Padding Variations (Low Priority)
**Pattern:** `padding: '0.25rem'`, `padding: '0.35rem'`, `padding: '0.5rem'`

**Locations:**
- `src/components/Settings.jsx` - 9 occurrences
- `src/components/Schema.jsx` - 14 occurrences
- `src/components/Booking.jsx` - 6 occurrences
- `src/components/Planning.jsx` - 3 occurrences
- `src/components/Equipage.jsx` - 3 occurrences

**Total:** 39+ occurrences

---

### 9. Display Flex with Gap (Low Priority)
**Pattern:** `display: 'flex', gap: '0.5rem'` (without alignItems)

**Locations:**
- `src/components/Settings.jsx` - 8 occurrences
- `src/components/Booking.jsx` - 3 occurrences
- `src/components/Customers.jsx` - 2 occurrences

**Total:** 13+ occurrences

---

### 10. Opacity Variations (Low Priority)
**Pattern:** `opacity: 0.6`, `opacity: 0.5`

**Locations:**
- `src/components/Settings.jsx` - 2 occurrences
- `src/components/Schema.jsx` - 1 occurrence
- `src/components/Equipage.jsx` - 1 occurrence

**Total:** 4 occurrences

---

## CSS Utilities to Create/Reuse

### Existing Utilities (from Phase 1)
✅ Already in `src/index.css`:
- `.nowrap` - white-space: nowrap
- `.flex-row` - display: flex; gap: 0.5rem
- `.flex-center` - display: flex; align-items: center; gap: 0.5rem
- `.detail-grid` - display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem
- `.badge-driver` - purple driver badge
- `.badge-driver-inactive` - gray inactive badge
- `.badge-vehicle` - green vehicle badge

### New Utilities to Add
Will add to `src/index.css`:

**Layout utilities:**
- `.u-cursor-pointer` - cursor: pointer
- `.u-flex-gap-sm` - display: flex; gap: 0.25rem
- `.u-flex-gap-md` - display: flex; gap: 0.35rem
- `.u-flex-gap-lg` - display: flex; gap: 0.75rem
- `.u-flex-center-sm` - display: flex; align-items: center; gap: 0.25rem
- `.u-flex-center-md` - display: flex; align-items: center; gap: 0.35rem

**Spacing utilities (if missing):**
- `.u-mb-xs` - margin-bottom: 0.25rem
- `.u-mb-sm` - margin-bottom: 0.5rem
- `.u-mb-md` - margin-bottom: 0.75rem
- `.u-mb-lg` - margin-bottom: 1rem
- `.u-p-xs` - padding: 0.25rem
- `.u-p-sm` - padding: 0.35rem
- `.u-p-md` - padding: 0.5rem

**Display utilities:**
- `.u-opacity-50` - opacity: 0.5
- `.u-opacity-60` - opacity: 0.6

**Grid utilities (only for repeated patterns):**
- `.u-grid-2col` - display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem
- `.u-grid-auto` - display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem

---

## Implementation Strategy

### Phase 2.1: Add Utilities (Commit 1)
- Add all new utility classes to `src/index.css`
- Preserve existing utilities from Phase 1
- Follow naming convention: `.u-*` prefix for utilities

### Phase 2.2: Replace Badge Styles (Commit 2)
- Replace driver badge inline styles with `.badge-driver` class
- Replace inactive badge inline styles with `.badge-driver-inactive` class
- **Files:** Settings.jsx, Equipage.jsx

### Phase 2.3: Replace Layout Patterns (Commit 3)
- Replace `whiteSpace: 'nowrap'` with `.nowrap`
- Replace flex patterns with `.flex-center`, `.u-flex-center-sm`, etc.
- Replace cursor pointer with `.u-cursor-pointer`
- **Files:** Settings.jsx, Booking.jsx, Planning.jsx, Equipage.jsx, Customers.jsx

### Phase 2.4: Replace Spacing Patterns (Commit 4)
- Replace marginBottom with utility classes
- Replace padding with utility classes
- Replace opacity with utility classes
- **Files:** Settings.jsx, Schema.jsx, Booking.jsx, Statistics.jsx

### Phase 2.5: Replace Grid Patterns (Commit 5)
- Replace repeated grid patterns with utility classes
- **Files:** Settings.jsx, Booking.jsx, Schema.jsx, Customers.jsx

---

## Risk Assessment

**Low Risk Changes:**
- Badge styles (already defined in Phase 1, just need to apply them)
- `.nowrap` utility (already defined in Phase 1)
- Cursor pointer (purely interactive, no visual impact)

**Medium Risk Changes:**
- Flex layouts with different gap values (need to ensure exact match)
- Grid patterns (unique layouts may need custom inline styles)

**High Risk (Skip if Uncertain):**
- Complex nested inline styles with multiple properties
- Styles that are dynamically computed
- Styles that depend on state/props

---

## Acceptance Criteria

### Visual Checks
✅ No visual changes intended
✅ All badge colors match exactly (#667eea purple, #95a5a6 gray)
✅ All spacing values preserved exactly
✅ All flex/grid layouts render identically

### Technical Checks
✅ `npm run build` passes with 0 errors
✅ No new linter errors (if linter exists)
✅ CSS file size increases reasonably (<2KB for utilities)

### Documentation Updates
✅ Update `ARCHITECTURE.md` with styling guide
✅ Update `AI_RULES.md` with "no inline styles" rule
✅ Create `PHASE2_REPORT.md` documenting changes

---

## Naming Convention

Following established patterns in `src/index.css`:
- **Utilities:** `.u-*` prefix (e.g., `.u-cursor-pointer`, `.u-flex-gap-sm`)
- **Component-specific:** `.c-*` prefix (if needed, e.g., `.c-booking-card`)
- **Existing classes:** Keep as-is (e.g., `.badge-driver`, `.nowrap`)

---

## Notes

- **Conservative approach:** Only replace inline styles that appear 3+ times
- **Preserve behavior:** Copy exact values from inline styles (don't "improve" or "normalize")
- **Stop if uncertain:** If a style replacement looks risky, document it and skip
- **Commit incrementally:** Small, focused commits that can be reverted if needed
- **No redesign:** This is purely a refactoring effort - UI must look identical

---

## Estimated Impact

**Before:**
- ~200+ inline style objects across 9 component files
- Duplication of badge styles (4 driver, 2 inactive)
- Inconsistent spacing and layout patterns

**After:**
- ~15 new utility classes in index.css
- ~150 inline style objects replaced with classes
- Consistent pattern for future development
- Easier to maintain and modify global styles

---

## Next Steps After Plan Approval

1. ✅ Create this plan document
2. ⏳ Add utility classes to `src/index.css`
3. ⏳ Replace inline styles component by component
4. ⏳ Update documentation (ARCHITECTURE.md, AI_RULES.md)
5. ⏳ Create PHASE2_REPORT.md
6. ⏳ Commit and push branch for review
