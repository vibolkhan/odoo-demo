# TimeNest / Odoo Demo Cheat Sheet

## 1. Project Summary
- Ionic + Vue 3 application with Capacitor mobile target support for Android and iOS.
- Integrates with an Odoo backend using JSON-RPC endpoints for authentication, leave management, attendance, and employee data.
- Uses Pinia for centralized state management and Vite for local development with a proxy to the Odoo API.

## 2. Core Technologies
- Vue 3 + Composition API
- Ionic Vue for UI components
- Pinia for state management
- CapacitorHttp for network requests
- Capacitor plugins: Preferences, Haptics, Geolocation, App
- Vite for build/dev server

## 3. App Bootstrap
- `src/main.js`
  - Creates Vue app and mounts once router is ready.
  - Applies IonicVue, Pinia, Vue Router.
  - Hydrates auth session before mount.
- `src/App.vue`
  - Global shell with splash screen until auth session is ready.
  - Applies theme from `theme.store` on mount.

## 4. Routing
- `src/router/index.js`
  - Root redirect: `/` → `/tabs/leave-calendar`.
  - Login route: `/login` with `guestOnly` guard.
  - Protected `tabs` route with nested child pages, including leave, attendance, and profile.
  - Authentication guard that redirects unauthenticated users to `/login`.

## 5. Authentication Flow
- `src/stores/auth.store.js`
  - Session persistence via Capacitor Preferences + browser localStorage fallback.
  - `hydrateSession()` restores stored session.
  - `login()` calls Odoo auth endpoint and persists result.
  - `logout()` clears session and resets user/timeoff stores.
- `src/api/auth.api.js`
  - `loginRequest()` / `logoutRequest()` implement Odoo JSON-RPC auth.
  - `restoreStoredSession()` & `persistSession()` handle native/browser storage.
  - Session expiration detection and redirect handling.

## 6. Leave Management
### Store Layer
- `src/stores/timeoff.store.js`
  - Tracks leave requests, company requests, allocations, leave types, and calendar data.
  - Provides computed balance totals and per-type balances.
  - Features leave request CRUD, approval/refusal, type list, and calendar aggregation.

### API Layer
- `src/api/timeoff.api.js`
  - JSON-RPC endpoints for:
    - leave request search/read
    - leave allocation search/read
    - leave save/update
    - leave approve/refuse actions
    - leave type catalog + management
    - leave calendar / special days data
  - Supports browser and native HTTP transport through CapacitorHttp.
  - Handles session expiration and network error conditions.

### Leave Pages
- `src/views/leave/LeaveCalendarPage.vue`
  - Month calendar view with leave, public holidays, mandatory days, and unusual days.
  - Day selection opens detail modals for leave or holidays.
- `src/views/leave/LeaveBalancePage.vue`
  - Visual leave balance summary with allocation, taken, remaining, and usage percentage.
  - Renders leave balances by type.
- `src/views/leave/LeaveTypesPage.vue`
  - Leave type list and catalog support.
- `src/views/leave/RequestListPage.vue`
  - Lists personal leave requests.
- `src/views/leave/RequestFormPage.vue`
  - Wrapper for `RequestForm.vue`, used to create/update leave requests.
- `src/views/leave/LeaveApprovalPage.vue`
  - Manager view for approving/refusing leave requests.

### Leave Components
- `src/components/leave/RequestForm.vue`
  - Core leave request form UI and validation.
- `src/components/leave/RequestList.vue`
  - Reusable request list component.
- `src/components/leave/LeaveRequestDetailModal.vue`
  - Modal showing selected leave request details.
- `src/components/leave/PublicHolidayDetailModal.vue`
  - Modal for holiday detail display.

## 7. Attendance Management
### Store Layer
- `src/stores/user.store.js`
  - Holds user/employee state, attendance lists, detail, and toggle actions.
  - Supports manager features like employee search and all-attendance queries.
  - Normalizes employee record and refreshes supplemental attendance state.

### API Layer
- `src/api/user.api.js`
  - Employee search and current user employee fetch.
  - Attendance search/read for user and company records.
  - Attendance detail fetch and check-in/check-out toggle action.
  - Strongly typed Odoo JSON-RPC payloads and session handling.

### Attendance Pages
- `src/views/attendance/MyAttendancePage.vue`
  - Personal attendance history for the logged-in user.
- `src/views/attendance/AdminAttendancePage.vue`
  - Manager-facing attendance dashboard with search, filters, and stats.
  - Employee suggestions, date filters, and modal detail view.

