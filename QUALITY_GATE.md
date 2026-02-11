# Quality Gate

This project uses ESLint and Prettier to maintain code quality and consistent formatting.

## Tools

- **ESLint**: JavaScript linter for catching common errors and enforcing code standards
- **Prettier**: Opinionated code formatter for consistent style
- **GitHub Actions**: Automated CI checks on every pull request and push to main

## Local Development

### Run Linter

Check for code quality issues:

```bash
npm run lint
```

Auto-fix issues where possible:

```bash
npm run lint:fix
```

### Check Formatting

Check if code is formatted correctly:

```bash
npm run format:check
```

Auto-format all code:

```bash
npm run format
```

### Build

Build the project for production:

```bash
npm run build
```

## Configuration

### ESLint

Configuration: `eslint.config.js`

- Base: `eslint:recommended`
- React plugin with hooks support
- React Refresh for fast development
- Relaxed rules to minimize warnings on existing code

### Prettier

Configuration: `.prettierrc`

- Semi-colons: Yes
- Single quotes: Yes
- Tab width: 2 spaces
- Trailing commas: ES5
- Print width: 100 characters
- Arrow parens: Avoid

### EditorConfig

Configuration: `.editorconfig`

- Ensures consistent coding styles across different editors
- UTF-8 charset
- LF line endings
- 2 space indentation for JS/JSX files

## CI/CD

### GitHub Actions

Workflow: `.github/workflows/ci.yml`

The CI pipeline runs automatically on:
- Pull requests to `main`
- Pushes to `main`

**Checks performed:**
1. **Install dependencies** - `npm ci`
2. **Lint** - `npm run lint`
3. **Format check** - `npm run format:check`
4. **Build** - `npm run build`

All checks must pass before code can be merged.

## Best Practices

### Before Committing

Run all checks locally:

```bash
npm run lint
npm run format:check
npm run build
```

Or auto-fix formatting issues:

```bash
npm run format
npm run lint:fix
npm run build
```

### Unused Variables

Unused variables are warnings, not errors. Prefix with `_` to silence:

```javascript
// Warning
const [value, setValue] = useState();

// No warning
const [value, _setValue] = useState();
```

### React Imports

With React 17+ JSX transform, you don't need to import React in every file:

```javascript
// Old way (not needed)
import React from 'react';

// New way (works automatically)
// No React import needed for JSX
```

## Troubleshooting

### ESLint Errors

If you encounter ESLint errors:

1. Try auto-fixing: `npm run lint:fix`
2. If errors persist, check the ESLint output for specific issues
3. Consider adjusting rules in `eslint.config.js` if necessary

### Prettier Conflicts

Prettier and ESLint are configured to work together via `eslint-config-prettier`, which disables conflicting ESLint formatting rules.

If you see conflicts:
1. Run `npm run format` to fix formatting
2. Then run `npm run lint:fix` for remaining issues

### Build Failures

If the build fails:

1. Check for TypeScript/JavaScript errors
2. Ensure all dependencies are installed: `npm install`
3. Clear build cache: `rm -rf dist`
4. Try building again: `npm run build`

## Editor Integration

### VS Code

Install these extensions for the best experience:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **EditorConfig** (`editorconfig.editorconfig`)

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Current Status

✅ **Lint**: Passing (48 warnings, 0 errors)  
✅ **Format**: Passing (all files formatted)  
✅ **Build**: Passing  
✅ **CI**: Configured and ready

## Future Improvements

Potential enhancements for the quality gate:

- [ ] Add unit tests with Jest/Vitest
- [ ] Add integration tests with Testing Library
- [ ] Add commit hooks with Husky
- [ ] Add conventional commits with commitlint
- [ ] Add code coverage reporting
- [ ] Add bundle size tracking
- [ ] Stricter TypeScript if migrating from JS
