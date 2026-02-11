# Architecture

This document provides an overview of the project architecture and development practices.

## Project Overview

Truck Route Planning Tool - A React-based application for managing bookings, schedules, vehicles, drivers, and customers.

## Technology Stack

- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Package Manager**: npm
- **Node Version**: 20 (see `.nvmrc`)

## Project Structure

```
src/
  components/        # React components
    booking/        # Booking-specific components
  hooks/            # Custom React hooks
  utils/            # Utility functions and helpers
  data/             # Mock data and constants
```

## Key Components

- **Booking**: Booking management with form, list, and modals
- **Schema**: Weekly/daily schedule view with drag-and-drop
- **Planning**: Route planning and optimization
- **Settings**: Configuration for vehicles, drivers, customers, locations
- **Statistics**: Reporting and analytics

## State Management

- **Local State**: React hooks (`useState`, `useMemo`, `useCallback`)
- **Custom Hooks**: Domain-specific hooks (e.g., `useBookingState`)
- **Props Drilling**: Data flows from App.jsx to child components
- **LocalStorage**: Persistent data storage via `storage.js` utilities

## Code Quality

### Quality Gate

The project uses ESLint and Prettier for code quality:
- ESLint: JavaScript linting with React plugins
- Prettier: Code formatting
- GitHub Actions: Automated CI checks

See [`QUALITY_GATE.md`](QUALITY_GATE.md) for details.

## Development Workflow

### Before Starting

1. Ensure you're using Node 20:
   ```bash
   node --version  # Should be v20.x.x
   # Or use nvm
   nvm use
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Before Creating a PR

Run all quality checks locally:

```bash
npm run lint
npm run format:check
npm run build
```

All three must pass before pushing.

**Quick fix commands:**
```bash
npm run format        # Auto-fix formatting
npm run lint:fix      # Auto-fix linting where possible
```

### Commit Guidelines

- Use descriptive commit messages
- Follow conventional commits format when possible:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `refactor:` - Code refactoring
  - `chore:` - Maintenance tasks
  - `docs:` - Documentation updates

## Recent Refactoring

### Phase 3: Component Splitting
- Extracted utility functions (sorters, filters, grouping)
- Created `BookingTabs` component
- Reduced component complexity

### Phase 4: State Refactoring
- Created `useBookingState` custom hook
- Reduced `useState` hooks from 22 to 1 in Booking component
- Improved state organization and maintainability

See `PHASE3_REPORT.md` and `PHASE4_REPORT.md` for details.

## Best Practices

### Component Organization

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Over Context**: Use explicit props for clarity
3. **Custom Hooks**: Extract complex state logic into hooks
4. **Utility Functions**: Pure functions go in `utils/`

### State Management

1. **Local First**: Keep state as local as possible
2. **Lift When Needed**: Share state only when necessary
3. **Memoization**: Use `useMemo` for expensive calculations
4. **Callbacks**: Use `useCallback` for stable function references

### Code Style

1. **Formatting**: Let Prettier handle it
2. **Naming**: Use descriptive names
3. **Comments**: Explain "why", not "what"
4. **Complexity**: Keep functions small and focused

## Testing

Currently, the project relies on manual testing. Future improvements:
- Unit tests with Vitest
- Integration tests with Testing Library
- E2E tests with Playwright

## Performance Considerations

- Memoization for expensive calculations
- Lazy loading for large components (future)
- Optimized re-renders with proper dependencies

## Future Improvements

- [ ] Add unit and integration tests
- [ ] Migrate to TypeScript
- [ ] Add state management library if needed
- [ ] Implement code splitting
- [ ] Add error boundaries
- [ ] Improve accessibility (a11y)

## Getting Help

- Check `QUALITY_GATE.md` for linting/formatting issues
- Check phase reports (`PHASE3_REPORT.md`, `PHASE4_REPORT.md`) for refactoring details
- Check `README.md` for general project information