### Attendance Components
- `src/components/attendance/AttendanceDetailModal.vue`
  - Modal for detailed attendance record view.

## 8. Profile & Layout
- `src/views/profile/ProfilePage.vue`
  - Profile page for logged-in user details and account information.
- `src/views/layout/TabsPage.vue`
  - Main bottom tab navigation for Calendar, Attendance, Requests, Balance, and Profile.
  - Haptics support via Capacitor Haptics on tab tap.

## 9. Shared UI Components
- `src/components/common/AppAsyncState.vue`
  - Async loading/error wrapper used throughout views.
- `src/components/common/AppEmptyState.vue`
  - Standard empty state component.
- `src/components/common/AppAvatar.vue`
  - Avatar helper component for user/employee initials.
- `src/components/common/AppSkeleton.vue`
  - Skeleton placeholder UI for loading states.
- `src/components/common/DateInput.vue`
  - Date input UI wrapper used in filtering and forms.

## 10. Utilities
- `src/utils/async-state.js`
  - Standardized async status object and `runAsync` helper.
- `src/utils/date.js`
  - Date formatting helpers used by attendance and leave pages.
- `src/utils/format.js`
  - Formatting utilities for string/number display.
- `src/composables/useNotification.js`
  - Notification helper for toast messages.
- `src/composables/useAttendanceTimer.js`
  - Likely manages attendance timer handling.

## 11. Configuration & Environment
- `package.json`
  - Scripts:
    - `npm run dev`
    - `npm run build`
    - `npm run preview`
    - Native live commands for Android/iOS.
  - Dependencies: `@ionic/vue`, `@capacitor/core`, `pinia`, `vue-router`, `ionicons`.
- `vite.config.js`
  - Vite alias `@` → `./src`.
  - Proxy `/odoo-api` to Odoo staging host during dev.
  - Includes legacy support plugin.
- `capacitor.config.json`
  - App ID `io.ionic.starter`, app name `TimeNest`.
  - Enables `CapacitorHttp` plugin.
- `.env-example` / `.env`
  - Contains environment variables for Odoo base URL and database.

## 12. Native Integration
- Capacitor native support for:
  - HTTP requests via `CapacitorHttp`.
  - Persistent storage via `Preferences`.
  - Haptics vibration on tab changes.
  - Geolocation plugin for attendance toggle (likely used in attendance flows).

## 13. File/Feature Map
### Root
- `index.html` — Ionic/Vite entry HTML.
- `ionic.config.json` — Ionic project metadata.

### Source
- `src/main.js` — app initialization.
- `src/App.vue` — global layout and session gating.
- `src/router/index.js` — route definitions and auth guards.
- `src/stores/` — Pinia stores.
- `src/api/` — backend integration layer.
- `src/views/` — screen/page components.
- `src/components/` — reusable UI modules.
- `src/utils/` — shared helper functions.
- `src/composables/` — composables for UI/business logic.

## 14. Insights / Recommendations
- The app is clearly split into two main domains: leave management and attendance management.
- The Odoo backend contract is implemented consistently with JSON-RPC payloads.
- Auth/session handling is robust with native + browser persistence and expiry handling.
- The current view layer uses a combination of page-level wrappers and reusable components.
- There is good use of async state wrappers for consistent loading/error UI.

## 15. Starting Points for a Senior Engineer
- `src/stores/timeoff.store.js` and `src/api/timeoff.api.js` for leave workflow logic.
- `src/stores/user.store.js` and `src/api/user.api.js` for attendance and employee management.
- `src/router/index.js` for app flow and auth protection.
- `src/views/attendance/AdminAttendancePage.vue` for the most complex UI flow.
- `src/views/leave/LeaveCalendarPage.vue` for calendar interactions and date handling.

## 16. JavaScript Function Cheat Sheet

### Normal Function vs Arrow Function
```js
function formatName(name) {
  return name.trim().toUpperCase();
}

const formatName = (name) => {
  return name.trim().toUpperCase();
};

const double = (number) => number * 2;
```

| Feature | Normal function | Arrow function |
| --- | --- | --- |
| Syntax | `function name() {}` | `const name = () => {}` |
| `this` | Has its own `this` | Uses `this` from outside |
| Hoisting | Can be called before declaration | Cannot be used before assignment |
| Best for | Reusable helpers, object methods | Callbacks, short helpers, Vue Composition API |

Use a normal function when you need a named helper or method behavior. Use an arrow function for short callbacks and local logic.

