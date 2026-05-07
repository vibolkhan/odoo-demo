# Improvement Plan

## Goal
Make the app safer to ship, easier to maintain, and more predictable for employees and managers using the leave and attendance flows.

## Current Observations
- The UI is already moving in a better direction with shared components like `AppAvatar`, `AppSkeleton`, and `AppEmptyState`.
- The main product areas are clear: auth, profile, leave management, leave balance, attendance, and manager actions.
- Several important behaviors are still tightly coupled to page components, which makes the app harder to test and evolve.
- A few values that should not live in the UI code are still hardcoded.

## Priority 1: Security And Environment Setup

### 1. Remove demo credentials from the login screen
- `src/views/LoginPage.vue` currently pre-fills a real-looking email and password.
- Replace them with empty defaults and, if needed, a development-only helper behind an environment flag.
- Why this matters: prevents accidental credential exposure and avoids training users to rely on seeded values.

### 2. Move backend configuration into environment variables
- `src/api/axios.js` and `src/api/auth.api.js` hardcode the Odoo base URL, database name, and company defaults.
- Move these into `.env` files with clear names such as `VITE_ODOO_BASE_URL`, `VITE_ODOO_DATABASE`, and company-related defaults only if they truly must vary.
- Why this matters: makes staging/production switching safer and reduces accidental deployments against the wrong backend.

### 3. Remove fallback GPS coordinates from attendance actions
- `src/views/ProfilePage.vue` falls back to fixed latitude and longitude values if geolocation is unavailable.
- Replace that with a user-facing error or a controlled fallback flow approved by the backend rules.
- Why this matters: hardcoded coordinates can create false attendance data and make audits unreliable.

## Priority 2: Routing, Auth, And Navigation

### 4. Refactor route naming to be explicit
- `src/router/index.js` and `src/views/TabsPage.vue` still use legacy route names like `tab3` and `tab4` beside clearer paths like `leave-balance` and `my-attendance`.
- Introduce named routes and replace generic tab identifiers with feature names.
- Why this matters: improves readability, reduces navigation mistakes, and makes future deep-linking easier.

### 5. Avoid re-hydrating session on every navigation
- The global `beforeEach` currently calls `hydrateSession()` on every route change.
- Hydrate once during app bootstrap, or guard it so it only runs when the session is not yet ready.
- Why this matters: reduces repeated async work and makes auth behavior easier to reason about.

### 6. Tighten role-based access
- Manager pages are surfaced from the profile UI, but route-level protection for manager-only screens is not obvious.
- Add route metadata such as `requiresManager` and enforce it in the router.
- Why this matters: UI hiding alone is not enough to protect privileged screens.

## Priority 3: Data Flow And State Management

### 7. Move page orchestration logic into composables or store helpers
- Pages like `ProfilePage.vue`, `LeaveBalancePage.vue`, and `MyAttendancePage.vue` each handle their own loading, refresh, transformation, and formatting logic.
- Extract reusable pieces such as:
  - attendance timer handling
  - refresh wrappers
  - leave balance aggregation
  - date and time formatting helpers
- Why this matters: smaller pages are easier to review and less likely to drift apart.

### 8. Standardize loading and error patterns across stores
- `auth`, `user`, and `timeoff` stores already share some conventions, but pages still manually inspect many loading and error flags.
- Introduce a clearer async state model or reusable helpers for `idle/loading/success/error`.
- Why this matters: it will simplify templates and reduce repeated conditional rendering logic.

### 9. Improve resilience of cross-source attendance data
- `fetchCurrentEmployee()` fetches employee data and then supplements it with `fetchAttendanceUserData()`.
- Define one normalized employee-attendance shape and centralize the merge behavior in the store.
- Why this matters: reduces subtle bugs when different endpoints disagree or return partial data.

## Priority 4: UX, Accessibility, And Product Clarity

### 10. Add user-visible error feedback for actions
- Some failures are only logged with `console.error`, especially for attendance toggle and logout flows.
- Surface errors with inline banners, toasts, or alert dialogs.
- Why this matters: users need to know whether an action failed and what to do next.

### 11. Improve form and button accessibility
- Review custom buttons and inputs in `LoginPage.vue` and card-based actions in profile and list pages.
- Add or verify:
  - accessible labels for icon-only controls
  - focus-visible states
  - disabled/loading semantics
  - sufficient color contrast in status chips and gradients
- Why this matters: the app already has custom UI, so accessibility needs to be intentional.

### 12. Fix text encoding and copy consistency
- There are visible encoding artifacts such as the password placeholder and attendance time separator.
- Normalize user-facing copy, capitalization, and state labels across leave and attendance pages.
- Why this matters: small text issues quickly make an app feel unstable or unfinished.

## Priority 5: Code Quality And Testing

### 13. Add a baseline test suite
- The project includes `vitest` and `cypress` dependencies, but there is no visible test coverage in `src`.
- Start with:
  - unit tests for auth/session helpers
  - store tests for leave balance calculations
  - component tests for login and empty/loading states
  - one end-to-end happy path for login plus attendance or leave request flow
- Why this matters: the app is stateful and API-driven, so regressions will be hard to catch manually.

### 14. Add linting and test scripts to `package.json`
- There is no clear `test`, `test:unit`, `lint`, or `format` script yet.
- Add the standard scripts and make them part of the regular workflow.
- Why this matters: contributors should have one obvious way to validate changes.

### 15. Introduce shared utility modules for date/time and domain formatting
- Formatting logic is repeated in pages, often with manual `new Date(... + "Z")` handling.
- Create shared utilities for:
  - API date parsing
  - local display formatting
  - duration formatting
  - leave type label splitting
- Why this matters: date handling is easy to get wrong and difficult to debug once repeated everywhere.

## Suggested Implementation Order

### Phase 1: Safe cleanup
1. Remove hardcoded credentials.
2. Move base URL and database config into env variables.
3. Remove hardcoded attendance coordinates.
4. Fix obvious encoding and copy issues.

### Phase 2: App structure
1. Rename routes and add named navigation.
2. Refine auth hydration flow.
3. Add route-level manager guards.
4. Extract shared formatting and refresh helpers.

### Phase 3: Reliability
1. Standardize async state handling.
2. Normalize attendance and employee data merging.
3. Add actionable user-facing error states.

### Phase 4: Quality gates
1. Add lint and test scripts.
2. Add unit tests for stores and auth helpers.
3. Add one or two Cypress happy-path flows.

## Quick Wins
- Clear the default login email and password.
- Replace corrupted characters in placeholders and separators.
- Add a visible error message when check-in/check-out fails.
- Rename `tab3` and `tab4` to feature-based route names.
- Add `test` and `lint` scripts to `package.json`.

## Definition Of Done For This Plan
- No sensitive or environment-specific values are hardcoded in UI code.
- Navigation is readable and role-safe.
- Shared business logic lives outside page templates where appropriate.
- Every important async action has visible loading and error feedback.
- At least one automated path protects login plus a core employee workflow.
