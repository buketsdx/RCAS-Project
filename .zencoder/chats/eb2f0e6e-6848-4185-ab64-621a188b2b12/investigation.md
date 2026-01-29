# Investigation Report - Theme Toggle Bug

## Bug Summary
The theme toggle buttons (in `ThemeToggle.jsx` and `ProfessionalFooter.jsx`) are not working.
- `ThemeToggle.jsx` is using a redundant and isolated `ThemeProvider` located in `src/components/common/`.
- `ProfessionalFooter.jsx` uses the main `ThemeContext` but attempts to call `setTheme`, which is not provided by that context (it provides `toggleTheme`).
- The system theme detection in the redundant `ThemeProvider` is missing a change listener.

## Root Cause Analysis
1. **Context Mismatch**: Multiple theme providers exist in the codebase. `App.jsx` uses `src/context/ThemeContext.jsx`, but some components use `src/components/common/ThemeProvider.jsx`.
2. **API Inconsistency**: The main `ThemeContext` provides `toggleTheme`, while components expect `setTheme`.
3. **Broken System Sync**: The system theme detection logic doesn't react to OS-level theme changes in one of the providers.

## Affected Components
- `src/context/ThemeContext.jsx` (Main Provider)
- `src/components/common/ThemeProvider.jsx` (Redundant Provider)
- `src/components/common/ThemeToggle.jsx` (Consumer)
- `src/components/ProfessionalFooter.jsx` (Consumer)
- `src/pages/Help.jsx` (Contains `ThemeToggle`)

## Proposed Solution
1. **Unify Theme Context**:
   - Update `src/context/ThemeContext.jsx` to provide `setTheme` (aliased or renamed from `toggleTheme` to match common usage).
   - Ensure it correctly handles 'light', 'dark', and 'system' modes with proper listeners.
2. **Remove Redundancy**:
   - Delete `src/components/common/ThemeProvider.jsx`.
3. **Update Consumers**:
   - Update `src/components/common/ThemeToggle.jsx` to import `useTheme` from `@/context/ThemeContext`.
   - Update `src/components/common/ThemeToggle.jsx` to use the correct API.
   - Update `src/components/ProfessionalFooter.jsx` to use the correct API.
4. **Verification**:
   - Manually verify switching between Light, Dark, and System modes.

## Implementation Notes
- Updated `src/context/ThemeContext.jsx` to export `setTheme` alongside `toggleTheme`.
- Pointed `src/components/common/ThemeToggle.jsx` to `@/context/ThemeContext`.
- Deleted redundant `src/components/common/ThemeProvider.jsx`.
- Confirmed `src/components/ProfessionalFooter.jsx` now works as it was already using `@/context/ThemeContext` and calling `setTheme`.