```js
export function formatDays(days) {
  return `${days} days`;
}

const approvedRequests = requests.filter((request) => request.state === 'validate');
```

## 17. Complete File-by-File Matrix

### Root / Config
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `.browserslistrc` | Build | Browser support targets | Affects transpilation/legacy output. |
| `.env` | Runtime config | Local Odoo endpoint/database values | Local-only runtime secrets/config. |
| `.env-example` | Runtime config | Template for required env vars | Onboarding reference. |
| `.eslintignore` | Tooling | Lint ignore rules | Keeps generated/native files out of lint. |
| `.eslintrc.cjs` | Tooling | ESLint config for JS/Vue | Code quality baseline. |
| `.gitignore` | Tooling | Git ignore rules | Excludes build/native noise. |
| `capacitor.config.json` | Native shell | Capacitor app/plugin config | Mobile integration entry point. |
| `index.html` | App shell | Vite/Ionic HTML entry | Browser bootstrap shell. |
| `ionic.config.json` | Ionic config | Ionic project metadata | Mostly tooling metadata. |
| `package.json` | Tooling/runtime | Scripts, deps, engine versions | Includes test/lint/build commands. |
| `package-lock.json` | Tooling/runtime | Locked dependency graph | Reproducible installs. |
| `vite.config.js` | Build/dev server | Alias, proxy, legacy plugin | Critical for local Odoo proxying. |

### App Bootstrap / Shell
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/main.js` | Bootstrap | Creates app, router, Pinia, Ionic setup | Entry point for runtime wiring. |
| `src/App.vue` | Shell | Splash/session gate and theme application | Global wrapper before routed pages render. |
| `src/router/index.js` | Routing | Route tree and auth/guest guards | Central app flow control. |
| `src/theme/variables.css` | Theme | Ionic/CSS theme tokens | Global visual system. |

### API Layer
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/api/http.js` | API infra | Shared CapacitorHttp helpers | Central JSON request helper. |
| `src/api/auth.api.js` | Auth API | Login/logout/session persistence helpers | Medium-size auth boundary. |
| `src/api/timeoff.api.js` | Leave API | Odoo JSON-RPC for leave/allocations/calendar/types | Largest API hotspot at 1206 lines. |
| `src/api/user.api.js` | Attendance API | Employee lookup and attendance RPCs | Large integration surface at 627 lines. |

### Stores
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/stores/index.js` | Store bootstrap | Store exports/registration helper | Very small glue module. |
| `src/stores/auth.store.js` | Auth state | Session hydration/login/logout orchestration | Connects auth API to UI. |
| `src/stores/theme.store.js` | Theme state | Theme preference state | Small isolated concern. |
| `src/stores/timeoff.store.js` | Leave state | Leave requests, balances, approvals, calendar state | Core leave orchestration layer. |
| `src/stores/user.store.js` | Attendance state | Employee/attendance state and actions | Core attendance orchestration layer. |

### Composables
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/composables/useAttendanceActions.js` | Attendance UX | Shared attendance action handlers | Likely reduces page-level duplication. |
| `src/composables/useAttendanceTimer.js` | Attendance UX | Attendance timer logic | Small behavioral helper. |
| `src/composables/useDateTimeFormatter.js` | Formatting | Date/time presentation helper | Presentation-only utility wrapper. |
| `src/composables/useLeaveBalance.js` | Leave UX | Leave balance derivation helper | Complements store/page logic. |
| `src/composables/useMinimumSkeleton.js` | UX state | Minimum skeleton timing helper | Smooths loading transitions. |
| `src/composables/useNotification.js` | UX state | Toast/notification helper | Shared user feedback helper. |

### Shared Components
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/components/common/AppAsyncState.vue` | Shared UI | Loading/error/content wrapper | Common async UX primitive. |
| `src/components/common/AppAvatar.vue` | Shared UI | Avatar/initials component | Simple reusable visual helper. |
| `src/components/common/AppEmptyState.vue` | Shared UI | Empty state presentation | Shared fallback UI. |
| `src/components/common/AppSkeleton.vue` | Shared UI | Skeleton placeholder component | Supports loading states. |
| `src/components/common/DateInput.vue` | Shared form UI | Date input abstraction | Reusable form control wrapper. |

### Leave Components
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/components/leave/RequestForm.vue` | Leave UI | Create/edit leave request form | Core transactional form. |
| `src/components/leave/RequestList.vue` | Leave UI | Request list rendering and status summaries | Large reusable list module at 626 lines. |
| `src/components/leave/LeaveRequestDetailModal.vue` | Leave UI | Leave request details modal | Medium-large detail presentation. |
| `src/components/leave/PublicHolidayDetailModal.vue` | Leave UI | Holiday detail modal | Focused modal component. |

### Attendance Components
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/components/attendance/AttendanceDetailModal.vue` | Attendance UI | Detailed attendance record modal | Very large modal component at 817 lines. |

### Views / Pages
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/views/auth/LoginPage.vue` | Auth page | Login flow UI | Entry point for unauthenticated users. |
| `src/views/layout/TabsPage.vue` | Layout page | Bottom-tab shell and navigation | Main authenticated shell. |
| `src/views/attendance/MyAttendancePage.vue` | Attendance page | Personal attendance history | Medium-complexity end-user flow. |
| `src/views/attendance/AdminAttendancePage.vue` | Attendance page | Manager attendance dashboard | Large workflow page at 648 lines. |
| `src/views/leave/LeaveCalendarPage.vue` | Leave page | Calendar, holidays, leave overlays | One of the biggest UI hotspots at 988 lines. |
| `src/views/leave/LeaveBalancePage.vue` | Leave page | Leave balance summaries | Reporting-oriented page. |
| `src/views/leave/LeaveTypesPage.vue` | Leave page | Leave type catalog/list management | Large page at 778 lines. |
| `src/views/leave/RequestListPage.vue` | Leave page | Personal leave requests page | Page wrapper around list/status UI. |
| `src/views/leave/RequestFormPage.vue` | Leave page | Wrapper page for request form | Thin routing/container layer. |
| `src/views/leave/LeaveApprovalPage.vue` | Leave page | Manager approval/refusal page | Large manager workflow page at 660 lines. |
| `src/views/profile/ProfilePage.vue` | Profile page | User profile and manager shortcuts | Large mixed-responsibility page at 691 lines. |

### Utilities
| File | Area | Purpose | Notes |
| --- | --- | --- | --- |
| `src/utils/async-state.js` | Utilities | Async state factory/helpers | Reused by async screens/components. |
| `src/utils/date.js` | Utilities | Date formatting/helpers | Shared date manipulation layer. |
| `src/utils/format.js` | Utilities | Number/string formatting helpers | Small presentation helper set. |

## 18. Risk / Technical Debt Assessment

### Highest-Risk Hotspots
| Area | Why it is risky | Evidence |
| --- | --- | --- |
| API modules | Odoo JSON-RPC integration is concentrated in a few very large files, making regressions and contract drift harder to isolate. | `src/api/timeoff.api.js` (1206 lines), `src/api/user.api.js` (627 lines). |
| Large page components | Pages appear to mix data loading, view-model logic, and presentation in single files, which raises change cost. | `src/views/leave/LeaveCalendarPage.vue` (988), `src/views/leave/LeaveTypesPage.vue` (778), `src/views/profile/ProfilePage.vue` (691), `src/views/attendance/AdminAttendancePage.vue` (648). |
| Large modal/list components | Deep UI components likely hold business formatting and status logic that is hard to reuse or test in isolation. | `src/components/attendance/AttendanceDetailModal.vue` (817), `src/components/leave/RequestList.vue` (626), `src/components/leave/LeaveRequestDetailModal.vue` (503). |

### Technical Debt Themes
| Theme | Current state | Likely impact | Recommended direction |
| --- | --- | --- | --- |
| Oversized modules | Several files exceed 600-1200 lines. | Harder reviews, fragile edits, duplicated logic, slower onboarding. | Split by domain capability, RPC endpoint family, and presentation subcomponents. |
| Logic in view files | Large `.vue` pages likely own fetching, transforms, and UI state together. | Reuse is limited and validation becomes expensive. | Pull page logic into composables or store helpers with clearer seams for future coverage. |
| Integration contract coupling | API layer appears tightly coupled to Odoo payload structure. | Backend field changes can break multiple screens at once. | Add mapper/adapter functions around normalized models. |
| Naming/tooling consistency | Small signs of drift exist in scripts and docs. | Minor friction during onboarding and CI maintenance. | Normalize naming such as `andriod:live` to `android:live`, keep docs synced with code. |

### Suggested Refactor Order
1. Break `src/api/timeoff.api.js` into smaller endpoint-focused modules.
2. Extract stateful page logic from `LeaveCalendarPage.vue`, `AdminAttendancePage.vue`, and `LeaveApprovalPage.vue` into composables so view files become mostly presentation.
3. Carve large modal/list components into smaller presentational subcomponents and shared status/format helpers.
